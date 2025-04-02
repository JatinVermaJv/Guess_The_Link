const express = require("express");
const { WebSocketServer } = require("ws");
const http = require("http");
const https = require("https");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

let server;

// In production, Render provides SSL termination, so we use HTTP
if (process.env.NODE_ENV === 'production') {
  console.log('Using HTTP server (Render provides SSL termination)');
  server = http.createServer(app);
} else {
  // In development, try to use SSL if certificates are available
  if (process.env.USE_SSL === 'true' && process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
    try {
      const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
      const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
      const credentials = { key: privateKey, cert: certificate };
      server = https.createServer(credentials, app);
      console.log('Server configured with SSL');
    } catch (error) {
      console.warn('SSL certificates not found, falling back to HTTP:', error);
      server = http.createServer(app);
    }
  } else {
    console.log('Using HTTP server');
    server = http.createServer(app);
  }
}

// Configure WebSocket server with proper origin verification
const wss = new WebSocketServer({ 
  server,
  verifyClient: (info) => {
    const origin = info.origin;
    const allowedOrigin = process.env.CORS_ORIGIN;
    console.log(`WebSocket connection attempt from origin: ${origin}`);
    console.log(`Allowed origin from env: ${allowedOrigin}`);
    
    // In development or if CORS_ORIGIN is not set, accept all origins
    if (!allowedOrigin || process.env.NODE_ENV !== 'production') {
      console.log('Accepting connection (development mode or no CORS_ORIGIN set)');
      return true;
    }

    // In production, verify the origin
    if (origin === allowedOrigin) {
      console.log('Origin verified, accepting connection');
      return true;
    }

    console.warn(`Rejected WebSocket connection from origin: ${origin}`);
    return false;
  }
});

// Log when the WebSocket server is ready
wss.on('listening', () => {
  console.log('WebSocket server is ready');
});

// Store active connections and rooms
const connections = new Map();
const rooms = new Map();

// Mock rounds data with correct links
const mockRounds = [
  {
    images: [
      'https://picsum.photos/300/300?random=1',
      'https://picsum.photos/300/300?random=2',
      'https://picsum.photos/300/300?random=3'
    ],
    correctLink: 'nature',
    hint: 'Think about the outdoors'
  },
  {
    images: [
      'https://picsum.photos/300/300?random=4',
      'https://picsum.photos/300/300?random=5',
      'https://picsum.photos/300/300?random=6'
    ],
    correctLink: 'technology',
    hint: 'Digital world'
  },
  {
    images: [
      'https://picsum.photos/300/300?random=7',
      'https://picsum.photos/300/300?random=8',
      'https://picsum.photos/300/300?random=9'
    ],
    correctLink: 'food',
    hint: 'Something delicious'
  }
];

// Game configuration from environment variables
const GAME_CONFIG = {
  maxPlayersPerRoom: parseInt(process.env.MAX_PLAYERS_PER_ROOM) || 2,
  roundTimer: parseInt(process.env.ROUND_TIMER) || 20,
  maxGuessesPerRound: parseInt(process.env.MAX_GUESSES_PER_ROUND) || 5,
  guessCooldown: parseInt(process.env.GUESS_COOLDOWN) || 2000
};

