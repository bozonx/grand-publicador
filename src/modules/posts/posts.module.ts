import { Module } from '@nestjs/common';
import { PostsService } from './posts.service.js';
import { PostsController } from './posts.controller.js';
import { ChannelsModule } from '../channels/channels.module.js';

@Module({
    imports: [ChannelsModule],
    controllers: [PostsController],
    providers: [PostsService],
    exports: [PostsService],
})
export class PostsModule { }
