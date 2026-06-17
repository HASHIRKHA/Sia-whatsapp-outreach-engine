import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';

export interface EngineSettings {
  meanMs: number;
  stdDevMs: number;
  floorMs: number;
  ceilingMs: number;
  typingMs: number;
  dailyLimit: number;
  dryRun: boolean;
}

export interface AiSettings {
  provider: string;
  model: string;
  autoReply: boolean;
  sentiment: boolean;
}

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly cache = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const rows = await this.prisma.setting.findMany();
    for (const r of rows) this.cache.set(r.key, r.value);
  }

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  getWithEnvFallback(key: string, fallback: string): string {
    return this.cache.get(key) ?? this.config.get<string>(key) ?? fallback;
  }

  async set(key: string, value: string): Promise<void> {
    this.cache.set(key, value);
    await this.prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    await this.prisma.setting.deleteMany({ where: { key } }).catch(() => {});
  }

  getEngineSettings(): EngineSettings {
    const raw = this.config;
    return {
      meanMs: +(this.getWithEnvFallback('DELAY_MEAN_MS', raw.get<string>('DELAY_MEAN_MS') ?? '120000')),
      stdDevMs: +(this.getWithEnvFallback('DELAY_STD_DEV_MS', raw.get<string>('DELAY_STD_DEV_MS') ?? '35000')),
      floorMs: +(this.getWithEnvFallback('DELAY_FLOOR_MS', raw.get<string>('DELAY_FLOOR_MS') ?? '60000')),
      ceilingMs: +(this.getWithEnvFallback('DELAY_CEILING_MS', raw.get<string>('DELAY_CEILING_MS') ?? '480000')),
      typingMs: +(this.getWithEnvFallback('TYPING_SIMULATION_MS', raw.get<string>('TYPING_SIMULATION_MS') ?? '3000')),
      dailyLimit: +(this.getWithEnvFallback('DAILY_SEND_LIMIT', raw.get<string>('DAILY_SEND_LIMIT') ?? '200')),
      dryRun: this.getWithEnvFallback('DRY_RUN', raw.get<string>('DRY_RUN') ?? 'true') === 'true',
    };
  }

  getAiSettings(): AiSettings {
    const raw = this.config;
    const provider = this.getWithEnvFallback('AI_PROVIDER', raw.get<string>('AI_PROVIDER') ?? 'anthropic');
    const defaultModel = provider === 'anthropic' ? 'claude-sonnet-4-6' : 'gpt-4o';
    return {
      provider,
      model: this.getWithEnvFallback('AI_MODEL', defaultModel),
      autoReply: this.getWithEnvFallback('AI_AUTO_REPLY', 'false') === 'true',
      sentiment: this.getWithEnvFallback('AI_SENTIMENT', 'true') === 'true',
    };
  }
}
