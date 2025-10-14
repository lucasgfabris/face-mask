import { IsString, IsEmail, IsArray, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsArray()
  @ArrayMinSize(3) // Agora esperamos múltiplos descritores
  faceDescriptors: number[][]; // Array de arrays
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsArray()
  @ArrayMinSize(128)
  faceDescriptor: number[];
}
