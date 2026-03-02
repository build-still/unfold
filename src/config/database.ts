export const DEV_DATABASE_FILE_NAME = 'unfold-dev.db';
export const PROD_DATABASE_FILE_NAME = 'unfold.db';

export const getDatabaseFileName = (): string =>
  import.meta.env.DEV ? DEV_DATABASE_FILE_NAME : PROD_DATABASE_FILE_NAME;
