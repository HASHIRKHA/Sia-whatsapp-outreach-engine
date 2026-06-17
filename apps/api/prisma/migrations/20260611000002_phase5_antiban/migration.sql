-- Phase 5: add device fingerprint field to Session (Layer 3)
ALTER TABLE "Session" ADD COLUMN "fingerprint" JSONB;
