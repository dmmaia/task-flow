import { Body, Controller, Delete, Get, Param, Post, Headers } from '@nestjs/common';
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

  @Get()
    async find(){
    return await this.jobService.find()
  }

  @Delete(":jobId")
    async delete(@Param('jobId') jobId: string){
    return await this.jobService.delete(jobId)
  }

  @Post()
  async create(@Body() newJob: JobDto, @Headers('Idempotency-Key') idempotencyKey?: string){
    return await this.jobService.create(newJob, idempotencyKey)
  }
  
}
