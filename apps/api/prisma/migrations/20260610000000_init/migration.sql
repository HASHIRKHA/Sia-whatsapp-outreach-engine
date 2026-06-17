-- Baseline migration — creates all tables in their initial state (before incremental migrations).
-- For an existing Supabase deployment, mark as applied without running:
--   npx prisma migrate resolve --applied 20260610000000_init
-- For a fresh deployment, this runs automatically via: npx prisma migrate deploy

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR');
CREATE TYPE "SessionMode" AS ENUM ('CLOUD_API', 'BAILEYS');
CREATE TYPE "SessionStatus" AS ENUM ('OFFLINE', 'CONNECTING', 'ONLINE', 'BANNED');
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'RUNNING', 'PAUSED', 'DONE');
CREATE TYPE "MsgStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'REPLIED', 'FAILED');
CREATE TYPE "LeadTemp" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateTable: User
CREATE TABLE "User" (
    "id"           TEXT     NOT NULL,
    "email"        TEXT     NOT NULL,
    "passwordHash" TEXT     NOT NULL,
    "role"         "Role"   NOT NULL DEFAULT 'ADMIN',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateTable: Session (without fingerprint column — added in 20260611000002_phase5_antiban)
CREATE TABLE "Session" (
    "id"          TEXT           NOT NULL,
    "label"       TEXT           NOT NULL,
    "mode"        "SessionMode"  NOT NULL,
    "phoneNumber" TEXT,
    "status"      "SessionStatus" NOT NULL DEFAULT 'OFFLINE',
    "authState"   JSONB,
    "cloudApi"    JSONB,
    "proxyId"     TEXT,
    "warmupDay"   INTEGER        NOT NULL DEFAULT 0,
    "dailySent"   INTEGER        NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Contact
CREATE TABLE "Contact" (
    "id"        TEXT        NOT NULL,
    "phone"     TEXT        NOT NULL,
    "name"      TEXT,
    "city"      TEXT,
    "interest"  TEXT,
    "notes"     TEXT,
    "leadTemp"  "LeadTemp"  NOT NULL DEFAULT 'COLD',
    "vars"      JSONB,
    "tags"      TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    "valid"     BOOLEAN     NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Contact_phone_key" ON "Contact"("phone");

-- CreateTable: Template
CREATE TABLE "Template" (
    "id"        TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "body"      TEXT         NOT NULL,
    "mediaUrl"  TEXT,
    "category"  TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Campaign
CREATE TABLE "Campaign" (
    "id"         TEXT             NOT NULL,
    "name"       TEXT             NOT NULL,
    "mode"       "SessionMode"    NOT NULL,
    "templateId" TEXT,
    "status"     "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "activeFrom" INTEGER          NOT NULL DEFAULT 8,
    "activeTo"   INTEGER          NOT NULL DEFAULT 22,
    "createdAt"  TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CampaignMessage (without wamid column — added in 20260611000000_phase3_add_wamid)
CREATE TABLE "CampaignMessage" (
    "id"           TEXT        NOT NULL,
    "campaignId"   TEXT        NOT NULL,
    "contactId"    TEXT        NOT NULL,
    "sessionId"    TEXT,
    "renderedText" TEXT        NOT NULL,
    "status"       "MsgStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt"       TIMESTAMP(3),
    CONSTRAINT "CampaignMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Reply
CREATE TABLE "Reply" (
    "id"        TEXT         NOT NULL,
    "contactId" TEXT         NOT NULL,
    "campaignId" TEXT,
    "text"      TEXT         NOT NULL,
    "sentiment" TEXT,
    "intent"    TEXT,
    "score"     DOUBLE PRECISION,
    "handled"   BOOLEAN      NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Proxy (without protocol column — added in 20260611000003_proxy_protocol)
CREATE TABLE "Proxy" (
    "id"        TEXT         NOT NULL,
    "host"      TEXT         NOT NULL,
    "port"      INTEGER      NOT NULL,
    "username"  TEXT,
    "password"  TEXT,
    "country"   TEXT,
    "inUse"     BOOLEAN      NOT NULL DEFAULT false,
    "lastRotat" TIMESTAMP(3),
    CONSTRAINT "Proxy_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AnalyticsEvent
CREATE TABLE "AnalyticsEvent" (
    "id"         TEXT         NOT NULL,
    "type"       TEXT         NOT NULL,
    "campaignId" TEXT,
    "sessionId"  TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: CampaignMessage.campaignId → Campaign.id
ALTER TABLE "CampaignMessage" ADD CONSTRAINT "CampaignMessage_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: CampaignMessage.sessionId → Session.id (set null on delete)
ALTER TABLE "CampaignMessage" ADD CONSTRAINT "CampaignMessage_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
