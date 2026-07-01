import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Logger {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  jobId!: string;

  @Column()
  message!: string;

  @CreateDateColumn()
  createdAt!: Date;
  
}
