/**
 * Quick verification of releaseListWhere for new filter params.
 * Run: npx tsx scripts/verify-release-filters.ts
 */
import { releaseListWhere } from "../lib/list-api-filters";

function check(label: string, qs: string, expectKeys: string[]) {
  const where = releaseListWhere(new URLSearchParams(qs));
  const json = JSON.stringify(where);
  const ok = expectKeys.every((k) => json.includes(k));
  console.log(ok ? "OK " : "FAIL", label, "→", json.slice(0, 180));
  if (!ok) process.exitCode = 1;
}

check("status", "status=Blocked", ["Blocked"]);
check("approvalStatus", "approvalStatus=CAB%20Approved", ["CAB Approved"]);
check("readiness range", "readinessMin=50&readinessMax=95", ["readinessPercent", "gte", "lte"]);
check("goLive range", "goLiveMin=0&goLiveMax=100", ["goLiveChecklistPercent"]);
check("conflict yes", "conflict=1", ["conflictFlag", "true"]);
check("conflict no", "conflict=0", ["conflictFlag", "false"]);
check("has blockers", "hasBlockers=1", ["blockers"]);
check("no blockers", "hasBlockers=0", ["blockers"]);
check("has depends", "hasDependsOn=1", ["dependsOn", "some"]);
check("no depends", "hasDependsOn=0", ["dependsOn", "none"]);
check("release code contains", "releaseCode=REL-000", ["releaseCode", "contains"]);
check("name contains", "name=Kyriba", ["name", "contains"]);
check("notes contains", "notes=freeze", ["notes", "contains"]);
check("owner name", "owner=Brian", ["releaseOwner", "contains"]);
check("stakeholder name", "stakeholder=Chen", ["stakeholders", "contains"]);
check("vendor", "vendorMaintenance=Oracle%20Patch%20Window", ["Oracle Patch Window"]);
check("rollback", "rollbackPlan=Ready", ["Ready"]);

console.log("done");
