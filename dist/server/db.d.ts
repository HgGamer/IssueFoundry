declare const db: import("better-sqlite3").Database;
export declare function getOrCreateProjectBoard(projectPath: string): {
    id: number;
    name: string;
    project_path: string;
};
export default db;
