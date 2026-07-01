import { Module } from '@nestjs/common';
import { JobModule } from './job/job.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [JobModule, LoggerModule],
})
export class AppModule {}
