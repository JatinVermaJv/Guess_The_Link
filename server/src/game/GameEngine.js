const DataManager = require('../data/DataManager');

class GameEngine {
    constructor(room) {
        this.room = room;
        this.currentRound = 0;
        this.maxRounds = 5;
        this.roundState = {
            status: 'waiting', // waiting, playing, cooldown
            timeLeft: 0,
            currentImageSet: null,
            correctAnswer: null,
            guesses: new Map() // playerId -> {answer, timestamp}
        };
        this.scores = new Map(); // playerId -> score
        this.timer = null;
        this.dataManager = new DataManager();
    }

    // Initialize the game engine
    async initialize() {
        await this.dataManager.initialize();
    }

    // Start a new round
    startRound() {
        if (this.currentRound >= this.maxRounds) {
            this.endGame();
            return;
        }

        this.currentRound++;
        this.roundState = {
            status: 'playing',
            timeLeft: 20, // 20 seconds for guessing
            currentImageSet: this.dataManager.getRandomImageSet(),
            correctAnswer: null,
            guesses: new Map()
        };

        // Broadcast round start to all players
        this.room.broadcast({
            type: 'roundStart',
            round: this.currentRound,
            maxRounds: this.maxRounds,
            timeLeft: this.roundState.timeLeft,
            images: this.roundState.currentImageSet.images,
            category: this.roundState.currentImageSet.category
        });

        // Start the round timer
        this.startTimer();
    }

    // Start the round timer
    startTimer() {
        this.timer = setInterval(() => {
            this.roundState.timeLeft--;
            
            // Broadcast time update
            this.room.broadcast({
                type: 'timeUpdate',
                timeLeft: this.roundState.timeLeft
            });

            if (this.roundState.timeLeft <= 0) {
                this.endRound();
            }
        }, 1000);
    }

    // Handle a player's guess
    handleGuess(playerId, guess) {
        if (this.roundState.status !== 'playing') {
            return false;
        }

        // Check if player already guessed
        if (this.roundState.guesses.has(playerId)) {
            return false;
        }

        // Record the guess
        this.roundState.guesses.set(playerId, {
            answer: guess.toLowerCase().trim(),
            timestamp: Date.now()
        });

        // Check if guess is correct
        const isCorrect = this.checkAnswer(guess);
        if (isCorrect) {
            this.handleCorrectGuess(playerId);
        }

        // If all players have guessed, end the round
        if (this.roundState.guesses.size === this.room.players.size) {
            this.endRound();
        }

        return true;
    }

    // Check if the guess is correct
    checkAnswer(guess) {
        return guess.toLowerCase().trim() === this.roundState.currentImageSet.correctAnswer.toLowerCase().trim();
    }

    // Handle a correct guess
    handleCorrectGuess(playerId) {
        const timeLeft = this.roundState.timeLeft;
        const score = Math.max(1, timeLeft * 2); // More points for faster correct guesses
        this.scores.set(playerId, (this.scores.get(playerId) || 0) + score);

        // Broadcast correct guess
        this.room.broadcast({
            type: 'correctGuess',
            playerId: playerId,
            score: score
        });
    }

    // End the current round
    endRound() {
        clearInterval(this.timer);
        this.roundState.status = 'cooldown';

        // Broadcast round end
        this.room.broadcast({
            type: 'roundEnd',
            round: this.currentRound,
            scores: Array.from(this.scores.entries()).map(([playerId, score]) => ({
                playerId,
                score
            })),
            correctAnswer: this.roundState.currentImageSet.correctAnswer,
            category: this.roundState.currentImageSet.category
        });

        // Start cooldown timer
        setTimeout(() => {
            this.startRound();
        }, 3000); // 3 second cooldown
    }

    // End the game
    endGame() {
        clearInterval(this.timer);
        this.roundState.status = 'finished';

        // Calculate winner
        const scores = Array.from(this.scores.entries());
        const winner = scores.reduce((a, b) => (a[1] > b[1] ? a : b))[0];

        // Broadcast game end
        this.room.broadcast({
            type: 'gameEnd',
            scores: scores.map(([playerId, score]) => ({
                playerId,
                score
            })),
            winner: winner
        });
    }

    // Get current game state
    getGameState() {
        return {
            currentRound: this.currentRound,
            maxRounds: this.maxRounds,
            roundState: this.roundState,
            scores: Array.from(this.scores.entries()).map(([playerId, score]) => ({
                playerId,
                score
            }))
        };
    }
}

module.exports = GameEngine; 