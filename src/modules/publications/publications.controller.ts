import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PostStatus } from '@prisma/client';

import { JWT_STRATEGY } from '../../common/constants/auth.constants.js';
import { ApiTokenGuard } from '../../common/guards/api-token.guard.js';
import { JwtOrApiTokenGuard } from '../../common/guards/jwt-or-api-token.guard.js';
import type { UnifiedAuthRequest } from '../../common/types/unified-auth-request.interface.js';
import { CreatePostsDto, CreatePublicationDto, UpdatePublicationDto } from './dto/index.js';
import { PublicationsService } from './publications.service.js';

/**
 * Controller for managing publications (content that can be distributed to multiple channels).
 */
@Controller('publications')
@UseGuards(JwtOrApiTokenGuard)
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) { }

  /**
   * Create a new publication.
   */
  @Post()
  public async create(
    @Request() req: UnifiedAuthRequest,
    @Body() createPublicationDto: CreatePublicationDto,
  ) {
    // Validate project scope for API token users
    if (req.user.scopeProjectIds && req.user.scopeProjectIds.length > 0) {
      ApiTokenGuard.validateProjectScope(createPublicationDto.projectId, req.user.scopeProjectIds, {
        userId: req.user.userId,
        tokenId: req.user.tokenId,
      });
    }
    return this.publicationsService.create(createPublicationDto, req.user.userId);
  }

  /**
   * Get all publications for a project.
   */
  @Get()
  public async findAll(
    @Request() req: UnifiedAuthRequest,
    @Query('projectId') projectId: string,
    @Query('status') status?: PostStatus,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.publicationsService.findAll(projectId, req.user.userId, {
      status,
      limit,
      offset,
    });
  }

  /**
   * Get a single publication by ID.
   */
  @Get(':id')
  public async findOne(@Request() req: UnifiedAuthRequest, @Param('id') id: string) {
    return this.publicationsService.findOne(id, req.user.userId);
  }

  /**
   * Update a publication.
   */
  @Patch(':id')
  public async update(
    @Request() req: UnifiedAuthRequest,
    @Param('id') id: string,
    @Body() updatePublicationDto: UpdatePublicationDto,
  ) {
    return this.publicationsService.update(id, req.user.userId, updatePublicationDto);
  }

  /**
   * Delete a publication.
   */
  @Delete(':id')
  public async remove(@Request() req: UnifiedAuthRequest, @Param('id') id: string) {
    return this.publicationsService.remove(id, req.user.userId);
  }

  /**
   * Generate individual posts for specified channels from a publication.
   */
  @Post(':id/posts')
  public async createPosts(
    @Request() req: UnifiedAuthRequest,
    @Param('id') id: string,
    @Body() createPostsDto: CreatePostsDto,
  ) {
    // Validate project scope for API token users
    const publication = await this.publicationsService.findOne(id, req.user.userId);
    if (req.user.scopeProjectIds && req.user.scopeProjectIds.length > 0) {
      ApiTokenGuard.validateProjectScope(publication.projectId, req.user.scopeProjectIds, {
        userId: req.user.userId,
        tokenId: req.user.tokenId,
      });
    }

    return this.publicationsService.createPostsFromPublication(
      id,
      createPostsDto.channelIds,
      req.user.userId,
      createPostsDto.scheduledAt,
    );
  }


}
