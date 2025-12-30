import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PostStatus } from '@prisma/client';

/**
 * Validator to ensure a date is in the future
 */
@ValidatorConstraint({ name: 'isFutureDate', async: false })
class IsFutureDateConstraint implements ValidatorConstraintInterface {
  public validate(value: any, _args: ValidationArguments): boolean {
    if (!value) {
      return true; // Let @IsOptional handle undefined/null
    }

    const date = new Date(value);
    const now = new Date();

    return date.getTime() > now.getTime();
  }

  public defaultMessage(_args: ValidationArguments): string {
    return 'Date must be in the future';
  }
}

/**
 * Decorator to validate that a date is in the future
 */
function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFutureDateConstraint,
    });
  };
}

/**
 * DTO for creating a publication via external API.
 */
export class CreateExternalPublicationDto {
  @IsString()
  @IsNotEmpty()
  public projectId!: string;

  @IsString()
  @IsOptional()
  public title?: string;

  @IsString()
  @IsNotEmpty()
  public content!: string;

  @IsArray()
  @IsOptional()
  public mediaFiles?: string[];

  @IsString()
  @IsOptional()
  public tags?: string;

  @IsEnum(PostStatus)
  @IsOptional()
  public status?: PostStatus;
}

/**
 * DTO for scheduling a publication via external API.
 */
export class SchedulePublicationDto {
  @IsString()
  @IsNotEmpty()
  public publicationId!: string;

  @IsArray()
  @IsNotEmpty()
  public channelIds!: string[];

  @IsDateString()
  @IsFutureDate({ message: 'Scheduled date must be in the future' })
  @IsOptional()
  public scheduledAt?: Date;
}
