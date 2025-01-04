import { Server } from 'socket.io'
import { InitRedis } from './redisSetup'
import { Socket } from 'dgram';

export let participants : any = {}

const {pub,sub,roomManager} = InitRedis()
export default class SocketSetup{
    private _io: any;
    private currentRoomId : string = ''
    private currentUserId : string = ''

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

        // -------WEBRTC MANAGEMENT-------
            

        // -------WEBRTC MANAGEMENT-------

        // -------MESSAGE MANAGEMENT------- 
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
        // -------MESSAGE MANAGEMENT-------

        // -------ROOM MANAGEMENT-------
            socket.on('Event:join-room',async (roomId:string,userId:string,userData:{
                avator : string,
                isAudioEnabled : boolean,
                isVideoEnabled : boolean
            })=>{
                this.currentUserId = userId

                // Room setup
                const roomExists = await roomManager.doesRoomExist(roomId)
                if(!roomExists){
                    await roomManager.createRoom(roomId,{
                        roomName : roomId,
                        roomSize : 0,

                        createdAt : new Date().toISOString()
                    })
                }

                
                let roomSize = await roomManager.getRoomSize(roomId)
                //Room size constraint
                if (roomSize >= 5) {
                    socket.emit('Event:room-error',"You can't join this room")
                    return;
                }

                // Leave previous room
                if (this.currentRoomId !== '') {
                    socket.leave(roomId);
                    const roomSize = await roomManager.getRoomSize(roomId)
                    if(roomSize === 0){
                        // await roomManager.cleanupEmptyRoom(this.currentRoomId)
                        await sub.unsubscribe('MESSAGE' + roomId)
                    }
                    this.currentRoomId = ''
                }
                
                // Join new room
                socket.join(roomId)
                await roomManager.addUserToRoom(roomId,userId,{
                    socketId : socket.id,
                    isAudioEnabled : userData.isAudioEnabled,
                    isVideoEnabled : userData.isVideoEnabled,
                    avator : userData.avator
                })
                roomSize = await roomManager.getRoomSize(roomId)
                await roomManager.updateRoomData(roomId,{roomSize : roomSize + 1})
                this.currentRoomId = roomId

                // Subscribe to channel
                const channelName = 'MESSAGE' + roomId 
                await sub.subscribe(channelName)

                

                // Notifiy user `s
                this._io.to(roomId).emit('Event:room-joined',roomId,userId)
                this._io.to(roomId).emit('Event:room-users',roomId,[userId])
                console.log('User',userId,'joined room',roomId)
            })

            
            socket.on("Event:room-data",async (roomId: string, ackCallback: (response: { status: string; message: any }) => void) => {
                const isRoom = await roomManager.doesRoomExist(roomId)
                const isUserInRoom = await roomManager.isRooomEmpty(roomId)
                let resMsg
                if(isRoom || isUserInRoom){    
                    const roomUsers = await roomManager.getRoomUsers(roomId)
                    resMsg = roomUsers
                }else{
                    resMsg = 'Room does not exist'                    
                }

                ackCallback({
                    status: "ok",
                    message: resMsg
                })
            });
            

            socket.on('Event:leave-room',async (roomId:string,userId:string)=>{
                const isUserInRoom = await roomManager.isUserInRoom(roomId,userId)
                const isRoom = await roomManager.doesRoomExist(roomId)
                if(!isUserInRoom || !isRoom){
                    socket.emit('Event:room-error',"You are not in this room !!")
                    // this._io.to(roomId).emit('Event:room-left',roomId,userId)
                    // this._io.to(roomId).emit('Event:room-users',roomId,[])``
                    return;
                }else{
                    socket.leave(userId);
                    await roomManager.removeUserFromRoom(roomId,userId)
                    
                    this._io.to(roomId).emit('Event:room-left',roomId,userId)
                    this._io.to(roomId).emit('Event:room-users',roomId,[])
                    console.log('User',userId,'left room',roomId)
                    return;
                }
                
            })

            socket.on('disconnect',()=>{
                console.log('User is disconnected',socket.id)  

            })
        // -------ROOM MANAGEMENT-------
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