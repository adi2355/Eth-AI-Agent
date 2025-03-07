declare module 'solc' {
  export function compile(input: string): string;
  export function loadRemoteVersion(version: string, callback: (err: Error | null, solc: any) => void): void;
  export function setupMethods(solc: any): void;
} 