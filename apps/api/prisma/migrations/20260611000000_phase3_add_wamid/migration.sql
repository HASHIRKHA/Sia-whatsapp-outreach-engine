-- Phase 3: add wamid to CampaignMessage for Cloud API webhook status correlation
ALTER TABLE "CampaignMessage" ADD COLUMN "wamid" TEXT;
