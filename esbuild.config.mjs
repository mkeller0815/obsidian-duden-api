import esbuild from "esbuild";
import process from "process";
import { builtinModules } from "node:module";
import { copyFileSync, mkdirSync } from "node:fs";

const prod = process.argv[2] === "production";

const outDir = prod
	? "."
	: "PluginTest/.obsidian/plugins/duden-mentor";

if (!prod) {
	mkdirSync(outDir, { recursive: true });
}

const context = await esbuild.context({
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtinModules,
	],
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: `${outDir}/main.js`,
	minify: prod,
	plugins: [
		{
			name: "copy-assets",
			setup(build) {
				build.onEnd(() => {
					copyFileSync("manifest.json", `${outDir}/manifest.json`);
					try {
						copyFileSync("styles.css", `${outDir}/styles.css`);
					} catch {
						// styles.css is optional
					}
				});
			},
		},
	],
});

if (prod) {
	await context.rebuild();
	process.exit(0);
} else {
	await context.watch();
}
