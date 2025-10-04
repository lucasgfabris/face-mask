import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum AuthType {
  LOGIN = 'login',
  REGISTER = 'register',
}

@Entity('auth_logs')
export class AuthLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_name', length: 255 })
  userName: string;

  @Column({
    name: 'auth_type',
    type: 'enum',
    enum: AuthType,
  })
  authType: AuthType;

  @Column()
  success: boolean;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
