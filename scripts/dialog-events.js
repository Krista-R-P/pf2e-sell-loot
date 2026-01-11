import { dialogState } from './dialog-state.js';
// Setup event handlers for the dialog
export function setupDialogEventHandlers(dialog, dialogData) {
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
        console.log(`[updateCoinDisplay] Setting coins: gp=${gp}, sp=${sp}, cp=${cp}`);
        // Only update the currency values in the footer
        const footer = element.querySelector('.sell-footer');
        if (footer) {
            const gpSpan = footer.querySelector('.denomination.gp span');
            const spSpan = footer.querySelector('.denomination.sp span');
            const cpSpan = footer.querySelector('.denomination.cp span');
            if (gpSpan && spSpan && cpSpan) {
                gpSpan.textContent = dialogState.coinTotals.gp;
                spSpan.textContent = dialogState.coinTotals.sp;
                cpSpan.textContent = dialogState.coinTotals.cp;
            } else {
                console.warn('Currency span(s) missing in sell-footer.');
            }
        } else {
            console.warn('sell-footer not found in dialog.');
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
        function enforceMinMax() {
            const min = 0;
            const max = parseInt(input.dataset.maxQuantity) || 0;
            let value = parseInt(input.value) || 0;
            if (value < min) {
                value = min;
            } else if (value > max) {
                value = max;
            }
            if (input.value != value) {
                input.value = value;
            }
            updateTotalValue();
        }
        input.addEventListener('input', enforceMinMax);
        input.addEventListener('change', enforceMinMax);
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
                    input.value = 0;
                    break;
                case 'max':
                    input.value = maxValue;
                    break;
                case 'dec':
                    input.value = Math.max(0, currentValue - 1);
                    break;
                case 'inc':
                    input.value = Math.min(maxValue, currentValue + 1);
                    break;
            }
            
            // Trigger change event to update total
            input.dispatchEvent(new Event('change'));
        });
    });
    
    // Select all category button (max for visible rows in category)
    element.querySelectorAll('.select-all-category').forEach(button => {
        button.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            // Only affect visible rows in this category
            const inputs = Array.from(element.querySelectorAll(`tr[data-category="${category}"]`))
                .filter(row => row.style.display !== 'none')
                .map(row => row.querySelector('.sell-quantity'));
            inputs.forEach(input => {
                if (input) input.value = input.dataset.maxQuantity;
            });
            updateTotalValue();
        });
    });

    // Select all items button (max for all visible rows)
    const selectAllBtn = element.querySelector('#select-all-items');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            Array.from(element.querySelectorAll('tbody tr'))
                .filter(row => row.style.display !== 'none')
                .forEach(row => {
                    const input = row.querySelector('.sell-quantity');
                    if (input) input.value = input.dataset.maxQuantity;
                });
            updateTotalValue();
        });
    }

    // Clear all items button (min for all visible rows)
    const clearAllBtn = element.querySelector('#clear-all-items');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            Array.from(element.querySelectorAll('tbody tr'))
                .filter(row => row.style.display !== 'none')
                .forEach(row => {
                    const input = row.querySelector('.sell-quantity');
                    if (input) input.value = 0;
                });
            updateTotalValue();
        });
    }

    // Min/Max buttons for each category (use controls-cell .quantity-controls in thead, only visible rows)
    element.querySelectorAll('thead .controls-cell.quantity-controls button').forEach(button => {
        button.addEventListener('click', (e) => {
            const category = button.dataset.category;
            const isMin = button.querySelector('.fa-angles-left') !== null;
            Array.from(element.querySelectorAll(`tr[data-category="${category}"]`))
                .filter(row => row.style.display !== 'none')
                .forEach(row => {
                    const input = row.querySelector('.sell-quantity');
                    if (input) input.value = isMin ? 0 : input.dataset.maxQuantity;
                });
            updateTotalValue();
        });
    });

    // Min/Max buttons for all items in the form (footer, only visible rows)
    element.querySelectorAll('button[data-action="min-all-items"]').forEach(button => {
        button.addEventListener('click', () => {
            Array.from(element.querySelectorAll('tbody tr'))
                .filter(row => row.style.display !== 'none')
                .forEach(row => {
                    const input = row.querySelector('.sell-quantity');
                    if (input) input.value = 0;
                });
            updateTotalValue();
        });
    });
    element.querySelectorAll('button[data-action="max-all-items"]').forEach(button => {
        button.addEventListener('click', () => {
            Array.from(element.querySelectorAll('tbody tr'))
                .filter(row => row.style.display !== 'none')
                .forEach(row => {
                    const input = row.querySelector('.sell-quantity');
                    if (input) input.value = input.dataset.maxQuantity;
                });
            updateTotalValue();
        });
    });

    // Update total value and coin display when quantities or multiplier change
    function updateTotalValue() {
        let total = 0;
        dialogState.selectedItems = []; // Reset selection
        // Read multiplier from input
        const multiplierInput = element.querySelector('#sell-multiplier');
        let multiplier = parseFloat(multiplierInput?.value);
        if (isNaN(multiplier) || multiplier < 0) multiplier = 0;
        if (multiplier > 1) multiplier = 1;
        dialogState.sellMultiplier = multiplier;
        // Update each row's price display
        element.querySelectorAll('tr[data-item-id] .price-cell').forEach(cell => {
            const row = cell.closest('tr[data-item-id]');
            const itemId = row?.dataset.itemId;
            if (!itemId) return;
            for (const category of dialogData.categories) {
                const item = category.items.find(i => i.id === itemId);
                if (item && item.totalPrice) {
                    // Show price per item with multiplier applied
                    const pricePer = (item.totalPrice / item.quantity) * multiplier;
                    cell.textContent = pricePer.toFixed(2) + ' gp';
                }
            }
        });
        // Calculate total value
        element.querySelectorAll('.sell-quantity').forEach(input => {
            const quantity = parseInt(input.value) || 0;
            const itemId = input.dataset.itemId;
            for (const category of dialogData.categories) {
                const item = category.items.find(i => i.id === itemId);
                if (item && item.totalPrice) {
                    total += ((item.totalPrice / item.quantity) * quantity) * multiplier;
                    if (quantity > 0) {
                        dialogState.selectedItems.push({ id: itemId, quantity });
                    }
                }
            }
        });
        // Save total value to dialogState (optional, if you want to track)
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

// Setup alternating row colors within each category
export function setupCategoryRowStriping(dialog) {
    const element = dialog.element;
    
    // Get all categories
    const categories = [...new Set(Array.from(element.querySelectorAll('tr[data-category]')).map(tr => tr.dataset.category))];
    
    // Apply striping within each category
    categories.forEach(category => {
        const categoryRows = element.querySelectorAll(`tr[data-category="${category}"]`);
        categoryRows.forEach((row, index) => {
            // Remove any existing striping class first
            row.classList.remove('item-row-even');
            
            // Add striping to odd index rows (which are the 2nd, 4th, 6th... rows)
            if (index % 2 === 1) {
                row.classList.add('item-row-even');
            }
        });
    });
}
