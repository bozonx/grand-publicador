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
import { AuthGuard } from '@nestjs/passport';

import { JWT_STRATEGY } from '../../common/constants/auth.constants.js';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.interface.js';
import { CreatePostDto, UpdatePostDto } from './dto/index.js';
import { PostsService } from './posts.service.js';

/**
 * Controller for managing posts within channels.
 */
@Controller('posts')
@UseGuards(AuthGuard(JWT_STRATEGY))
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Post()
  public create(@Request() req: AuthenticatedRequest, @Body() createPostDto: CreatePostDto) {
    const { channelId, ...data } = createPostDto;
    return this.postsService.create(req.user.sub, channelId, data);
  }

  @Get()
  public findAll(
    @Request() req: AuthenticatedRequest,
    @Query('channelId') channelId?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: any, // specific enum type import might be needed but 'any' or string is safe for now as pipes handle validation if DTO used
    @Query('postType') postType?: any,
    @Query('search') search?: string,
  ) {
    const filters = { status, postType, search };
    if (projectId) {
      return this.postsService.findAllForProject(projectId, req.user.sub, filters);
    }
    if (channelId) {
      return this.postsService.findAllForChannel(channelId, req.user.sub, filters);
    }
    return [];
  }

  @Get(':id')
  public findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.postsService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  public update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, req.user.sub, updatePostDto);
  }

  @Delete(':id')
  public remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.postsService.remove(id, req.user.sub);
  }
}
