import { Module } from '@nestjs/common';

import { ApiTokensModule } from '../api-tokens/api-tokens.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AutomationService } from './automation.service.js';

@Module({
  imports: [ApiTokensModule, PrismaModule],
  controllers: [],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule { }
