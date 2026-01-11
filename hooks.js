// import { printDebugData } from './scripts/debug.js';
import { createSellButton } from './scripts/create-button.js';
import { registerSellLootSettings } from './scripts/settings.js';

Hooks.once('init', () => {
  	registerSellLootSettings();
});

Hooks.on(`renderActorSheet`, async (app, html) => {
  	await createSellButton(app, html);
});

Hooks.once('ready', async () => {
	console.log("PF2E Sell Loot | Module ready.");
});