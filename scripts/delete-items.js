// Accepts selectedItems: array of { id, quantity }
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