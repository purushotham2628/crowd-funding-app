declare module 'better-sqlite3' {
  interface RunResult { changes: number; lastInsertROWID?: number }
  interface DatabaseOptions { readonly?: boolean; fileMustExist?: boolean }
  class Database {
    constructor(filename: string, options?: DatabaseOptions);
    exec(sql: string): void;
    prepare(sql: string): any;
    pragma(statement: string, options?: { simple?: boolean }): any;
    close(): void;
  }
  export default Database;
}
