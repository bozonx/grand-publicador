import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { PublicationsController } from './publications.controller.js';
import { PublicationsService } from './publications.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PublicationsController],
  providers: [PublicationsService],
  exports: [PublicationsService],
})
export class PublicationsModule {}
