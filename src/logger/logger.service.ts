import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from './logger.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerService {
  constructor(
      @InjectRepository(Logger)
      private loggerRepository: Repository<Logger>,
      private readonly configService: ConfigService
    ){}
    
    findByJob(jobId: string): Promise<Logger[]> {
      return this.loggerRepository.find({where:{jobId}})
    }

    async clean(){
      await this.loggerRepository.deleteAll()
    }
  
    async create(jobId: string, message:string){
      const log:Logger = new Logger()
      log.jobId = jobId
      log.message = message
      log.instanceId = "instance-"+this.configService.get<string>('PORT')
      console.debug(message)
      return await this.loggerRepository.save(log)
    }
}
