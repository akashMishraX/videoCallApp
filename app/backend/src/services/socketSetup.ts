import { Server } from 'socket.io'
import { InitRedis } from './redisSetup'
import { Socket } from 'dgram';

export let participants : any = {}

const {pub,sub} = InitRedis()
export default class SocketSetup{
    private _io: any;
    public rooms : Map<string, Set<string>> = new Map()

    constructor(server:any){
        console.log('Socket init....')
        this._io = new Server(server,{
            cors:{
                origin: 'http://localhost:5173',
                methods : ['GET','POST'],
                credentials:true
            }
        });   
    }

    //Io listener
    public ioListener(){
        console.log('Io init....')
        this._io.on('connect',async (socket:any)=>{
            console.log('User is connected',socket.id)
            let currentRoomId : string = '';
            let currentUserId : string = '';

            // server listener
            socket.on('Event:message',async (message:string,roomId:string,userId:string)=>{
                const data = {
                    message,
                    roomId,
                    userId,
                }
                const channelName = 'MESSAGE' + roomId 
                await pub.publish(channelName,JSON.stringify(data))

                console.log('Message recieved',data)
            })

            // server listener
            socket.on('Event:join-room',async (roomId:string,userId:string)=>{
                currentUserId = userId

                // Room setup
                if (!this.rooms.has(roomId)) {
                    this.rooms.set(roomId, new Set());
                }

                const room = this.rooms.get(roomId);

                //Room size constraint
                if (room!.size >= 2) {
                    socket.emit('Event:room-error',"You can't join this room")
                    return;
                }

                // Leave previous room
                if (currentRoomId) {
                    socket.leave(currentRoomId);
                    const oldRoom = this.rooms.get(currentRoomId);
                    oldRoom!.delete(currentUserId);
                    if(oldRoom!.size === 0){
                        this.rooms.delete(currentRoomId)
                        await sub.unsubscribe('MESSAGE' + currentRoomId)
                    }
                    currentRoomId = ''
                }
                
                // Join new room
                socket.join(roomId)
                room!.add(userId)
                currentRoomId = roomId

                // Subscribe to channel
                const channelName = 'MESSAGE' + roomId 
                await sub.subscribe(channelName)

                // Update Participants
                participants[roomId] = Array.from(this.rooms.get(roomId) || [])
                

                // Notifiy users
                this._io.to(roomId).emit('Event:room-joined',roomId,userId)
                this._io.to(roomId).emit('Event:roon-users',roomId,[userId])
                console.log('User',userId,'joined room',roomId)
            })

            socket.on('Event:leave-room',async (roomId:string,userId:string)=>{
                if(!this.rooms.get(roomId)!.has(userId)){
                    socket.emit('Event:room-error',"You are not in this room !!")
                    return;
                }
                if (currentRoomId === roomId && currentUserId === userId) {
                    socket.leave(currentRoomId);
                    const oldRoom = this.rooms.get(currentRoomId);
                    oldRoom!.delete(currentUserId);
                    if(oldRoom!.size === 0){
                        this.rooms.delete(currentRoomId)
                        await sub.unsubscribe('MESSAGE' + currentRoomId)
                    }
                    currentRoomId = ''
                    currentUserId = ''

                    this._io.to(roomId).emit('Event:room-left',roomId,userId)
                    this._io.to(roomId).emit('Event:roon-users',roomId,[])
                    console.log('User',userId,'left room',roomId)
                    return;
                }

            })



            socket.on('disconnect',()=>{
                console.log('User is disconnected',socket.id)   
            })
        })

        sub.on('message',(channel:string,message:string)=>{
            const channelName = 'MESSAGE' + JSON.parse(message).roomId 
            if(channel === channelName){
                // server emitter form redis to client
                this._io.emit('Event:message-recieved',JSON.parse(message).message,JSON.parse(message).roomId,JSON.parse(message).userId)
            }
        })
    }  
}