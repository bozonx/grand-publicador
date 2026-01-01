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
import { ChannelsService } from './channels.service.js';
import { CreateChannelDto, UpdateChannelDto } from './dto/index.js';

/**
 * Controller for managing channels within projects.
 */
@Controller('channels')
@UseGuards(JwtOrApiTokenGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) { }

  @Post()
  public async create(
    @Request() req: UnifiedAuthRequest,
    @Body() createChannelDto: CreateChannelDto,
  ) {
    const { projectId, ...data } = createChannelDto;

    // Validate project scope for API token users
    if (req.user.scopeProjectIds) {
      ApiTokenGuard.validateProjectScope(projectId, req.user.scopeProjectIds, {
        userId: req.user.userId,
        tokenId: req.user.tokenId,
      });
    }

    return this.channelsService.create(req.user.userId, projectId, data);
  }

  @Get()
  public async findAll(@Request() req: UnifiedAuthRequest, @Query('projectId') projectId: string) {
    // Validate project scope for API token users
    if (req.user.scopeProjectIds) {
      ApiTokenGuard.validateProjectScope(projectId, req.user.scopeProjectIds, {
        userId: req.user.userId,
        tokenId: req.user.tokenId,
      });
    }

    return this.channelsService.findAllForProject(projectId, req.user.userId);
  }

  @Get(':id')
  public async findOne(@Request() req: UnifiedAuthRequest, @Param('id') id: string) {
    const channel = await this.channelsService.findOne(id, req.user.userId, true);

    // Validate project scope for API token users
    if (req.user.scopeProjectIds) {
      ApiTokenGuard.validateProjectScope(channel.projectId, req.user.scopeProjectIds, {
        userId: req.user.userId,
        tokenId: req.user.tokenId,
      });
    }

    return channel;
  }

  @Patch(':id')
  public async update(
    @Request() req: UnifiedAuthRequest,
    @Param('id') id: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    const channel = await this.channelsService.findOne(id, req.user.userId, true);

    // Validate project scope for API token users
    if (req.user.scopeProjectIds) {
      ApiTokenGuard.validateProjectScope(channel.projectId, req.user.scopeProjectIds, {
        userId: req.user.userId,
        tokenId: req.user.tokenId,
      });
    }

    return this.channelsService.update(id, req.user.userId, updateChannelDto);
  }

  @Delete(':id')
  public async remove(@Request() req: UnifiedAuthRequest, @Param('id') id: string) {
    const channel = await this.channelsService.findOne(id, req.user.userId, true);

    // Validate project scope for API token users
    if (req.user.scopeProjectIds) {
      ApiTokenGuard.validateProjectScope(channel.projectId, req.user.scopeProjectIds, {
        userId: req.user.userId,
        tokenId: req.user.tokenId,
      });
    }

    return this.channelsService.remove(id, req.user.userId);
  }

  @Post(':id/archive')
  public async archive(@Request() req: UnifiedAuthRequest, @Param('id') id: string) {
    const channel = await this.channelsService.findOne(id, req.user.userId, true);

    // Validate project scope for API token users
    if (req.user.scopeProjectIds) {
      ApiTokenGuard.validateProjectScope(channel.projectId, req.user.scopeProjectIds, {
        userId: req.user.userId,
        tokenId: req.user.tokenId,
      });
    }

    return this.channelsService.archive(id, req.user.userId);
  }

  @Post(':id/unarchive')
  public async unarchive(@Request() req: UnifiedAuthRequest, @Param('id') id: string) {
    const channel = await this.channelsService.findOne(id, req.user.userId, true);

    // Validate project scope for API token users
    if (req.user.scopeProjectIds) {
      ApiTokenGuard.validateProjectScope(channel.projectId, req.user.scopeProjectIds, {
        userId: req.user.userId,
        tokenId: req.user.tokenId,
      });
    }

    return this.channelsService.unarchive(id, req.user.userId);
  }
}
