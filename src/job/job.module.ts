import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './job.entity';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    HttpModule,
    LoggerModule
  ],
  controllers: [JobController],
  providers: [JobService]
})
export class JobModule {}
