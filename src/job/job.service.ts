import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from './job.entity';
import { LessThan, Repository } from 'typeorm';
import { JobDto } from './job.dto';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { v4 as uuid } from 'uuid'
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class JobService {
  private running = false;

  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    private readonly httpService: HttpService,
    private loggerService: LoggerService
  ){}
  
  findOne(id: string): Promise<Job | null> {
    return this.jobRepository.findOneBy({ id });
  }

  @Cron('* * * * * *')
  async checkJobStatus(){
    if (this.running) return;

    this.running = true;

    try {
      const jobs = await this.jobRepository.find({ 
        where:
          [
            {status: 'pending', runAt: LessThan(new Date())},
            {status: 'retrying', nextAttemptAt: LessThan(new Date())},
          ],
        order:{runAt:"ASC"},
        lock: { mode: 'pessimistic_write' },
        take: 50
      })
      for(var job of jobs){
        await this.executeJob(job);
      }
    } finally {
      this.running = false;
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
    job.attempts = 0
    job.id = id

    await this.jobRepository.save(job)
    await this.loggerService.create(
      job.id,
      "Job created"
    )
  }

  async executeJob(job: Job){
      try {
        await this.httpService.post(job.targetUrl, job.payload)
        await this.jobRepository.update({id:job.id},{status: "executed"})
        await this.loggerService.create(
          job.id,
          "Job executed"
        )
      } catch (error) {
        if (job.attempts>=3){
          await this.jobRepository.update({id:job.id},{status: "failed"})
          await this.loggerService.create(
            job.id,
            "Job fail to execute"
          )
        }
        const delay = 30 * (5 ** job.attempts)
        job.attempts++
        const lastAttempt = job.nextAttemptAt? new Date(job.nextAttemptAt): new Date(job.runAt)
        await this.jobRepository.update({id:job.id},{
          status: "retrying", 
          nextAttemptAt: lastAttempt.setSeconds(lastAttempt.getSeconds()+delay),
          attempts:job.attempts
        })
        await this.loggerService.create(
          job.id,
          "Job failed, retry sheduled"
        )
      }
  }
}
