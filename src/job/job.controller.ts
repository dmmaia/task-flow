import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { JobService } from './job.service';
import { JobDto } from './job.dto';

@Controller('job')
export class JobController {
   constructor(private readonly jobService: JobService) {
  }

  @Get(":jobId")
    async findOne(@Param('jobId') jobId: string){
      return await this.jobService.findOne(jobId)
  }

  @Post()
  async create(@Body() newJob: JobDto){
    return await this.jobService.create(newJob)
  }
  
}
