import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { DelayService } from './delay.service';
import { WarmupService } from './warmup.service';
import { FingerprintService } from './fingerprint.service';
import { ProxyService } from './proxy.service';

@Module({
  imports: [SettingsModule],
  providers: [DelayService, WarmupService, FingerprintService, ProxyService],
  exports: [DelayService, WarmupService, FingerprintService, ProxyService],
})
export class AntibanModule {}
