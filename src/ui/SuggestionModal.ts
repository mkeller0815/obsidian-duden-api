import { App, Modal, Setting } from "obsidian";
import type { SpellAdvice } from "../api";

export type SuggestionAction =
	| { type: "accept"; proposal: string; advice: SpellAdvice }
	| { type: "decline"; advice: SpellAdvice }
	| { type: "learn"; advice: SpellAdvice };

const TYPE_LABELS: Record<string, string> = {
	orth: "Spelling",
	gram: "Grammar",
	style: "Style",
	term: "Term",
};

export class SuggestionModal extends Modal {
	private advices: SpellAdvice[];
	private currentIndex = 0;
	private onAction: (action: SuggestionAction, currentIndex: number) => Promise<void>;
	private onReady: () => void;

	constructor(
		app: App,
		advices: SpellAdvice[],
		onAction: (action: SuggestionAction, currentIndex: number) => Promise<void>,
		onReady: () => void = () => {}
	) {
		super(app);
		this.advices = advices;
		this.onAction = onAction;
		this.onReady = onReady;
	}

	onOpen(): void {
		this.onReady();
		this.render();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();

		if (this.currentIndex >= this.advices.length) {
			contentEl.createEl("p", { text: "All suggestions reviewed." });
			const closeBtn = contentEl.createEl("button", { text: "Close" });
			closeBtn.addEventListener("click", () => this.close());
			return;
		}

		const advice = this.advices[this.currentIndex];
		if (!advice) return;
		const total = this.advices.length;
		const typeLabel = TYPE_LABELS[advice.type] ?? advice.type;

		contentEl.createEl("h2", {
			text: `Suggestion ${this.currentIndex + 1} of ${total} — ${typeLabel}`,
		});

		if (advice.shortMessage) {
			contentEl.createEl("p", { text: advice.shortMessage, cls: "duden-short-message" });
		}

		const errorEl = contentEl.createDiv({ cls: "duden-error-text" });
		errorEl.createSpan({ text: "Error: " }).style.fontWeight = "bold";
		errorEl.createSpan({ text: advice.original, cls: "duden-original" });

		if (advice.proposals.length > 0) {
			contentEl.createEl("p", { text: "Suggestions:" }).style.fontWeight = "bold";

			const proposalList = contentEl.createDiv({ cls: "duden-proposals" });
			for (const proposal of advice.proposals) {
				new Setting(proposalList)
					.setName(proposal)
					.addButton((btn) =>
						btn
							.setButtonText("Accept")
							.setCta()
							.onClick(async () => {
								await this.onAction({ type: "accept", proposal, advice }, this.currentIndex);
								this.currentIndex++;
								this.render();
							})
					);
			}
		} else {
			contentEl.createEl("p", { text: "No suggestions available." });
		}

		const actions = contentEl.createDiv({ cls: "duden-actions" });

		const declineBtn = actions.createEl("button", { text: "Skip" });
		declineBtn.addEventListener("click", async () => {
			await this.onAction({ type: "decline", advice }, this.currentIndex);
			this.currentIndex++;
			this.render();
		});

		const learnBtn = actions.createEl("button", { text: "Add to dictionary" });
		learnBtn.style.marginLeft = "8px";
		learnBtn.addEventListener("click", async () => {
			await this.onAction({ type: "learn", advice }, this.currentIndex);
			this.currentIndex++;
			this.render();
		});
	}
}
