import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller.js';
import { AutomationService } from './automation.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ApiTokensModule } from '../api-tokens/api-tokens.module.js';

@Module({
  imports: [PrismaModule, ApiTokensModule],
  controllers: [AutomationController],
  providers: [AutomationService],
})
export class AutomationModule { }
