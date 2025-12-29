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
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { SocialMedia } from '@prisma/client';

class CreateChannelDto {
    @IsString()
    @IsNotEmpty()
    projectId!: string;

    @IsEnum(SocialMedia)
    @IsNotEmpty()
    socialMedia!: SocialMedia;

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
        const { projectId, ...data } = createChannelDto;
        return this.channelsService.create(req.user.userId, projectId, data);
    }

    @Get()
    findAll(@Request() req: any, @Query('projectId') projectId: string) {
        return this.channelsService.findAllForProject(projectId, req.user.userId);
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
