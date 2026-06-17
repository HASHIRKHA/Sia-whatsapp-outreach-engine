-- Clean up orphaned rows that would violate the FK constraints we are about to add.
-- These exist because FK enforcement was missing from the initial schema.
DELETE FROM "CampaignMessage"
WHERE "contactId" NOT IN (SELECT "id" FROM "Contact");

DELETE FROM "Reply"
WHERE "contactId" NOT IN (SELECT "id" FROM "Contact");

UPDATE "Reply" SET "campaignId" = NULL
WHERE "campaignId" IS NOT NULL
  AND "campaignId" NOT IN (SELECT "id" FROM "Campaign");

-- AddForeignKey: CampaignMessage.contactId → Contact.id (cascade delete)
ALTER TABLE "CampaignMessage" ADD CONSTRAINT "CampaignMessage_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Reply.contactId → Contact.id (cascade delete)
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Reply.campaignId → Campaign.id (set null on delete)
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: performance indexes for query-hot columns
CREATE INDEX "CampaignMessage_contactId_idx" ON "CampaignMessage"("contactId");
CREATE INDEX "CampaignMessage_sentAt_idx"    ON "CampaignMessage"("sentAt");
CREATE INDEX "CampaignMessage_sessionId_idx" ON "CampaignMessage"("sessionId");
CREATE INDEX "Reply_contactId_idx"           ON "Reply"("contactId");
CREATE INDEX "Reply_sentiment_idx"           ON "Reply"("sentiment");
CREATE INDEX "Reply_handled_idx"             ON "Reply"("handled");
