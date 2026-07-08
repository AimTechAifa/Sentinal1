/** Shared table column / filter field types (no hook imports — safe for lib/*.ts). */

export type ColumnDef = {
  key: string;
  label: string;
};

export type FilterFieldDef = {
  key: string;
  label: string;
};
