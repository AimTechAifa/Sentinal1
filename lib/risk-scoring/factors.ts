/**
 * Weighted Risk Score (System 2) — 44-factor definitions.
 *
 * Source of truth: user-provided extraction from the source Excel's per-factor
 * bucketing formula (cell AW68). Weights sum to 0.992, not exactly 1.0 — this
 * was verified against the actual Excel and reproduces all 12 known ground-truth
 * release scores exactly, so it is NOT a bug to "fix" by normalizing to 1.0.
 *
 * The "worked example" and "10 Factor Categories" prose sections elsewhere in
 * the seed data are stale documentation (the worked example's own arithmetic
 * sums to 1.43, not the 1.45 it claims) and must NOT be used as a weight source.
 */

export type BandRule = (rawValue: number) => number;

export type RiskFactorDef = {
  order: number;
  category: string;
  factorName: string;
  weight: number;
  description: string;
  /** Converts a raw input value to a 1-5 band score. */
  bandRule: BandRule;
};

const invert = (v: number) => 6 - v;
const direct = (v: number) => v;

export const RISK_FACTOR_DEFS: RiskFactorDef[] = [
  { order: 1, category: "Technical Complexity", factorName: "Files Changed", weight: 0.04, description: "Number of modified files", bandRule: v => v < 10 ? 1 : v < 30 ? 2 : v < 60 ? 3 : v < 100 ? 4 : 5 },
  { order: 2, category: "Technical Complexity", factorName: "Code Churn", weight: 0.03, description: "Lines of code changed", bandRule: v => v < 200 ? 1 : v < 500 ? 2 : v < 1500 ? 3 : v < 3000 ? 4 : 5 },
  { order: 3, category: "Technical Complexity", factorName: "DB Changes", weight: 0.05, description: "Database schema modifications", bandRule: v => v === 0 ? 1 : v === 1 ? 2 : v === 2 ? 3 : v < 5 ? 4 : 5 },
  { order: 4, category: "Technical Complexity", factorName: "API Changes", weight: 0.04, description: "Breaking API contract changes", bandRule: v => v === 0 ? 1 : v === 1 ? 2 : v === 2 ? 3 : v === 3 ? 4 : 5 },
  { order: 5, category: "Technical Complexity", factorName: "New Tech Stack", weight: 0.02, description: "Unfamiliar technology introduced (raw value is already 1-5)", bandRule: direct },

  { order: 6, category: "Testing Quality", factorName: "Test Coverage %", weight: 0.06, description: "Code coverage percentage", bandRule: v => v > 90 ? 1 : v > 80 ? 2 : v > 70 ? 3 : v > 60 ? 4 : 5 },
  { order: 7, category: "Testing Quality", factorName: "Test Days", weight: 0.03, description: "Testing duration in days", bandRule: v => v < 3 ? 1 : v < 5 ? 2 : v < 7 ? 3 : v < 10 ? 4 : 5 },
  { order: 8, category: "Testing Quality", factorName: "Test Bugs", weight: 0.04, description: "Defects discovered in testing", bandRule: v => v < 3 ? 1 : v < 6 ? 2 : v < 10 ? 3 : v < 15 ? 4 : 5 },
  { order: 9, category: "Testing Quality", factorName: "Bug Fix Rate %", weight: 0.02, description: "Defects fixed vs found", bandRule: v => v > 95 ? 1 : v > 85 ? 2 : v > 75 ? 3 : v > 60 ? 4 : 5 },
  { order: 10, category: "Testing Quality", factorName: "UAT Days", weight: 0.03, description: "UAT testing period in days", bandRule: v => v < 3 ? 1 : v < 5 ? 2 : v < 7 ? 3 : v < 10 ? 4 : 5 },
  { order: 11, category: "Testing Quality", factorName: "UAT Defects", weight: 0.02, description: "Defects found in UAT", bandRule: v => v < 2 ? 1 : v < 4 ? 2 : v < 7 ? 3 : v < 10 ? 4 : 5 },
  { order: 12, category: "Testing Quality", factorName: "UAT Sign-off", weight: 0.03, description: "Business sign-off level (raw is 1-5, inverted)", bandRule: invert },
  { order: 13, category: "Testing Quality", factorName: "Test Env Parity", weight: 0.02, description: "Test environment match with Prod (raw is 1-5, inverted)", bandRule: invert },

  { order: 14, category: "Security & Compliance", factorName: "Crit/High Vulns", weight: 0.03, description: "Open critical/high security vulnerabilities", bandRule: v => v === 0 ? 1 : v < 3 ? 2 : v < 5 ? 3 : v < 10 ? 4 : 5 },
  { order: 15, category: "Security & Compliance", factorName: "Pen Test", weight: 0.03, description: "Penetration test sign-off status (raw is 1-5, inverted)", bandRule: invert },
  { order: 16, category: "Security & Compliance", factorName: "Compliance Gate", weight: 0.02, description: "SOX/GDPR/PCI-DSS gate status (raw is 1-5, inverted)", bandRule: invert },

  { order: 17, category: "Data Migration", factorName: "Migration Req", weight: 0.015, description: "Data migration required (binary factor, no band 2/4/5)", bandRule: v => v === 0 ? 1 : 3 },
  { order: 18, category: "Data Migration", factorName: "Backup Tested", weight: 0.01, description: "Backup/restore verification status (raw is 1-5, inverted)", bandRule: invert },
  { order: 19, category: "Data Migration", factorName: "Migration Script", weight: 0.015, description: "Migration script validation status (raw is 1-5, inverted)", bandRule: invert },

  { order: 20, category: "Resource & Schedule", factorName: "Team Size", weight: 0.02, description: "Number of team members/testers assigned", bandRule: v => v < 3 ? 1 : v < 6 ? 2 : v < 10 ? 3 : v < 15 ? 4 : 5 },
  { order: 21, category: "Resource & Schedule", factorName: "Deploy Window", weight: 0.03, description: "Deployment window duration (hours)", bandRule: v => v < 2 ? 1 : v < 4 ? 2 : v < 6 ? 3 : v < 8 ? 4 : 5 },
  { order: 22, category: "Resource & Schedule", factorName: "Freeze Proximity", weight: 0.03, description: "Days until next change freeze window", bandRule: v => v > 14 ? 1 : v > 7 ? 2 : v > 3 ? 3 : v > 1 ? 4 : 5 },
  { order: 23, category: "Resource & Schedule", factorName: "Key Staff Avail", weight: 0.03, description: "Critical personnel availability (raw is 1-5, inverted)", bandRule: invert },
  { order: 24, category: "Resource & Schedule", factorName: "Overlapping Rels", weight: 0.03, description: "Releases scheduled in the same window", bandRule: v => v === 0 ? 1 : v === 1 ? 2 : v === 2 ? 3 : v === 3 ? 4 : 5 },

  { order: 25, category: "Env & Dependencies", factorName: "Dep Count", weight: 0.03, description: "Number of external dependencies", bandRule: v => v < 2 ? 1 : v < 4 ? 2 : v < 6 ? 3 : v < 8 ? 4 : 5 },
  { order: 26, category: "Env & Dependencies", factorName: "Dep Health", weight: 0.02, description: "Upstream dependency health status (raw is 1-5, inverted)", bandRule: invert },
  { order: 27, category: "Env & Dependencies", factorName: "Vendor Involvement", weight: 0.02, description: "Level of vendor/third-party involvement (3-tier only)", bandRule: v => v === 0 ? 1 : v === 1 ? 3 : 5 },
  { order: 28, category: "Env & Dependencies", factorName: "Feature Flags", weight: 0.02, description: "Stale feature flags pending cleanup (raw is 1-5, inverted)", bandRule: invert },

  { order: 29, category: "Operational Readiness", factorName: "Rollback Plan", weight: 0.02, description: "Rollback plan documentation status (raw is 1-5, inverted)", bandRule: invert },
  { order: 30, category: "Operational Readiness", factorName: "Docs Complete", weight: 0.015, description: "Release documentation completeness (raw is 1-5, inverted)", bandRule: invert },
  { order: 31, category: "Operational Readiness", factorName: "Monitoring Ready", weight: 0.015, description: "Monitoring/alerting readiness (raw is 1-5, inverted)", bandRule: invert },
  { order: 32, category: "Operational Readiness", factorName: "Runbook Updated", weight: 0.015, description: "Operational runbook currency (raw is 1-5, inverted)", bandRule: invert },
  { order: 33, category: "Operational Readiness", factorName: "Rollback RTO", weight: 0.02, description: "Rollback recovery time objective (minutes)", bandRule: v => v < 15 ? 1 : v < 30 ? 2 : v < 60 ? 3 : v < 120 ? 4 : 5 },
  { order: 34, category: "Operational Readiness", factorName: "Deploy Auto %", weight: 0.015, description: "Deployment automation coverage percentage", bandRule: v => v > 90 ? 1 : v > 75 ? 2 : v > 50 ? 3 : v > 25 ? 4 : 5 },

  { order: 35, category: "Performance & Scalability", factorName: "Load Test", weight: 0.02, description: "Load testing completion status (raw is 1-5, inverted)", bandRule: invert },
  { order: 36, category: "Performance & Scalability", factorName: "Perf Regression %", weight: 0.02, description: "Performance regression vs baseline", bandRule: v => v < 5 ? 1 : v < 10 ? 2 : v < 15 ? 3 : v < 25 ? 4 : 5 },

  { order: 37, category: "Release History", factorName: "Vendor Patch", weight: 0.01, description: "Vendor patch/update status (raw is 1-5, inverted)", bandRule: invert },
  { order: 38, category: "Release History", factorName: "Cadence Dev", weight: 0.008, description: "Deviation from planned release cadence (days late)", bandRule: v => v < 2 ? 1 : v < 5 ? 2 : v < 10 ? 3 : v < 20 ? 4 : 5 },
  { order: 39, category: "Release History", factorName: "MTBF Days", weight: 0.008, description: "Mean time between failures (days)", bandRule: v => v > 60 ? 1 : v > 30 ? 2 : v > 14 ? 3 : v > 7 ? 4 : 5 },
  { order: 40, category: "Release History", factorName: "Past Failures", weight: 0.01, description: "Prior release failure count", bandRule: v => v === 0 ? 1 : v === 1 ? 2 : v === 2 ? 3 : v === 3 ? 4 : 5 },
  { order: 41, category: "Release History", factorName: "BC Tested", weight: 0.008, description: "Backward compatibility testing status (raw is 1-5, inverted)", bandRule: invert },
  { order: 42, category: "Release History", factorName: "Rollback Tested", weight: 0.008, description: "Rollback procedure rehearsal status (raw is 1-5, inverted)", bandRule: invert },

  { order: 43, category: "Business Criticality", factorName: "Revenue Impact", weight: 0.01, description: "Revenue risk if release fails (raw value is already 1-5)", bandRule: direct },
  { order: 44, category: "Business Criticality", factorName: "Blast Radius", weight: 0.01, description: "Number of users/customers affected", bandRule: v => v < 1000 ? 1 : v < 5000 ? 2 : v < 20000 ? 3 : v < 50000 ? 4 : 5 },
];

/** Actual weight sum from the verified source formula (not 1.0 — see file header note). */
export const RISK_FACTOR_WEIGHT_SUM = RISK_FACTOR_DEFS.reduce((sum, f) => sum + f.weight, 0);
