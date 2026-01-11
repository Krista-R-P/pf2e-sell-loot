/**
 * Adds coins to the specified actor's inventory.
 * @param {Actor} actor - The actor to receive coins.
 * @param {Object} coins - The coins to add (e.g., { gp: 10, sp: 5, cp: 0 }).
 * @returns {Promise<void>}
 */
export async function addCoinsToActor(actor, coins) {
    await actor.inventory.addCoins(coins);
}