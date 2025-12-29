
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
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PublicationsService } from './publications.service.js';
import { CreatePublicationDto, UpdatePublicationDto, CreatePostsDto } from './dto/index.js';
import { PostStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/types/authenticated-request.interface.js';
import { JWT_STRATEGY } from '../../common/constants/auth.constants.js';

@Controller('publications')
@UseGuards(AuthGuard(JWT_STRATEGY))
export class PublicationsController {
    constructor(private readonly publicationsService: PublicationsService) { }

    @Post()
    create(@Request() req: AuthenticatedRequest, @Body() createPublicationDto: CreatePublicationDto) {
        return this.publicationsService.create(req.user.sub, createPublicationDto);
    }

    @Get()
    findAll(
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

    @Get(':id')
    findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.publicationsService.findOne(id, req.user.sub);
    }

    @Patch(':id')
    update(
        @Request() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() updatePublicationDto: UpdatePublicationDto,
    ) {
        return this.publicationsService.update(id, req.user.sub, updatePublicationDto);
    }

    @Delete(':id')
    remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.publicationsService.remove(id, req.user.sub);
    }

    @Post(':id/posts')
    createPosts(
        @Request() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() createPostsDto: CreatePostsDto,
    ) {
        return this.publicationsService.createPostsFromPublication(
            id,
            req.user.sub,
            createPostsDto.channelIds,
            createPostsDto.scheduledAt,
        );
    }
}
