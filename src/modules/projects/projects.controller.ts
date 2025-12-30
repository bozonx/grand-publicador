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
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.interface.js';
import { CreateProjectDto, UpdateProjectDto } from './dto/index.js';
import { ProjectsService } from './projects.service.js';

/**
 * Controller for managing projects.
 * Handles creation, retrieval, updating, and deletion of projects.
 */
@Controller('projects')
@UseGuards(AuthGuard(JWT_STRATEGY))
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  public create(@Request() req: AuthenticatedRequest, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(req.user.sub, createProjectDto);
  }

  @Get()
  public findAll(
    @Request() req: AuthenticatedRequest,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.projectsService.findAllForUser(req.user.sub, { limit, offset });
  }

  @Get(':id')
  public findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.projectsService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  public update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, req.user.sub, updateProjectDto);
  }

  @Delete(':id')
  public remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.projectsService.remove(id, req.user.sub);
  }
}
