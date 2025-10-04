import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FaceRecognitionService } from './face-recognition.service';
import { User } from '../database/entities/user.entity';
import { AuthLog } from '../database/entities/auth-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuthLog])],
  controllers: [AuthController],
  providers: [AuthService, FaceRecognitionService],
})
export class AuthModule {}
