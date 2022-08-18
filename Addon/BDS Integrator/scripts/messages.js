import { variables } from "mojang-minecraft-server-admin"

export const messages = {
    invalidUUID: `UUID §a${variables.get("server-uuid")}§r is not a valid V4 UUID! Be sure to set your server's UUID in §7config/default/variables§r to a valid one!`,
    validUUID: `Valid server UUID. Connected to the BDS Integration database.`,
    status: `Connected to the BDS Integration database.\nChat: §a${variables.get("enable-chat")}§r\nVoice: §a${variables.get("enable-voice")}§r`,
    commands: `List of !bds commands:\n§7!bds link§r\n§8Generates a code to link your Minecraft account with discord.§r\n§7!bds unlink§r\n§8Unlinks your Minecraft account from discord.§r\n§7!bds status§r\n§8Displays the status of the server connection with BDS Integration.§r`
}