import { motion } from 'framer-motion';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseClasses = `
    px-4 py-2 rounded-lg font-medium
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200
  `;

  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-300',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
} 