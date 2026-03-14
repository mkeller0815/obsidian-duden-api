import { App, PluginSettingTab, Setting } from "obsidian";
import type DudenMentorPlugin from "./main";

export interface DudenMentorSettings {
	apiKey: string;
	language: string;
	maxProposals: number;
	dictionary: string[];
}

export const DEFAULT_SETTINGS: DudenMentorSettings = {
	apiKey: "",
	language: "de",
	maxProposals: 7,
	dictionary: [],
};

export class DudenMentorSettingTab extends PluginSettingTab {
	plugin: DudenMentorPlugin;

	constructor(app: App, plugin: DudenMentorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("API key")
			.setDesc("Your Duden Mentor API key (from your account page after activating API access).")
			.addText((text) =>
				text
					.setPlaceholder("Enter your API key")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Language")
			.setDesc("Language code for spell checking (default: de).")
			.addText((text) =>
				text
					.setPlaceholder("de")
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value.trim() || "de";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Max proposals")
			.setDesc("Maximum number of correction suggestions per error (1–10).")
			.addSlider((slider) =>
				slider
					.setLimits(1, 10, 1)
					.setValue(this.plugin.settings.maxProposals)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.maxProposals = value;
						await this.plugin.saveSettings();
					})
			);

		// Dictionary management
		containerEl.createEl("h3", { text: "Personal dictionary" });
		containerEl.createEl("p", {
			text: "Words added via 'Add to dictionary' are ignored in all future checks.",
			cls: "setting-item-description",
		});

		const { dictionary } = this.plugin.settings;

		if (dictionary.length === 0) {
			containerEl.createEl("p", {
				text: "No words in dictionary.",
				cls: "setting-item-description",
			});
		} else {
			for (const word of [...dictionary].sort()) {
				new Setting(containerEl)
					.setName(word)
					.addButton((btn) =>
						btn
							.setButtonText("Remove")
							.setWarning()
							.onClick(async () => {
								this.plugin.settings.dictionary =
									this.plugin.settings.dictionary.filter((w) => w !== word);
								await this.plugin.saveSettings();
								this.display();
							})
					);
			}
		}
	}
}
