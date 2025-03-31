import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaCrown, FaHandshake, FaPlay, FaSignOutAlt } from 'react-icons/fa';
import Button from './Button';

export default function GameOver({ gameOver, onNewGame, onLeaveRoom }) {
  if (!gameOver) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full mx-4 text-center"
        >
          {/* Winner Animation */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative mb-8"
          >
            {gameOver.isTie ? (
              <div className="flex justify-center items-center gap-4">
                <FaHandshake className="text-6xl text-yellow-400" />
                <span className="text-4xl font-bold text-yellow-400">It's a Tie!</span>
              </div>
            ) : (
              <>
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2"
                >
                  <FaCrown className="text-6xl text-yellow-400" />
                </motion.div>
                <div className="mt-8">
                  <h2 className="text-4xl font-bold text-yellow-400 mb-2">
                    {gameOver.winner.username}
                  </h2>
                  <p className="text-2xl text-gray-400">Wins!</p>
                </div>
              </>
            )}
          </motion.div>

          {/* Final Scores */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h3 className="text-2xl font-semibold text-gray-300 mb-4">Final Scores</h3>
            <div className="space-y-3">
              {gameOver.finalScores.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className={`flex items-center justify-center gap-3 p-3 rounded-lg ${
                    player.id === gameOver.winner?.id ? 'bg-yellow-400/10' : 'bg-gray-800'
                  }`}
                >
                  <FaTrophy className={`text-xl ${
                    player.id === gameOver.winner?.id ? 'text-yellow-400' : 'text-gray-500'
                  }`} />
                  <span className="text-xl font-medium">{player.username}</span>
                  <span className="text-xl text-gray-400">{player.score} points</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex gap-4 justify-center"
          >
            <Button
              onClick={onNewGame}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              <FaPlay className="mr-2" />
              New Game
            </Button>
            <Button
              onClick={onLeaveRoom}
              className="bg-red-600 hover:bg-red-700 text-white px-8"
            >
              <FaSignOutAlt className="mr-2" />
              Leave Room
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 