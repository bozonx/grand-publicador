import { Exclude, Expose, Transform } from 'class-transformer';
import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class UserDto {
  @Expose()
  id!: string;

  @Expose()
  email?: string | null;

  @Expose()
  fullName?: string | null;

  @Expose()
  username?: string | null;

  @Expose()
  avatarUrl?: string | null;

  /**
   * The Telegram ID of the user.
   * Transformed to string to avoid BigInt serialization issues in JSON.
   */
  @Expose()
  @Transform(({ value }) => value?.toString(), { toPlainOnly: true })
  telegramId?: string | null;

  @Expose()
  isAdmin!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  preferences!: string; // Internal use
}


export class UpdateUserAdminDto {
  @IsBoolean()
  isAdmin!: boolean;
}

export class UpdateUserProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

