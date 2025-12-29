import { Module } from '@nestjs/common';
import { ExternalController } from './external.controller.js';
import { PublicationsModule } from '../publications/publications.module.js';

@Module({
  imports: [PublicationsModule],
  controllers: [ExternalController],
})
export class ExternalModule {}
