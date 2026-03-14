import { EditorView, Decoration, DecorationSet } from "@codemirror/view";
import { StateField, StateEffect, Range } from "@codemirror/state";

export type HighlightType = "orth" | "gram" | "style" | "term";

interface HighlightRange {
	from: number;
	to: number;
	type: HighlightType;
}

export const setHighlights = StateEffect.define<HighlightRange[]>();
export const clearHighlights = StateEffect.define<void>();
export const setActiveHighlight = StateEffect.define<number>(); // absolute `from` offset

const highlightField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none;
	},
	update(deco, tr) {
		deco = deco.map(tr.changes);

		for (const effect of tr.effects) {
			if (effect.is(clearHighlights)) {
				return Decoration.none;
			}
			if (effect.is(setHighlights)) {
				const marks = effect.value.map((r) =>
					Decoration.mark({
						class: `duden-highlight duden-highlight-${r.type}`,
					}).range(r.from, r.to)
				);
				deco = Decoration.set(marks, true);
			}
			if (effect.is(setActiveHighlight)) {
				// Replace existing marks, promoting the active one
				const ranges: Range<Decoration>[] = [];
				const cursor = deco.iter();
				while (cursor.value) {
					const isActive = cursor.from === effect.value;
					const currentClass = (cursor.value.spec as { class?: string }).class ?? "";
					const baseClass = currentClass.replace(" duden-highlight-active", "");
					ranges.push(
						Decoration.mark({
							class: baseClass + (isActive ? " duden-highlight-active" : ""),
						}).range(cursor.from, cursor.to)
					);
					cursor.next();
				}
				deco = Decoration.set(ranges, true);
			}
		}
		return deco;
	},
	provide(f) {
		return EditorView.decorations.from(f);
	},
});

export function buildHighlighterExtension() {
	return highlightField;
}

export function applyHighlights(view: EditorView, ranges: HighlightRange[]) {
	view.dispatch({ effects: setHighlights.of(ranges) });
}

export function applyActiveHighlight(view: EditorView, from: number) {
	view.dispatch({ effects: setActiveHighlight.of(from) });
}

export function removeHighlights(view: EditorView) {
	view.dispatch({ effects: clearHighlights.of() });
}
