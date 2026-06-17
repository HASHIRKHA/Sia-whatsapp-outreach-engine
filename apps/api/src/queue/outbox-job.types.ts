import { SessionMode } from '@prisma/client';

export interface OutboxJob {
  campaignMessageId: string;
  campaignId: string;
  contactId: string;
  sessionId: string;
  phone: string;
  renderedText: string;
  /** Present for CLOUD_API mode: the approved Meta template name. */
  templateName?: string;
  activeFrom: number;
  activeTo: number;
  mode: SessionMode;
}

export interface DlqJob {
  originalJob: OutboxJob;
  error: string;
  failedAt: string;
}
