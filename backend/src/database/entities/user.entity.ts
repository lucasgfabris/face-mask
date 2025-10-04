import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_name', unique: true, length: 255 })
  userName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'face_descriptor', type: 'text' })
  faceDescriptor: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  getFaceDescriptorArray(): number[] {
    return JSON.parse(this.faceDescriptor);
  }

  setFaceDescriptorArray(descriptor: number[]): void {
    this.faceDescriptor = JSON.stringify(descriptor);
  }
}
