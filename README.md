# Real-Time Video Chat Application

A WebRTC-based video chat application that enables users to create and join video rooms, participate in video/audio calls, and exchange messages in real-time.

## Features

- Create and join video rooms using unique room codes
- Real-time video and audio streaming
- Text chat functionality within rooms
- Screen sharing capability
- User presence indicators
- Real-time notifications for user join/leave events
- Persistent chat history using Redis
- Low-latency WebRTC connections with Socket.io signaling

## Tech Stack

### Backend
- Node.js
- Express.js
- Socket.io (Signaling server)
- Upstash Redis (Chat persistence)

### Frontend
- Vue.js
- Socket.io-client
- WebRTC API

## Prerequisites

- Node.js >= 14.x
- NPM >= 6.x
- Upstash Redis account and credentials
- Modern browser with WebRTC support

## Installation

1. Clone the repository:
```bash
git clone https://github.com/akashMishraX/videoCallApp.git
cd videoCallApp
```

2. Install backend dependencies:
```bash
cd app/backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../../app/frontend
npm install
```

4. Configure environment variables:

Create a `.env` file in the server directory:
```
REDIS_URL=''
CLIENT_URL=''
```

Create a `.env` file in the client directory:
```
VITE_GOOGLE_CLIENT_ID=''
VITE_BACKEND_URL=''
```

## Running the Application

1. Start the backend server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

1. Open the application in your browser
2. Create a new room or join an existing one using a room code
3. Allow camera and microphone permissions when prompted
4. Start video chatting and messaging with other participants

## API Endpoints

### Room Management
- `POST /api/rooms/create` - Create a new room
- `GET /api/rooms/:roomId` - Get room details
- `POST /api/rooms/join` - Join an existing room

### WebSocket Events

#### Client to Server
- `join-room` - Join a specific room
- `leave-room` - Leave the current room
- `offer` - Send WebRTC offer
- `answer` - Send WebRTC answer
- `ice-candidate` - Send ICE candidate
- `chat-message` - Send chat message

#### Server to Client
- `room-joined` - Room successfully joined
- `user-joined` - New user joined the room
- `user-left` - User left the room
- `receive-offer` - Receive WebRTC offer
- `receive-answer` - Receive WebRTC answer
- `receive-ice-candidate` - Receive ICE candidate
- `chat-message` - Receive chat message

## Development

### Project Structure
```
├── app
│   ├── backend
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── app.ts
│   │   │   ├── redisData
│   │   │   │   ├── connectionManger.ts
│   │   │   │   └── roomManager.ts
│   │   │   └── services
│   │   │       ├── redisSetup.ts
│   │   │       └── socketSetup.ts
│   │   └── tsconfig.json
│   └── frontend
│       ├── certificate.pem
│       ├── index.html
│       ├── package.json
│       ├── package-lock.json
│       ├── private-key.pem
│       ├── public
│       │   └── video.png
│       ├── README.md
│       ├── request.csr
│       ├── src
│       │   ├── App.vue
│       │   ├── assets
│       │   ├── components
│       │   │   ├── ChatBox.vue
│       │   │   ├── HomeComponent.vue
│       │   │   ├── Login.vue
│       │   │   └── roomComponent.vue
│       │   ├── composables
│       │   │   ├── useAuth.ts
│       │   │   ├── useParticipants.ts
│       │   │   └── useSocket.ts
│       │   ├── main.ts
│       │   ├── shims-vue.d.ts
│       │   ├── style.css
│       │   └── vite-env.d.ts
│       ├── tsconfig.app.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── util
│       │   ├── generateId.ts
│       │   └── hashUserId.ts
│       └── vite.config.ts
├── dump.rdb
├── package.json
├── package-lock.json
└── README.md
```


## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

- WebRTC API
- Socket.io
- Upstash Redis
- Vue.js community