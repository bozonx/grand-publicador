import { UserDto } from '../../users/dto/user.dto.js';
import { Expose, Type } from 'class-transformer';

export class AuthResponseDto {
    @Expose()
    access_token!: string;

    @Expose()
    @Type(() => UserDto)
    user!: UserDto;
}
