interface Config {
    extensions: string[];
    excludeDirs: string[];
    excludeFiles: string[];
    excludePaths: string[];
    maxFileSize: number;
}
declare function collectCode(outputFile: string, customConfig?: Partial<Config>): void;
export { collectCode };
