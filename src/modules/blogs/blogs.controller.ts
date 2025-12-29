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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BlogsService } from './blogs.service.js';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CreateBlogDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;
}

class UpdateBlogDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;
}

@Controller('blogs')
@UseGuards(AuthGuard('jwt'))
export class BlogsController {
    constructor(private readonly blogsService: BlogsService) { }

    @Post()
    create(@Request() req: any, @Body() createBlogDto: CreateBlogDto) {
        return this.blogsService.create(req.user.userId, createBlogDto);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.blogsService.findAllForUser(req.user.userId);
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.blogsService.findOne(id, req.user.userId);
    }

    @Patch(':id')
    update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() updateBlogDto: UpdateBlogDto,
    ) {
        return this.blogsService.update(id, req.user.userId, updateBlogDto);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.blogsService.remove(id, req.user.userId);
    }
}
