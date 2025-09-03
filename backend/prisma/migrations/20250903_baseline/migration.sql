-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AlertLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'WARNING');

-- CreateEnum
CREATE TYPE "public"."LogType" AS ENUM ('INFO', 'ERROR', 'WARNING', 'EVENT');

-- CreateEnum
CREATE TYPE "public"."MetricType" AS ENUM ('CPU', 'MEMORY', 'LATENCY', 'STATUS');

-- CreateEnum
CREATE TYPE "public"."MonitoringMode" AS ENUM ('cron', 'agent', 'both');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('EMAIL', 'PUSH', 'SMS', 'SLACK', 'TELEGRAM', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('EMAIL', 'PUSH', 'SMS', 'SLACK', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'USER', 'AGENT', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."SLAStatus" AS ENUM ('OK', 'VIOLATED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."ServiceStatus" AS ENUM ('UP', 'DOWN', 'DEGRADED', 'PENDING', 'PAUSED', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."ServiceType" AS ENUM ('SERVER', 'NETWORK', 'WEBSITE', 'DATABASE', 'API', 'CUSTOM', 'SNMP', 'PING', 'WEBHOOK', 'HTTP');

-- CreateEnum
CREATE TYPE "public"."SnmpVersion" AS ENUM ('v1', 'v2c', 'v3');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."TeamRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "public"."Alert" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "ruleId" INTEGER NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AlertRule" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "field" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "severity" "public"."AlertLevel" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailConfig" (
    "id" SERIAL NOT NULL,
    "configsId" INTEGER NOT NULL,
    "gmailAppPassword" TEXT,
    "gmailUser" TEXT,

    CONSTRAINT "EmailConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HttpConfig" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "monitoringId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "headers" JSONB,
    "body" JSONB,
    "authType" TEXT,
    "authValue" TEXT,
    "validateSSL" BOOLEAN DEFAULT true,
    "followRedirects" BOOLEAN DEFAULT true,
    "expectedStatus" INTEGER,
    "expectedBodyIncludes" TEXT,
    "expectedResponseTimeMs" INTEGER,
    "expectedHeadersIncludes" JSONB,
    "retries" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HttpConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MonitoringConfig" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "timeout" INTEGER NOT NULL,
    "webhookUrl" TEXT,
    "interval" INTEGER NOT NULL,

    CONSTRAINT "MonitoringConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "alertId" INTEGER,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationsConfig" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "NotificationsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PingConfig" (
    "id" SERIAL NOT NULL,
    "monitoringId" INTEGER NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "packetSize" INTEGER,
    "ttl" INTEGER,

    CONSTRAINT "PingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SLA" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "uptimePct" DOUBLE PRECISION NOT NULL,
    "downtime" INTEGER NOT NULL,
    "status" "public"."SLAStatus" NOT NULL,

    CONSTRAINT "SLA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ServiceType" NOT NULL,
    "status" "public"."ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "teamId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL DEFAULT 'Sem descrição',

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceUserNotification" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ServiceUserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SlackConfig" (
    "id" SERIAL NOT NULL,
    "configsId" INTEGER NOT NULL,
    "webhookUrl" TEXT,
    "channel" TEXT,

    CONSTRAINT "SlackConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SnmpConfig" (
    "id" SERIAL NOT NULL,
    "monitoringId" INTEGER NOT NULL,
    "host" TEXT NOT NULL,
    "version" "public"."SnmpVersion" NOT NULL,
    "community" TEXT,
    "username" TEXT,
    "authProtocol" TEXT,
    "authPassword" TEXT,
    "privProtocol" TEXT,
    "privPassword" TEXT,
    "oid" TEXT NOT NULL,
    "retries" INTEGER,
    "delay" INTEGER,
    "alertAfterFailures" INTEGER,
    "minAlertInterval" INTEGER,
    "expectedResponseTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SnmpConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamMember" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "role" "public"."TeamRole" NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isTemporaryPassword" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',
    "temporaryPasswordExpiry" TIMESTAMP(3),
    "number" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookConfig" (
    "id" SERIAL NOT NULL,
    "monitoringId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "secret" TEXT,
    "headers" JSONB,
    "provedor" TEXT NOT NULL,

    CONSTRAINT "WebhookConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."metrics" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cpu" DOUBLE PRECISION,
    "memory" DOUBLE PRECISION,
    "latency" DOUBLE PRECISION,
    "status" "public"."ServiceStatus" NOT NULL,
    "errorMsg" TEXT,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_logs" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "public"."LogType" NOT NULL,
    "message" TEXT NOT NULL,
    "serviceId" INTEGER,
    "message_received" JSONB,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HttpConfig_monitoringId_key" ON "public"."HttpConfig"("monitoringId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "HttpConfig_serviceId_key" ON "public"."HttpConfig"("serviceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringConfig_serviceId_key" ON "public"."MonitoringConfig"("serviceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PingConfig_monitoringId_key" ON "public"."PingConfig"("monitoringId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceUserNotification_serviceId_userId_key" ON "public"."ServiceUserNotification"("serviceId" ASC, "userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SnmpConfig_monitoringId_key" ON "public"."SnmpConfig"("monitoringId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookConfig_monitoringId_key" ON "public"."WebhookConfig"("monitoringId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookConfig_serviceId_key" ON "public"."WebhookConfig"("serviceId" ASC);

-- CreateIndex
CREATE INDEX "metrics_timestamp_idx" ON "public"."metrics"("timestamp" ASC);

-- CreateIndex
CREATE INDEX "system_logs_serviceId_timestamp_idx" ON "public"."system_logs"("serviceId" ASC, "timestamp" ASC);

-- CreateIndex
CREATE INDEX "system_logs_timestamp_idx" ON "public"."system_logs"("timestamp" ASC);

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."AlertRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AlertRule" ADD CONSTRAINT "AlertRule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AlertRule" ADD CONSTRAINT "AlertRule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailConfig" ADD CONSTRAINT "EmailConfig_configsId_fkey" FOREIGN KEY ("configsId") REFERENCES "public"."NotificationsConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HttpConfig" ADD CONSTRAINT "HttpConfig_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "public"."MonitoringConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MonitoringConfig" ADD CONSTRAINT "MonitoringConfig_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "public"."Alert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PingConfig" ADD CONSTRAINT "PingConfig_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "public"."MonitoringConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SLA" ADD CONSTRAINT "SLA_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceUserNotification" ADD CONSTRAINT "ServiceUserNotification_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceUserNotification" ADD CONSTRAINT "ServiceUserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SlackConfig" ADD CONSTRAINT "SlackConfig_configsId_fkey" FOREIGN KEY ("configsId") REFERENCES "public"."NotificationsConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SnmpConfig" ADD CONSTRAINT "SnmpConfig_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "public"."MonitoringConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WebhookConfig" ADD CONSTRAINT "WebhookConfig_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "public"."MonitoringConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."metrics" ADD CONSTRAINT "metrics_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."system_logs" ADD CONSTRAINT "system_logs_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

