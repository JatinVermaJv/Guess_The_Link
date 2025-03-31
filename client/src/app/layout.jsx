import './globals.css';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

export const metadata = {
  title: 'Guess the Link',
  description: 'A multiplayer game where players guess the correct link from a set of images.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </body>
    </html>
  );
} 