declare module 'better-sqlite3' {
  // Minimal ambient for TypeScript when package exports block direct typing resolution.
  type RunResult = { changes: number; lastInsertROWID?: number };
  type DatabaseOptions = { readonly?: boolean; fileMustExist?: boolean };
  class Database {
    constructor(filename: string, options?: DatabaseOptions);
    exec(sql: string): void;
    prepare(sql: string): any;
    pragma(statement: string, options?: { simple?: boolean }): any;
    close(): void;
  }
  export default Database;
}
