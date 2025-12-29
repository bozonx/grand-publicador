import { UserDto } from '../../users/dto/user.dto.js';
import { Expose, Type } from 'class-transformer';

/**
 * DTO for the authentication response.
 * Contains the JWT access token and user information.
 */
export class AuthResponseDto {
    @Expose()
    access_token!: string;

    @Expose()
    @Type(() => UserDto)
    user!: UserDto;
}
