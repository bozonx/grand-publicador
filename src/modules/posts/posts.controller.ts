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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PostsService } from './posts.service.js';
import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    channelId!: string;

    @IsString()
    @IsNotEmpty()
    content!: string;

    @IsString()
    @IsNotEmpty()
    socialMedia!: string;

    @IsString()
    @IsNotEmpty()
    postType!: string;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    authorComment?: string;

    @IsString()
    @IsOptional()
    tags?: string;

    @IsOptional()
    mediaFiles?: any;

    @IsDateString()
    @IsOptional()
    scheduledAt?: Date;

    @IsString()
    @IsOptional()
    status?: string;
}

class UpdatePostDto {
    @IsString()
    @IsOptional()
    content?: string;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    authorComment?: string;

    @IsString()
    @IsOptional()
    tags?: string;

    @IsOptional()
    mediaFiles?: any;

    @IsString()
    @IsOptional()
    status?: string;

    @IsDateString()
    @IsOptional()
    scheduledAt?: Date;

    @IsDateString()
    @IsOptional()
    publishedAt?: Date;
}

@Controller('posts')
@UseGuards(AuthGuard('jwt'))
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    create(@Request() req: any, @Body() createPostDto: CreatePostDto) {
        const { channelId, ...data } = createPostDto;
        return this.postsService.create(req.user.userId, channelId, data);
    }

    @Get()
    findAll(@Request() req: any, @Query('channelId') channelId: string) {
        return this.postsService.findAllForChannel(channelId, req.user.userId);
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.postsService.findOne(id, req.user.userId);
    }

    @Patch(':id')
    update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() updatePostDto: UpdatePostDto,
    ) {
        return this.postsService.update(id, req.user.userId, updatePostDto);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.postsService.remove(id, req.user.userId);
    }
}
