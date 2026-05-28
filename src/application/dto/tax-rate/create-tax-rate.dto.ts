import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, MaxLength } from 'class-validator';

export class CreateTaxRateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
  @IsOptional()
  isActive?: boolean;
}
