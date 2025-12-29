
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
    DefaultValuePipe,
    ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto, UpdateProjectDto } from './dto/index.js';
import { AuthenticatedRequest } from '../../common/types/authenticated-request.interface.js';
import { JWT_STRATEGY } from '../../common/constants/auth.constants.js';

@Controller('projects')
@UseGuards(AuthGuard(JWT_STRATEGY))
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    create(@Request() req: AuthenticatedRequest, @Body() createProjectDto: CreateProjectDto) {
        return this.projectsService.create(req.user.sub, createProjectDto);
    }

    @Get()
    findAll(
        @Request() req: AuthenticatedRequest,
        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    ) {
        return this.projectsService.findAllForUser(req.user.sub, { limit, offset });
    }

    @Get(':id')
    findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.projectsService.findOne(id, req.user.sub);
    }

    @Patch(':id')
    update(
        @Request() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() updateProjectDto: UpdateProjectDto,
    ) {
        return this.projectsService.update(id, req.user.sub, updateProjectDto);
    }

    @Delete(':id')
    remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.projectsService.remove(id, req.user.sub);
    }
}
