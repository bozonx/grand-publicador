
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for updating an existing project.
 */
export class UpdateProjectDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;
}
