import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import type { Reply } from '@prisma/client';
import { RepliesService } from './replies.service';

@Controller('replies')
export class RepliesController {
  constructor(private readonly replies: RepliesService) {}

  @Get()
  findAll(
    @Query('sentiment') sentiment?: string,
    @Query('handled') handled?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<Reply[]> {
    const parsedHandled =
      handled === 'true' ? true : handled === 'false' ? false : undefined;
    return this.replies.findAll({
      sentiment,
      handled: parsedHandled,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Patch(':id')
  patch(
    @Param('id') id: string,
    @Body() body: { handled?: boolean },
  ): Promise<Reply> {
    return this.replies.patch(id, body);
  }
}
