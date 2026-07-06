/**
 * Known aliasing between application names as they appear in the extracted
 * Excel/monitoring seed JSON files and the canonical name in the Application
 * table. Populated when an exact-match lookup fails but the mismatch is
 * clearly the same application under a shortened/legacy name.
 *
 * "SAP S/4HANA Finance" (JSON files) -> "SAP S/4HANA Finance (FICO)" (DB) —
 * confirmed same application; JSON extraction dropped the "(FICO)" suffix.
 */
export const APPLICATION_NAME_ALIASES: Record<string, string> = {
  "SAP S/4HANA Finance": "SAP S/4HANA Finance (FICO)",
};
