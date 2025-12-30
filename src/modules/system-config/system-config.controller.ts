import {
    Controller,
    Get,
    Put,
    Body,
    UseGuards,
    Request,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SystemConfigService } from './system-config.service.js';
import { UsersService } from '../users/users.service.js';
import { JWT_STRATEGY } from '../../common/constants/auth.constants.js';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.interface.js';

@Controller('config')
@UseGuards(AuthGuard(JWT_STRATEGY))
export class SystemConfigController {
    constructor(
        private readonly systemConfigService: SystemConfigService,
        private readonly usersService: UsersService,
    ) { }

    @Get()
    async getConfig(@Request() req: AuthenticatedRequest) {
        await this.checkAdmin(req.user.sub);
        return {
            yaml: this.systemConfigService.getRawConfig(),
        };
    }

    @Put()
    async updateConfig(
        @Request() req: AuthenticatedRequest,
        @Body() body: { yaml: string },
    ) {
        await this.checkAdmin(req.user.sub);

        if (!body.yaml) {
            throw new BadRequestException('YAML content is required');
        }

        try {
            return this.systemConfigService.updateConfig(body.yaml);
        } catch (error: any) {
            throw new BadRequestException(error.message || 'Invalid YAML configuration');
        }
    }

    private async checkAdmin(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user?.isAdmin) {
            throw new ForbiddenException('Admin access required');
        }
    }
}
