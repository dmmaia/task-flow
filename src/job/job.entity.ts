import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class Job {
  @PrimaryColumn()
  id!: string;

  @Column()
  task!: string;

  @Column()
  targetUrl!: string;

  @Column()
  status!: string;

  @Column({ nullable: true })
  runAt!: Date;

  @Column({ type: 'jsonb'})
  payload!: Record<string, any>;

  @Column()
  attempts!: number

  @Column()
  nextAttemptAt: Date | undefined;

  @CreateDateColumn()
  createdAt!: Date;
  
}
