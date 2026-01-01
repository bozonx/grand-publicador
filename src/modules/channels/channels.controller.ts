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
  public create(@Request() req: UnifiedAuthRequest, @Body() createChannelDto: CreateChannelDto) {
    const { projectId, ...data } = createChannelDto;
    return this.channelsService.create(req.user.userId, projectId, data);
  }

  @Get()
  public findAll(@Request() req: UnifiedAuthRequest, @Query('projectId') projectId: string) {
    return this.channelsService.findAllForProject(projectId, req.user.userId);
  }

  @Get(':id')
  public findOne(@Request() req: UnifiedAuthRequest, @Param('id') id: string) {
    return this.channelsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  public update(
    @Request() req: UnifiedAuthRequest,
    @Param('id') id: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.channelsService.update(id, req.user.userId, updateChannelDto);
  }

  @Delete(':id')
  public remove(@Request() req: UnifiedAuthRequest, @Param('id') id: string) {
    return this.channelsService.remove(id, req.user.userId);
  }
}
