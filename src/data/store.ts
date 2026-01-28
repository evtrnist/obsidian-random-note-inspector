import { Plugin } from "obsidian";
import { DEFAULT_DATA, RandomInspectorData } from "./data";

type Updater = (prev: RandomInspectorData) => RandomInspectorData;

export class DataStore {
    private data: RandomInspectorData = DEFAULT_DATA;

    constructor(private readonly plugin: Plugin) {
    }

    async load(): Promise<RandomInspectorData> {
        const loaded = (await this.plugin.loadData()) as Partial<RandomInspectorData> | null;

        this.data = {
            ...DEFAULT_DATA,
            ...loaded,
        };

        return this.data;
    }

    get(): RandomInspectorData {
        return this.data;
    }

    async set(next: RandomInspectorData): Promise<void> {
        this.data = next;
        await this.plugin.saveData(this.data);
    }

    async update(patch: Partial<RandomInspectorData> | Updater): Promise<void> {
        const next =
            typeof patch === "function"
                ? patch(this.data)
                : { ...this.data, ...patch };

        await this.set(next);
    }
}
