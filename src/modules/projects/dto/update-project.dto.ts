import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for updating an existing project.
 */
export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  public name?: string;

  @IsString()
  @IsOptional()
  public description?: string;
}
