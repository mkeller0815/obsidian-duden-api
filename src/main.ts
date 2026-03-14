import { Editor, Menu, MarkdownView, Notice, Plugin } from "obsidian";
import { EditorView } from "@codemirror/view";
import { DudenMentorAPI } from "./api";
import type { SpellAdvice } from "./api";
import { DEFAULT_SETTINGS, DudenMentorSettingTab } from "./settings";
import type { DudenMentorSettings } from "./settings";
import { SuggestionModal } from "./ui/SuggestionModal";
import type { SuggestionAction } from "./ui/SuggestionModal";
import {
	buildHighlighterExtension,
	applyHighlights,
	applyActiveHighlight,
	removeHighlights,
} from "./editor/highlighter";

export default class DudenMentorPlugin extends Plugin {
	settings: DudenMentorSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new DudenMentorSettingTab(this.app, this));
		this.registerEditorExtension(buildHighlighterExtension());

		this.addCommand({
			id: "check-selection",
			name: "Check selected text",
			editorCallback: (editor: Editor) => {
				const text = editor.getSelection();
				if (!text) {
					new Notice("No text selected. Please select text to check.");
					return;
				}
				this.runCheck(editor, text, editor.getCursor("from"));
			},
		});

		this.addCommand({
			id: "check-full-note",
			name: "Check full note",
			editorCallback: (editor: Editor) => {
				const text = editor.getValue();
				if (!text.trim()) {
					new Notice("Note is empty.");
					return;
				}
				this.runCheck(editor, text, { line: 0, ch: 0 });
			},
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
				menu.addItem((item) =>
					item
						.setTitle("Duden Mentor: Check selection")
						.setIcon("spell-check")
						.onClick(() => {
							const selection = editor.getSelection();
							if (!selection) {
								new Notice("No text selected.");
								return;
							}
							this.runCheck(editor, selection, editor.getCursor("from"));
						})
				);
				menu.addItem((item) =>
					item
						.setTitle("Duden Mentor: Check whole note")
						.setIcon("spell-check")
						.onClick(() => {
							const text = editor.getValue();
							if (!text.trim()) {
								new Notice("Note is empty.");
								return;
							}
							this.runCheck(editor, text, { line: 0, ch: 0 });
						})
				);
			})
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private getCMView(editor: Editor): EditorView | null {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		// @ts-expect-error: cm is not in the public API
		return view?.editor?.cm ?? null;
	}

	private posToOffset(state: { doc: { line: (n: number) => { from: number } } }, pos: { line: number; ch: number }): number {
		return state.doc.line(pos.line + 1).from + pos.ch;
	}

	private async runCheck(
		editor: Editor,
		text: string,
		basePosition: { line: number; ch: number }
	) {
		const api = new DudenMentorAPI(
			this.settings.apiKey,
			this.settings.language,
			this.settings.maxProposals
		);

		new Notice("Checking text with Duden Mentor…");

		let advices: SpellAdvice[];
		try {
			advices = await api.spellcheck(text, this.settings.dictionary);
		} catch (err) {
			new Notice((err as Error).message);
			return;
		}

		if (advices.length === 0) {
			new Notice("No issues found.");
			return;
		}

		new Notice(`Found ${advices.length} suggestion(s).`);

		// Highlight all errors in the editor
		const cmView = this.getCMView(editor);
		if (cmView) {
			const baseOffset = this.posToOffset(cmView.state, basePosition);
			const ranges = advices.map((a) => ({
				from: baseOffset + a.offset,
				to: baseOffset + a.offset + a.length,
				type: a.type,
			}));
			applyHighlights(cmView, ranges);
		}

		const pendingReplacements: Array<{ advice: SpellAdvice; proposal: string }> = [];

		const modal = new SuggestionModal(
			this.app,
			advices,
			async (action: SuggestionAction, currentIndex: number) => {
				if (action.type === "accept") {
					pendingReplacements.push({ advice: action.advice, proposal: action.proposal });
				} else if (action.type === "learn") {
					if (!this.settings.dictionary.includes(action.advice.original)) {
						this.settings.dictionary.push(action.advice.original);
						await this.saveSettings();
					}
				}
				// Advance active highlight to next suggestion
				if (cmView) {
					const next = advices[currentIndex + 1];
					if (next) {
						const baseOffset = this.posToOffset(cmView.state, basePosition);
						applyActiveHighlight(cmView, baseOffset + next.offset);
					}
				}
			},
			// Called when modal first opens — highlight the first error as active
			() => {
				if (cmView && advices[0]) {
					const baseOffset = this.posToOffset(cmView.state, basePosition);
					applyActiveHighlight(cmView, baseOffset + advices[0].offset);
				}
			}
		);

		modal.onClose = () => {
			// Clear all highlights
			if (cmView) removeHighlights(cmView);

			// Apply accepted replacements in reverse offset order
			const sorted = pendingReplacements.sort(
				(a, b) => b.advice.offset - a.advice.offset
			);
			for (const { advice, proposal } of sorted) {
				const from = this.offsetToPos(text, basePosition, advice.offset);
				const to = this.offsetToPos(text, basePosition, advice.offset + advice.length);
				editor.replaceRange(proposal, from, to);
			}
		};

		modal.open();
	}

	private offsetToPos(
		text: string,
		base: { line: number; ch: number },
		offset: number
	): { line: number; ch: number } {
		const slice = text.slice(0, offset);
		const newlines = slice.split("\n");
		const addedLines = newlines.length - 1;
		const lastLineLen = newlines[newlines.length - 1]?.length ?? 0;

		if (addedLines === 0) {
			return { line: base.line, ch: base.ch + lastLineLen };
		}
		return { line: base.line + addedLines, ch: lastLineLen };
	}
}
