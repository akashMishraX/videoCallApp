import { Server } from "socket.io";
import { Redis } from "ioredis";

function setupRedis() {
    const redisOptions = {
        host : 'localhost',
        port : 6379,
        retryStrategy: (times: number) =>{
            return Math.min(times * 50, 2000);
        }
    }

    const pub = new Redis(redisOptions);
    const sub = pub.duplicate();

    pub.on('error',()=>{
        console.log('pub error')
    })
    pub.on('connect',()=>{
        console.log('pub connected')
    })
    sub.on('error',()=>{
        console.log('sub error')
    })
    sub.on('connect',()=>{
        console.log('sub connected')
    })
    return {
        pub,
        sub
    }
}

const { pub, sub } = setupRedis() 


// Handle Redis message


export default function setupSocket(server: any,roomSize:number) {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ["GET", "POST"],
            credentials: true
        },
    });
    const rooms = new Map();


   
    // Handle Redis message
    sub.on('message', (channel, message) => {
        const parsedMessage = JSON.parse(message);
        console.log(parsedMessage)
        io.to(parsedMessage.roomId).emit('message', parsedMessage);

        const roomId =parsedMessage.roomId
        const room = rooms.get(roomId)
        if(room){
            const userId = parsedMessage.userId
            room.add(userId)
            io.to(roomId).emit('room-users',{
                roomId:parsedMessage.roomId,
                users: Array.from(room)
            })
        }
    
    })

    // Handle connection
    io.on('connection', (socket) => {
        console.log('a user connected.', socket.id);
        let currentRoom : string = '';
        let currentUserId : string = '';

        socket.on('join-room',async ({ roomId, userId }) => {
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

                    // Leave room from redis
                    await sub.unsubscribe(currentRoom);
                }
            }

            
            // Join
            socket.join(roomId);
            room.add(userId)
            currentRoom = roomId;

            
            // Subscribe to redis channel
            await sub.subscribe(roomId); 

            // Notify
            io.to(roomId).emit('room-users',{
                roomId,
                users: Array.from(room)
            });

            socket.emit('room-joined',{roomId});
            console.log(`user ${currentUserId} joined a room ${currentRoom}`)

        });

        

        // Handle Socket message
        socket.on('message', async ({roomId , message ,userId})=>{
            if(roomId == currentRoom){
                // Publish to redis
                await pub.publish(roomId,JSON.stringify({
                    userId,
                    message,
                    timeStamp: new Date().toISOString(),
                    roomId
                }))                
            }
        })
        

        // Handle disconnection
        socket.on('disconnect',async() => {
            if(currentRoom && currentUserId){
                const room  =rooms.get(currentRoom);
                if(room){
                    room.delete(currentUserId)
                    if (room.size == 0){
                        rooms.delete(currentRoom);
                        // Leave room from redis
                        await sub.unsubscribe(currentRoom);
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