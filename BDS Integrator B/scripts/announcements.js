import { EntityHurtEvent, Player, world } from "@minecraft/server";
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