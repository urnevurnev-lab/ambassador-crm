import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportsService } from './imports.service';

@Controller('imports')
export class ImportsController {
    constructor(private readonly importsService: ImportsService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadExcel(@UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('Файл не передан');
        }

        const result = await this.importsService.importExcel(file.buffer);
        return result;
    }
}
