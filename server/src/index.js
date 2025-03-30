const express = require("express");
const { WebSocketServer } = require("ws");
const http = require("http");
const { v4: uuidv4 } = require("uuid");
const RoomManager = require("./game/RoomManager");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Initialize room manager
const roomManager = new RoomManager();

// Store active connections
const clients = new Map();

// WebSocket connection handling
wss.on("connection", (ws) => {
    const clientId = uuidv4();
    clients.set(clientId, ws);

    // Set up ping interval for this client
    const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.ping();
        }
    }, 30000); // Send ping every 30 seconds

    // Handle incoming messages
    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`Received message from ${clientId}:`, data);

            // Handle different message types
            switch (data.type) {
                case "createRoom":
                    handleCreateRoom(clientId, ws);
                    break;
                case "joinRoom":
                    handleJoinRoom(clientId, ws, data.roomId, data.username);
                    break;
                case "leaveRoom":
                    handleLeaveRoom(clientId);
                    break;
                case "submitGuess":
                    handleGameMessage(clientId, data);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error("Error processing message:", error);
            ws.send(JSON.stringify({
                type: "error",
                message: error.message || "Invalid message format"
            }));
        }
    });

    // Handle client disconnect
    ws.on("close", () => {
        console.log(`Client ${clientId} disconnected`);
        clearInterval(pingInterval);
        handleLeaveRoom(clientId);
        clients.delete(clientId);
    });

    // Handle ping/pong
    ws.on("ping", () => {
        ws.pong();
    });

    // Send welcome message to new client
    ws.send(JSON.stringify({
        type: "connectionEstablished",
        clientId: clientId
    }));
});

// Message handlers
function handleCreateRoom(clientId, ws) {
    try {
        const roomId = roomManager.createRoom();
        ws.send(JSON.stringify({
            type: "roomCreated",
            roomId: roomId
        }));
    } catch (error) {
        ws.send(JSON.stringify({
            type: "error",
            message: error.message
        }));
    }
}

function handleJoinRoom(clientId, ws, roomId, username) {
    try {
        const joinResult = roomManager.joinRoom(roomId, clientId, ws, username);
        const room = roomManager.getRoom(roomId);
        
        // Notify the joining player
        ws.send(JSON.stringify({
            type: "roomJoined",
            ...joinResult
        }));

        // Notify other players in the room
        room.broadcast({
            type: "playerJoined",
            username: username
        }, clientId);
    } catch (error) {
        ws.send(JSON.stringify({
            type: "error",
            message: error.message
        }));
    }
}

function handleLeaveRoom(clientId) {
    try {
        roomManager.leaveRoom(clientId);
    } catch (error) {
        console.error("Error leaving room:", error);
    }
}

function handleGameMessage(clientId, data) {
    const roomId = roomManager.getPlayerRoom(clientId);
    if (!roomId) {
        return;
    }

    const room = roomManager.getRoom(roomId);
    if (room) {
        room.handleGameMessage(clientId, data);
    }
}

// Basic Express route
app.get("/", (req, res) => {
    res.send("Guess the Link Game Server");
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`WebSocket server is ready to accept connections`);
});
