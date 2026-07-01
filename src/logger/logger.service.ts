import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from './logger.entity';

@Injectable()
export class LoggerService {
  constructor(
      @InjectRepository(Logger)
      private loggerRepository: Repository<Logger>,
    ){}
    
    findByJob(jobId: string): Promise<Logger[]> {
      return this.loggerRepository.find({where:{jobId}})
    }
  
    async create(jobId: string, message:string){
      const log:Logger = new Logger()
      log.jobId = jobId
      log.message = message
      return await this.loggerRepository.save(log)
    }
}
