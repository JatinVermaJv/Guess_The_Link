'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useWebSocket } from '@/contexts/WebSocketContext';
import dynamic from 'next/dynamic';

// Dynamically import icons with no SSR
const FaGamepad = dynamic(() => import('react-icons/fa').then(mod => mod.FaGamepad), {
  ssr: false
});

const FaUsers = dynamic(() => import('react-icons/fa').then(mod => mod.FaUsers), {
  ssr: false
});

const FaArrowRight = dynamic(() => import('react-icons/fa').then(mod => mod.FaArrowRight), {
  ssr: false
});

const FaCompass = dynamic(() => import('react-icons/fa').then(mod => mod.FaCompass), {
  ssr: false
});

const FaSpinner = dynamic(() => import('react-icons/fa').then(mod => mod.FaSpinner), {
  ssr: false
});

export default function Home() {
  const router = useRouter();
  const { joinRoom, isConnected } = useWebSocket();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Handle connection retries
  useEffect(() => {
    let retryTimeout;
    if (!isConnected && connectionAttempts < 3) {
      retryTimeout = setTimeout(() => {
        setConnectionAttempts(prev => prev + 1);
      }, 2000);
    }
    return () => clearTimeout(retryTimeout);
  }, [isConnected, connectionAttempts]);

  const handleCreateRoom = async () => {
    if (!username) {
      setError('Please enter a username first');
      return;
    }

    if (!isConnected) {
      setError('Waiting for connection... Please try again in a moment.');
      return;
    }

    setIsLoading(true);
    try {
      const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await joinRoom(newRoomCode, username);
      router.push('/game');
    } catch (err) {
      console.error('Failed to create room:', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCode || !username) {
      setError('Please fill in all fields');
      return;
    }

    if (!isConnected) {
      setError('Waiting for connection... Please try again in a moment.');
      return;
    }

    setIsLoading(true);
    try {
      await joinRoom(roomCode, username);
      router.push('/game');
    } catch (err) {
      console.error('Failed to join room:', err);
      setError('Failed to join room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Animated waves overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2"
        >
          {!isConnected && (
            <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full">
              <FaSpinner className="animate-spin" />
              <span className="text-sm">
                {connectionAttempts === 0
                  ? 'Connecting...'
                  : `Retrying connection (${connectionAttempts}/3)...`}
              </span>
            </div>
          )}
        </motion.div>

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <FaCompass className="text-6xl text-blue-400 mx-auto mb-4" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold text-white mb-4 tracking-tight"
          >
            Guess the Link
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-300"
          >
            Challenge your friends to guess the correct link from images!
          </motion.p>
        </div>

        {/* Main Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-6 space-y-6"
        >
          {!showJoinForm ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                error={error}
              />
              <Button
                onClick={handleCreateRoom}
                className="w-full flex items-center justify-center gap-2 py-3"
                disabled={isLoading || !username || !isConnected}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin text-xl" />
                    Creating Room...
                  </>
                ) : (
                  <>
                    <FaGamepad className="text-xl" />
                    Create New Room
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowJoinForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3"
                disabled={!isConnected}
              >
                <FaUsers className="text-xl" />
                Join Existing Room
              </Button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleJoinRoom}
              className="space-y-6"
            >
              <Input
                label="Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                error={error}
              />
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                error={error}
              />
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowJoinForm(false)}
                  className="flex-1 py-3"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-3"
                  disabled={isLoading || !roomCode || !username || !isConnected}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin text-xl" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join Room
                      <FaArrowRight />
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </motion.div>

        {/* Game Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center text-gray-400 space-y-2"
        >
          <p className="text-lg">Challenge your friends to a game of Guess the Link!</p>
          <p>Each round shows 3 images - can you guess the correct link?</p>
        </motion.div>
      </motion.div>
    </main>
  );
} 