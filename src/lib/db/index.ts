export type DbResult<T> = {
  data: T | null;
  error: string | null;
};
