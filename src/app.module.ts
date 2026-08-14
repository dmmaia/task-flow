import { Module } from '@nestjs/common';
import { JobModule } from './job/job.module';
import { LoggerModule } from './logger/logger.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PostgresConfigService } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({envFilePath:['.env.development.local','.env'],isGlobal:true}),
    TypeOrmModule.forRootAsync({
      imports:[ConfigModule],
      useClass: PostgresConfigService,
    }),
    JobModule, 
    LoggerModule
  ],
})
export class AppModule {}
