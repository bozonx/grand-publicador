
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
import { CreatePostDto, UpdatePostDto } from './dto/index.js';
import { AuthenticatedRequest } from '../../common/types/authenticated-request.interface.js';
import { JWT_STRATEGY } from '../../common/constants/auth.constants.js';

@Controller('posts')
@UseGuards(AuthGuard(JWT_STRATEGY))
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    create(@Request() req: AuthenticatedRequest, @Body() createPostDto: CreatePostDto) {
        const { channelId, ...data } = createPostDto;
        return this.postsService.create(req.user.sub, channelId, data);
    }

    @Get()
    findAll(@Request() req: AuthenticatedRequest, @Query('channelId') channelId: string) {
        return this.postsService.findAllForChannel(channelId, req.user.sub);
    }

    @Get(':id')
    findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.postsService.findOne(id, req.user.sub);
    }

    @Patch(':id')
    update(
        @Request() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() updatePostDto: UpdatePostDto,
    ) {
        return this.postsService.update(id, req.user.sub, updatePostDto);
    }

    @Delete(':id')
    remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.postsService.remove(id, req.user.sub);
    }
}
