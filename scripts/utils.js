/**
* Applies alternating row striping within each category in a table.
* @param {Element} element - The dialog/table element.
 */
export function setupCategoryRowStriping(element) {
    // Get all categories
    const categories = [...new Set(Array.from(element.querySelectorAll('tr[data-category]')).map(tr => tr.dataset.category))];
    // Apply striping within each category
    categories.forEach(category => {
        const categoryRows = element.querySelectorAll(`tr[data-category="${category}"]`);
        categoryRows.forEach((row, index) => {
            row.classList.remove('item-row-even');
            if (index % 2 === 1) {
                row.classList.add('item-row-even');
            }
        });
    });
}



/**
* Parses and clamps the multiplier value from an input element.
* @param {HTMLInputElement} input - The multiplier input element.
* @returns {number} The clamped multiplier (0 to 1).
*/
export function parseMultiplier(input) {
    let multiplier = parseFloat(input?.value);
    if (isNaN(multiplier) || multiplier < 0) multiplier = 0;
    if (multiplier > 1) multiplier = 1;
    return multiplier;
}



/**
* Updates the currency spans in the given footer element.
* @param {Element} footer - The footer DOM element.
* @param {Object} coins - The coins object (e.g., { gp, sp, cp }).
*/
export function updateCurrencySpans(footer, coins) {
    if (!footer) return;
    const gpSpan = footer.querySelector('.denomination.gp span');
    const spSpan = footer.querySelector('.denomination.sp span');
    const cpSpan = footer.querySelector('.denomination.cp span');
    if (gpSpan && spSpan && cpSpan) {
        gpSpan.textContent = coins.gp;
        spSpan.textContent = coins.sp;
        cpSpan.textContent = coins.cp;
    }
}



/**
* Logs a warning if the given element is missing.
* @param {any} element - The element to check.
* @param {string} message - The warning message.
*/
export function warnIfMissing(element, message) {
    if (!element) {
        console.warn(message);
    }
}



/**
* Returns all visible .sell-quantity inputs, optionally filtered by category.
* @param {Element} element - The dialog element.
* @param {string} [category] - Optional category to filter rows.
* @returns {HTMLInputElement[]}
*/
export function getVisibleSellQuantityInputs(element, category) {
    let selector = 'tbody tr';
    if (category) selector += `[data-category="${category}"]`;
    return Array.from(element.querySelectorAll(selector))
        .filter(row => row.style.display !== 'none')
        .map(row => row.querySelector('.sell-quantity'))
        .filter(Boolean);
}



/**
* Attaches an event handler to all elements matching a selector within a parent.
* @param {string} selector - The CSS selector for elements.
* @param {Function} handler - The event handler function.
* @param {Element} [parent=document] - The parent element to query within.
*/
export function attachListeners(selector, handler, parent = document) {
    parent.querySelectorAll(selector).forEach(el => el.addEventListener('click', handler));
}



/**
* Formats a coin object as a string (e.g., "2 gp, 5 sp").
* @param {Object} coins - The coins object (e.g., { pp, gp, sp, cp }).
* @returns {string}
*/
export function formatCoins(coins) {
    if (!coins) return "0 gp";
    const pp = coins.pp || 0;
    const gp = coins.gp || 0;
    const sp = coins.sp || 0;
    const cp = coins.cp || 0;
    const parts = [];
    if (pp) parts.push(`${pp} pp`);
    if (gp) parts.push(`${gp} gp`);
    if (sp) parts.push(`${sp} sp`);
    if (cp) parts.push(`${cp} cp`);
    return parts.length ? parts.join(", ") : "0 gp";
}



/**
* Calculates the total value of an item with quantity and multiplier.
* @param {Object} item - The item object (must have system.price.value and system.quantity).
* @param {number} quantity - The quantity to sell.
* @param {number} multiplier - The sell multiplier.
* @returns {number} The total value in gp.
*/
export function getItemTotalValue(item, quantity, multiplier) {
    if (!item) return 0;
    // If itemData object with totalPrice, use it (already in gp for all owned)
    if (typeof item.totalPrice === 'number') {
        // If quantity is provided, scale proportionally (should be 1 for per-item, or n for total)
        // item.totalPrice is for all owned, so scale by (quantity / item.quantity)
        const baseQty = item.quantity || 1;
        return (item.totalPrice * (quantity / baseQty) * multiplier) || 0;
    }
    // Otherwise, assume Foundry item with system.price.value
    if (!item.system || !item.system.price || !item.system.price.value) return 0;
    const price = typeof item.system.price.value === 'object' ? item.system.price.value : { gp: 0 };
    const gp = price.gp || 0;
    const sp = price.sp || 0;
    const cp = price.cp || 0;
    return ((gp * 100 + sp * 10 + cp) * quantity * multiplier) / 100;
}



/**
* Converts a price object to copper value.
* @param {Object} priceVal - The price object (e.g., { gp: 1, sp: 5, cp: 0 }).
* @returns {number} The total value in copper.
*/
export function parsePriceToCopper(priceVal) {
    if (!priceVal) return 0;
    if (typeof priceVal === 'object') {
        let total = 0;
        if (priceVal.pp) total += priceVal.pp * 1000;
        if (priceVal.gp) total += priceVal.gp * 100;
        if (priceVal.sp) total += priceVal.sp * 10;
        if (priceVal.cp) total += priceVal.cp;
        return total;
    }
    return 0;
}



/**
* Converts and formats bulk for display, handling light and negligible bulk.
* @param {string|number|Object} bulk - The bulk value.
* @param {number} [quantity=1] - The quantity of items.
* @returns {string} The formatted bulk string.
*/
export function convertBulkDisplay(bulk, quantity = 1) {
    if (!bulk || bulk === "—" || bulk === "-") return "—";
    if (typeof bulk === 'object' && bulk !== null) {
        const bulkValue = bulk.value !== undefined ? bulk.value : bulk.toString();
        return convertBulkDisplay(bulkValue, quantity);
    }
    if (bulk === "negligible" || bulk === "neg" || bulk === "N" || bulk === 0) return "0";
    if (bulk === "L" || bulk === "light" || bulk === 0.1 || bulk === "0.1") {
        const totalLightBulk = quantity;
        const wholeBulk = Math.floor(totalLightBulk / 10);
        const remainingLight = totalLightBulk % 10;
        if (wholeBulk > 0 && remainingLight > 0) return `${wholeBulk},${remainingLight}L`;
        if (wholeBulk > 0) return wholeBulk.toString();
        return remainingLight === 1 ? "L" : `${remainingLight}L`;
    }
    const bulkValue = parseFloat(bulk);
    if (!isNaN(bulkValue)) return (bulkValue * quantity).toString();
    return bulk.toString();
}