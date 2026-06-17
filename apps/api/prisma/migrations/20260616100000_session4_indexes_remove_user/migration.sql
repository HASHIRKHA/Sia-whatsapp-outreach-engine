-- DropTable: User (auth was removed; table is orphaned)
DROP TABLE IF EXISTS "User";

-- DropEnum: Role (only used by User model)
DROP TYPE IF EXISTS "Role";

-- CreateIndex: missing indexes on CampaignMessage for stats queries and webhook wamid lookups
CREATE INDEX "CampaignMessage_campaignId_idx"        ON "CampaignMessage"("campaignId");
CREATE INDEX "CampaignMessage_campaignId_status_idx" ON "CampaignMessage"("campaignId", "status");
CREATE INDEX "CampaignMessage_wamid_idx"             ON "CampaignMessage"("wamid");
