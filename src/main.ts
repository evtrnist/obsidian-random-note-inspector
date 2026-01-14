import {
	MarkdownView,
	Notice,
	Plugin,
	TFile,
} from "obsidian";
import { RandomInspectorData } from "random-inspector-data";

const DEFAULT_DATA: RandomInspectorData = {
	remainingPaths: [],
};

export default class RandomNoteInspector extends Plugin {
	private data: RandomInspectorData = {
		remainingPaths: [],
	};

	async onload() {
		const loadedData =
			(await this.loadData()) as Partial<RandomInspectorData> | null;

		this.data = {
			...DEFAULT_DATA,
			...loadedData,
		};

		this.addCommand({
			id: "inspect-random-note",
			name: "Inspect random note",
			callback: () => this.inspectNote(),
		});
	}

	private async inspectNote() {
		if (this.data.remainingPaths.length === 0) {
			await this.startNewCycle();
		}

		if (this.data.remainingPaths.length === 0) {
			new Notice("No notes available for inspection.");

			return;
		}

		const path = this.data.remainingPaths.shift()!;

		await this.saveData(this.data);

		const file = this.app.vault.getAbstractFileByPath(path);

		if (!(file instanceof TFile)) {
			return;
		}

		await this.openAndHighlightFile(file);
	}

	private async startNewCycle() {
		const files = this.app.vault.getMarkdownFiles();

		const paths = files.map((file) => file.path);

		this.data.remainingPaths = this.shuffle(paths);

		await this.saveData(this.data);
	}

	private shuffle<T>(paths: T[]): T[] {
		const result = [...paths];

		for (let i = result.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[result[i], result[j]] = [result[j]!, result[i]!];
		}
		return result;
	}

	private async openAndHighlightFile(file: TFile) {
		const leaf = this.app.workspace.getLeaf(false);

		await leaf.openFile(file);

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		view?.containerEl.addClass("random-note-inspector-highlight");

		new Notice(`Inspect: ${file.basename}`);
	}
}
