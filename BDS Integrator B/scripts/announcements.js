import { EntityHurtEvent, Player, PlayerJoinEvent, PlayerLeaveEvent } from "@minecraft/server";
import { DBRequests } from "./requests";

/**
 * Announces when a player kills another player.
 * @param {EntityHurtEvent} event Entity hurt event to look for pvp kills in.
 */
export function announceKills(event) {
    if (event.damagingEntity instanceof Player === false || event.hurtEntity instanceof Player === false) return;
    if (event.hurtEntity.getComponent("health").current > 0) return;
    let message = `${event.hurtEntity.name} was ${event.projectile ? `shot` : `slain`} by ${event.damagingEntity.name}`;
    const itemNameTag = event.damagingEntity.getComponent("inventory").container.getItem(event.damagingEntity.selectedSlot)?.nameTag;
    if (itemNameTag !== undefined) message += ` using ${itemNameTag}`;
    DBRequests.Announce(message);
}

/**
 * Announces when a player joins the game.
 * @param {PlayerJoinEvent} event The player join event to announce.
 */
export function announceJoins(event) {
    DBRequests.Announce(`${event.player.name} joined the game`);
}

/**
 * Announces when a player leaves the game.
 * @param {PlayerLeaveEvent} event The player leave event to announce.
 */
 export function announceLeaves(event) {
    DBRequests.Announce(`${event.playerName} left the game`);
}