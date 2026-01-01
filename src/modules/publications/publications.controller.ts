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
import { AutomationService } from '../automation/automation.service.js';
import { CreatePostsDto, CreatePublicationDto, UpdatePublicationDto } from './dto/index.js';
import { PublicationsService } from './publications.service.js';

/**
 * Controller for managing publications (content that can be distributed to multiple channels).
 */
@Controller('publications')
@UseGuards(JwtOrApiTokenGuard)
export class PublicationsController {
  constructor(
    private readonly publicationsService: PublicationsService,
    private readonly automationService: AutomationService,
  ) { }

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
      ApiTokenGuard.validateProjectScope(createPublicationDto.projectId, req.user.scopeProjectIds);
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
      ApiTokenGuard.validateProjectScope(publication.projectId, req.user.scopeProjectIds);
    }

    return this.publicationsService.createPostsFromPublication(
      id,
      createPostsDto.channelIds,
      req.user.userId,
      createPostsDto.scheduledAt,
    );
  }

  /**
   * Get posts that are ready to be published (Automation API)
   * GET /api/v1/publications/automation/pending?limit=10
   * Only returns posts from projects within the token's scope
   */
  @Get('automation/pending')
  public async getPendingPosts(
    @Request() req: UnifiedAuthRequest,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('lookback', new DefaultValuePipe(60), ParseIntPipe) lookback: number,
  ) {
    const scopeProjectIds = req.user.scopeProjectIds || [];
    return this.automationService.getPendingPosts(limit, lookback, req.user.userId, scopeProjectIds);
  }

  /**
   * Claim a post for publishing (Automation API - atomic operation)
   * POST /api/v1/publications/automation/:id/claim
   */
  @Post('automation/:id/claim')
  public async claimPost(@Request() req: UnifiedAuthRequest, @Param('id') id: string) {
    const scopeProjectIds = req.user.scopeProjectIds || [];
    return this.automationService.claimPost(id, req.user.userId, scopeProjectIds);
  }

  /**
   * Update post status after publishing (Automation API)
   * PATCH /api/v1/publications/automation/:id/status
   */
  @Patch('automation/:id/status')
  public async updatePostStatus(
    @Request() req: UnifiedAuthRequest,
    @Param('id') id: string,
    @Body() dto: { status: PostStatus; error?: string },
  ) {
    const scopeProjectIds = req.user.scopeProjectIds || [];
    return this.automationService.updatePostStatus(
      id,
      dto.status,
      req.user.userId,
      scopeProjectIds,
      dto.error,
    );
  }
}
