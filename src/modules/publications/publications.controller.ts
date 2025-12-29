
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
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.interface.js';
import { JWT_STRATEGY } from '../../common/constants/auth.constants.js';

/**
 * Controller for managing publications (content that can be distributed to multiple channels).
 */
@Controller('publications')
@UseGuards(AuthGuard(JWT_STRATEGY))
export class PublicationsController {
    constructor(private readonly publicationsService: PublicationsService) { }

    @Post()
    create(@Request() req: AuthenticatedRequest, @Body() createPublicationDto: CreatePublicationDto) {
        return this.publicationsService.create(createPublicationDto, req.user.sub);
    } // ...

    // ...

    @Post(':id/posts')
    createPosts(
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
