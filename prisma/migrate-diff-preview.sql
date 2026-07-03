node.exe : warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please 
migrate to a Prisma config file (e.g., `prisma.config.ts`).
At line:1 char:1
+ & "C:\Program Files\nodejs/node.exe" "C:\Program Files\nodejs/node_mo ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (warn The config...ma.config.ts`).:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
For more information, see: https://pris.ly/prisma-config

-- DropForeignKey
ALTER TABLE "AgentPauseState" DROP CONSTRAINT "AgentPauseState_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "AppNotificationRow" DROP CONSTRAINT "AppNotificationRow_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ApplicationCategoryDefinition" DROP CONSTRAINT "ApplicationCategoryDefinition_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ApplicationStatusCheck" DROP CONSTRAINT "ApplicationStatusCheck_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "ApplicationStatusCheck" DROP CONSTRAINT "ApplicationStatusCheck_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ApprovalTypeDefinition" DROP CONSTRAINT "ApprovalTypeDefinition_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ChangeFreezePeriod" DROP CONSTRAINT "ChangeFreezePeriod_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Connector" DROP CONSTRAINT "Connector_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "CustomFieldDefinition" DROP CONSTRAINT "CustomFieldDefinition_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "DeploymentState" DROP CONSTRAINT "DeploymentState_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "DeploymentWindowDefinition" DROP CONSTRAINT "DeploymentWindowDefinition_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Drift" DROP CONSTRAINT "Drift_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "EnvBooking" DROP CONSTRAINT "EnvBooking_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "EnvironmentTypeDefinition" DROP CONSTRAINT "EnvironmentTypeDefinition_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Incident" DROP CONSTRAINT "Incident_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "Incident" DROP CONSTRAINT "Incident_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Incident" DROP CONSTRAINT "Incident_relatedReleaseId_fkey";

-- DropForeignKey
ALTER TABLE "LeaveRecord" DROP CONSTRAINT "LeaveRecord_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "MonitoringAlert" DROP CONSTRAINT "MonitoringAlert_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "MonitoringAlert" DROP CONSTRAINT "MonitoringAlert_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationTypeDefinition" DROP CONSTRAINT "NotificationTypeDefinition_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "P1Issue" DROP CONSTRAINT "P1Issue_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "PlannedMaintenance" DROP CONSTRAINT "PlannedMaintenance_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Release" DROP CONSTRAINT "Release_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ReleaseDecisionState" DROP CONSTRAINT "ReleaseDecisionState_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ReleaseHistoryEvent" DROP CONSTRAINT "ReleaseHistoryEvent_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ReleaseRiskMetric" DROP CONSTRAINT "ReleaseRiskMetric_releaseId_fkey";

-- DropForeignKey
ALTER TABLE "ReleaseSizeDefinition" DROP CONSTRAINT "ReleaseSizeDefinition_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Risk" DROP CONSTRAINT "Risk_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "RiskFactorDefinition" DROP CONSTRAINT "RiskFactorDefinition_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "RiskImpactScale" DROP CONSTRAINT "RiskImpactScale_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "RiskLikelihoodScale" DROP CONSTRAINT "RiskLikelihoodScale_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "RiskScoreThreshold" DROP CONSTRAINT "RiskScoreThreshold_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "RoleDefinition" DROP CONSTRAINT "RoleDefinition_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "SLAMetricDefinition" DROP CONSTRAINT "SLAMetricDefinition_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "SharedEnvironmentConfig" DROP CONSTRAINT "SharedEnvironmentConfig_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "SharedEnvironmentDepartment" DROP CONSTRAINT "SharedEnvironmentDepartment_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "SharedEnvironmentDepartment" DROP CONSTRAINT "SharedEnvironmentDepartment_sharedEnvironmentId_fkey";

-- DropForeignKey
ALTER TABLE "SuperAdminProfile" DROP CONSTRAINT "SuperAdminProfile_linkedUserId_fkey";

-- DropForeignKey
ALTER TABLE "SuperAdminProfile" DROP CONSTRAINT "SuperAdminProfile_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "SystemIntegration" DROP CONSTRAINT "SystemIntegration_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "SystemIntegration" DROP CONSTRAINT "SystemIntegration_sourceAppId_fkey";

