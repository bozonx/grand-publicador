import { IsString, IsOptional, IsArray } from 'class-validator';
import { Expose, Transform } from 'class-transformer';

export class CreateApiTokenDto {
    @IsString()
    name!: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    scopeProjectIds?: string[];
}

export class UpdateApiTokenDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    scopeProjectIds?: string[];
}

export class ApiTokenDto {
    @Expose()
    id!: string;

    @Expose()
    userId!: string;

    @Expose()
    name!: string;

    @Expose()
    plainToken!: string;

    @Expose()
    @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
    scopeProjectIds!: string[];

    @Expose()
    lastUsedAt?: Date | null;

    @Expose()
    createdAt!: Date;

    @Expose()
    updatedAt!: Date;
}
