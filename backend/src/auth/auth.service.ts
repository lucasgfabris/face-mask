import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { FaceRecognitionService } from './face-recognition.service';
import { User } from '../database/entities/user.entity';
import { AuthLog, AuthType } from '../database/entities/auth-log.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuthLog)
    private readonly authLogRepository: Repository<AuthLog>,
    private readonly faceRecognitionService: FaceRecognitionService
  ) {}

  async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const { userName, email, faceDescriptors } = registerDto;

    try {
      const existingUserByName = await this.userRepository.findOne({
        where: { userName: userName.toLowerCase() },
      });

      if (existingUserByName) {
        await this.logAuth(userName, AuthType.REGISTER, false, ipAddress, userAgent);
        throw new HttpException('Nome de usuário já existe', HttpStatus.CONFLICT);
      }

      const existingUserByEmail = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (existingUserByEmail) {
        await this.logAuth(userName, AuthType.REGISTER, false, ipAddress, userAgent);
        throw new HttpException('E-mail já cadastrado', HttpStatus.CONFLICT);
      }

      // Validar consistência dos descritores
      const consistencyCheck =
        this.faceRecognitionService.validateDescriptorConsistency(faceDescriptors);
      if (!consistencyCheck.isValid) {
        await this.logAuth(userName, AuthType.REGISTER, false, ipAddress, userAgent);
        throw new HttpException(consistencyCheck.message, HttpStatus.BAD_REQUEST);
      }

      // Calcular o descritor médio
      const averageDescriptor = this.faceRecognitionService.averageDescriptors(faceDescriptors);

      // Verificar se o rosto já está registrado
      const allUsers = await this.userRepository.find();
      const existingDescriptors = allUsers.map((user) => user.getFaceDescriptorArray());

      const isFaceRegistered = this.faceRecognitionService.findMatchingFace(
        averageDescriptor,
        existingDescriptors
      );

      if (isFaceRegistered !== -1) {
        await this.logAuth(userName, AuthType.REGISTER, false, ipAddress, userAgent);
        throw new HttpException('Este rosto já está registrado', HttpStatus.CONFLICT);
      }

      const user = new User();
      user.userName = userName.toLowerCase();
      user.email = email.toLowerCase();
      user.setFaceDescriptorArray(averageDescriptor);

      await this.userRepository.save(user);
      await this.logAuth(userName, AuthType.REGISTER, true, ipAddress, userAgent);

      return {
        success: true,
        message: 'Usuário registrado com sucesso',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erro ao registrar usuário', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { userName, faceDescriptor } = loginDto;

    try {
      const user = await this.userRepository.findOne({
        where: { userName: userName.toLowerCase() },
      });

      if (!user) {
        await this.logAuth(userName, AuthType.LOGIN, false, ipAddress, userAgent);
        throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
      }

      const storedDescriptor = user.getFaceDescriptorArray();
      const isMatch = this.faceRecognitionService.compareFaces(faceDescriptor, storedDescriptor);

      if (!isMatch) {
        await this.logAuth(userName, AuthType.LOGIN, false, ipAddress, userAgent);
        throw new HttpException('Rosto não reconhecido. Tente novamente.', HttpStatus.UNAUTHORIZED);
      }

      await this.logAuth(userName, AuthType.LOGIN, true, ipAddress, userAgent);

      return {
        success: true,
        message: 'Autenticação realizada com sucesso',
        userName: user.userName,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erro ao autenticar usuário', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async logAuth(
    userName: string,
    authType: AuthType,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const log = new AuthLog();
      log.userName = userName;
      log.authType = authType;
      log.success = success;
      log.ipAddress = ipAddress;
      log.userAgent = userAgent;

      await this.authLogRepository.save(log);
    } catch (error) {
      console.error('Erro ao salvar log de autenticação:', error);
    }
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'userName', 'email', 'createdAt', 'updatedAt'],
    });
  }

  async getAuthLogs(limit: number = 50): Promise<AuthLog[]> {
    return this.authLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
