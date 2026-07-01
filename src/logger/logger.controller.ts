import { Controller, Get, Param } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Controller('logger')
export class LoggerController {
  constructor(private readonly logerService: LoggerService) {
    }
  
    @Get(":jobId")
      async findOne(@Param('jobId') jobId: string){
        return await this.logerService.findByJob(jobId)
    }
}
