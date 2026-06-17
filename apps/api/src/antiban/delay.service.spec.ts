import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DelayService } from './delay.service';
import { SettingsService } from '../settings/settings.service';

const mockSettingsService = { get: () => undefined } as unknown as SettingsService;

const mockConfigService = {
  get: (key: string): string | undefined => {
    const cfg: Record<string, string> = {
      ACTIVE_HOURS_TIMEZONE: 'UTC',
      DELAY_MEAN_MS: '120000',
      DELAY_STD_DEV_MS: '35000',
      DELAY_FLOOR_MS: '60000',
      DELAY_CEILING_MS: '480000',
      TYPING_SIMULATION_MS: '6000',
    };
    return cfg[key];
  },
} as unknown as ConfigService;

describe('DelayService', () => {
  let service: DelayService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DelayService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();
    service = module.get(DelayService);
  });

  // ── computeDelayMs ──────────────────────────────────────────────────────────

  describe('computeDelayMs', () => {
    it('always stays within [floor, ceiling] over 1000 samples', () => {
      for (let i = 0; i < 1000; i++) {
        const delay = service.computeDelayMs();
        expect(delay).toBeGreaterThanOrEqual(service.floorMs);
        expect(delay).toBeLessThanOrEqual(service.ceilingMs);
      }
    });

    it('returns an integer', () => {
      for (let i = 0; i < 20; i++) {
        expect(Number.isInteger(service.computeDelayMs())).toBe(true);
      }
    });

    it('mean of 10 000 samples is within ±10 % of configured mean', () => {
      const samples = Array.from({ length: 10_000 }, () => service.computeDelayMs());
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(mean).toBeGreaterThan(service.meanMs * 0.9);
      expect(mean).toBeLessThan(service.meanMs * 1.1);
    });
  });

  // ── isWithinActiveHours ─────────────────────────────────────────────────────

  describe('isWithinActiveHours', () => {
    beforeAll(() => jest.useFakeTimers());
    afterAll(() => jest.useRealTimers());

    // Suffix 'Z' ensures explicit UTC so Intl.DateTimeFormat(UTC) reads the same hour
    const setHour = (h: number) =>
      jest.setSystemTime(new Date(`2024-01-15T${String(h).padStart(2, '0')}:00:00Z`));

    describe('normal window 08:00–22:00', () => {
      it('returns true inside the window (10:00)', () => {
        setHour(10);
        expect(service.isWithinActiveHours(8, 22)).toBe(true);
      });

      it('returns true at exactly activeFrom (08:00)', () => {
        setHour(8);
        expect(service.isWithinActiveHours(8, 22)).toBe(true);
      });

      it('returns false at exactly activeTo (22:00)', () => {
        setHour(22);
        expect(service.isWithinActiveHours(8, 22)).toBe(false);
      });

      it('returns false before the window (06:00)', () => {
        setHour(6);
        expect(service.isWithinActiveHours(8, 22)).toBe(false);
      });

      it('returns false after the window (23:00)', () => {
        setHour(23);
        expect(service.isWithinActiveHours(8, 22)).toBe(false);
      });
    });

    describe('overnight window 22:00–06:00', () => {
      it('returns true at 23:00', () => {
        setHour(23);
        expect(service.isWithinActiveHours(22, 6)).toBe(true);
      });

      it('returns true at 01:00', () => {
        setHour(1);
        expect(service.isWithinActiveHours(22, 6)).toBe(true);
      });

      it('returns false at 10:00 (midday gap)', () => {
        setHour(10);
        expect(service.isWithinActiveHours(22, 6)).toBe(false);
      });
    });
  });
});
