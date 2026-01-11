/**
 * Stores the current state of the sell loot dialog.
 * @typedef {Object} DialogState
 * @property {{gp: number, sp: number, cp: number}} coinTotals - The current coin totals.
 * @property {Array} selectedItems - The currently selected items for sale.
 * @property {number} sellMultiplier - The multiplier applied to item values.
 */

/** @type {DialogState} */
export const dialogState = {
    coinTotals: { gp: 0, sp: 0, cp: 0 },
    selectedItems: [],
    sellMultiplier: 0.5 // Will be set from settings at dialog open
};