import { convertBulkDisplay, parsePriceToCopper, formatCoins } from './utils.js';
/**
 * Gathers and categorizes inventory data for the given actor.
 * @param {Actor} actor - The actor whose inventory will be processed.
 * @returns {Promise<{categories: Array, totalValue: number}>}
 */
export async function getInventoryData(actor) {
    const categories = [
        { name: "Weapons & Shields", type: "weapons", itemTypes: ["weapon", "shield"], hasPrice: true, items: [] },
        { name: "Armor", type: "armor", itemTypes: ["armor"], hasPrice: true, items: [] },
        { name: "Equipment", type: "equipment", itemTypes: ["equipment"], hasPrice: true, items: [] },
        { name: "Consumables", type: "consumable", itemTypes: ["consumable"], hasPrice: true, items: [] },
        { name: "Treasure", type: "treasure", itemTypes: ["treasure"], hasPrice: true, items: [] },
        { name: "Containers", type: "backpack", itemTypes: ["backpack"], hasPrice: true, items: [] }
    ];

    let totalValue = 0;
    const items = actor.items;

    // Categorize items
    for (const item of items) {
        if (!["weapon", "shield", "armor", "equipment", "consumable", "treasure", "backpack"].includes(item.type)) continue;
        if (item.type === "treasure" && item.system.stackGroup === "coins") continue;


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

        if (item.system.price?.value) {
            const priceVal = item.system.price.value;
            const priceInCopper = parsePriceToCopper(priceVal);
            itemData.totalPrice = (priceInCopper * itemData.quantity) / 100; // total price for all items in gp
            totalValue += itemData.totalPrice;
        } else {
            itemData.totalPrice = 0;
        }

        let targetCategory = categories.find(cat => cat.itemTypes.includes(item.type));
        if (targetCategory) targetCategory.items.push(itemData);
    }

    const filteredCategories = categories.filter(cat => cat.items.length > 0);
    return {
        categories: filteredCategories,
        totalValue: Math.round(totalValue * 100) / 100
    };
}