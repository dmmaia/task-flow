import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';

export enum JobStatus {
  Pending = 'pending',
  Processing = 'processing',
  Retrying = 'retrying',
  Executed = 'executed',
  Failed = 'failed',
}

@Entity()
export class Job {
  @PrimaryColumn()
  id!: string;

  @Column()
  task!: string;

  @Column()
  targetUrl!: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.Pending,
  })
  status!: JobStatus;

  @Column({
    type: 'timestamptz'
  })
  runAt!: Date;

  @Column({ type: 'jsonb'})
  payload!: Record<string, any>;

  @Column()
  attempts!: number

  @Column({
    type: 'timestamptz',
    nullable: true
  })
  nextAttemptAt!: Date | null;

  @Column({
    type: 'timestamptz',
    nullable: true
  })
  lockedUntil!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
  
}
