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
import { ChannelsService } from './channels.service.js';
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

class CreateChannelDto {
    @IsString()
    @IsNotEmpty()
    blogId!: string;

    @IsString()
    @IsNotEmpty()
    socialMedia!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    channelIdentifier!: string;

    @IsOptional()
    credentials?: any;
}

class UpdateChannelDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    channelIdentifier?: string;

    @IsOptional()
    credentials?: any;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

@Controller('channels')
@UseGuards(AuthGuard('jwt'))
export class ChannelsController {
    constructor(private readonly channelsService: ChannelsService) { }

    @Post()
    create(@Request() req: any, @Body() createChannelDto: CreateChannelDto) {
        const { blogId, ...data } = createChannelDto;
        return this.channelsService.create(req.user.userId, blogId, data);
    }

    @Get()
    findAll(@Request() req: any, @Query('blogId') blogId: string) {
        return this.channelsService.findAllForBlog(blogId, req.user.userId);
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.channelsService.findOne(id, req.user.userId);
    }

    @Patch(':id')
    update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() updateChannelDto: UpdateChannelDto,
    ) {
        return this.channelsService.update(id, req.user.userId, updateChannelDto);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.channelsService.remove(id, req.user.userId);
    }
}
