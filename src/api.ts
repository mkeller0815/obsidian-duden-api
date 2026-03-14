export type SuggestionType = "orth" | "gram" | "style" | "term";

export interface SpellAdvice {
	errorCode: string;
	type: SuggestionType;
	offset: number;
	length: number;
	proposals: string[];
	shortMessage: string;
	original: string;
}

interface SpellcheckResponse {
	data: {
		spellAdvices: Array<{
			errorCode: string;
			type: SuggestionType;
			offset: number;
			length: number;
			proposals: string[];
			shortMessage: string;
			originalError: string;
		}>;
	};
}

export class DudenMentorAPI {
	private readonly baseUrl = "https://api.duden.de/v1";

	constructor(
		private apiKey: string,
		private language: string,
		private maxProposals: number
	) {}

	async spellcheck(text: string, dictionary: string[] = []): Promise<SpellAdvice[]> {
		if (!this.apiKey) {
			throw new Error("No API key configured. Please add your Duden Mentor API key in the plugin settings.");
		}

		let response: Response;
		try {
			response = await fetch(`${this.baseUrl}/spellcheck`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": this.apiKey,
				},
				body: JSON.stringify({
					text,
					language: this.language,
					dictionary,
					maxProposals: this.maxProposals,
				}),
			});
		} catch (err) {
			throw new Error(`Network error: ${(err as Error).message}`);
		}

		if (!response.ok) {
			if (response.status === 401 || response.status === 403) {
				throw new Error("Invalid API key. Please check your Duden Mentor API key in the plugin settings.");
			}
			throw new Error(`Duden Mentor API error: ${response.status} ${response.statusText}`);
		}

		const raw = await response.text();

		const data = JSON.parse(raw) as SpellcheckResponse;

		return (data.data.spellAdvices ?? []).map((advice) => ({
			...advice,
			original: text.slice(advice.offset, advice.offset + advice.length),
		}));
	}
}
