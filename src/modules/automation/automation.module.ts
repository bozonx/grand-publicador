import { Module } from '@nestjs/common';

import { ApiTokensModule } from '../api-tokens/api-tokens.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AutomationController } from './automation.controller.js';
import { AutomationService } from './automation.service.js';

@Module({
  imports: [ApiTokensModule, PrismaModule],
  controllers: [AutomationController],
  providers: [AutomationService],
})
export class AutomationModule {}
