import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  ci: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @MinLength(10)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message: 'La contraseña debe tener mayúscula, minúscula, número y símbolo',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  captchaId: string;

  @IsString()
  @IsNotEmpty()
  captchaAnswer: string;
}