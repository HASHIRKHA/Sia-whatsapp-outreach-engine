import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { type Session } from '@prisma/client';
import { ConnectSessionDto } from './dto/connect-session.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionsService } from './sessions.service';

type SafeSession = Omit<Session, 'authState'>;

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post()
  create(@Body() dto: CreateSessionDto): Promise<SafeSession> {
    return this.sessions.createSession(dto);
  }

  @Get()
  list(): Promise<SafeSession[]> {
    return this.sessions.listSessions();
  }

  @Post(':id/connect')
  connect(
    @Param('id') id: string,
    @Body() dto: ConnectSessionDto,
  ): Promise<{ method: string; code?: string }> {
    return this.sessions.connect(id, dto);
  }

  @Post(':id/disconnect')
  @HttpCode(204)
  disconnect(@Param('id') id: string): Promise<void> {
    return this.sessions.disconnectSession(id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.sessions.deleteSession(id);
  }

  @Get(':id/health')
  health(
    @Param('id') id: string,
  ): Promise<{ status: string; phoneNumber: string | null }> {
    return this.sessions.getHealth(id);
  }
}
