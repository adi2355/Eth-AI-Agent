import '../scripts/load-env';
export declare function setupTestEnvironment(): Promise<void>;
declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean;
}
