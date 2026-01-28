import { TFile } from "obsidian";
import { normalizePath } from "../data/data";

export class FileEligibility {
    constructor(private readonly excludedFolders: string[]) {
    }

    isExcludedFolder(folderPath: string): boolean {
        const normalized = normalizePath(folderPath);
        return this.excludedFolders.some((p) => normalizePath(p) === normalized);
    }

    isExcludedPath(path: string): boolean {
        const normalized = path.replace(/\\/g, "/");

        return this.excludedFolders.some((folder) => {
            const f = normalizePath(folder);
            return normalized === f || normalized.startsWith(f + "/");
        });
    }

    filterEligibleMarkdownFiles(files: TFile[]): TFile[] {
        return files.filter((file) => !this.isExcludedPath(file.path));
    }
}
