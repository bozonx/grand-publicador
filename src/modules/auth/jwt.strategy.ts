import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../common/types/jwt-payload.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Initialize the strategy.
   * Configures the JWT extraction from the Bearer token and sets the secret key.
   */
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwtSecret')!,
    });
  }

  /**
   * Validate the JWT payload.
   * This method is called by Passport after successfully verifying the token signature.
   * It transforms the payload into a structured object for the request.
   *
   * @param payload - The decoded JWT payload.
   * @returns A partial user object (JwtPayload) attached to the request.
   */
  async validate(payload: any): Promise<JwtPayload> {
    return {
      sub: payload.sub,
      telegramId: payload.telegramId,
      username: payload.username,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
