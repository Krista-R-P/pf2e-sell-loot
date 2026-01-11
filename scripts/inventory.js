import { parsePriceToCopper, convertBulkDisplay } from './utils.js';

export async function getInventoryData(actor) {
    const categories = [
        {
            name: "Weapons & Shields",
            type: "weapons",
            itemTypes: ["weapon", "shield"],
            hasPrice: true,
            items: []
        },
        {
            name: "Armor",
            type: "armor",
            itemTypes: ["armor"],
            hasPrice: true,
            items: []
        },
        {
            name: "Equipment",
            type: "equipment",
            itemTypes: ["equipment"],
            hasPrice: true,
            items: []
        },
        {
            name: "Consumables",
            type: "consumable",
            itemTypes: ["consumable"],
            hasPrice: true,
            items: []
        },
        {
            name: "Treasure",
            type: "treasure",
            itemTypes: ["treasure"],
            hasPrice: true,
            items: []
        },
        {
            name: "Containers",
            type: "backpack",
            itemTypes: ["backpack"],
            hasPrice: true,
            items: []
        }
    ];

    let totalValue = 0;

    // Get all items from the actor
    const items = actor.items;

    console.log(`Processing ${items.size} items for ${actor.name}`);

    // Categorize items
    for (const item of items) {
        // Skip items that are not physical/equipment types
        if (!["weapon", "shield", "armor", "equipment", "consumable", "treasure", "backpack"].includes(item.type)) {
            continue;
        }

        // Exclude coins from Treasure category
        if (item.type === "treasure" && item.system.stackGroup === "coins") {
            continue;
        }

        // Helper to format coin object as a comma-separated string, maximizing gp conversion
        function formatCoins(coins) {
            if (!coins) return "0 gp";
            let pp = coins.pp || 0;
            let gp = coins.gp || 0;
            let sp = coins.sp || 0;
            let cp = coins.cp || 0;
            // Convert as much as possible to gp
            gp += Math.floor(sp / 10);
            sp = sp % 10;
            gp += Math.floor(cp / 100);
            cp = cp % 100;
            const parts = [];
            if (pp) parts.push(`${pp} pp`);
            if (gp) parts.push(`${gp} gp`);
            if (sp) parts.push(`${sp} sp`);
            if (cp) parts.push(`${cp} cp`);
            return parts.length ? parts.join(", ") : "0 gp";
        }

        const itemData = {
            id: item.id,
            uuid: item.uuid,
            name: item.name,
            img: item.img,
            quantity: item.system.quantity || 1,
            bulk: convertBulkDisplay(item.system.bulk?.value || item.system.bulk || "—", item.system.quantity || 1),
            rarity: item.system.traits?.rarity?.value || item.system.traits?.rarity || "common",
            selected: false,
            priceDisplay: item.system.price && item.system.price.value ? formatCoins(item.system.price.value) : "0 gp"
        };

        // Add price for all items (0 if no price set)
        if (item.system.price?.value) {
            const priceVal = item.system.price.value;
            const priceInCopper = parsePriceToCopper(priceVal);
            console.log(`[getInventoryData] Item: ${item.name}, price.value:`, priceVal, `parsed copper: ${priceInCopper}, quantity: ${itemData.quantity}`);
            itemData.totalPrice = (priceInCopper * itemData.quantity) / 100; // total price for all items in gp
            console.log(`[getInventoryData] Item: ${item.name}, totalPrice (gp): ${itemData.totalPrice}`);
            totalValue += itemData.totalPrice;
        } else {
            itemData.totalPrice = 0; // Default to 0 for items without a price
        }

        // Find the appropriate category
        let targetCategory = categories.find(cat => cat.itemTypes.includes(item.type));

        if (targetCategory) {
            targetCategory.items.push(itemData);
        }
    }

    // Filter out empty categories
    const filteredCategories = categories.filter(cat => cat.items.length > 0);

    return {
        categories: filteredCategories,
        totalValue: Math.round(totalValue * 100) / 100 // Round to 2 decimal places
    };
};