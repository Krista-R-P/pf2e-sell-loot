export function parsePriceToCopper(priceVal) {
    if (!priceVal) return 0;
    if (typeof priceVal === 'object') {
        let total = 0;
        // Always convert pp to gp for all calculations
        if (priceVal.pp) total += priceVal.pp * 1000;
        if (priceVal.gp) total += priceVal.gp * 100;
        if (priceVal.sp) total += priceVal.sp * 10;
        if (priceVal.cp) total += priceVal.cp;
        return total;
    }
}

export function convertBulkDisplay(bulk, quantity = 1) {
    if (!bulk || bulk === "—" || bulk === "-") {
        return "—";
    }

    // Handle object bulk values (PF2e sometimes uses objects)
    if (typeof bulk === 'object' && bulk !== null) {
        // Try to get the value property or convert to string
        const bulkValue = bulk.value !== undefined ? bulk.value : bulk.toString();
        return convertBulkDisplay(bulkValue, quantity); // Recursive call with the extracted value
    }

    // Convert negligible bulk to 0
    if (bulk === "negligible" || bulk === "neg" || bulk === "N" || bulk === 0) {
        return "0";
    }

    // Handle light bulk items (L or 0.1)
    if (bulk === "L" || bulk === "light" || bulk === 0.1 || bulk === "0.1") {
        const totalLightBulk = quantity;
        const wholeBulk = Math.floor(totalLightBulk / 10);
        const remainingLight = totalLightBulk % 10;
        
        if (wholeBulk > 0 && remainingLight > 0) {
            // e.g., 11x light = "1,1L", 12x light = "1,2L"
            return `${wholeBulk},${remainingLight}L`;
        } else if (wholeBulk > 0) {
            // e.g., 10x light = "1"
            return wholeBulk.toString();
        } else {
            // e.g., 1x light = "L", 9x light = "9L"
            if (remainingLight === 1) {
                return "L";
            } else {
                return `${remainingLight}L`;
            }
        }
    }

    // For regular bulk items, multiply by quantity
    const bulkValue = parseFloat(bulk);
    if (!isNaN(bulkValue)) {
        const totalBulk = bulkValue * quantity;
        return totalBulk.toString();
    }

    // Return the bulk value as-is for everything else
    return bulk.toString();
}

export function coinsToCopper(coins) {
    // Always convert pp to gp for all calculations
    const gp = (coins.gp || 0) + ((coins.pp || 0) * 10);
    return gp * 100 + (coins.sp || 0) * 10 + (coins.cp || 0);
}

export function copperToCoins(copper) {
    let remaining = copper;
    // Always convert all platinum to gold, never return pp
    const gp = Math.floor(remaining / 100); remaining -= gp * 100;
    const sp = Math.floor(remaining / 10); remaining -= sp * 10;
    const cp = remaining;
    return { gp, sp, cp };
}

export function splitCoinsEvenly(coins, numRecipients) {
    const totalCopper = coinsToCopper(coins);
    if (numRecipients === 0) return { shares: [], remainder: copperToCoins(totalCopper) };
    const shareCopper = Math.floor(totalCopper / numRecipients);
    const remainderCopper = totalCopper % numRecipients;
    // Use Array.from to avoid Array.fill() bug (all objects same reference)
    const shares = Array.from({ length: numRecipients }, () => copperToCoins(shareCopper));
    const remainder = copperToCoins(remainderCopper);
    return { shares, remainder };
}