// Room class to manage room state
class Room {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.players = new Map();
    this.currentRoundIndex = 0;
    this.roundTimer = null;
    this.state = {
      roomCode,
      round: 1,
      maxRounds: mockRounds.length,
      timeLeft: GAME_CONFIG.roundTimer,
      totalScore: 0,
      players: [],
      currentRound: {
        images: mockRounds[0].images,
        hint: mockRounds[0].hint
      }
    };
    // Add guess tracking
    this.guessHistory = new Map(); // playerId -> { lastGuess: string, lastGuessTime: number, guessCount: number }
    this.GUESS_COOLDOWN = GAME_CONFIG.guessCooldown;
    this.MAX_GUESSES_PER_ROUND = GAME_CONFIG.maxGuessesPerRound;
  }

  // Add input validation helper
  validateGuess(guess) {
    // Remove special characters and normalize
    const normalizedGuess = guess.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    
    // Check minimum length
    if (normalizedGuess.length < 2) {
      return {
        isValid: false,
        message: 'Guess must be at least 2 characters long'
      };
    }

    // Check maximum length
    if (normalizedGuess.length > 50) {
      return {
        isValid: false,
        message: 'Guess must be less than 50 characters'
      };
    }

    return {
      isValid: true,
      normalizedGuess
    };
  }

  resetGame() {
    this.currentRoundIndex = 0;
    // Clear existing timer if any
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }
    
    this.state = {
      ...this.state,
      round: 1,
      timeLeft: GAME_CONFIG.roundTimer,
      totalScore: 0,
      currentRound: {
        images: mockRounds[0].images,
        hint: mockRounds[0].hint
      }
    };
    
    // Reset all player scores and guess history
    this.players.forEach(player => {
      player.score = 0;
    });
    this.guessHistory.clear();
    
    this.updateState();
    this.startRound();
    console.log(`Game reset in room ${this.roomCode}`);
  }

  addPlayer(clientId, username, ws) {
    const player = {
      id: clientId,
      username,
      score: 0,
      ws
    };
    this.players.set(clientId, player);
    this.updateState();

    // Start the game if we have 2 players
    if (this.players.size === 2) {
      console.log(`Starting game in room ${this.roomCode}`);
      this.startRound();
    }
  }

  removePlayer(clientId) {
    this.players.delete(clientId);
    this.updateState();
    
    // Clear timer if a player leaves
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }
    
    return this.players.size === 0;
  }

  startRound() {
    console.log(`Starting round ${this.state.round} in room ${this.roomCode}`);
    
    // Clear any existing timer
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
    }
    
    this.state.timeLeft = GAME_CONFIG.roundTimer;
    this.updateState();
    
    // Start the countdown
    this.roundTimer = setInterval(() => {
      this.state.timeLeft--;
      this.updateState();
      
      if (this.state.timeLeft <= 0) {
        this.endRound();
      }
    }, 1000);
  }

  endRound() {
    console.log(`Ending round ${this.state.round} in room ${this.roomCode}`);
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }

    // Move to next round
    this.currentRoundIndex++;
    if (this.currentRoundIndex < mockRounds.length) {
      this.state.round++;
      this.state.currentRound = {
        images: mockRounds[this.currentRoundIndex].images,
        hint: mockRounds[this.currentRoundIndex].hint
      };
      this.startRound();
    } else {
      // Game over - determine winner
      const players = Array.from(this.players.values());
      const winner = players.reduce((prev, current) => 
        (prev.score > current.score) ? prev : current
      );
      
      // Check for tie
      const isTie = players.filter(p => p.score === winner.score).length > 1;
      
      // Game over state
      this.state.gameOver = {
        winner: isTie ? null : {
          id: winner.id,
          username: winner.username,
          score: winner.score
        },
        isTie,
        finalScores: players.map(p => ({
          id: p.id,
          username: p.username,
          score: p.score
        }))
      };

      // Broadcast game over
      this.broadcast('gameOver', this.state.gameOver);
      console.log(`Game over in room ${this.roomCode}`);
    }
  }

  submitGuess(clientId, guess) {
    const player = this.players.get(clientId);
    if (!player || !this.roundTimer) return;

    // Get or initialize player's guess history
    let playerHistory = this.guessHistory.get(clientId) || {
      lastGuess: '',
      lastGuessTime: 0,
      guessCount: 0
    };

    // Check cooldown period
    const now = Date.now();
    if (now - playerHistory.lastGuessTime < this.GUESS_COOLDOWN) {
      player.ws.send(JSON.stringify({
        type: 'incorrectGuess',
        data: {
          guess: guess,
          message: `Please wait ${Math.ceil((this.GUESS_COOLDOWN - (now - playerHistory.lastGuessTime)) / 1000)} seconds before guessing again`
        }
      }));
      return;
    }

    // Check maximum guesses per round
    if (playerHistory.guessCount >= this.MAX_GUESSES_PER_ROUND) {
      player.ws.send(JSON.stringify({
        type: 'incorrectGuess',
        data: {
          guess: guess,
          message: 'Maximum guesses reached for this round'
        }
      }));
      return;
    }

    // Validate and normalize the guess
    const validation = this.validateGuess(guess);
    if (!validation.isValid) {
      player.ws.send(JSON.stringify({
        type: 'incorrectGuess',
        data: {
          guess: guess,
          message: validation.message
        }
      }));
      return;
    }

    // Check for duplicate guesses
    if (validation.normalizedGuess === playerHistory.lastGuess) {
      player.ws.send(JSON.stringify({
        type: 'incorrectGuess',
        data: {
          guess: guess,
          message: 'You already tried this guess'
        }
      }));
      return;
    }

    const currentRound = mockRounds[this.currentRoundIndex];
    const normalizedCorrect = currentRound.correctLink.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');

    console.log(`Player ${player.username} guessed: ${guess}`);
    console.log(`Correct answer is: ${currentRound.correctLink}`);

    // Update guess history
    playerHistory.lastGuess = validation.normalizedGuess;
    playerHistory.lastGuessTime = now;
    playerHistory.guessCount++;
    this.guessHistory.set(clientId, playerHistory);

    if (validation.normalizedGuess === normalizedCorrect) {
      // Calculate score based on time left and number of attempts
      const baseScore = Math.max(10, this.state.timeLeft * 5);
      const attemptsPenalty = (playerHistory.guessCount - 1) * 10; // 10 points penalty per attempt
      const scoreForRound = Math.max(10, baseScore - attemptsPenalty);
      
      player.score += scoreForRound;
      
      console.log(`Correct guess! ${player.username} scored ${scoreForRound} points`);
      
      // Notify all players of correct guess
      this.broadcast('correctGuess', {
        playerId: clientId,
        username: player.username,
        scoreForRound,
        totalScore: player.score,
        correctLink: currentRound.correctLink,
        attempts: playerHistory.guessCount
      });

      // End the round
      this.endRound();
    } else {
      // Notify player of incorrect guess with remaining attempts
      player.ws.send(JSON.stringify({
        type: 'incorrectGuess',
        data: {
          guess: guess,
          message: `Try again! (${this.MAX_GUESSES_PER_ROUND - playerHistory.guessCount} attempts remaining)`
        }
      }));
      console.log(`Incorrect guess by ${player.username}`);
    }
  }

  updateState() {
    // Update the state with current players
    this.state.players = Array.from(this.players.values()).map(({ id, username, score }) => ({
      id,
      username,
      score
    }));

    // Calculate total score
    this.state.totalScore = this.state.players.reduce((sum, player) => sum + player.score, 0);

    // Broadcast state to all players
    this.broadcast('gameState', this.state);
  }

  broadcast(type, data) {
    const message = JSON.stringify({ type, state: data });
    this.players.forEach(player => {
      if (player.ws.readyState === player.ws.OPEN) {
        player.ws.send(message);
      }
    });
  }
}

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  const clientId = uuidv4();
  connections.set(clientId, ws);

  // Send initial connection success message
  ws.send(JSON.stringify({
    type: "connection",
    data: { clientId }
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data);
      handleMessage(clientId, ws, data);
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected:', clientId);
    handleDisconnection(clientId);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    handleDisconnection(clientId);
  });
});

