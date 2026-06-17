import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { type JobsOptions, Queue } from 'bullmq';
import { SessionMode } from '@prisma/client';
import { BAILEYS_QUEUE, CLOUD_API_QUEUE } from './queue.constants';
import { type OutboxJob } from './outbox-job.types';

const BASE_OPTS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: { count: 200 },
  removeOnFail: { count: 500 },
};

@Injectable()
export class OutboxProducer {
  constructor(
    @InjectQueue(CLOUD_API_QUEUE) private readonly cloudApiQueue: Queue,
    @InjectQueue(BAILEYS_QUEUE) private readonly baileysQueue: Queue,
  ) {}

  async enqueue(data: OutboxJob, opts: { delay?: number } = {}): Promise<void> {
    const queue =
      data.mode === SessionMode.CLOUD_API ? this.cloudApiQueue : this.baileysQueue;
    await queue.add('send', data, { ...BASE_OPTS, delay: opts.delay });
  }
}
