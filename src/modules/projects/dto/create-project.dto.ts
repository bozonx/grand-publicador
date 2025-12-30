import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating a new project.
 */
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsString()
  @IsOptional()
  public description?: string;
}
