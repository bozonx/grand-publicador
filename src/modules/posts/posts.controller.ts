import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { ApiTokenGuard } from '../../common/guards/api-token.guard.js';
import { JwtOrApiTokenGuard } from '../../common/guards/jwt-or-api-token.guard.js';
import type { UnifiedAuthRequest } from '../../common/types/unified-auth-request.interface.js';
import { ChannelsService } from '../channels/channels.service.js';
import { CreatePostDto, UpdatePostDto } from './dto/index.js';
import { PostsService } from './posts.service.js';

/**
 * Controller for managing posts within channels.
 */
@Controller('posts')
@UseGuards(JwtOrApiTokenGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly channelsService: ChannelsService,
  ) {}

  @Post()
  public async create(@Request() req: UnifiedAuthRequest, @Body() createPostDto: CreatePostDto) {
    const { channelId, ...data } = createPostDto;

    // Validate project scope for API token users
    if (req.user.scopeProjectIds) {
      const channel = await this.channelsService.findOne(channelId, req.user.userId);
      ApiTokenGuard.validateProjectScope(channel.projectId, req.user.scopeProjectIds, {
        userId: req.user.userId,
        tokenId: req.user.tokenId,
      });
    }

    return this.postsService.create(req.user.userId, channelId, data);
  }

  @Get()
  public async findAll(
    @Request() req: UnifiedAuthRequest,
    @Query('channelId') channelId?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: any,
    @Query('postType') postType?: any,
    @Query('search') search?: string,
  ) {
    const filters = { status, postType, search };

    // Validate project scope for API token users
    if (req.user.scopeProjectIds) {
      if (projectId) {
        ApiTokenGuard.validateProjectScope(projectId, req.user.scopeProjectIds, {
          userId: req.user.userId,
          tokenId: req.user.tokenId,
        });
      } else if (channelId) {
        const channel = await this.channelsService.findOne(channelId, req.user.userId);
        ApiTokenGuard.validateProjectScope(channel.projectId, req.user.scopeProjectIds, {
          userId: req.user.userId,
          tokenId: req.user.tokenId,
        });
      }
    }

    if (projectId) {
      return this.postsService.findAllForProject(projectId, req.user.userId, filters);
    }
    if (channelId) {
      return this.postsService.findAllForChannel(channelId, req.user.userId, filters);
    }
    return [];
  }

  @Get(':id')
  public async findOne(@Request() req: UnifiedAuthRequest, @Param('id') id: string) {
    const post = await this.postsService.findOne(id, req.user.userId);

    // Validate project scope for API token users
    if (req.user.scopeProjectIds) {
      // @ts-ignore - post returned from findOne includes channel
      const projectId = post.channel?.projectId;
      if (projectId) {
        ApiTokenGuard.validateProjectScope(projectId, req.user.scopeProjectIds, {
          userId: req.user.userId,
          tokenId: req.user.tokenId,
        });
      }
    }

    return post;
  }

  @Patch(':id')
  public async update(
    @Request() req: UnifiedAuthRequest,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    const post = await this.postsService.findOne(id, req.user.userId);

    // Validate project scope for API token users
    if (req.user.scopeProjectIds) {
      // @ts-ignore - post returned from findOne includes channel
      const projectId = post.channel?.projectId;
      if (projectId) {
        ApiTokenGuard.validateProjectScope(projectId, req.user.scopeProjectIds, {
          userId: req.user.userId,
          tokenId: req.user.tokenId,
        });
      }
    }

    return this.postsService.update(id, req.user.userId, updatePostDto);
  }

  @Delete(':id')
  public async remove(@Request() req: UnifiedAuthRequest, @Param('id') id: string) {
    const post = await this.postsService.findOne(id, req.user.userId);

    // Validate project scope for API token users
    if (req.user.scopeProjectIds) {
      // @ts-ignore - post returned from findOne includes channel
      const projectId = post.channel?.projectId;
      if (projectId) {
        ApiTokenGuard.validateProjectScope(projectId, req.user.scopeProjectIds, {
          userId: req.user.userId,
          tokenId: req.user.tokenId,
        });
      }
    }

    return this.postsService.remove(id, req.user.userId);
  }
}
