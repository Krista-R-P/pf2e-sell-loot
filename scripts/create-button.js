import { renderSellDialog } from './dialog-rendering.js';

// Create and add sell loot button to actor sheets
export async function createSellButton(app, html) {
    // Find the wealth div and add sell button
    const wealthDiv = html.find('.wealth');
    if (wealthDiv.length) {
        // Render the button template
        const buttonHtml = await renderTemplate("modules/pf2e-sell-loot/templates/apps/button.hbs", {});
        const sellButton = $(buttonHtml);
        
        // Add click handler
        sellButton.on('click', (event) => {
            event.preventDefault();
            console.log('%cSell Loot button clicked!', 'color: yellow; font-weight: bold;');
            renderSellDialog(app.actor);
        });
        
        wealthDiv.append(sellButton);
    }
}