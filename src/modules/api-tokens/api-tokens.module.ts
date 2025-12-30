import { Module } from '@nestjs/common';
import { ApiTokensController } from './api-tokens.controller.js';
import { ApiTokensService } from './api-tokens.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
    imports: [PrismaModule],
    controllers: [ApiTokensController],
    providers: [ApiTokensService],
    exports: [ApiTokensService],
})
export class ApiTokensModule { }
