import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SessionStatus } from '@prisma/client';
import { WarmupService } from './warmup.service';
import { PrismaService } from '../common/prisma/prisma.service';

const mockPrisma = {
  session: {
    updateMany: jest.fn(),
  },
};

function makeModule(dailyLimit = 200) {
  return Test.createTestingModule({
    providers: [
      WarmupService,
      { provide: PrismaService, useValue: mockPrisma },
      {
        provide: ConfigService,
        useValue: { get: jest.fn().mockReturnValue(String(dailyLimit)) },
      },
    ],
  }).compile();
}

describe('WarmupService', () => {
  let service: WarmupService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await makeModule();
    service = module.get(WarmupService);
  });

  // ── getEffectiveDailyLimit ───────────────────────────────────────────────

  describe('getEffectiveDailyLimit — warmup cap boundaries', () => {
    const cases: [warmupDay: number, expected: number][] = [
      [0,  10],  // Day 0–2 band starts
      [2,  10],  // Day 0–2 band ends
      [3,  25],  // Day 3–5 band starts
      [5,  25],  // Day 3–5 band ends
      [6,  50],  // Day 6–9 band starts
      [9,  50],  // Day 6–9 band ends
      [10, 100], // Day 10–13 band starts
      [13, 100], // Day 10–13 band ends
      [14, 150], // Day 14–20 band starts
      [20, 150], // Day 14–20 band ends
      [21, 200], // Graduated — use env limit
      [30, 200], // Well past graduation
    ];

    it.each(cases)('warmupDay=%i → cap %i', (warmupDay, expected) => {
      expect(service.getEffectiveDailyLimit({ warmupDay, dailySent: 0 })).toBe(expected);
    });
  });

  describe('getEffectiveDailyLimit — respects configured env limit for day 21+', () => {
    it('uses 500 when DAILY_SEND_LIMIT=500', async () => {
      const mod = await makeModule(500);
      const svc = mod.get(WarmupService);
      expect(svc.getEffectiveDailyLimit({ warmupDay: 21, dailySent: 0 })).toBe(500);
    });
  });

  // ── midnightReset (merged cron method) ──────────────────────────────────

  describe('midnightReset', () => {
    it('increments warmupDay and resets dailySent for ONLINE sessions atomically', async () => {
      mockPrisma.session.updateMany.mockResolvedValue({ count: 3 });

      await service.midnightReset();

      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: { status: SessionStatus.ONLINE },
        data: { warmupDay: { increment: 1 }, dailySent: 0 },
      });
    });

    it('resets dailySent for non-ONLINE sessions without incrementing warmupDay', async () => {
      mockPrisma.session.updateMany.mockResolvedValue({ count: 5 });

      await service.midnightReset();

      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: { status: { not: SessionStatus.ONLINE } },
        data: { dailySent: 0 },
      });
    });

    it('issues exactly two updateMany calls per midnight tick', async () => {
      mockPrisma.session.updateMany.mockResolvedValue({ count: 0 });
      await service.midnightReset();
      expect(mockPrisma.session.updateMany).toHaveBeenCalledTimes(2);
    });
  });
});
