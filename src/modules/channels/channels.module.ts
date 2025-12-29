import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service.js';
import { ChannelsController } from './channels.controller.js';
import { BlogsModule } from '../blogs/blogs.module.js';

@Module({
    imports: [BlogsModule],
    controllers: [ChannelsController],
    providers: [ChannelsService],
    exports: [ChannelsService],
})
export class ChannelsModule { }
