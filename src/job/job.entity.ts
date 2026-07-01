import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Job {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  task!: string;

  @Column()
  targetUrl!: string;

  @Column({ nullable: true })
  runAt!: Date;

  @Column({ type: 'jsonb'})
  payload!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;
  
}
