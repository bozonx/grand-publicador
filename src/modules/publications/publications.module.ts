import { Module } from '@nestjs/common';
import { PublicationsService } from './publications.service.js';
import { PublicationsController } from './publications.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [PublicationsController],
  providers: [PublicationsService],
  exports: [PublicationsService],
})
export class PublicationsModule { }
