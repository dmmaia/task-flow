import { Module } from '@nestjs/common';
import { JobModule } from './job/job.module';
import { LoggerModule } from './logger/logger.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PostgresConfigService } from './config/database.config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({envFilePath:['.env.development.local','.env'],isGlobal:true}),
    TypeOrmModule.forRootAsync({
      imports:[ConfigModule],
      useClass: PostgresConfigService,
    }),
    ScheduleModule.forRoot(),
    JobModule, 
    LoggerModule,
  ],
})
export class AppModule {}
