'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/Button';
import Input from '@/components/Input';
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

export default function GamePage() {
  // Mock data - will be replaced with real data from WebSocket
  const [gameState, setGameState] = useState({
    round: 1,
    maxRounds: 5,
    timeLeft: 20,
    players: [
      { id: '1', username: 'Player 1', score: 0 },
      { id: '2', username: 'Player 2', score: 0 }
    ],
    currentRound: {
      images: [
        'https://www.google.com/search?sca_esv=f65d9110a0398786&sxsrf=AHTn8zpXnP74sFc9LLjEewUaJiJh1M8IDQ:1743415534638&q=goku+atomas+ultra+instinct&udm=2&fbs=ABzOT_CWdhQLP1FcmU5B0fn3xuWpA-dk4wpBWOGsoR7DG5zJBsxayPSIAqObp_AgjkUGqel3rTRMIJGV_ECIUB00muput9Zp8VMKUi0ZjqPs3JlrgNjQ9rOqRdXcDwEBQ82jIzIeJKF_t4xlLNL8OlcUPXuD4mOHi5CwSvqoRYVHDp8kIKIKk9txe0fwpxc-El6CFYl-jFdhssameWHw9C9RusrnI0QBZA&sa=X&ved=2ahUKEwjlgY39iLSMAxVjslYBHUNeJasQtKgLegQIExAB&biw=1536&bih=730&dpr=1.25#vhid=PX2ejYWrNHkTIM&vssid=mosaic',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg'
      ]
    }
  });

  const [guess, setGuess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock timer - will be replaced with WebSocket updates
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft - 1)
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmitGuess = (e) => {
    e.preventDefault();
    if (!guess.trim()) return;

    setIsLoading(true);
    // TODO: Implement guess submission via WebSocket
    console.log('Submitting guess:', guess);
    setGuess('');
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 text-primary-600">
            <FaClock className="text-xl" />
            <span className="text-2xl font-bold">{gameState.timeLeft}s</span>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">Round {gameState.round}</h2>
            <p className="text-sm text-gray-500">of {gameState.maxRounds}</p>
          </div>
          <div className="flex items-center gap-2 text-primary-600">
            <FaTrophy className="text-xl" />
            <span className="text-2xl font-bold">0</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Player Panels */}
          <div className="lg:col-span-3 space-y-4">
            {gameState.players.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card flex items-center gap-3"
              >
                <FaUser className="text-xl text-primary-600" />
                <div>
                  <p className="font-medium">{player.username}</p>
                  <p className="text-sm text-gray-500">{player.score} points</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Image Grid */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {gameState.currentRound.images.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-200"
                >
                  <img
                    src={image}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Guess Input */}
          <div className="lg:col-span-3">
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmitGuess}
              className="card space-y-4"
            >
              <h3 className="font-semibold text-lg">Submit Your Guess</h3>
              <Input
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Enter the correct link..."
                disabled={isLoading || gameState.timeLeft === 0}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || gameState.timeLeft === 0}
              >
                {isLoading ? 'Submitting...' : 'Submit Guess'}
              </Button>
            </motion.form>
          </div>
        </div>
      </div>
    </main>
  );
} 