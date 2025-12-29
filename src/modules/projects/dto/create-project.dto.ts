import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating a new project.
 */
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
