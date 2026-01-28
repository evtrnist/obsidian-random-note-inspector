import { setIcon } from "obsidian";

export type InspectorStatus = "on" | "off";

interface StatusBarHandlers {
    onToggle: () => void;
    onRandom: () => void;
    onDone: () => void;
    onFindOrphan: () => void;
}

export class InspectorStatusBar {
    private readonly rootEl: HTMLElement;
    private readonly stateBtnEl: HTMLButtonElement;
    private readonly actionsEl: HTMLElement;

    private readonly randomBtnEl: HTMLButtonElement;
    private readonly orphanBtnEl: HTMLButtonElement;
    private readonly doneBtnEl: HTMLButtonElement;

    constructor(statusBarItemEl: HTMLElement, handlers: StatusBarHandlers) {
        this.rootEl = statusBarItemEl;
        this.rootEl.addClass("random-note-inspector-status-root");

        this.stateBtnEl = this.rootEl.createEl("button", {
            type: "button",
            cls: "random-note-inspector-status-state",
            attr: {
                "aria-label": "Toggle inspector",
                "title": "Toggle inspector",
            },
        });

        this.actionsEl = this.rootEl.createEl("span", {
            cls: "random-note-inspector-status-actions",
        });

        this.randomBtnEl = this.actionsEl.createEl("button", {
            type: "button",
            cls: "random-note-inspector-status-btn",
            attr: {
                "aria-label": "Inspect random note",
                "title": "Inspect random note",
            },
        });
        setIcon(this.randomBtnEl, "dice");

        this.orphanBtnEl = this.actionsEl.createEl("button", {
            type: "button",
            cls: "random-note-inspector-status-btn",
            attr: {
                "aria-label": "Find orphan note",
                "title": "Find orphan note",
            },
        });
        setIcon(this.orphanBtnEl, "unlink");

        this.doneBtnEl = this.actionsEl.createEl("button", {
            type: "button",
            cls: "random-note-inspector-status-btn",
            attr: {
                "aria-label": "Done",
                "title": "Done",
            },
        });
        setIcon(this.doneBtnEl, "check");

        this.stateBtnEl.addEventListener("click", handlers.onToggle);
        this.randomBtnEl.addEventListener("click", handlers.onRandom);
        this.doneBtnEl.addEventListener("click", handlers.onDone);
        this.orphanBtnEl.addEventListener("click", handlers.onFindOrphan);
    }

    render(status: InspectorStatus) {
        this.stateBtnEl.setText(status === "on" ? "Inspector: on" : "Inspector: off");

        if (status === "on") {
            this.actionsEl.removeClass("is-hidden");
        } else {
            this.actionsEl.addClass("is-hidden");
        }
    }
}
