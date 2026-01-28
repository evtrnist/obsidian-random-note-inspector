export interface RandomInspectorData {
    enabled: boolean;
    remainingPaths: string[];
    excludedFolders: string[];
}

export const DEFAULT_DATA: RandomInspectorData = {
    enabled: false,
    remainingPaths: [],
    excludedFolders: [],
};

