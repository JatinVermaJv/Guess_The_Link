'use client';

import { useState } from 'react';
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

export default function Home() {
  const router = useRouter();
  const { joinRoom, isConnected } = useWebSocket();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!username) {
      setError('Please enter a username first');
      setShowJoinForm(true);
      return;
    }

    setIsLoading(true);
    try {
      // Generate a random room code (6 characters)
      const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await joinRoom(newRoomCode, username);
      router.push('/game');
    } catch (err) {
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

    setIsLoading(true);
    try {
      await joinRoom(roomCode, username);
      router.push('/game');
    } catch (err) {
      setError('Failed to join room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Guess the Link
        </h1>
        <p className="text-lg text-gray-600">
          Challenge your friends to guess the correct link from images!
        </p>
      </motion.div>

      <div className="w-full max-w-md space-y-6">
        {!showJoinForm ? (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
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
              className="w-full flex items-center justify-center gap-2"
              disabled={isLoading || !username}
            >
              <FaGamepad className="text-xl" />
              {isLoading ? 'Creating Room...' : 'Create New Room'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowJoinForm(true)}
              className="w-full flex items-center justify-center gap-2"
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
            className="space-y-4"
          >
            <Input
              label="Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
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
                className="flex-1"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2"
                disabled={isLoading || !roomCode || !username}
              >
                {isLoading ? 'Joining...' : 'Join Room'}
                <FaArrowRight />
              </Button>
            </div>
          </motion.form>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center text-sm text-gray-500"
      >
        <p>Challenge your friends to a game of Guess the Link!</p>
        <p className="mt-2">
          Each round shows 3 images - can you guess the correct link?
        </p>
      </motion.div>
    </main>
  );
} 