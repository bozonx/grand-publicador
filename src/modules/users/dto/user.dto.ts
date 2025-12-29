import { Exclude, Expose, Transform } from 'class-transformer';

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
