import { Server } from "socket.io";

export default function setupSocket(server: any,roomSize:number) {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ["GET", "POST"],
            credentials: true
        },
    });
    const rooms = new Map();

    // Handle connection
    io.on('connection', (socket) => {
        console.log('a user connected.', socket.id);
        let currentRoom : string = '';
        let currentUserId : string = '';

        socket.on('join-room', ({ roomId, userId }) => {
            currentUserId = userId;

            // Room setup
            if(!rooms.has(roomId)){
                rooms.set(roomId,new Set());
            }

            const room = rooms.get(roomId)

            // Room Size
            if (room.size >= roomSize) {
                socket.emit('room-error','Room is full')
                return;
            }


            // Leave 
            if(currentRoom){
                socket.leave(currentRoom)
                const oldRoom = rooms.get(currentRoom)
                oldRoom.delete(currentUserId)
                if (oldRoom.size == 0){
                    rooms.delete(currentRoom)
                }
            }

            // Join
            socket.join(roomId);
            room.add(userId)
            currentRoom = roomId;

            // Notify
            io.to(roomId).emit('room-users',{
                roomId,
                users: Array.from(room)
            });

            socket.emit('room-joined',{roomId});
            console.log(`user ${currentUserId} joined a room ${currentRoom}`)

        });

        // Handle message
        socket.on('message',({roomId , message ,userId})=>{
            if(roomId == currentRoom){
                io.to(roomId).emit('message',{
                    userId,
                    message,
                    timeStamp: new Date().toISOString()
                })
            }
        })
        

        // Handle disconnection
        socket.on('disconnect', () => {
            if(currentRoom && currentUserId){
                const room  =rooms.get(currentRoom);
                if(room){
                    room.delete(currentUserId)
                    if (room.size == 0){
                        rooms.delete(currentRoom);
                    }
                    else{
                        io.to(currentRoom).emit('room-users',{
                            roomId:currentRoom,
                            users: Array.from(room)
                        })
                    }
                }
            }
            console.log(`user ${currentUserId} is disconnected from room ${currentRoom}.`)
        })
    });
    
    return io;
}