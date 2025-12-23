import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Get()
    findAll(@Query('category') category: string) {
        return this.postsService.findAll(category);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.postsService.findOne(Number(id));
    }

    @Post()
    create(
        @Body()
        dto: {
            title: string;
            category?: string;
            content?: string;
            imageUrl?: string;
            readTime?: string;
            importance?: number;
        },
    ) {
        return this.postsService.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body()
        dto: {
            title?: string;
            category?: string;
            content?: string;
            imageUrl?: string;
            readTime?: string;
            importance?: number;
        },
    ) {
        return this.postsService.update(Number(id), dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.postsService.remove(Number(id));
    }
}
