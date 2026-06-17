import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

/** Shape required from a Session to compute the effective limit. */
export interface SessionWarmupData {
  warmupDay: number;
  dailySent: number;
}

/**
 * Day-range → cap mapping.
 * Day 15+ falls through to the env DAILY_SEND_LIMIT.
 */
const WARMUP_CAPS: [minDay: number, maxDay: number, cap: number][] = [
  [0,  2,  10],   // Days 0–2:  10/day  — critical to avoid ban on new number
  [3,  5,  25],   // Days 3–5:  25/day
  [6,  9,  50],   // Days 6–9:  50/day
  [10, 13, 100],  // Days 10–13: 100/day
  [14, 20, 150],  // Days 14–20: 150/day
  // Day 21+ falls through to DAILY_SEND_LIMIT env (default 200)
];

@Injectable()
export class WarmupService {
  private readonly log = new Logger(WarmupService.name);
  readonly dailyLimit: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.dailyLimit = +(config.get<string>('DAILY_SEND_LIMIT') ?? '200');
  }

  /**
   * Returns the effective daily send cap for a session.
   * Uses warmup schedule when warmupDay < 15; falls back to env limit.
   */
  getEffectiveDailyLimit(session: SessionWarmupData): number {
    const { warmupDay } = session;
    if (warmupDay >= 21) return this.dailyLimit;
    for (const [min, max, cap] of WARMUP_CAPS) {
      if (warmupDay >= min && warmupDay <= max) return cap;
    }
    return this.dailyLimit;
  }

  /**
   * Midnight cron: atomic midnight reset.
   * ONLINE sessions: increment warmupDay AND reset dailySent in one query.
   * All other sessions: reset dailySent only (warmupDay stays until they reconnect).
   * Single cron avoids the race condition of two separate midnight jobs operating
   * on overlapping session sets.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async midnightReset(): Promise<void> {
    const online = await this.prisma.session.updateMany({
      where: { status: SessionStatus.ONLINE },
      data: { warmupDay: { increment: 1 }, dailySent: 0 },
    });
    const others = await this.prisma.session.updateMany({
      where: { status: { not: SessionStatus.ONLINE } },
      data: { dailySent: 0 },
    });
    this.log.log(
      `Warmup midnight: incremented warmupDay + reset dailySent for ${online.count} ONLINE session(s); reset dailySent for ${others.count} other session(s)`,
    );
  }
}
