# Guess the Link Game

A real-time multiplayer game where players compete to guess the correct link from a set of images. Built with Next.js, WebSocket, and Framer Motion.

## Features

- 🎮 Real-time multiplayer gameplay
- 🖼️ Dynamic image-based rounds
- ⏱️ Time-based scoring system
- 🏆 Winner determination
- 🔄 Room-based game sessions
- 🎨 Modern, responsive UI with animations
- 🌐 WebSocket-based real-time communication

## Tech Stack

### Frontend
- Next.js 14
- React
- Framer Motion (animations)
- Tailwind CSS (styling)
- WebSocket client

### Backend
- Node.js
- Express
- WebSocket server
- UUID for room management

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose (optional, for containerized deployment)

### Running with Docker

1. Clone the repository:
```bash
git clone https://github.com/JatinVermaJv/guess-the-link.git
cd guess-the-link
```

2. Create a `.env` file in the root directory with the following content:
```env
# Client Environment Variables
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001

# Server Environment Variables
PORT=3001
WS_PORT=3001
MAX_PLAYERS_PER_ROOM=2
ROUND_TIMER=20
MAX_GUESSES_PER_ROUND=5
GUESS_COOLDOWN=2000
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

3. Build and start the containers:
```bash
docker-compose up --build
```

4. Open your browser and navigate to `http://localhost:3000`

To stop the containers:
```bash
docker-compose down
```

### Running Locally (Without Docker)

1. Clone the repository:
```bash
git clone https://github.com/JatinVermaJv/guess-the-link.git
cd guess-the-link
```

2. Install dependencies for both client and server:
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Create environment files:

For client (`client/.env.local`):
```env
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

For server (`server/.env`):
```env
PORT=3001
```

4. Start the server:
```bash
cd server
npm run dev
```

5. Start the client (in a new terminal):
```bash
cd client
npm run dev
```

6. Open your browser and navigate to `http://localhost:3000`

## Game Rules

1. Create or join a room with a room code
2. Each round displays 3 images related to a specific link
3. Players have 20 seconds to guess the correct link
4. Points are awarded based on:
   - Time remaining
   - Number of attempts used
5. The game consists of multiple rounds
6. The player with the highest score at the end wins

## Project Structure

```
guess-the-link/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # Reusable UI components
│   │   └── contexts/      # React contexts
│   ├── public/            # Static assets
│   └── Dockerfile         # Client Dockerfile
├── server/                # Node.js backend
│   ├── src/
│   │   ├── game/         # Game logic
│   │   └── data/         # Data management
│   ├── index.js          # Server entry point
│   └── Dockerfile        # Server Dockerfile
└── docker-compose.yml     # Docker Compose configuration
```

## Docker Configuration

The project includes Docker configuration for both development and production environments:

### Client Dockerfile
- Located in `client/Dockerfile`
- Builds the Next.js application
- Exposes port 3000
- Optimized for production builds

### Server Dockerfile
- Located in `server/Dockerfile`
- Sets up the WebSocket server
- Exposes port 3001
- Includes all necessary dependencies

### docker-compose.yml
- Orchestrates both client and server services
- Sets up networking between containers
- Configures environment variables
- Handles port mapping
- Includes SSL volume mount for secure WebSocket connections
- Implements restart policy for production reliability

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

