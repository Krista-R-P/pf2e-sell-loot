import { renderSellDialog } from './dialog-rendering.js';

/**
 * Creates and adds the Sell Loot button to actor sheets.
 * @param {Application} app - The actor sheet application instance.
 * @param {jQuery} html - The jQuery HTML of the sheet.
 * @returns {Promise<void>}
 */
export async function createSellButton(app, html) {
    const wealthDiv = html.find('.wealth');
    if (wealthDiv.length) {
        const buttonHtml = await renderTemplate("modules/pf2e-sell-loot/templates/apps/button.hbs", {});
        const sellButton = $(buttonHtml);
        sellButton.on('click', (event) => {
            event.preventDefault();
            renderSellDialog(app.actor);
        });
        wealthDiv.append(sellButton);
    }
}