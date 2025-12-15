import { Controller, Get, Param, Query } from '@nestjs/common';
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
}
