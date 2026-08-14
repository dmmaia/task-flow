import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from './job.entity';
import { LessThan, Repository } from 'typeorm';
import { JobDto } from './job.dto';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { HttpService } from '@nestjs/axios';
import { v4 as uuid } from 'uuid'

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    private schedulerRegistry: SchedulerRegistry,
    private readonly httpService: HttpService
  ){}
  
  findOne(id: string): Promise<Job | null> {
    return this.jobRepository.findOneBy({ id });
  }

  @Cron('* * 00 * * *')
  async checkJobStatus(){
    const jobs = await this.jobRepository.find({ where:{status: "pending", runAt: LessThan(new Date())}})
    for(var job of jobs){
      await this.executeJob(job);
    }
  }

  async create(newJob:JobDto){
    const id = uuid()
    const job:Job = new Job()
    job.task = newJob.task
    job.payload = newJob.payload
    job.targetUrl = newJob.targetUrl
    job.runAt = newJob.runAt
    job.status = "pending"
    job.id = id

    await this.jobRepository.save(job)

    const cronJob = new CronJob(new Date(newJob.runAt), async () => {
      await this.executeJob(job)
    });

    this.schedulerRegistry.addCronJob(id, cronJob);
    cronJob.start();
  }

  async executeJob(job: Job){
    this.httpService.post(job.targetUrl, job.payload)
      await this.jobRepository.update({id:job.id},{status: "executed"})

      this.schedulerRegistry.deleteCronJob(job.id);
  }
}
