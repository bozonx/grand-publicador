import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { ApiTokenGuard } from '../../common/guards/api-token.guard.js';
import type { ApiTokenRequest } from '../../common/types/api-token-user.interface.js';
import { AutomationService } from './automation.service.js';
import { UpdatePostStatusDto } from './dto/automation.dto.js';

/**
 * Automation API for polling and updating scheduled posts.
 * Designed for use by the background worker service.
 * Protected by API token authentication.
 */
@Controller('automation/v1')
@UseGuards(ApiTokenGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  /**
   * Get posts that are ready to be published
   * GET /api/automation/v1/posts/pending?limit=10
   * Only returns posts from projects within the token's scope
   */
  @Get('posts/pending')
  public async getPendingPosts(
    @Request() req: ApiTokenRequest,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('lookback', new DefaultValuePipe(60), ParseIntPipe) lookback: number,
  ) {
    const { userId, scopeProjectIds } = req.user;
    return this.automationService.getPendingPosts(limit, lookback, userId, scopeProjectIds);
  }

  /**
   * Claim a post for publishing (atomic operation)
   * POST /api/automation/v1/posts/:id/claim
   */
  @Post('posts/:id/claim')
  public async claimPost(@Request() req: ApiTokenRequest, @Param('id') id: string) {
    const { userId, scopeProjectIds } = req.user;
    return this.automationService.claimPost(id, userId, scopeProjectIds);
  }

  /**
   * Update post status after publishing
   * PATCH /api/automation/v1/posts/:id/status
   */
  @Patch('posts/:id/status')
  public async updatePostStatus(
    @Request() req: ApiTokenRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePostStatusDto,
  ) {
    const { userId, scopeProjectIds } = req.user;
    return this.automationService.updatePostStatus(
      id,
      dto.status,
      userId,
      scopeProjectIds,
      dto.error,
    );
  }
}
