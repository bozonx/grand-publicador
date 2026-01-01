import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { AutomationModule } from '../automation/automation.module.js';
import { PublicationsController } from './publications.controller.js';
import { PublicationsService } from './publications.service.js';

@Module({
  imports: [PrismaModule, AutomationModule],
  controllers: [PublicationsController],
  providers: [PublicationsService],
  exports: [PublicationsService],
})
export class PublicationsModule { }
