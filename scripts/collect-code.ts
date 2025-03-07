import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

interface Config {
  extensions: string[];
  excludeDirs: string[];
  excludeFiles: string[];
  excludePaths: string[];
  maxFileSize: number;
}

interface FileInfo {
  path: string;
  relativePath: string;
}

const DEFAULT_CONFIG: Config = {
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

function getRelativePath(fullPath: string, rootDir: string): string {
  return path.relative(rootDir, fullPath);
}

function shouldExcludeFile(filePath: string, config: Config): boolean {
  const normalizedPath = path.normalize(filePath);

  if (config.excludeFiles.some((pattern) => normalizedPath.includes(pattern))) {
    return true;
  }

  if (config.excludePaths.some((excludePath) =>
    normalizedPath.includes(path.normalize(excludePath))
  )) {
    return true;
  }

  return false;
}

function shouldExcludeDir(dirPath: string, config: Config): boolean {
  const normalizedPath = path.normalize(dirPath);
  return config.excludeDirs.some((excludeDir) =>
    normalizedPath.includes(path.normalize(excludeDir))
  );
}

function collectFiles(dir: string, rootDir: string, config: Config): FileInfo[] {
  let results: FileInfo[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = getRelativePath(fullPath, rootDir);

    if (item.isDirectory()) {
      if (!shouldExcludeDir(fullPath, config)) {
        results = results.concat(collectFiles(fullPath, rootDir, config));
      }
    } else {
      const ext = path.extname(item.name).toLowerCase();

      if (config.extensions.includes(ext) && !shouldExcludeFile(relativePath, config)) {
        const stats = fs.statSync(fullPath);
        if (stats.size <= config.maxFileSize) {
          results.push({ path: fullPath, relativePath });
        }
      }
    }
  }

  return results;
}

function collectCode(outputFile: string, customConfig: Partial<Config> = {}): void {
  const config = { ...DEFAULT_CONFIG, ...customConfig };

  try {
    fs.writeFileSync(outputFile, '');

    const rootDir = process.cwd();
    console.log(`Processing project directory: ${rootDir}`);
    const files = collectFiles(rootDir, rootDir, config);

    files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

    files.forEach(({ path: filePath, relativePath }) => {
      const content = fs.readFileSync(filePath, 'utf8');
      const separator = '='.repeat(80);
      fs.appendFileSync(
        outputFile,
        `\n\n${separator}\nFile: ${relativePath}\n${separator}\n\n${content}`
      );
    });

    console.log('Collection complete!');
  } catch (error) {
    console.error('Error during collection:', error);
    process.exit(1);
  }
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  const outputFile = process.argv[2] || 'code-collection.txt';
  collectCode(outputFile);
}

export { collectCode };
