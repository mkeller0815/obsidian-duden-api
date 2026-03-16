# Duden Mentor for Obsidian

An Obsidian plugin that checks spelling and grammar in your notes using the [Duden Mentor API](https://api.duden.io).

## Features

- Check spelling and grammar of selected text or the entire note
- Step through suggestions one by one in a review modal
- Accept a correction, skip it, or add the word to your personal dictionary
- All errors are highlighted in the editor while reviewing (wavy underlines by type)
- Personal dictionary is persisted and sent with every API request so ignored words stay ignored

## Requirements

- A Duden Mentor account with API access activated
- Your API key from the Duden Mentor account page

## Installation

### Via BRAT (recommended for beta)

1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat) from the Obsidian community plugins
2. Open BRAT settings and click **Add Beta Plugin**
3. Enter this repository's GitHub URL
4. Enable the plugin in **Settings → Community plugins**

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [GitHub release](../../releases)
2. Copy them to `<your vault>/.obsidian/plugins/duden-mentor/`
3. Enable the plugin in **Settings → Community plugins**

## Setup

1. Go to **Settings → Duden Mentor**
2. Paste your API key from your Duden Mentor account page

## Usage

### Commands

| Command | Description |
|---|---|
| **Duden Mentor: Check selected text** | Checks only the currently selected text |
| **Duden Mentor: Check full note** | Checks the entire note |

Commands are available via the command palette (`Cmd/Ctrl+P`).

### Context menu

Right-click anywhere in the editor to access:
- **Duden Mentor: Check selection** — checks the selected text
- **Duden Mentor: Check whole note** — checks the entire note

### Review modal

When issues are found, a modal steps through each one:

- **Accept** a proposal to apply the correction
- **Skip** to leave the text unchanged
- **Add to dictionary** to permanently ignore the word in future checks

All corrections are applied when the modal is closed.

### Personal dictionary

Words added via "Add to dictionary" are shown in **Settings → Duden Mentor → Personal dictionary**, where they can also be removed.

## Development

```bash
npm install
npm run dev    # watch mode — rebuilds on every change
npm run build  # production build
```

By default, `npm run dev` outputs directly to `PluginTest/.obsidian/plugins/duden-mentor/` (relative to the repo root). Create an Obsidian vault in a `PluginTest/` folder next to the source, or change the `outDir` path in `esbuild.config.mjs` to point to any vault on your machine.

## Highlight colors

| Color | Type |
|---|---|
| Red wavy underline | Spelling (orth) |
| Blue wavy underline | Grammar (gram) |
| Yellow wavy underline | Style |
| Purple wavy underline | Term |
| Orange background | Currently reviewed suggestion |
