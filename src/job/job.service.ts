import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, JobStatus } from './job.entity';
import { Brackets, DataSource, In, LessThan, QueryFailedError, Repository } from 'typeorm';
import { JobDto } from './job.dto';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { v4 as uuid } from 'uuid'
import { LoggerService } from '../logger/logger.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class JobService {
  private running = false;
  private static readonly MAX_ATTEMPTS = 3;

  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    private readonly httpService: HttpService,
    private loggerService: LoggerService,
    private dataSource: DataSource,
  ){}
  
  findOne(id: string): Promise<Job | null> {
    return this.jobRepository.findOneBy({ id });
  }

  async claimJobs(){
    return await this.dataSource.transaction(async (entityManager) => {
      const repository = entityManager.getRepository(Job);

        const jobs = await repository
          .createQueryBuilder('job')
          .where(
            new Brackets((qd)=>{
              qd.where('job.status = :pendingStatus AND job.runAt < :now',{
                pendingStatus: JobStatus.Pending,
                now: new Date()
              }).orWhere('job.status = :retryStatus AND job.nextAttemptAt < :now',{
                retryStatus: JobStatus.Retrying,
                now: new Date()
              })
            })
          )
          .orderBy('job.runAt', 'ASC')
          .addOrderBy('job.nextAttemptAt', 'ASC')
          .take(5)
          .setLock('pessimistic_write')
          .setOnLocked('skip_locked')
          .getMany(); 

      if (jobs.length === 0) {
        return [];
      }

      const jobIds = jobs.map(job => job.id);
      const lockedUntil = new Date(Date.now() + 60000) 

      await repository
        .createQueryBuilder('job')
        .update(Job)
        .set({ 
          status: JobStatus.Processing, 
          attempts: () => 'attempts + 1',
          lockedUntil: lockedUntil
        })
        .where({ id: In(jobIds) })
        .execute();

      for(const job of jobs){
        job.attempts += 1;
        job.status = JobStatus.Processing;
        job.lockedUntil = lockedUntil;
        await this.loggerService.create(
          job.id,
          "JOB_CLAIMED, attempt = "+job.attempts
        )
      }
      
      return jobs
      })
  }

  @Cron('0 * * * * *')
  async checkProcessingJobs(){
    await this.dataSource.transaction(async (entityManager) => {
      const repository = entityManager.getRepository(Job);

      var jobs = await repository
        .createQueryBuilder('job')
        .where('job.status = :status AND job.lockedUntil < :now',{
          status: JobStatus.Processing,
          now: new Date()
        })
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .getMany(); 

      if (jobs.length === 0) {
        return [];
      }

      for(const [index, job] of jobs.entries()){
        await this.loggerService.create(
          job.id,
          "JOB_LEASE_EXPIRED"
        )
        if (job.attempts>=JobService.MAX_ATTEMPTS){
          await this.jobRepository.update({id:job.id},{status: JobStatus.Failed})
          jobs.splice(index,1)
        }
      }

      const jobIds = jobs.map(job => job.id);

      await repository
        .createQueryBuilder('job')
        .update(Job)
        .set({ 
          status: JobStatus.Retrying, 
          nextAttemptAt: new Date(Date.now() + 30 * 1000) })
        .where({ id: In(jobIds) })
        .execute();
      
      for(const job of jobs){
        await this.loggerService.create(
          job.id,
          "JOB_RECOVERED"
        )
      }
    })
  }

  @Cron('* * * * * *')
  async checkJobStatus(){
    if (this.running) return;

    this.running = true;

    try {
      const jobs = await this.claimJobs();
      
      await Promise.allSettled(
        jobs.map(job => this.executeJob(job))
      );
    } finally {
      this.running = false;
    }
  }

  async create(newJob:JobDto, idempotencyKey?: string){
    const job:Job = new Job()

    if(idempotencyKey){
       const checkIfExists = await this.jobRepository.findOne({where:{idempotencyKey: idempotencyKey}})

      if(checkIfExists)
        return checkIfExists
      job.idempotencyKey = idempotencyKey
    }

    const id = uuid()
    job.task = newJob.task
    job.payload = newJob.payload
    job.targetUrl = newJob.targetUrl
    job.runAt = new Date(newJob.runAt)
    job.attempts = 0
    job.id = id

    try {
      const createdJob = await this.jobRepository.save(job)
      await this.loggerService.create(
        job.id,
        "JOB_CREATED"
      )
      return createdJob
    } catch (error) {
      if(error instanceof QueryFailedError){
        if (idempotencyKey && error.driverError?.code === '23505') {
          const existing = await this.jobRepository.findOne({
            where: { idempotencyKey }
          });

          if (existing) {
            return existing;
          }
        }
      }

      throw error;
    }
  }

  async executeJob(job: Job){
      try {
        await this.loggerService.create(
          job.id,
          "JOB_EXECUTION_STARTED"
        )
        
        await firstValueFrom(
          this.httpService.post(job.targetUrl, job.payload, {
            timeout:30000, 
            headers:{
              "X-TaskFlow-Job-Id": job.id,
              "X-TaskFlow-Attempt": job.attempts
            }
          })
        )
        
        await this.jobRepository.update({id:job.id},{status: JobStatus.Executed})
        await this.loggerService.create(
          job.id,
          "JOB_COMPLETED"
        )
      } catch (error) {
        await this.loggerService.create(
          job.id,
          "JOB_EXECUTION_FAILED"
        )
        if (job.attempts>=JobService.MAX_ATTEMPTS){
          await this.jobRepository.update({id:job.id},{status: JobStatus.Failed})
          return;
        }
        
        const delay = 30 * (2 ** (job.attempts - 1));
        const nextAttemptAt = new Date(Date.now() + delay * 1000)
        await this.jobRepository.update({id:job.id},{
          status: JobStatus.Retrying, 
          nextAttemptAt: nextAttemptAt,
        })
        await this.loggerService.create(
          job.id,
          "JOB_RETRY_SCHEDULED, retryAt = " + nextAttemptAt.toISOString()
        )
      }
  }

  async find(){
    return this.jobRepository.find()
  }

  async delete(jobId){
    await this.jobRepository.delete({id:jobId})
  }

  async clean(){
      await this.jobRepository.deleteAll()
  }
}
