import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';

/**
 * Module for user management.
 * Provides services for user retrieval and updates.
 */
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
