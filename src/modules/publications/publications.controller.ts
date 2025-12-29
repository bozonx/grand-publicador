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
import { CreatePublicationDto, UpdatePublicationDto } from './dto/index.js';
import { PostStatus } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CreatePostsDto {
    @IsArray()
    @IsNotEmpty()
    channelIds!: string[];

    @IsDateString()
    @IsOptional()
    scheduledAt?: Date;
}

@Controller('publications')
@UseGuards(AuthGuard('jwt'))
export class PublicationsController {
    constructor(private readonly publicationsService: PublicationsService) { }

    @Post()
    create(@Request() req: any, @Body() createPublicationDto: CreatePublicationDto) {
        return this.publicationsService.create(req.user.userId, createPublicationDto);
    }

    @Get()
    findAll(
        @Request() req: any,
        @Query('projectId') projectId: string,
        @Query('status') status?: PostStatus,
        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    ) {
        return this.publicationsService.findAll(projectId, req.user.userId, {
            status,
            limit,
            offset,
        });
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.publicationsService.findOne(id, req.user.userId);
    }

    @Patch(':id')
    update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() updatePublicationDto: UpdatePublicationDto,
    ) {
        return this.publicationsService.update(id, req.user.userId, updatePublicationDto);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.publicationsService.remove(id, req.user.userId);
    }

    @Post(':id/posts')
    createPosts(
        @Request() req: any,
        @Param('id') id: string,
        @Body() createPostsDto: CreatePostsDto,
    ) {
        return this.publicationsService.createPostsFromPublication(
            id,
            req.user.userId,
            createPostsDto.channelIds,
            createPostsDto.scheduledAt,
        );
    }
}
