import { EntityHurtEvent, Player, PlayerJoinEvent, PlayerLeaveEvent } from "@minecraft/server";
import { DBRequests } from "./requests";

/**
 * Announces when a player kills another player.
 * @param {EntityHurtEvent} event Entity hurt event to look for pvp kills in.
 */
export function announceDeaths(event) {
    if (event.hurtEntity instanceof Player === false || event.hurtEntity.getComponent("health").current > 0) return;
    let damagerName = event.damagingEntity instanceof Player ? event.damagingEntity.name : event.damagingEntity?.nameTag === '' || event.damagingEntity?.nameTag === undefined ? getEntityName(event.damagingEntity?.typeId) : event.damagingEntity?.nameTag;
    let message = ``;
    switch (event.cause) {
        case undefined:
            message = `${event.hurtEntity.name} was obliterated by a sonically-charged shriek whilst trying to escape Warden`
            break;
        case "freezing":
            message = `${event.hurtEntity.name} froze to death`
            break;
        case "void":
            message = `${event.hurtEntity.name} fell out of the world`
            break;
        case "fire":
            message = `${event.hurtEntity.name} went up in flames`
            break;
        case "fall":
            message = `${event.hurtEntity.name} fell from a high place`
            break;
        case "flyIntoWall":
            message = `${event.hurtEntity.name} experienced kinetic energy`
            break;
        case "lightning":
            message = `${event.hurtEntity.name} was struck by lightning`
            break;
        case "fireworks":
            message = `${event.hurtEntity.name} went off with a bang`
            break;
        case "blockExplosion":
            message = `${event.hurtEntity.name} blew up`
            break;
        case "fireTick":
            message = `${event.hurtEntity.name} burned to death`
            break;
        case "magic":
            message = `${event.hurtEntity.name} was killed by ${damagerName !== '' ? `${damagerName} using ` : ``}magic`
            break;
        case "starve":
            message = `${event.hurtEntity.name} starved to death`
            break;
        case "lava":
            message = `${event.hurtEntity.name} tried to swim in lava`
            break;
        case "magma":
            message = `${event.hurtEntity.name} discovered floor was lava`
            break;
        case "drowning":
            message = `${event.hurtEntity.name} drowned`
            break;
        case "suffocation":
            message = `${event.hurtEntity.name} suffocated in a wall`;
            break;
        case "stalactite":
            message = `${event.hurtEntity.name} was skewered by a falling stalactite`
            break;
        case "stalagmite":
            message = `${event.hurtEntity.name} was impaled on a stalagmite`
            break;
        case "anvil":
            message = `${event.hurtEntity.name} was squashed by a falling anvil`
            break;
        case "wither":
            message = `${event.hurtEntity.name} withered away`
            break;
        case "entityExplosion":
            message = `${event.hurtEntity.name} was blown up by ${damagerName}`;
            break;
        case "entityAttack":
            message = `${event.hurtEntity.name} was slain by ${damagerName}`;
            if (event.damagingEntity instanceof Player) {
                const itemNameTag = event.damagingEntity.getComponent("inventory").container.getItem(event.damagingEntity.selectedSlot)?.nameTag;
                if (itemNameTag !== undefined) message += ` using ${itemNameTag}`;
            }
            break;
        case "projectile":
            if (damagerName === "Blaze" && event.damagingEntity instanceof Player === false) message = `${event.hurtEntity.name} was fireballed by Blaze`;
            else if (damagerName === "Ghast" && event.damagingEntity instanceof Player === false) message = `${event.hurtEntity.name} was slain by Ghast`;
            else if (damagerName === "Llama" && event.damagingEntity instanceof Player === false) message = `${event.hurtEntity.name} was spitballed by Llama`;
            else if (damagerName === "Shulker" && event.damagingEntity instanceof Player === false) message = `${event.hurtEntity.name} was sniped by Shulker`;
            else message = `${event.hurtEntity.name} was shot by ${damagerName}`;
            if (event.damagingEntity instanceof Player) {
                const itemNameTag = event.damagingEntity.getComponent("inventory").container.getItem(event.damagingEntity.selectedSlot)?.nameTag;
                if (itemNameTag !== undefined) message += ` using ${itemNameTag}`;
            }
            break;
        default:
            message = `${event.hurtEntity.name} died`
    }
    DBRequests.Announce(message);
}

/**
 * Converts a given entity ID into a properly formatted name.
 * @param {string} entityId The entity ID.
 * @returns The properly formatted name.
 */
function getEntityName(entityId) {
    switch (entityId) {
        case undefined: return '';
        case 'minecraft:zombie_pigman': return 'Zombified Piglin';
        case 'minecraft:tnt': return 'TNT';
        case 'minecraft:wither_skull': return 'Wither';
        case 'minecraft:evocation_illager': return 'Evoker';
        case 'minecraft:zombie_villager_v2': return 'Zombie Villager';
        default:
            let nameArray = entityId.slice(entityId.indexOf(':') + 1).split('_');
            nameArray.forEach((word, i) => {
                nameArray[i] = word.charAt(0).toUpperCase().concat(word.slice(1));
            })
            return nameArray.join(' ');
    }

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