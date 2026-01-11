// import { printDebugData } from './scripts/debug.js';
import { createSellButton } from './scripts/create-button.js';
import { registerSellLootSettings } from './scripts/settings.js';

Hooks.once('init', () => {
  	registerSellLootSettings();
});

// Hooks.on("clickHeaderControlApplicationV2", (application, action, event) => {
// 	if (action === "debug") {
// 		printDebugData(application);
// 	}
// });

// Hooks.on('getActorSheetHeaderButtons', (sheet, buttons) => {
// 	buttons.unshift({
// 		label: "Debug",
// 		class: "debug-data",
// 		icon: "fas fa-bug",
// 		onclick: () => printDebugData(sheet)
// 	});
// });

Hooks.on(`renderActorSheet`, async (app, html) => {
  	await createSellButton(app, html);
});

Hooks.once('ready', async () => {
	console.log("PF2E Sell Loot | Module ready.");
});