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

import { JWT_STRATEGY } from '../../common/constants/auth.constants.js';
import { JwtOrApiTokenGuard } from '../../common/guards/jwt-or-api-token.guard.js';
import type { UnifiedAuthRequest } from '../../common/types/unified-auth-request.interface.js';
import { CreateProjectDto, UpdateProjectDto } from './dto/index.js';
import { ProjectsService } from './projects.service.js';

/**
 * Controller for managing projects.
 * Handles creation, retrieval, updating, and deletion of projects.
 */
@Controller('projects')
@UseGuards(JwtOrApiTokenGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @Post()
  public create(@Request() req: UnifiedAuthRequest, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(req.user.userId, createProjectDto);
  }

  @Get()
  public findAll(
    @Request() req: UnifiedAuthRequest,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.projectsService.findAllForUser(req.user.userId, { limit, offset });
  }

  @Get(':id')
  public findOne(@Request() req: UnifiedAuthRequest, @Param('id') id: string) {
    return this.projectsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  public update(
    @Request() req: UnifiedAuthRequest,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, req.user.userId, updateProjectDto);
  }

  @Delete(':id')
  public remove(@Request() req: UnifiedAuthRequest, @Param('id') id: string) {
    return this.projectsService.remove(id, req.user.userId);
  }
}
