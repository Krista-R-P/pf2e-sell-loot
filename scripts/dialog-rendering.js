import { getInventoryData } from './inventory.js';
import { setupDialogEventHandlers } from './dialog-events.js';
import { setupCategoryRowStriping } from './utils.js';
import { addCoinsToActor } from './add-coins.js';
import { deleteSelectedItems } from './delete-items.js';
import { dialogState } from './dialog-state.js';
import { getItemTotalValue } from './utils.js';

export async function renderSellDialog(actor) {
    // Get the actor's inventory data
    if (!actor) {
        // Fallback: try to get the currently viewed actor or use a selected token
        actor = game.user.character || canvas.tokens.controlled[0]?.actor;
        
        if (!actor) {
            ui.notifications.error("No actor available. Please select a token or open a character sheet.");
            return;
        }
    }

    // Get default multiplier from settings
    let defaultMultiplier = 0.5;
    if (game.settings) {
        defaultMultiplier = game.settings.get('pf2e-sell-loot', 'defaultSellMultiplier') ?? 0.5;
    }

    // Get new settings
    const hideMultiplierField = game.settings?.get('pf2e-sell-loot', 'hideMultiplierField') ?? false;
    const gmWhisperMode = game.settings?.get('pf2e-sell-loot', 'gmWhisperMode') ?? 'public-default';

    // Determine GM toggle visibility and default checked state
    let showGmToggle = true;
    let gmToggleChecked = false;
    if (gmWhisperMode === 'always-public' || gmWhisperMode === 'always-private') {
        showGmToggle = false;
    }
    if (gmWhisperMode === 'private-default' || gmWhisperMode === 'always-private') {
        gmToggleChecked = true;
    }

    // Set dialogState and dialogData
    dialogState.sellMultiplier = defaultMultiplier;
    const dialogData = await getInventoryData(actor);
    dialogData.defaultSellMultiplier = defaultMultiplier;
    dialogData.hideMultiplierField = hideMultiplierField;
    dialogData.showGmToggle = showGmToggle;
    dialogData.gmToggleChecked = gmToggleChecked;
    dialogData.gmWhisperMode = gmWhisperMode;

    const content = await renderTemplate("modules/pf2e-sell-loot/templates/apps/sell.hbs", dialogData);

    const dialog = new foundry.applications.api.DialogV2({
        window: {
            title: `Sell Loot - ${actor.name}`,
            icon: "fas fa-coins"
        },
        classes: ["actor", "sheet", "character", "pf2e"],
        content: content,
        buttons: [
            {
                action: "sell",
                label: "Sell Items",
                icon: "fas fa-handshake",
                callback: async (event, button, dialog) => {
                    // Calculate total value first
                    const multiplier = dialogState.sellMultiplier ?? 0.5;
                    let totalValue = 0;
                    // Prepare sold items data for chat, but filter out 0gp items
                    const soldItemsRaw = dialogState.selectedItems.map(sel => {
                        const item = actor.items.get(sel.id);
                        const itemTotal = getItemTotalValue(item, sel.quantity, multiplier);
                        totalValue += itemTotal;
                        let priceStr = `${itemTotal.toFixed(2)} gp`;
                        return (item && itemTotal > 0) ? {
                            name: item.name,
                            quantity: sel.quantity,
                            price: priceStr,
                            img: item.img,
                            rarity: item.system.traits?.rarity?.value || item.system.traits?.rarity || "common",
                            type: item.type
                        } : null;
                    }).filter(Boolean);
                    if (totalValue <= 0 || soldItemsRaw.length === 0) {
                        dialog.close();
                        return;
                    }
                    // Use dialogState for coins and items
                    await addCoinsToActor(actor, dialogState.coinTotals);
                    await deleteSelectedItems(actor, dialogState.selectedItems);
                    const categoryDefs = [
                        { name: "Weapons & Shields", itemTypes: ["weapon", "shield"] },
                        { name: "Armor", itemTypes: ["armor"] },
                        { name: "Equipment", itemTypes: ["equipment"] },
                        { name: "Consumables", itemTypes: ["consumable"] },
                        { name: "Treasure", itemTypes: ["treasure"] },
                        { name: "Containers", itemTypes: ["backpack"] }
                    ];
                    const categories = categoryDefs.map(cat => ({
                        name: cat.name,
                        items: soldItemsRaw.filter(item => cat.itemTypes.includes(item.type))
                    })).filter(cat => cat.items.length > 0);
                    const chatHtml = await renderTemplate("modules/pf2e-sell-loot/templates/chat/message.hbs", {
                        categories,
                        totalValue: totalValue.toFixed(2),
                        coins: dialogState.coinTotals,
                        multiplier
                    });
                    // Determine whisper logic based on gmWhisperMode
                    let whisper = [];
                    if (gmWhisperMode === 'always-private') {
                        whisper = game.users?.filter(u => u.isGM).map(u => u.id) || [];
                    } else if (gmWhisperMode === 'always-public') {
                        whisper = [];
                    } else {
                        // public-default or private-default: check the toggle
                        const element = dialog.element;
                        if (element) {
                            const gmToggle = element.querySelector('#send-to-gm');
                            if (gmToggle && gmToggle.checked) {
                                whisper = game.users?.filter(u => u.isGM).map(u => u.id) || [];
                            }
                        }
                    }
                    ChatMessage.create({
                        user: game.user.id,
                        speaker: ChatMessage.getSpeaker({ actor }),
                        content: chatHtml,
                        whisper
                    });
                    ui.notifications.info("Items sold and coins added!");
                    dialog.close();
                    dialogState.coinTotals = { pp: 0, gp: 0, sp: 0, cp: 0 };
                    dialogState.selectedItems = [];
                }
            },
            {
                action: "cancel",
                label: "Cancel",
                icon: "fas fa-times",
                callback: (event, button, dialog) => {
                    dialog.close();
                }
            }
        ]
    });

    dialog.render(true);
    
    // Add event handlers after dialog is rendered
    dialog.addEventListener("render", () => {
        setupDialogEventHandlers(dialog, dialogData);
        setupCategoryRowStriping(dialog.element);
        // Calculate values with multiplier on initial render
        const element = dialog.element;
        if (element && typeof element.querySelector === 'function') {
            const updateTotalValue = element.ownerDocument?.defaultView?.setupDialogEventHandlers?.updateTotalValue;
            // Fallback: manually trigger the updateTotalValue function if available
            if (typeof updateTotalValue === 'function') {
                updateTotalValue();
            } else {
                // Fallback: manually trigger input event on multiplier to force update
                const multiplierInput = element.querySelector('#sell-multiplier');
                if (multiplierInput) {
                    multiplierInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }
    });
    
    return dialog;
}