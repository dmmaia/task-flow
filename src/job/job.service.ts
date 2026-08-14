import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from './job.entity';
import { Repository } from 'typeorm';
import { JobDto } from './job.dto';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { HttpService } from '@nestjs/axios';

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

  async create(newJob:JobDto){
    const job:Job = new Job()
    job.task = newJob.task
    job.payload = newJob.payload
    job.targetUrl = newJob.targetUrl
    job.runAt = newJob.runAt

    const cronJob = new CronJob(new Date(newJob.runAt), () => {
      this.httpService.post(newJob.targetUrl, newJob.payload)
      this.schedulerRegistry.deleteCronJob(newJob.task);
    });

    this.schedulerRegistry.addCronJob(newJob.task, cronJob);
    cronJob.start();

    return await this.jobRepository.save(job)
  }
}
