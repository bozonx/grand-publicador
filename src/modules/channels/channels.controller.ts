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
import { ChannelsService } from './channels.service.js';
import { CreateChannelDto, UpdateChannelDto } from './dto/index.js';

/**
 * Controller for managing channels within projects.
 */
@Controller('channels')
@UseGuards(AuthGuard(JWT_STRATEGY))
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  public create(@Request() req: AuthenticatedRequest, @Body() createChannelDto: CreateChannelDto) {
    const { projectId, ...data } = createChannelDto;
    return this.channelsService.create(req.user.sub, projectId, data);
  }

  @Get()
  public findAll(@Request() req: AuthenticatedRequest, @Query('projectId') projectId: string) {
    return this.channelsService.findAllForProject(projectId, req.user.sub);
  }

  @Get(':id')
  public findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.channelsService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  public update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.channelsService.update(id, req.user.sub, updateChannelDto);
  }

  @Delete(':id')
  public remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.channelsService.remove(id, req.user.sub);
  }
}