-- DropForeignKey
ALTER TABLE "SystemMappingEdge" DROP CONSTRAINT "SystemMappingEdge_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "SystemMappingGroup" DROP CONSTRAINT "SystemMappingGroup_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "TestingPhaseGate" DROP CONSTRAINT "TestingPhaseGate_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "WorkItem" DROP CONSTRAINT "WorkItem_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "WorkflowStageDefinition" DROP CONSTRAINT "WorkflowStageDefinition_organizationId_fkey";

-- DropIndex
DROP INDEX "AppNotificationRow_organizationId_timestamp_idx";

-- DropIndex
DROP INDEX "Application_deletedAt_idx";

-- DropIndex
DROP INDEX "Application_organizationId_departmentId_idx";

-- DropIndex
DROP INDEX "Application_organizationId_name_departmentId_key";

-- DropIndex
DROP INDEX "Approval_organizationId_approvalCode_key";

-- DropIndex
DROP INDEX "Approval_organizationId_decision_idx";

-- DropIndex
DROP INDEX "CalendarEvent_organizationId_date_idx";

-- DropIndex
DROP INDEX "ConnectorSyncLog_connectorId_startedAt_idx";

-- DropIndex
DROP INDEX "Department_organizationId_name_key";

-- DropIndex
DROP INDEX "DeploymentState_organizationId_releaseId_key";

-- DropIndex
DROP INDEX "Drift_organizationId_driftCode_key";

-- DropIndex
DROP INDEX "Drift_organizationId_status_idx";

-- DropIndex
DROP INDEX "EnvBooking_applicationId_fromDate_toDate_idx";

-- DropIndex
DROP INDEX "EnvBooking_environmentId_fromDate_toDate_idx";

-- DropIndex
DROP INDEX "EnvBooking_organizationId_releaseId_idx";

-- DropIndex
DROP INDEX "Environment_applicationId_status_idx";

-- DropIndex
DROP INDEX "Environment_deletedAt_idx";

-- DropIndex
DROP INDEX "LeaveRecord_organizationId_leaveCode_key";

-- DropIndex
DROP INDEX "LeaveRecord_organizationId_leaveStart_leaveEnd_idx";

-- DropIndex
DROP INDEX "P1Issue_organizationId_externalId_key";

-- DropIndex
DROP INDEX "P1Issue_organizationId_status_idx";

-- DropIndex
DROP INDEX "Release_deletedAt_idx";

-- DropIndex
DROP INDEX "Release_organizationId_createdAt_idx";

-- DropIndex
DROP INDEX "Release_organizationId_departmentId_idx";

-- DropIndex
DROP INDEX "Release_organizationId_releaseCode_key";

-- DropIndex
DROP INDEX "Release_organizationId_releaseOwnerId_idx";

-- DropIndex
DROP INDEX "Release_organizationId_status_idx";

-- DropIndex
DROP INDEX "ReleaseAuditEvent_releaseId_createdAt_idx";

-- DropIndex
DROP INDEX "ReleaseDecisionState_organizationId_releaseId_key";

-- DropIndex
DROP INDEX "ReleaseHistoryEvent_organizationId_releaseId_idx";

-- DropIndex
DROP INDEX "ReleaseHistoryEvent_organizationId_releaseId_timestamp_idx";

-- DropIndex
DROP INDEX "Risk_organizationId_riskCode_key";

-- DropIndex
DROP INDEX "Risk_organizationId_status_idx";

-- DropIndex
DROP INDEX "SystemMappingEdge_organizationId_idx";

-- DropIndex
DROP INDEX "SystemMappingGroup_organizationId_idx";

-- DropIndex
DROP INDEX "User_organizationId_email_key";

-- DropIndex
DROP INDEX "User_organizationId_role_idx";

-- DropIndex
DROP INDEX "User_organizationId_status_idx";

-- DropIndex
DROP INDEX "User_organizationId_userId_key";

-- DropIndex
DROP INDEX "WorkItem_organizationId_externalId_key";

-- DropIndex
DROP INDEX "WorkItem_organizationId_releaseCode_idx";

-- DropIndex
DROP INDEX "WorkItem_organizationId_status_idx";

-- AlterTable
ALTER TABLE "AgentPauseState" DROP CONSTRAINT "AgentPauseState_pkey",
DROP COLUMN "organizationId",
ADD CONSTRAINT "AgentPauseState_pkey" PRIMARY KEY ("agentId");