// Message handler
function handleMessage(clientId, ws, message) {
    switch (message.type) {
        case "joinRoom":
            handleJoinRoom(clientId, ws, message.data);
            break;
        case "submitGuess":
            handleSubmitGuess(clientId, message.data);
            break;
        case "resetGame":
            handleResetGame(clientId);
            break;
        default:
            ws.send(JSON.stringify({
                type: "error",
                message: "Unknown message type"
            }));
    }
}

// Room joining handler
function handleJoinRoom(clientId, ws, data) {
    const { roomCode, username } = data;
    
    let room = rooms.get(roomCode);
    
    if (!room) {
        room = new Room(roomCode);
        rooms.set(roomCode, room);
    }

    if (room.players.size >= GAME_CONFIG.maxPlayersPerRoom) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room is full'
        }));
        return;
    }

    room.addPlayer(clientId, username, ws);
    console.log(`Player ${username} joined room ${roomCode}`);
}

// Guess submission handler
function handleSubmitGuess(clientId, data) {
    const { guess } = data;
    
    // Find the room this client is in
    for (const room of rooms.values()) {
        if (room.players.has(clientId)) {
            room.submitGuess(clientId, guess);
            break;
        }
    }
}

// Handle client disconnection
function handleDisconnection(clientId) {
    // Remove player from their room
    for (const [roomCode, room] of rooms.entries()) {
        if (room.players.has(clientId)) {
            const isEmpty = room.removePlayer(clientId);
            // Delete room if empty
            if (isEmpty) {
                rooms.delete(roomCode);
                console.log(`Room ${roomCode} deleted (empty)`);
            }
            break;
        }
    }
}

// Add new handler for resetGame
function handleResetGame(clientId) {
    // Find the room this client is in
    for (const room of rooms.values()) {
        if (room.players.has(clientId)) {
            room.resetGame();
            break;
        }
    }
}

// Basic Express route
app.get("/", (req, res) => {
    res.send("Guess the Link Game Server");
});

// Start server with environment variables
const PORT = process.env.PORT || 3001;
const HOST = process.env.WS_HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`Server running on ${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${HOST}:${PORT}`);
});
