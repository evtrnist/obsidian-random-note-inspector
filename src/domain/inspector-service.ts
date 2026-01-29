import { App, MarkdownView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { FileEligibility } from "./file-eligibility";

export class InspectorService {
    private highlightedLeaf: WorkspaceLeaf | null = null;

    constructor(private readonly app: App) {
    }

    clearHighlight() {
        if (!this.highlightedLeaf) {
            return;
        }

        const view = this.highlightedLeaf.view;
        if (view instanceof MarkdownView) {
            view.containerEl.removeClass("random-note-inspector-highlight");
        }

        this.highlightedLeaf = null;
    }

    async openAndHighlight(file: TFile) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file);

        this.applyHighlight(leaf);
    }

    async inspectRandomNote(
        remainingPaths: string[],
        onRemainingPathsChange: (next: string[]) => Promise<void>,
        eligibility: FileEligibility
    ) {
        const tryInspect = async (paths: string[]): Promise<boolean> => {
            let remaining = paths;

            while (remaining.length > 0) {
                const path = remaining[0]!;
                const next = remaining.slice(1);
                const file = this.app.vault.getAbstractFileByPath(path);

                if (!(file instanceof TFile)) {
                    remaining = next;
                    continue;
                }

                await onRemainingPathsChange(next);
                await this.openAndHighlight(file);
                new Notice(`Inspect: ${file.basename}`);
                return true;
            }

            await onRemainingPathsChange([]);
            return false;
        };

        if (remainingPaths.length === 0) {
            const files = eligibility.filterEligibleMarkdownFiles(this.app.vault.getMarkdownFiles());
            remainingPaths = this.shuffle(files.map((f) => f.path));
            await onRemainingPathsChange(remainingPaths);
        }

        if (remainingPaths.length === 0) {
            new Notice("No notes found in vault");
            return;
        }

        if (await tryInspect(remainingPaths)) {
            return;
        }

        const refreshedFiles = eligibility.filterEligibleMarkdownFiles(this.app.vault.getMarkdownFiles());
        const refreshedPaths = this.shuffle(refreshedFiles.map((f) => f.path));
        if (refreshedPaths.length === 0 || !(await tryInspect(refreshedPaths))) {
            new Notice("No notes found in vault");
        }
    }

    async findOrphanNote(eligibility: FileEligibility) {
        const files = eligibility.filterEligibleMarkdownFiles(this.app.vault.getMarkdownFiles());
        const resolvedLinks = this.app.metadataCache.resolvedLinks;
        const incomingLinks = new Set<string>();

        for (const targets of Object.values(resolvedLinks)) {
            for (const targetPath of Object.keys(targets)) {
                incomingLinks.add(targetPath);
            }
        }

        for (const file of files) {
            if (this.isOrphan(file, resolvedLinks, incomingLinks)) {
                await this.openAndHighlight(file);
                new Notice(`Orphan: ${file.basename}`);
                return;
            }
        }

        new Notice("No orphan notes found");
    }

    private isOrphan(
        file: TFile,
        resolvedLinks: Record<string, Record<string, number>>,
        incomingLinks: Set<string>
    ): boolean {
        const cache = this.app.metadataCache.getFileCache(file);

        const hasOutgoingLinks =
            (cache?.links?.length ?? 0) > 0 ||
            (cache?.embeds?.length ?? 0) > 0;

        const hasIncomingLinks = incomingLinks.has(file.path);

        return !hasOutgoingLinks && !hasIncomingLinks;
    }

    private shuffle<T>(array: T[]): T[] {
        const result = [...array];

        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            const tmp = result[i]!;
            result[i] = result[j]!;
            result[j] = tmp;
        }

        return result;
    }

    private applyHighlight(leaf: WorkspaceLeaf) {
        this.clearHighlight();

        const view = leaf.view;
        if (view instanceof MarkdownView) {
            view.containerEl.addClass("random-note-inspector-highlight");
            this.highlightedLeaf = leaf;
        }
    }
}
