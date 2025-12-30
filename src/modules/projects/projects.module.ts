import { Module } from '@nestjs/common';

import { PermissionsModule } from '../../common/services/permissions.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';

@Module({
  imports: [PermissionsModule, PrismaModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
