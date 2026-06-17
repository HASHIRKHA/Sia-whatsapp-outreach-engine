import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' } })
export class SessionsGateway {
  @WebSocketServer()
  private server: Server | undefined;

  emitQr(sessionId: string, qr: string): void {
    this.server?.emit('session:qr', { sessionId, qr });
  }

  emitStatus(sessionId: string, status: string): void {
    this.server?.emit('session:status', { sessionId, status });
  }

  emitCampaignStats(campaignId: string, stats: Record<string, unknown>): void {
    this.server?.emit('campaign:stats', { campaignId, ...stats });
  }

  emitReply(contactId: string, phone: string, text: string, campaignId: string | null): void {
    this.server?.emit('reply:new', { contactId, phone, text, campaignId, at: new Date().toISOString() });
  }
}
