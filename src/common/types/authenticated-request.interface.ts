
import { FastifyRequest } from 'fastify';
import { JwtPayload } from './jwt-payload.interface.js';

export interface AuthenticatedRequest extends FastifyRequest {
    user: JwtPayload;
}
