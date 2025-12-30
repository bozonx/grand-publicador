import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    UseGuards,
    Request,
    Query,
    DefaultValuePipe,
    ParseIntPipe,
    ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service.js';
import { UpdateUserAdminDto, UpdateUserProfileDto } from './dto/user.dto.js';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.interface.js';
import { JWT_STRATEGY } from '../../common/constants/auth.constants.js';

/**
 * Controller for managing users.
 * Admin-only endpoints for user management.
 */
@Controller('users')
@UseGuards(AuthGuard(JWT_STRATEGY))
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * Get all users with pagination and filtering.
     * Admin only.
     */
    @Get()
    async findAll(
        @Request() req: AuthenticatedRequest,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
        @Query('is_admin') isAdmin?: string,
        @Query('search') search?: string,
    ) {
        // Check if user is admin
        const currentUser = await this.usersService.findById(req.user.sub);
        if (!currentUser?.isAdmin) {
            throw new ForbiddenException('Admin access required');
        }

        const isAdminFilter = isAdmin === 'true' ? true : isAdmin === 'false' ? false : undefined;

        return this.usersService.findAll({
            page,
            perPage,
            isAdmin: isAdminFilter,
            search,
        });
    }

    /**
     * Toggle admin status for a user.
     * Admin only.
     */
    @Patch(':id/admin')
    async toggleAdmin(
        @Request() req: AuthenticatedRequest,
        @Param('id') userId: string,
        @Body() updateDto: UpdateUserAdminDto,
    ) {
        // Check if user is admin
        const currentUser = await this.usersService.findById(req.user.sub);
        if (!currentUser?.isAdmin) {
            throw new ForbiddenException('Admin access required');
        }

        // Prevent user from removing their own admin status
        if (userId === req.user.sub && !updateDto.isAdmin) {
            throw new ForbiddenException('Cannot remove your own admin status');
        }


        return this.usersService.updateAdminStatus(userId, updateDto.isAdmin);
    }

    /**
     * Update current user profile.
     */
    @Patch('me')
    async updateProfile(
        @Request() req: AuthenticatedRequest,
        @Body() updateDto: UpdateUserProfileDto,
    ) {
        return this.usersService.updateProfile(req.user.sub, updateDto);
    }
}
