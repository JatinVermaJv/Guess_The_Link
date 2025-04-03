'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // Use the environment variable for WebSocket URL
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    console.log('Attempting to connect to WebSocket URL:', wsUrl);
    console.log('Current environment:', process.env.NODE_ENV);
    
    if (!wsUrl) {
      console.error('WebSocket URL is not defined');
      setError('WebSocket URL is not configured');
      return;
    }
    
    try {
      ws.current = new WebSocket(wsUrl);
      console.log('WebSocket instance created');

      ws.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        // Clear any reconnection timeout
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected with code:', event.code, 'reason:', event.reason);
        setIsConnected(false);
        
        // Try to reconnect if we haven't exceeded max attempts
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          setError('Failed to connect after multiple attempts. Please refresh the page.');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Please check your internet connection.');
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setError('Failed to create WebSocket connection: ' + error.message);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'connection':
        setIsConnected(true);
        break;
      case 'gameState':
        // When receiving a new game state, ensure gameOver is cleared
        setGameState(prev => ({
          ...data.state,
          gameOver: null // Explicitly clear gameOver state
        }));
        break;
      case 'roundUpdate':
        setGameState(prev => ({
          ...prev,
          currentRound: data.round,
          gameOver: null // Clear gameOver when round updates
        }));
        break;
      case 'scoreUpdate':
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(player =>
            player.id === data.playerId
              ? { ...player, score: data.score }
              : player
          ),
          gameOver: null // Clear gameOver when scores update
        }));
        break;
      case 'correctGuess':
        // Update game state with new scores
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(player =>
            player.id === data.state.playerId
              ? { ...player, score: data.state.totalScore }
              : player
          ),
          gameOver: null // Clear gameOver on correct guess
        }));
        // Show success message
        setError(null);
        setGameState(prev => ({
          ...prev,
          feedback: `Correct! ${data.state.username} scored ${data.state.scoreForRound} points. The link was: ${data.state.correctLink}`
        }));
        break;
      case 'incorrectGuess':
        setError(`Incorrect guess: ${data.data.message}`);
        break;
      case 'gameOver':
        setGameState(prev => ({
          ...prev,
          gameOver: data.state
        }));
        break;
      case 'error':
        setError(data.message);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  };

  const sendMessage = (type, data) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected. Current state:', ws.current?.readyState);
      connect(); // Try to reconnect if not connected
      setError('Connecting... Please try again in a moment.');
      return Promise.reject(new Error('WebSocket not connected'));
    }

    return new Promise((resolve, reject) => {
      try {
        const message = JSON.stringify({ type, data });
        console.log('Sending WebSocket message:', message);
        ws.current.send(message);
        resolve();
      } catch (err) {
        console.error('Error sending message:', err);
        setError('Failed to send message');
        reject(err);
      }
    });
  };

  const joinRoom = async (roomCode, username) => {
    try {
      console.log('Attempting to join room:', roomCode, 'with username:', username);
      await sendMessage('joinRoom', { roomCode, username });
      console.log('Join room message sent successfully');
    } catch (err) {
      console.error('Failed to join room:', err);
      throw new Error('Failed to join room');
    }
  };

  const createRoom = async (username) => {
    try {
      console.log('Attempting to create room with username:', username);
      if (!isConnected) {
        console.log('WebSocket not connected, attempting to connect...');
        connect();
        throw new Error('Please wait for connection and try again');
      }
      await sendMessage('createRoom', { username });
      console.log('Create room message sent successfully');
    } catch (err) {
      console.error('Failed to create room:', err);
      setError(err.message);
      throw err;
    }
  };

  const submitGuess = async (guess) => {
    try {
      await sendMessage('submitGuess', { guess });
    } catch (err) {
      throw new Error('Failed to submit guess');
    }
  };

  const resetGame = async () => {
    try {
      await sendMessage('resetGame', {});
    } catch (err) {
      throw new Error('Failed to reset game');
    }
  };

  const value = {
    isConnected,
    gameState,
    error,
    joinRoom,
    createRoom,
    submitGuess,
    resetGame,
    sendMessage
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
} 