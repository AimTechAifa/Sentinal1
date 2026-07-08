export type TablePreferences = {
  hiddenColumns: string[];
  hiddenFilters: string[];
};

export const EMPTY_TABLE_PREFERENCES: TablePreferences = {
  hiddenColumns: [],
  hiddenFilters: [],
};
