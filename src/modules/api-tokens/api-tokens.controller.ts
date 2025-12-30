import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ApiTokensService } from './api-tokens.service.js';
import { CreateApiTokenDto, UpdateApiTokenDto } from './dto/api-token.dto.js';

/**
 * Controller for managing user API tokens.
 * All endpoints require JWT authentication.
 */
@Controller('api-tokens')
@UseGuards(JwtAuthGuard)
export class ApiTokensController {
    constructor(private readonly apiTokensService: ApiTokensService) { }

    /**
     * Get all API tokens for the current user
     * GET /api/v1/api-tokens
     */
    @Get()
    async findAll(@Request() req: any) {
        return this.apiTokensService.findAllByUser(req.user.userId);
    }

    /**
     * Create a new API token
     * POST /api/v1/api-tokens
     */
    @Post()
    async create(@Request() req: any, @Body() dto: CreateApiTokenDto) {
        return this.apiTokensService.create(req.user.userId, dto);
    }

    /**
     * Update an API token (name and scope only)
     * PATCH /api/v1/api-tokens/:id
     */
    @Patch(':id')
    async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateApiTokenDto) {
        return this.apiTokensService.update(id, req.user.userId, dto);
    }

    /**
     * Delete an API token
     * DELETE /api/v1/api-tokens/:id
     */
    @Delete(':id')
    async delete(@Request() req: any, @Param('id') id: string) {
        await this.apiTokensService.delete(id, req.user.userId);
        return { success: true };
    }
}