-- AlterTable
ALTER TABLE "AppNotificationRow" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "customFields",
DROP COLUMN "deletedAt",
DROP COLUMN "organizationId",
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "support" SET NOT NULL,
ALTER COLUMN "criticality" SET NOT NULL;

-- AlterTable
ALTER TABLE "Approval" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "CalendarEvent" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "Connector" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "deptCode",
DROP COLUMN "organizationId",
DROP COLUMN "primaryFocus";

-- AlterTable
ALTER TABLE "DeploymentState" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "Drift" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "EnvBooking" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "Environment" DROP COLUMN "customFields",
DROP COLUMN "deletedAt",
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "LeaveRecord" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "P1Issue" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "Release" DROP COLUMN "customFields",
DROP COLUMN "deletedAt",
DROP COLUMN "endDate",
DROP COLUMN "organizationId",
ADD COLUMN     "owner" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ReleaseDecisionState" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "ReleaseHistoryEvent" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "Risk" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "SystemMappingEdge" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "SystemMappingGroup" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "customFields",
DROP COLUMN "organizationId",
DROP COLUMN "phone",
DROP COLUMN "region",
DROP COLUMN "rmStartDate",
DROP COLUMN "specialization";

-- AlterTable
ALTER TABLE "WorkItem" DROP COLUMN "organizationId";

-- DropTable
DROP TABLE "ApplicationCategoryDefinition";

-- DropTable
DROP TABLE "ApplicationStatusCheck";

-- DropTable
DROP TABLE "ApprovalTypeDefinition";

-- DropTable
DROP TABLE "ChangeFreezePeriod";

-- DropTable
DROP TABLE "CustomFieldDefinition";

-- DropTable
DROP TABLE "DeploymentWindowDefinition";

-- DropTable
DROP TABLE "EnvironmentTypeDefinition";

-- DropTable
DROP TABLE "Incident";

-- DropTable
DROP TABLE "MonitoringAlert";

-- DropTable
DROP TABLE "NotificationTypeDefinition";

-- DropTable
DROP TABLE "Organization";

-- DropTable
DROP TABLE "PlannedMaintenance";

-- DropTable
DROP TABLE "ReleaseRiskMetric";

-- DropTable
DROP TABLE "ReleaseSizeDefinition";

-- DropTable
DROP TABLE "RiskFactorDefinition";

-- DropTable
DROP TABLE "RiskImpactScale";

-- DropTable
DROP TABLE "RiskLikelihoodScale";

-- DropTable
DROP TABLE "RiskScoreThreshold";

-- DropTable
DROP TABLE "RoleDefinition";

-- DropTable
DROP TABLE "SLAMetricDefinition";

-- DropTable
DROP TABLE "SharedEnvironmentConfig";

-- DropTable
DROP TABLE "SharedEnvironmentDepartment";

-- DropTable
DROP TABLE "SuperAdminProfile";

-- DropTable
DROP TABLE "SystemIntegration";

-- DropTable
DROP TABLE "TestingPhaseGate";

-- DropTable
DROP TABLE "WorkflowStageDefinition";

-- CreateIndex
CREATE UNIQUE INDEX "Application_name_departmentId_key" ON "Application"("name", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Approval_approvalCode_key" ON "Approval"("approvalCode");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DeploymentState_releaseId_key" ON "DeploymentState"("releaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Drift_driftCode_key" ON "Drift"("driftCode");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveRecord_leaveCode_key" ON "LeaveRecord"("leaveCode");

-- CreateIndex
CREATE UNIQUE INDEX "P1Issue_externalId_key" ON "P1Issue"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Release_releaseCode_key" ON "Release"("releaseCode");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseDecisionState_releaseId_key" ON "ReleaseDecisionState"("releaseId");

-- CreateIndex
CREATE INDEX "ReleaseHistoryEvent_releaseId_idx" ON "ReleaseHistoryEvent"("releaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Risk_riskCode_key" ON "Risk"("riskCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WorkItem_externalId_key" ON "WorkItem"("externalId");

-- CreateIndex
CREATE INDEX "WorkItem_releaseCode_idx" ON "WorkItem"("releaseCode");

