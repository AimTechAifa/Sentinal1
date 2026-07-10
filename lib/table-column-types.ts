/** Shared table column / filter field types (no hook imports — safe for lib/*.ts). */

export type ColumnDef = {
  key: string;
  label: string;
};

export type FilterFieldDef = {
  key: string;
  label: string;
};

/**
 * table-standard.mdc #5 — Manage Filters / Manage Columns panels show a search
 * input automatically once the option list exceeds this count.
 */
export const MANAGE_PANEL_SEARCH_THRESHOLD = 8;
