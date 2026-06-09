import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'currentPassword debe ser un texto' })
  @MinLength(8, { message: 'currentPassword debe tener al menos 8 caracteres' })
  @MaxLength(255, { message: 'currentPassword no puede tener más de 255 caracteres' })
  currentPassword!: string;

  @IsString({ message: 'newPassword debe ser un texto' })
  @MinLength(8, { message: 'newPassword debe tener al menos 8 caracteres' })
  @MaxLength(255, { message: 'newPassword no puede tener más de 255 caracteres' })
  newPassword!: string;

  @IsString({ message: 'confirmPassword debe ser un texto' })
  @MinLength(8, { message: 'confirmPassword debe tener al menos 8 caracteres' })
  @MaxLength(255, { message: 'confirmPassword no puede tener más de 255 caracteres' })
  confirmPassword!: string;

  @IsString({ message: 'ip debe ser un texto' })
  @IsOptional()
  ip?: string;

  @IsString({ message: 'userAgent debe ser un texto' })
  @IsOptional()
  userAgent?: string;
}
