import { Entity, Column, CreateDateColumn, PrimaryColumn, Unique } from 'typeorm';

export enum JobStatus {
  Pending = 'pending',
  Processing = 'processing',
  Retrying = 'retrying',
  Executed = 'executed',
  Failed = 'failed',
}

@Entity()
@Unique(['idempotencyKey']) 
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

  @Column({
    nullable: true
  })
  idempotencyKey!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
  
}
