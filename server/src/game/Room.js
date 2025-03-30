const { v4: uuidv4 } = require('uuid');
const GameEngine = require('./GameEngine');

class Room {
    constructor() {
        this.id = uuidv4();
        this.players = new Map(); 
        this.gameState = {
            status: 'waiting',
            currentRound: 0,
            maxRounds: 5
        };
        this.createdAt = Date.now();
        this.gameEngine = null;
    }

    // Add a player to the room
    async addPlayer(playerId, ws, username) {
        if (this.players.size >= 2) {
            throw new Error('Room is full');
        }
        if (this.isUsernameTaken(username)) {
            throw new Error('Username is already taken');
        }

        this.players.set(playerId, {
            ws,
            username,
            score: 0
        });

        // If room is full, initialize game engine and start the game
        if (this.players.size === 2) {
            this.gameState.status = 'playing';
            this.gameEngine = new GameEngine(this);
            await this.gameEngine.initialize();
            this.gameEngine.startRound();
        }

        return {
            roomId: this.id,
            playerId,
            username,
            gameState: this.gameState
        };
    }

    // Remove a player from the room
    removePlayer(playerId) {
        this.players.delete(playerId);
        if (this.players.size === 0) {
            this.gameState.status = 'waiting';
            if (this.gameEngine) {
                this.gameEngine.endGame();
                this.gameEngine = null;
            }
        }
    }

    // Check if username is already taken
    isUsernameTaken(username) {
        return Array.from(this.players.values()).some(
            player => player.username === username
        );
    }

    // Get room information
    getRoomInfo() {
        return {
            id: this.id,
            playerCount: this.players.size,
            players: Array.from(this.players.entries()).map(([id, player]) => ({
                id,
                username: player.username,
                score: player.score
            })),
            gameState: this.gameState
        };
    }

    // Broadcast message to all players in the room
    broadcast(message, excludePlayerId = null) {
        this.players.forEach((player, id) => {
            if (id !== excludePlayerId && player.ws.readyState === player.ws.OPEN) {
                player.ws.send(JSON.stringify(message));
            }
        });
    }

    // Send message to specific player
    sendToPlayer(playerId, message) {
        const player = this.players.get(playerId);
        if (player && player.ws.readyState === player.ws.OPEN) {
            player.ws.send(JSON.stringify(message));
        }
    }

    // Handle game message
    handleGameMessage(playerId, message) {
        if (!this.gameEngine) {
            return;
        }

        switch (message.type) {
            case 'submitGuess':
                this.gameEngine.handleGuess(playerId, message.guess);
                break;
            default:
                console.log('Unknown game message type:', message.type);
        }
    }
}

module.exports = Room; 