const Room = require('./Room');

class RoomManager {
    constructor() {
        this.rooms = new Map(); // Map of roomId -> Room
        this.playerToRoom = new Map(); // Map of playerId -> roomId
    }

    // Create a new room
    createRoom() {
        const room = new Room();
        this.rooms.set(room.id, room);
        return room.id;
    }

    // Get room by ID
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    // Join a room
    joinRoom(roomId, playerId, ws, username) {
        const room = this.getRoom(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        // Add player to room
        const joinResult = room.addPlayer(playerId, ws, username);
        
        // Update player to room mapping
        this.playerToRoom.set(playerId, roomId);

        return joinResult;
    }

    // Leave a room
    leaveRoom(playerId) {
        const roomId = this.playerToRoom.get(playerId);
        if (!roomId) {
            return;
        }

        const room = this.getRoom(roomId);
        if (room) {
            room.removePlayer(playerId);
            
            // If room is empty, delete it
            if (room.players.size === 0) {
                this.rooms.delete(roomId);
            }
        }

        this.playerToRoom.delete(playerId);
    }

    // Get room information
    getRoomInfo(roomId) {
        const room = this.getRoom(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        return room.getRoomInfo();
    }

    // Get room ID for a player
    getPlayerRoom(playerId) {
        return this.playerToRoom.get(playerId);
    }

    // Clean up inactive rooms (optional)
    cleanupInactiveRooms() {
        const now = Date.now();
        const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

        for (const [roomId, room] of this.rooms.entries()) {
            if (now - room.createdAt > inactiveThreshold && room.players.size === 0) {
                this.rooms.delete(roomId);
            }
        }
    }
}

module.exports = RoomManager; 