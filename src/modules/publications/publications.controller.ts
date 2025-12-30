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
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.interface.js';
import { CreatePostsDto, CreatePublicationDto, UpdatePublicationDto } from './dto/index.js';
import { PublicationsService } from './publications.service.js';

/**
 * Controller for managing publications (content that can be distributed to multiple channels).
 */
@Controller('publications')
@UseGuards(AuthGuard(JWT_STRATEGY))
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  /**
   * Create a new publication.
   */
  @Post()
  public async create(
    @Request() req: AuthenticatedRequest,
    @Body() createPublicationDto: CreatePublicationDto,
  ) {
    return this.publicationsService.create(createPublicationDto, req.user.sub);
  }

  /**
   * Get all publications for a project.
   */
  @Get()
  public async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('projectId') projectId: string,
    @Query('status') status?: PostStatus,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.publicationsService.findAll(projectId, req.user.sub, {
      status,
      limit,
      offset,
    });
  }

  /**
   * Get a single publication by ID.
   */
  @Get(':id')
  public async findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.publicationsService.findOne(id, req.user.sub);
  }

  /**
   * Update a publication.
   */
  @Patch(':id')
  public async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updatePublicationDto: UpdatePublicationDto,
  ) {
    return this.publicationsService.update(id, req.user.sub, updatePublicationDto);
  }

  /**
   * Delete a publication.
   */
  @Delete(':id')
  public async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.publicationsService.remove(id, req.user.sub);
  }

  /**
   * Generate individual posts for specified channels from a publication.
   */
  @Post(':id/posts')
  public async createPosts(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() createPostsDto: CreatePostsDto,
  ) {
    return this.publicationsService.createPostsFromPublication(
      id,
      createPostsDto.channelIds,
      req.user.sub,
      createPostsDto.scheduledAt,
    );
  }
}
