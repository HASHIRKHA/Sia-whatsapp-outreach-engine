/**
 * E2E smoke test — structural API verification (no real WhatsApp connection).
 *
 * Prerequisites:
 *   - PostgreSQL + Redis running (e.g. docker compose up -d postgres redis)
 *   - .env loaded with DRY_RUN=true, REGISTRATION_SECRET set or empty
 *
 * Run:
 *   cd apps/api
 *   DRY_RUN=true npx ts-node -r tsconfig-paths/register test/e2e-smoke.ts
 */

import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { AI_PROVIDER_TOKEN, type AiProvider } from '../src/ai/ai.service';

// ─── Mock AI provider (no real LLM calls) ─────────────────────────────────────

const mockAiProvider: AiProvider = {
  async complete(systemPrompt: string): Promise<string> {
    if (systemPrompt.includes('templates')) {
      return JSON.stringify({
        templates: [
          '{Hi|Hello} {name}! Our {offer|deal} is live today.',
          'Hey {name}, we have something special for you in {city}!',
        ],
      });
    }
    return JSON.stringify({
      sentiment: 'HOT',
      intent: 'BUYING',
      score: 0.95,
      action: 'Follow up immediately — high purchase intent.',
    });
  },
};

// ─── Assertion helper ──────────────────────────────────────────────────────────

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  FAIL  ${message}`);
    process.exit(1);
  }
  console.log(`  PASS  ${message}`);
}

// ─── Main smoke test ──────────────────────────────────────────────────────────

async function runSmoke(): Promise<void> {
  console.log('\n=== WA Outreach Engine — E2E Smoke Test ===\n');

  // Bootstrap NestJS with mock AI provider
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(AI_PROVIDER_TOKEN)
    .useValue(mockAiProvider)
    .compile();

  const app: INestApplication = moduleRef.createNestApplication();
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useWebSocketAdapter(new IoAdapter(app));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const http = supertest(app.getHttpServer());

  // ── 1. Health check ──────────────────────────────────────────────────────────
  console.log('1. Health endpoint');
  {
    const res = await http.get('/health');
    assert(res.status === 200, `GET /health → 200 (got ${res.status})`);
    assert(res.body.status === 'ok', 'health.status === ok');
    assert(typeof res.body.timestamp === 'string', 'health.timestamp is string');
  }

  // ── 2. Register admin ────────────────────────────────────────────────────────
  console.log('\n2. Register admin');
  const regSecret = process.env.REGISTRATION_SECRET ?? '';
  const regBody: Record<string, string> = {
    email: `smoke-${Date.now()}@test.example`,
    password: 'SmokeTest123!',
  };
  if (regSecret) regBody.secret = regSecret;

  let userId = '';
  let accessToken = '';
  {
    const res = await http.post('/api/auth/register').send(regBody);
    assert(res.status === 201, `POST /api/auth/register → 201 (got ${res.status}: ${JSON.stringify(res.body)})`);
    assert(typeof res.body.id === 'string', 'register returns id');
    assert(res.body.email === regBody.email, 'register returns email');
    userId = res.body.id as string;
    console.log(`   Created user id=${userId}`);
  }

  // ── 3. Login ─────────────────────────────────────────────────────────────────
  console.log('\n3. Login');
  {
    const res = await http.post('/api/auth/login').send({
      email: regBody.email,
      password: regBody.password,
    });
    assert(res.status === 200, `POST /api/auth/login → 200 (got ${res.status})`);
    assert(typeof res.body.accessToken === 'string', 'login returns accessToken');
    accessToken = res.body.accessToken as string;
  }

  const auth = { Authorization: `Bearer ${accessToken}` };

  // ── 4. Import contact ─────────────────────────────────────────────────────────
  console.log('\n4. Import contact');
  let contactId = '';
  {
    const res = await http
      .post('/api/contacts/import')
      .set(auth)
      .send({ contacts: [{ phone: '+441234567890', name: 'Smoke Test', city: 'London' }] });
    assert(res.status === 201, `POST /api/contacts/import → 201 (got ${res.status})`);
    assert(typeof res.body.imported === 'number', 'import returns imported count');
    assert(res.body.imported >= 1, 'at least 1 contact imported');
  }
  {
    const res = await http.get('/api/contacts').set(auth);
    assert(res.status === 200, `GET /api/contacts → 200 (got ${res.status})`);
    const contacts = res.body as Array<{ id: string; phone: string }>;
    const c = contacts.find((x) => x.phone === '+441234567890');
    assert(!!c, 'imported contact appears in list');
    contactId = c?.id ?? '';
  }

  // ── 5. Create template ───────────────────────────────────────────────────────
  console.log('\n5. Create template with spin syntax');
  let templateId = '';
  {
    const res = await http
      .post('/api/templates')
      .set(auth)
      .send({ name: 'Smoke Test Template', category: 'marketing', body: '{Hi|Hello} {name}! Our {offer|deal} is ready.' });
    assert(res.status === 201, `POST /api/templates → 201 (got ${res.status})`);
    assert(typeof res.body.id === 'string', 'template has id');
    templateId = res.body.id as string;
    console.log(`   Created template id=${templateId}`);
  }

  // ── 6. Create Baileys session (no real WA connect) ───────────────────────────
  console.log('\n6. Create Baileys session');
  let sessionId = '';
  {
    const res = await http
      .post('/api/sessions')
      .set(auth)
      .send({ label: 'Smoke Session', mode: 'BAILEYS' });
    assert(res.status === 201, `POST /api/sessions → 201 (got ${res.status})`);
    assert(res.body.mode === 'BAILEYS', 'session mode is BAILEYS');
    sessionId = res.body.id as string;
    console.log(`   Created session id=${sessionId}`);
  }

  // ── 7. Create campaign (DRAFT) ───────────────────────────────────────────────
  console.log('\n7. Create campaign (DRAFT)');
  let campaignId = '';
  {
    const res = await http
      .post('/api/campaigns')
      .set(auth)
      .send({
        name: 'Smoke Campaign',
        mode: 'BAILEYS',
        templateId,
        contactIds: [contactId],
      });
    assert(res.status === 201, `POST /api/campaigns → 201 (got ${res.status})`);
    assert(res.body.status === 'DRAFT', 'campaign starts as DRAFT');
    campaignId = res.body.id as string;
    console.log(`   Created campaign id=${campaignId}`);
  }

  // ── 8. AI generate-campaign (mocked LLM) ─────────────────────────────────────
  console.log('\n8. POST /api/ai/generate-campaign (mock AI)');
  {
    const res = await http
      .post('/api/ai/generate-campaign')
      .set(auth)
      .send({ brief: 'Promote our new product to warm leads', audience: 'existing customers', tone: 'friendly', count: 2 });
    assert(res.status === 201, `POST /api/ai/generate-campaign → 201 (got ${res.status})`);
    assert(Array.isArray(res.body.templates), 'returns templates array');
    assert((res.body.templates as unknown[]).length === 2, 'returns 2 templates');
    console.log(`   Generated ${(res.body.templates as unknown[]).length} templates`);
  }

  // ── 9. AI analyze-reply (mocked LLM) ─────────────────────────────────────────
  console.log('\n9. POST /api/ai/analyze-reply (mock AI)');
  {
    const res = await http
      .post('/api/ai/analyze-reply')
      .set(auth)
      .send({ text: 'Yes I am interested, what is the price?', contactId });
    assert(res.status === 201, `POST /api/ai/analyze-reply → 201 (got ${res.status})`);
    assert(typeof res.body.sentiment === 'string', 'analyze-reply returns sentiment');
    assert(typeof res.body.score === 'number', 'analyze-reply returns score');
    console.log(`   Sentiment: ${res.body.sentiment as string}, Score: ${res.body.score as number}`);
  }

  // ── 10. Analytics overview ────────────────────────────────────────────────────
  console.log('\n10. GET /api/analytics/overview');
  {
    const res = await http.get('/api/analytics/overview').set(auth);
    assert(res.status === 200, `GET /api/analytics/overview → 200 (got ${res.status})`);
    assert(typeof res.body.messagesToday === 'number', 'overview has messagesToday');
    assert(typeof res.body.activeSessions === 'number', 'overview has activeSessions');
    assert(Array.isArray(res.body.dailyMessages), 'overview has dailyMessages array');
  }

  // ── 11. Cleanup ───────────────────────────────────────────────────────────────
  console.log('\n11. Cleanup');
  {
    if (campaignId) {
      const r = await http.delete(`/api/campaigns/${campaignId}`).set(auth);
      assert(r.status === 200 || r.status === 204, `DELETE /api/campaigns/${campaignId}`);
    }
    if (templateId) {
      const r = await http.delete(`/api/templates/${templateId}`).set(auth);
      assert(r.status === 200 || r.status === 204, `DELETE /api/templates/${templateId}`);
    }
    if (sessionId) {
      const r = await http.delete(`/api/sessions/${sessionId}`).set(auth);
      assert(r.status === 200 || r.status === 204, `DELETE /api/sessions/${sessionId}`);
    }
    if (contactId) {
      const r = await http.delete(`/api/contacts/${contactId}`).set(auth);
      assert(r.status === 200 || r.status === 204, `DELETE /api/contacts/${contactId}`);
    }
  }

  await app.close();

  console.log('\n=== ALL SMOKE TESTS PASSED ===\n');
  process.exit(0);
}

runSmoke().catch((err: unknown) => {
  console.error('\nSmoke test crashed:', err);
  process.exit(1);
});
