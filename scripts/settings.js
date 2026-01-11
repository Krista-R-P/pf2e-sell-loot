export function registerSellLootSettings() {
	game.settings.register('pf2e-sell-loot', 'defaultSellMultiplier', {
		name: 'Default Sell Multiplier',
		hint: 'The default multiplier for item value when selling loot (e.g., 0.5 for 50%).',
		scope: 'world',
		config: true,
		type: Number,
		default: 0.5,
		min: 0,
		restricted: true
	});

	game.settings.register('pf2e-sell-loot', 'hideMultiplierField', {
		name: 'Hide Multiplier Field',
		hint: 'If enabled, the multiplier field will be hidden from the sell dialog. The multiplier will still be used and shown in the output message.',
		scope: 'world',
		config: true,
		type: Boolean,
		default: false,
		restricted: true
	});

	game.settings.register('pf2e-sell-loot', 'gmWhisperMode', {
		name: 'GM Whisper Mode',
		hint: 'Controls the visibility and default state of the "hide from players" toggle in the sell dialog.',
		scope: 'world',
		config: true,
		type: String,
		choices: {
			'public-default': 'Public by default (toggle shown, unchecked)',
			'private-default': 'Private by default (toggle shown, checked)',
			'always-public': 'Always public (toggle hidden, always public)',
			'always-private': 'Always private (toggle hidden, always private)'
		},
		default: 'public-default',
		restricted: true
	});
}
