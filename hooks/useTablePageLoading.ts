/** True while row data or saved column visibility is still loading. */
export function useTablePageLoading(dataLoading: boolean, columnsLoaded: boolean): boolean {
  return dataLoading || !columnsLoaded;
}
