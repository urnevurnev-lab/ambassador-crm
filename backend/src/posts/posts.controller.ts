import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('posts')
export class PostsController {
    constructor(private readonly prisma: PrismaService) {}

    @Get()
    async getPosts() {
        return this.prisma.post.findMany({
            orderBy: [
                { importance: 'desc' },
                { createdAt: 'desc' },
            ],
        });
    }
}
