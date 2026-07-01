import { Module } from '@nestjs/common';
import { JobModule } from './job/job.module';
import { LoggerModule } from './logger/logger.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Logger } from './logger/logger.entity';
import { Job } from './job/job.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    JobModule, 
    LoggerModule
  ],
})
export class AppModule {}
