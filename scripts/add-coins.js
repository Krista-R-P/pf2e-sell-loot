export async function addCoinsToActor(actor, coins) {
    console.log(`[addCoinsToActor] Character: ${actor.name}`);
    await actor.inventory.addCoins(coins);
}