import { variables } from "mojang-minecraft-server-admin";
import { http, HttpRequest, HttpRequestMethod } from "mojang-net";

export class DBRequests {
    /**
     * Makes a request to the database to merge a group with another.
     * @param {number} mergedGroupId The ID of the group to move players to.
     * @param {number} deletedGroupId The ID of the group to remove players from and delete.
     */
    static Merge(mergedGroupId, deletedGroupId) {
        const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "voice-group-merge")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            merged: mergedGroupId,
            deleted: deletedGroupId
        })
        request.method = HttpRequestMethod.POST;
        http.request(request);
    }
    /**
     * Makes a request to the database to create a new group with the given players.
     * @param {GroupId} groupId The ID of the group to create.
     * @param {string[]} members The Members to add to the group.
     */
    static Create(groupId, members) {
        const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "voice-group-create")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            group: groupId,
            members: members
        })
        request.method = HttpRequestMethod.POST;

        http.request(request);
    }
    /**
     * Makes a request to the database to add a player to a group.
     * @param {number} groupId The ID of the group to add the player to.
     * @param {string} playerName The player to add to the group.
     */
    static Add(groupId, playerName) {
        const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "voice-group-add")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            group: groupId,
            newMember: playerName
        })
        request.method = HttpRequestMethod.POST;

        http.request(request);
    }
    /**
     * Makes a request to the database to disband a group.
     * @param {number} groupId The ID of the group to delete.
     */
    static Disband(groupId) {
        const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "voice-group-disband")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            group: groupId
        })
        request.method = HttpRequestMethod.POST;

        http.request(request);
    }
    /**
     * Makes a request to the database to remove a player from a group.
     * @param {number} groupId The ID of the group to remove the player from.
     * @param {string} playerName The player to remove from the group.
     */
    static Remove(groupId, playerName) {
        const request = new HttpRequest(`https://bdsintegrator.ddns.net/api`);
        request.addHeader("Content-Type", "application/json")
        request.addHeader("mc-data-type", "voice-group-remove")
        request.addHeader("server-uuid", variables.get('server-uuid'))
        request.body = JSON.stringify({
            group: groupId,
            removedMember: playerName
        })
        request.method = HttpRequestMethod.POST;

        http.request(request);
    }
}