-- AlterTable: add protocol column with default 'http' to Proxy
ALTER TABLE "Proxy" ADD COLUMN "protocol" TEXT NOT NULL DEFAULT 'http';
