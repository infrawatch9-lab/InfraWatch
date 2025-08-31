-- DropForeignKey
ALTER TABLE "public"."TeamMember" DROP CONSTRAINT "TeamMember_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TeamMember" DROP CONSTRAINT "TeamMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Service" DROP CONSTRAINT "Service_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."metrics" DROP CONSTRAINT "metrics_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AlertRule" DROP CONSTRAINT "AlertRule_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."AlertRule" DROP CONSTRAINT "AlertRule_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Alert" DROP CONSTRAINT "Alert_ruleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Alert" DROP CONSTRAINT "Alert_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Alert" DROP CONSTRAINT "Alert_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_alertId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SLA" DROP CONSTRAINT "SLA_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."system_logs" DROP CONSTRAINT "system_logs_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MonitoringConfig" DROP CONSTRAINT "MonitoringConfig_serviceId_fkey";

-- DropTable
DROP TABLE "public"."User";

-- DropTable
DROP TABLE "public"."Team";

-- DropTable
DROP TABLE "public"."TeamMember";

-- DropTable
DROP TABLE "public"."Service";

-- DropTable
DROP TABLE "public"."metrics";

-- DropTable
DROP TABLE "public"."AlertRule";

-- DropTable
DROP TABLE "public"."Alert";

-- DropTable
DROP TABLE "public"."Notification";

-- DropTable
DROP TABLE "public"."SLA";

-- DropTable
DROP TABLE "public"."system_logs";

-- DropTable
DROP TABLE "public"."MonitoringConfig";

-- DropEnum
DROP TYPE "public"."SnmpVersion";

-- DropEnum
DROP TYPE "public"."Role";

-- DropEnum
DROP TYPE "public"."Status";

-- DropEnum
DROP TYPE "public"."TeamRole";

-- DropEnum
DROP TYPE "public"."ServiceType";

-- DropEnum
DROP TYPE "public"."ServiceStatus";

-- DropEnum
DROP TYPE "public"."AlertLevel";

-- DropEnum
DROP TYPE "public"."NotificationType";

-- DropEnum
DROP TYPE "public"."NotificationChannel";

-- DropEnum
DROP TYPE "public"."SLAStatus";

-- DropEnum
DROP TYPE "public"."LogType";

-- DropEnum
DROP TYPE "public"."MetricType";

-- DropEnum
DROP TYPE "public"."MonitoringMode";

