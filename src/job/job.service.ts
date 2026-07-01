import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from './job.entity';
import { Repository } from 'typeorm';
import { JobDto } from './job.dto';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
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
    return await this.jobRepository.save(job)
  }
}
