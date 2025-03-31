'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useWebSocket } from '@/contexts/WebSocketContext';
import dynamic from 'next/dynamic';

// Dynamically import icons with no SSR
const FaClock = dynamic(() => import('react-icons/fa').then(mod => mod.FaClock), {
  ssr: false
});

const FaTrophy = dynamic(() => import('react-icons/fa').then(mod => mod.FaTrophy), {
  ssr: false
});

const FaUser = dynamic(() => import('react-icons/fa').then(mod => mod.FaUser), {
  ssr: false
});

const FaCopy = dynamic(() => import('react-icons/fa').then(mod => mod.FaCopy), {
  ssr: false
});

export default function GamePage() {
  const router = useRouter();
  const { gameState, error, submitGuess, resetGame, isConnected } = useWebSocket();
  const [guess, setGuess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const redirectTimeout = useRef(null);

  // Handle connection state with delay
  useEffect(() => {
    if (!isConnected && !gameState) {
      // Wait 2 seconds before redirecting to ensure it's not a temporary disconnection
      redirectTimeout.current = setTimeout(() => {
        router.push('/');
      }, 2000);
    }

    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, [isConnected, gameState, router]);

  // Handle error messages
  useEffect(() => {
    if (error) {
      setLocalError(error);
      const timer = setTimeout(() => setLocalError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle feedback messages
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Reset remaining attempts when round changes
  useEffect(() => {
    setRemainingAttempts(5);
  }, [gameState?.round]);

  const handleSubmitGuess = async (e) => {
    e.preventDefault();
    if (!guess.trim()) {
      setLocalError('Please enter a guess');
      return;
    }

    setIsLoading(true);
    try {
      await submitGuess(guess.trim());
      setGuess('');
      setLocalError(null);
      setRemainingAttempts(prev => Math.max(0, prev - 1));
    } catch (err) {
      setLocalError('Failed to submit guess. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyRoomCode = async () => {
    if (gameState?.roomCode) {
      try {
        await navigator.clipboard.writeText(gameState.roomCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        setLocalError('Failed to copy room code');
      }
    }
  };

  // Show loading state if game state is not yet available
  if (!gameState) {
    return (
      <main className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading game...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Top Bar with Timer and New Game */}
        <div className="flex justify-between items-center mb-6">
          {/* Timer */}
          {gameState.timeLeft > 0 && (
            <motion.div 
              initial={{ scale: 1 }}
              animate={{ scale: gameState.timeLeft <= 5 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5 }}
              className={`text-3xl font-bold ${
                gameState.timeLeft <= 5 ? 'text-red-500' : 'text-blue-400'
              }`}
            >
              {gameState.timeLeft}s
            </motion.div>
          )}
          {/* New Game Button */}
          <Button
            onClick={resetGame}
            className="bg-green-600 hover:bg-green-700 text-white px-6"
          >
            New Game
          </Button>
        </div>

        {/* Game Title and Round */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-1">Round {gameState.round}</h2>
          <p className="text-gray-400">of {gameState.maxRounds}</p>
        </div>

        {/* Room Code */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gray-800/50 rounded-lg px-4 py-2">
            <span className="text-gray-400">Room Code:</span>
            <span className="font-mono text-blue-400">{gameState.roomCode || 'Loading...'}</span>
            <button
              onClick={copyRoomCode}
              className="text-gray-400 hover:text-blue-400 transition-colors"
              title="Copy room code"
            >
              <FaCopy />
            </button>
            {copySuccess && (
              <span className="text-green-400 text-sm">Copied!</span>
            )}
          </div>
        </div>

        {/* Player Info and Score */}
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            {gameState.players.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 text-gray-300"
              >
                <FaUser className="text-blue-400" />
                <span className="font-medium">{player.username}</span>
                <span className="text-gray-400">{player.score} points</span>
                {player.id === gameState.players[0].id && (
                  <span className="text-sm text-gray-500">
                    ({remainingAttempts} attempts left)
                  </span>
                )}
              </motion.div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-blue-400">
            <FaTrophy className="text-xl" />
            <span className="text-2xl font-bold">{gameState.totalScore || 0}</span>
          </div>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence>
          {(localError || feedback) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`rounded-lg px-4 py-3 mb-4 ${
                localError 
                  ? 'bg-red-900/50 border border-red-500 text-red-200'
                  : 'bg-green-900/50 border border-green-500 text-green-200'
              }`}
            >
              {localError || feedback}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4 max-w-4xl mx-auto">
          {gameState.currentRound.images.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="aspect-square rounded-lg overflow-hidden bg-gray-800"
            >
              <img
                src={image}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>

        {/* Hint */}
        {gameState.currentRound.hint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-4 text-gray-400"
          >
            <span className="font-medium">Hint:</span> {gameState.currentRound.hint}
          </motion.div>
        )}

        {/* Guess Input */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmitGuess}
          className="max-w-2xl mx-auto"
        >
          <div className="flex gap-4">
            <Input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Enter the correct link..."
              disabled={isLoading || remainingAttempts === 0}
              className="flex-1 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
            />
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8"
              disabled={isLoading || remainingAttempts === 0}
            >
              {isLoading ? 'Submitting...' : remainingAttempts === 0 ? 'No attempts left' : 'Submit'}
            </Button>
          </div>
          {remainingAttempts === 0 && (
            <p className="text-red-400 text-sm mt-2 text-center">
              Maximum attempts reached for this round
            </p>
          )}
        </motion.form>
      </div>
    </main>
  );
} 