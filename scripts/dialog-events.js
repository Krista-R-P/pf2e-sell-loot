import { dialogState } from './dialog-state.js';
import { getItemTotalValue, getVisibleSellQuantityInputs, attachListeners, updateCurrencySpans, warnIfMissing, parseMultiplier } from './utils.js';
// Setup event handlers for the dialog
export function setupDialogEventHandlers(dialog, dialogData) {
	/**
	 * Updates the price display for all visible item rows.
	 * @param {Element} element
	 * @param {Array} categories
	 * @param {number} multiplier
	 */
	function updatePriceCells(element, categories, multiplier) {
		element.querySelectorAll('tr[data-item-id] .price-cell').forEach(cell => {
			const row = cell.closest('tr[data-item-id]');
			const itemId = row?.dataset.itemId;
			if (!itemId) return;
			for (const category of categories) {
				const item = category.items.find(i => i.id === itemId);
				if (item) {
					const pricePer = getItemTotalValue(item, 1, multiplier);
					cell.textContent = pricePer.toFixed(2) + ' gp';
				}
			}
		});
	}

	/**
	 * Collects selected items and calculates the total value.
	 * @param {Element} element
	 * @param {Array} categories
	 * @param {number} multiplier
	 * @returns {{selectedItems: Array, total: number}}
	 */
	function collectSelectedItemsAndTotal(element, categories, multiplier) {
		let total = 0;
		const selectedItems = [];
		element.querySelectorAll('.sell-quantity').forEach(input => {
			const quantity = parseInt(input.value) || 0;
			const itemId = input.dataset.itemId;
			for (const category of categories) {
				const item = category.items.find(i => i.id === itemId);
				if (item) {
					total += getItemTotalValue(item, quantity, multiplier);
					if (quantity > 0) {
						selectedItems.push({ id: itemId, quantity });
					}
				}
			}
		});
		return { selectedItems, total };
	}
	/**
	 * Sets the value of an input and triggers updateTotalValue.
	 * @param {HTMLInputElement} input
	 * @param {number} value
	 */
	function setInputValue(input, value) {
		input.value = value;
		updateTotalValue();
	}

	/**
	 * Enforces min/max constraints on a quantity input and triggers updateTotalValue.
	 * @param {HTMLInputElement} input
	 */
	function enforceMinMax(input) {
		const min = 0;
		const max = parseInt(input.dataset.maxQuantity) || 0;
		let value = parseInt(input.value) || 0;
		if (value < min) value = min;
		else if (value > max) value = max;
		if (input.value != value) input.value = value;
		updateTotalValue();
	}

	// Update coin display to reflect total value
    function updateCoinDisplay(totalValue) {
        // Convert totalValue (gp) to gp, sp, cp only
        let remaining = Math.round(totalValue * 100); // total in copper
        const gp = Math.floor(remaining / 100); remaining -= gp * 100;
        const sp = Math.floor(remaining / 10); remaining -= sp * 10;
        const cp = remaining;
        dialogState.coinTotals.gp = gp;
        dialogState.coinTotals.sp = sp;
        dialogState.coinTotals.cp = cp;
        const footer = element.querySelector('.sell-footer');
        warnIfMissing(footer, 'sell-footer not found in dialog.');
        updateCurrencySpans(footer, dialogState.coinTotals);
        if (footer) {
            const gpSpan = footer.querySelector('.denomination.gp span');
            const spSpan = footer.querySelector('.denomination.sp span');
            const cpSpan = footer.querySelector('.denomination.cp span');
            if (!(gpSpan && spSpan && cpSpan)) {
                console.warn('Currency span(s) missing in sell-footer.');
            }
        }
    }
    const element = dialog.element;
    // Filtering logic for item names (search input)
    const searchInput = element.querySelector('.search-header input[type="search"]');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const filter = searchInput.value.trim().toLowerCase();
            element.querySelectorAll('tbody tr').forEach(row => {
                const nameCell = row.querySelector('.item-name-cell .item-name-wrapper span');
                if (!nameCell) return;
                const itemName = nameCell.textContent.trim().toLowerCase();
                row.style.display = filter === '' || itemName.includes(filter) ? '' : 'none';
            });
        });
    }
    
    // Add event listeners to quantity inputs
    element.querySelectorAll('.sell-quantity').forEach(input => {
        input.addEventListener('input', () => enforceMinMax(input));
        input.addEventListener('change', () => enforceMinMax(input));
    });
    
    // Quantity control buttons
    element.querySelectorAll('.quantity-controls button').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.target.dataset.itemId;
            const action = e.target.dataset.action;
            const input = element.querySelector(`input[data-item-id="${itemId}"]`);
            if (!input) return;
            const currentValue = parseInt(input.value) || 0;
            const maxValue = parseInt(input.dataset.maxQuantity) || 0;
            switch (action) {
                case 'min':
                    setInputValue(input, 0);
                    break;
                case 'max':
                    setInputValue(input, maxValue);
                    break;
                case 'dec':
                    setInputValue(input, Math.max(0, currentValue - 1));
                    break;
                case 'inc':
                    setInputValue(input, Math.min(maxValue, currentValue + 1));
                    break;
            }
        });
    });
    
    // Select all category button (max for visible rows in category)
    attachListeners('.select-all-category', (e) => {
        const category = e.target.dataset.category;
        getVisibleSellQuantityInputs(element, category).forEach(input => {
            input.value = input.dataset.maxQuantity;
        });
        updateTotalValue();
    }, element);

    // Select all items button (max for all visible rows)
    attachListeners('#select-all-items', () => {
        getVisibleSellQuantityInputs(element).forEach(input => {
            input.value = input.dataset.maxQuantity;
        });
        updateTotalValue();
    }, element);

    // Clear all items button (min for all visible rows)
    attachListeners('#clear-all-items', () => {
        getVisibleSellQuantityInputs(element).forEach(input => {
            input.value = 0;
        });
        updateTotalValue();
    }, element);

    // Min/Max buttons for each category (use controls-cell .quantity-controls in thead, only visible rows)
    attachListeners('thead .controls-cell.quantity-controls button', (e) => {
        const button = e.currentTarget;
        const category = button.dataset.category;
        const isMin = button.querySelector('.fa-angles-left') !== null;
        getVisibleSellQuantityInputs(element, category).forEach(input => {
            input.value = isMin ? 0 : input.dataset.maxQuantity;
        });
        updateTotalValue();
    }, element);

    // Min/Max buttons for all items in the form (footer, only visible rows)
    attachListeners('button[data-action="min-all-items"]', () => {
        getVisibleSellQuantityInputs(element).forEach(input => {
            input.value = 0;
        });
        updateTotalValue();
    }, element);
    attachListeners('button[data-action="max-all-items"]', () => {
        getVisibleSellQuantityInputs(element).forEach(input => {
            input.value = input.dataset.maxQuantity;
        });
        updateTotalValue();
    }, element);

    // Update total value and coin display when quantities or multiplier change
    function updateTotalValue() {
        const multiplierInput = element.querySelector('#sell-multiplier');
        const multiplier = parseMultiplier(multiplierInput);
        dialogState.sellMultiplier = multiplier;
        updatePriceCells(element, dialogData.categories, multiplier);
        const { selectedItems, total } = collectSelectedItemsAndTotal(element, dialogData.categories, multiplier);
        dialogState.selectedItems = selectedItems;
        dialogState.totalValue = total;
        updateCoinDisplay(total);
    }
    // Listen for multiplier changes
    const multiplierInput = element.querySelector('#sell-multiplier');
    if (multiplierInput) {
        multiplierInput.addEventListener('input', updateTotalValue);
        multiplierInput.addEventListener('change', updateTotalValue);
    }
}
