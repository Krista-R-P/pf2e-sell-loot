/**
 * Deletes or updates selected items from an actor's inventory.
 * @param {Actor} actor - The actor whose items will be modified.
 * @param {Array<{id: string, quantity: number}>} selectedItems - Items to delete or update.
 * @returns {Promise<void>}
 */
export async function deleteSelectedItems(actor, selectedItems) {
    if (!selectedItems.length) return;
    const updates = [];
    const deletes = [];
    for (const { id, quantity } of selectedItems) {
        const item = actor.items.get(id);
        if (!item) continue;
        const currentQty = item.system.quantity || 1;
        if (quantity >= currentQty) {
            deletes.push(id); // Remove item if selling all
        } else {
            updates.push({ _id: id, "system.quantity": currentQty - quantity }); // Decrement quantity
        }
    }
    if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
    if (deletes.length) await actor.deleteEmbeddedDocuments("Item", deletes);
}