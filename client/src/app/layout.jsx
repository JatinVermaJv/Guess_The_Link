import './globals.css';

export const metadata = {
  title: 'Guess the Link',
  description: 'A fun multiplayer game where players guess the correct link from images',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 