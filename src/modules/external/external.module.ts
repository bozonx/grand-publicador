import { Module } from '@nestjs/common';
import { ExternalController } from './external.controller.js';
import { PublicationsModule } from '../publications/publications.module.js';
import { ApiTokensModule } from '../api-tokens/api-tokens.module.js';

@Module({
  imports: [PublicationsModule, ApiTokensModule],
  controllers: [ExternalController],
})
export class ExternalModule {}
