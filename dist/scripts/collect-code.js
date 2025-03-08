"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectCode = collectCode;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const DEFAULT_CONFIG = {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.sql'],
    excludeDirs: [
        'node_modules',
        '.git',
        'dist',
        '.next',
        'coverage',
        'tests',
        'scripts',
        'components/ui',
    ],
    excludeFiles: [
        '.test.',
        '.spec.',
        '.d.ts',
        '.map',
        'next-env.d.ts',
        '.gitignore',
        '.eslintrc.json',
        '.env.example',
        'components.json',
        'package-lock.json',
    ],
    excludePaths: [
        'lib/supabase.ts',
        'lib/rate-limit.ts',
        'lib/monitoring.ts',
        'lib/cache.ts',
        'lib/auth.ts',
        'scripts/test-agent1.ts',
        'scripts/test-agent2.ts',
        'scripts/test-agent3.ts',
        'scripts/test-orchestrator.ts',
        'lib/graphql/queries.ts',
        'lib/graphql/client.ts',
        'hooks/use-toast.ts',
        'components/WalletConnect.tsx',
        'components/Learn.tsx',
        'components/ContractInteraction.tsx',
        'components/Analytics.tsx',
        'app/providers.tsx',
        'app/page.tsx',
        'app/globals.css',
        'app/layout.tsx',
    ],
    maxFileSize: 1024 * 1024, // 1MB
};
function getRelativePath(fullPath, rootDir) {
    return path_1.default.relative(rootDir, fullPath);
}
function shouldExcludeFile(filePath, config) {
    const normalizedPath = path_1.default.normalize(filePath);
    if (config.excludeFiles.some((pattern) => normalizedPath.includes(pattern))) {
        return true;
    }
    if (config.excludePaths.some((excludePath) => normalizedPath.includes(path_1.default.normalize(excludePath)))) {
        return true;
    }
    return false;
}
function shouldExcludeDir(dirPath, config) {
    const normalizedPath = path_1.default.normalize(dirPath);
    return config.excludeDirs.some((excludeDir) => normalizedPath.includes(path_1.default.normalize(excludeDir)));
}
function collectFiles(dir, rootDir, config) {
    let results = [];
    const items = fs_1.default.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path_1.default.join(dir, item.name);
        const relativePath = getRelativePath(fullPath, rootDir);
        if (item.isDirectory()) {
            if (!shouldExcludeDir(fullPath, config)) {
                results = results.concat(collectFiles(fullPath, rootDir, config));
            }
        }
        else {
            const ext = path_1.default.extname(item.name).toLowerCase();
            if (config.extensions.includes(ext) && !shouldExcludeFile(relativePath, config)) {
                const stats = fs_1.default.statSync(fullPath);
                if (stats.size <= config.maxFileSize) {
                    results.push({ path: fullPath, relativePath });
                }
            }
        }
    }
    return results;
}
function collectCode(outputFile, customConfig = {}) {
    const config = { ...DEFAULT_CONFIG, ...customConfig };
    try {
        fs_1.default.writeFileSync(outputFile, '');
        const rootDir = process.cwd();
        console.log(`Processing project directory: ${rootDir}`);
        const files = collectFiles(rootDir, rootDir, config);
        files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
        files.forEach(({ path: filePath, relativePath }) => {
            const content = fs_1.default.readFileSync(filePath, 'utf8');
            const separator = '='.repeat(80);
            fs_1.default.appendFileSync(outputFile, `\n\n${separator}\nFile: ${relativePath}\n${separator}\n\n${content}`);
        });
        console.log('Collection complete!');
    }
    catch (error) {
        console.error('Error during collection:', error);
        process.exit(1);
    }
}
const isMainModule = process.argv[1] === (0, url_1.fileURLToPath)(import.meta.url);
if (isMainModule) {
    const outputFile = process.argv[2] || 'code-collection.txt';
    collectCode(outputFile);
}
