import { Body, Controller, Post } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly adminAuthService: AdminAuthService) {}

    @Post('admin')
    async adminLogin(@Body() body: { password: string }) {
        const token = this.adminAuthService.issueToken(body?.password);
        return { token };
    }
}
