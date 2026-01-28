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
        if (remainingPaths.length === 0) {
            const files = eligibility.filterEligibleMarkdownFiles(this.app.vault.getMarkdownFiles());
            const paths = this.shuffle(files.map((f) => f.path));
            remainingPaths = paths;
            await onRemainingPathsChange(remainingPaths);
        }

        if (remainingPaths.length === 0) {
            new Notice("No notes found in vault");
            return;
        }

        const path = remainingPaths[0]!;
        const next = remainingPaths.slice(1);
        await onRemainingPathsChange(next);

        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) {
            return;
        }

        await this.openAndHighlight(file);
        new Notice(`Inspect: ${file.basename}`);
    }

    async findOrphanNote(eligibility: FileEligibility) {
        const files = eligibility.filterEligibleMarkdownFiles(this.app.vault.getMarkdownFiles());
        const resolvedLinks = this.app.metadataCache.resolvedLinks;

        for (const file of files) {
            if (this.isOrphan(file, resolvedLinks)) {
                await this.openAndHighlight(file);
                new Notice(`Orphan: ${file.basename}`);
                return;
            }
        }

        new Notice("No orphan notes found");
    }

    private isOrphan(file: TFile, resolvedLinks: Record<string, Record<string, number>>): boolean {
        const cache = this.app.metadataCache.getFileCache(file);

        const hasOutgoingLinks =
            (cache?.links?.length ?? 0) > 0 ||
            (cache?.embeds?.length ?? 0) > 0;

        const hasIncomingLinks = Object.values(resolvedLinks).some((targets) => {
            return targets[file.path] !== undefined;
        });

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
