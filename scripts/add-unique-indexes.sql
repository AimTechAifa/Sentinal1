-- Additive unique constraints expected by Prisma schema (live DB only had PKs).
-- Safe: values are already unique in seeded data.

CREATE UNIQUE INDEX IF NOT EXISTS "Release_releaseCode_key" ON "Release"("releaseCode");
CREATE UNIQUE INDEX IF NOT EXISTS "User_userId_key" ON "User"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "EnvBooking_bookingCode_key" ON "EnvBooking"("bookingCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Risk_riskCode_key" ON "Risk"("riskCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Drift_driftCode_key" ON "Drift"("driftCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Approval_approvalCode_key" ON "Approval"("approvalCode");
CREATE UNIQUE INDEX IF NOT EXISTS "LeaveRecord_leaveCode_key" ON "LeaveRecord"("leaveCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Incident_incidentCode_key" ON "Incident"("incidentCode");
CREATE UNIQUE INDEX IF NOT EXISTS "MonitoringAlert_alertCode_key" ON "MonitoringAlert"("alertCode");
CREATE UNIQUE INDEX IF NOT EXISTS "PlannedMaintenance_maintenanceCode_key" ON "PlannedMaintenance"("maintenanceCode");
CREATE UNIQUE INDEX IF NOT EXISTS "ReferenceData_category_value_key" ON "ReferenceData"("category", "value");
CREATE UNIQUE INDEX IF NOT EXISTS "ReleaseDependency_releaseId_dependsOnReleaseId_key"
  ON "ReleaseDependency"("releaseId", "dependsOnReleaseId");
