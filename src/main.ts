import { Notice, Plugin, TFolder, normalizePath } from "obsidian";
import { DataStore } from "./data/store";
import { FileEligibility } from "./domain/file-eligibility";
import { InspectorService } from "./domain/inspector-service";
import { InspectorStatusBar } from "./ui/status-bar";

export default class RandomNoteInspector extends Plugin {
	private store: DataStore | null = null;
	private inspector: InspectorService | null = null;
	private statusBar: InspectorStatusBar | null = null;

	async onload() {
		this.store = new DataStore(this);

		await this.store.load();

		this.inspector = new InspectorService(this.app);

		this.statusBar = new InspectorStatusBar(this.addStatusBarItem(), {
			onToggle: () => {
				void this.toggleInspector();
			},
			onRandom: () => {
				void this.inspectRandomNote();
			},
			onDone: () => {
				void this.setInspectorEnabled(false);
			},
			onFindOrphan: () => {
				void this.findOrphanNote();
			},
		});

		this.renderStatusBar();
		this.addCommands();
		this.registerFolderMenu();
	}

	onunload() {
		this.inspector?.clearHighlight();
	}

	private getEligibility(): FileEligibility {
		const data = this.store!.get();
		return new FileEligibility(data.excludedFolders);
	}

	private renderStatusBar() {
		const enabled = this.store!.get().enabled;
		this.statusBar?.render(enabled ? "on" : "off");
	}

	private addCommands() {
		this.addCommand({
			id: "toggle-inspector",
			name: "Toggle inspector",
			callback: () => {
				void this.toggleInspector();
			},
		});

		this.addCommand({
			id: "inspect-random-note",
			name: "Inspect random note",
			callback: () => {
				void this.inspectRandomNote();
			},
		});

		this.addCommand({
			id: "find-orphan-note",
			name: "Find orphan note",
			callback: () => {
				void this.findOrphanNote();
			},
		});
	}

	private registerFolderMenu() {
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (!(file instanceof TFolder)) {
					return;
				}

				const folderPath = file.path;
				const eligibility = this.getEligibility();

				if (!eligibility.isExcludedFolder(folderPath)) {
					menu.addItem((item) => {
						item.setTitle("Exclude from inspector");
						item.setIcon("ban");
						item.onClick(() => {
							void this.excludeFolder(folderPath);
						});
					});
				} else {
					menu.addItem((item) => {
						item.setTitle("Include in inspector");
						item.setIcon("check");
						item.onClick(() => {
							void this.includeFolder(folderPath);
						});
					});
				}
			}),
		);
	}

	private async toggleInspector() {
		const enabled = this.store!.get().enabled;
		await this.setInspectorEnabled(!enabled);
	}

	private async setInspectorEnabled(enabled: boolean) {
		await this.store!.update({ enabled });

		if (!enabled) {
			this.inspector?.clearHighlight();
		}

		this.renderStatusBar();
		new Notice(enabled ? "Inspector enabled" : "Inspector disabled");
	}

	private async inspectRandomNote() {
		const data = this.store!.get();

		if (!data.enabled) {
			new Notice("Inspector is off");
			return;
		}

		if (!this.inspector) {
			return;
		}

		const eligibility = this.getEligibility();

		await this.inspector.inspectRandomNote(
			data.remainingPaths,
			async (nextRemainingPaths) => {
				await this.store!.update({
					remainingPaths: nextRemainingPaths,
				});
			},
			eligibility,
		);
	}

	private async findOrphanNote() {
		const data = this.store!.get();

		if (!data.enabled) {
			new Notice("Inspector is off");
			return;
		}

		await this.inspector!.findOrphanNote(this.getEligibility());
	}

	private async excludeFolder(folderPath: string) {
		const normalized = normalizePath(folderPath);

		await this.store!.update((prev) => {
			if (prev.excludedFolders.includes(normalized)) {
				return prev;
			}

			return {
				...prev,
				excludedFolders: [...prev.excludedFolders, normalized],
				remainingPaths: [],
			};
		});

		new Notice("Folder excluded from inspector");
	}

	private async includeFolder(folderPath: string) {
		const normalized = normalizePath(folderPath);

		await this.store!.update((prev) => {
			return {
				...prev,
				excludedFolders: prev.excludedFolders.filter(
					(p) => p !== normalized,
				),
				remainingPaths: [],
			};
		});

		new Notice("Folder included in inspector");
	}
}
