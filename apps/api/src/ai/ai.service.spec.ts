import { Test, type TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { MsgStatus, SessionMode, SessionStatus } from '@prisma/client';
import { AiService, AI_PROVIDER_TOKEN, type AiProvider } from './ai.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { OutboxProducer } from '../queue/outbox.producer';
import { DelayService } from '../antiban/delay.service';
import { WarmupService } from '../antiban/warmup.service';
import { type ContactInputDto } from './dto/generate-campaign.dto';

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeContact = (i: number): ContactInputDto => ({
  contactId: `c-${i}`,
  phone: `+1555000000${i}`,
  name: `User${i}`,
});

const makeSession = (id = 'sess-1') => ({
  id,
  mode: SessionMode.BAILEYS,
  status: SessionStatus.ONLINE,
  dailySent: 0,
  warmupDay: 30,
});

const makeCampaign = (id = 'camp-1') => ({
  id,
  mode: SessionMode.BAILEYS,
  activeFrom: 8,
  activeTo: 22,
});

// ─── mock provider factory ────────────────────────────────────────────────────

function makeProvider(overrides: Partial<AiProvider> = {}): jest.Mocked<AiProvider> {
  return { complete: jest.fn(), ...overrides } as jest.Mocked<AiProvider>;
}

// ─── suite ───────────────────────────────────────────────────────────────────

describe('AiService', () => {
  let service: AiService;
  let provider: jest.Mocked<AiProvider>;
  let prisma: jest.Mocked<{
    campaign: { findUnique: jest.Mock };
    session: { findMany: jest.Mock };
    campaignMessage: { findMany: jest.Mock; create: jest.Mock };
    reply: { findFirst: jest.Mock; update: jest.Mock; create: jest.Mock };
  }>;
  let producer: jest.Mocked<OutboxProducer>;

  beforeEach(async () => {
    provider = makeProvider();

    prisma = {
      campaign: { findUnique: jest.fn() },
      session: { findMany: jest.fn().mockResolvedValue([]) },
      campaignMessage: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
      reply: { findFirst: jest.fn().mockResolvedValue(null), update: jest.fn(), create: jest.fn() },
    };

    producer = { enqueue: jest.fn() } as unknown as jest.Mocked<OutboxProducer>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: AI_PROVIDER_TOKEN, useValue: provider },
        { provide: PrismaService, useValue: prisma },
        { provide: OutboxProducer, useValue: producer },
        { provide: DelayService, useValue: { computeDelayMs: jest.fn().mockReturnValue(75000), floorMs: 45000, typingMs: 2500 } },
        { provide: WarmupService, useValue: { getEffectiveDailyLimit: jest.fn().mockReturnValue(200) } },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── generate-campaign ──────────────────────────────────────────────────────

  describe('generateCampaign', () => {
    it('returns correct count of messages — one per contact', async () => {
      provider.complete.mockResolvedValue(
        JSON.stringify({ templates: ['Hello {name}!', 'Hi {name}!', 'Hey {name}!'] }),
      );

      const contacts = [makeContact(1), makeContact(2), makeContact(3), makeContact(4), makeContact(5)];
      const result = await service.generateCampaign({
        productBrief: 'Widget',
        audience: 'SMBs',
        tone: 'friendly',
        count: 3,
        contacts,
      });

      expect(result.messages).toHaveLength(5);
      result.messages.forEach((m) => expect(m.renderedText).toBeTruthy());
    });

    it('renders contact name via spinText personalization', async () => {
      provider.complete.mockResolvedValue(JSON.stringify({ templates: ['Hello {name}!'] }));

      const result = await service.generateCampaign({
        productBrief: 'P',
        audience: 'A',
        tone: 'casual',
        count: 1,
        contacts: [makeContact(1)],
      });

      expect(result.messages[0]?.renderedText).toBe('Hello User1!');
    });

    it('distributes templates round-robin across contacts', async () => {
      provider.complete.mockResolvedValue(
        JSON.stringify({ templates: ['Alpha', 'Beta'] }),
      );

      const contacts = [makeContact(1), makeContact(2), makeContact(3)];
      const result = await service.generateCampaign({
        productBrief: 'P',
        audience: 'A',
        tone: 'direct',
        count: 2,
        contacts,
      });

      // index 0 → template 0, index 1 → template 1, index 2 → template 0
      expect(result.messages[0]?.renderedText).toBe('Alpha');
      expect(result.messages[1]?.renderedText).toBe('Beta');
      expect(result.messages[2]?.renderedText).toBe('Alpha');
    });

    it('enqueues jobs when campaignId is provided and sessions exist', async () => {
      provider.complete.mockResolvedValue(JSON.stringify({ templates: ['Buy {name}!'] }));
      prisma.campaign.findUnique.mockResolvedValue(makeCampaign());
      prisma.session.findMany.mockResolvedValue([makeSession()]);
      prisma.campaignMessage.create.mockResolvedValue({ id: 'msg-1' });

      await service.generateCampaign({
        productBrief: 'P',
        audience: 'A',
        tone: 'bold',
        count: 1,
        contacts: [makeContact(1)],
        campaignId: 'camp-1',
      });

      expect(prisma.campaignMessage.create).toHaveBeenCalledTimes(1);
      expect(producer.enqueue).toHaveBeenCalledTimes(1);
    });

    it('skips enqueueing when no ONLINE session is found', async () => {
      provider.complete.mockResolvedValue(JSON.stringify({ templates: ['Msg'] }));
      prisma.campaign.findUnique.mockResolvedValue(makeCampaign());
      prisma.session.findMany.mockResolvedValue([]); // no sessions

      await service.generateCampaign({
        productBrief: 'P',
        audience: 'A',
        tone: 'bold',
        count: 1,
        contacts: [makeContact(1)],
        campaignId: 'camp-1',
      });

      expect(producer.enqueue).not.toHaveBeenCalled();
    });
  });

  // ── analyze-reply ─────────────────────────────────────────────────────────

  describe('analyzeReply', () => {
    it('returns valid sentiment and intent fields', async () => {
      provider.complete.mockResolvedValue(
        JSON.stringify({ sentiment: 'HOT', intent: 'BUYING', score: 0.95, action: 'Call them now' }),
      );

      const result = await service.analyzeReply({ contactId: 'c-1', text: 'Yes I want to buy!' });

      expect(result.sentiment).toBe('HOT');
      expect(result.intent).toBe('BUYING');
      expect(result.score).toBe(0.95);
      expect(result.action).toBe('Call them now');
    });

    it('persists sentiment+intent to an existing Reply record', async () => {
      provider.complete.mockResolvedValue(
        JSON.stringify({ sentiment: 'COLD', intent: 'QUESTION', score: 0.6, action: 'Send info' }),
      );
      prisma.reply.findFirst.mockResolvedValue({ id: 'r-1' });

      await service.analyzeReply({ contactId: 'c-1', text: 'What is this?' });

      expect(prisma.reply.update).toHaveBeenCalledWith({
        where: { id: 'r-1' },
        data: { sentiment: 'COLD', intent: 'QUESTION', score: 0.6 },
      });
      expect(prisma.reply.create).not.toHaveBeenCalled();
    });

    it('creates a new Reply when none exists', async () => {
      provider.complete.mockResolvedValue(
        JSON.stringify({ sentiment: 'NEGATIVE', intent: 'OPT_OUT', score: 0.99, action: 'Remove from list' }),
      );
      prisma.reply.findFirst.mockResolvedValue(null);

      await service.analyzeReply({ contactId: 'c-2', text: 'STOP' });

      expect(prisma.reply.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ contactId: 'c-2' }) }),
      );
    });

    it('throws InternalServerErrorException when JSON parse fails', async () => {
      provider.complete.mockResolvedValue('not json at all');

      await expect(
        service.analyzeReply({ contactId: 'c-1', text: 'Hi' }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('throws InternalServerErrorException when sentiment is invalid', async () => {
      provider.complete.mockResolvedValue(
        JSON.stringify({ sentiment: 'UNKNOWN', intent: 'BUYING', score: 0.5, action: '...' }),
      );

      await expect(
        service.analyzeReply({ contactId: 'c-1', text: 'Hi' }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('throws InternalServerErrorException when intent is invalid', async () => {
      provider.complete.mockResolvedValue(
        JSON.stringify({ sentiment: 'HOT', intent: 'UNKNOWN_INTENT', score: 0.5, action: '...' }),
      );

      await expect(
        service.analyzeReply({ contactId: 'c-1', text: 'Hi' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ── optimize ──────────────────────────────────────────────────────────────

  describe('optimize', () => {
    it('returns variants sorted by reply rate descending', async () => {
      prisma.campaignMessage.findMany.mockResolvedValue([
        { renderedText: 'Alpha', status: MsgStatus.REPLIED },
        { renderedText: 'Alpha', status: MsgStatus.SENT },
        { renderedText: 'Beta', status: MsgStatus.SENT },
        { renderedText: 'Beta', status: MsgStatus.SENT },
      ]);

      const result = await service.optimize({ campaignId: 'camp-1' });

      expect(result.variants[0]?.text).toBe('Alpha'); // 1/2 = 50% vs 0/2 = 0%
      expect(result.variants[0]?.replyRate).toBe(0.5);
      expect(result.variants[1]?.replyRate).toBe(0);
    });

    it('weights sum to 1 (softmax normalisation)', async () => {
      prisma.campaignMessage.findMany.mockResolvedValue([
        { renderedText: 'A', status: MsgStatus.REPLIED },
        { renderedText: 'B', status: MsgStatus.SENT },
        { renderedText: 'C', status: MsgStatus.SENT },
      ]);

      const result = await service.optimize({ campaignId: 'camp-1' });
      const totalWeight = result.variants.reduce((s, v) => s + v.weight, 0);
      expect(totalWeight).toBeCloseTo(1, 5);
    });

    it('returns empty variants when campaign has no messages', async () => {
      prisma.campaignMessage.findMany.mockResolvedValue([]);

      const result = await service.optimize({ campaignId: 'camp-empty' });
      expect(result.variants).toHaveLength(0);
    });
  });

  // ── provider switching ────────────────────────────────────────────────────

  describe('provider switching', () => {
    it('uses the injected Anthropic-style provider', async () => {
      provider.complete.mockResolvedValue(JSON.stringify({ templates: ['Test'] }));

      await service.generateCampaign({
        productBrief: 'X',
        audience: 'Y',
        tone: 'Z',
        count: 1,
        contacts: [makeContact(1)],
      });

      expect(provider.complete).toHaveBeenCalledTimes(1); // replace-sentinel();
    });

    it('uses an alternative OpenAI-style provider when injected', async () => {
      const openAiMock = makeProvider();
      openAiMock.complete.mockResolvedValue(
        JSON.stringify({ sentiment: 'WARM', intent: 'QUESTION', score: 0.7, action: 'Engage' }),
      );

      // Build a fresh module with the openai-style mock
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AiService,
          { provide: AI_PROVIDER_TOKEN, useValue: openAiMock },
          { provide: PrismaService, useValue: prisma },
          { provide: OutboxProducer, useValue: producer },
          { provide: DelayService, useValue: { computeDelayMs: jest.fn().mockReturnValue(75000), floorMs: 45000, typingMs: 2500 } },
          { provide: WarmupService, useValue: { getEffectiveDailyLimit: jest.fn().mockReturnValue(200) } },
        ],
      }).compile();

      const svc = module.get<AiService>(AiService);
      const result = await svc.analyzeReply({ contactId: 'c-1', text: 'Maybe later' });

      expect(openAiMock.complete).toHaveBeenCalledTimes(1); // replace-sentinel();
      expect(result.sentiment).toBe('WARM');
    });
  });
});
