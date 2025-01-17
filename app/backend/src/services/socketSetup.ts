import { Server } from 'socket.io'
import { InitRedis } from './redisSetup'


interface ConnectionDetails {
    offer: RTCSessionDescriptionInit;
    answer: RTCSessionDescriptionInit;
    offererId: string;
    offererSocketId: string;
    answererId: string;
    answerSocketId: string;
}
export let participants : any = {}

const {pub,sub,roomManager,signalingServiceManager} = InitRedis()
export default class SocketSetup{
    private _io: any;
    private currentRoomId : string = ''
    private currentUserId : string = ''
    
    constructor(server:any){
        console.log('Socket init....')
        this._io = new Server(server,{
            cors:{
                origin: 'https://localhost:5173', 
                methods : ['GET','POST'],
                credentials:true,
                allowedHeaders: ['Content-Type', 'Authorization'],
                exposedHeaders: ['Content-Type', 'Authorization'],        
            }
        });   
    }

    //Io listener
    public ioListener(){
        console.log('Io init....')
        this._io.on('connect',async (socket:any)=>{
            console.log('User is connected',socket.id)

        // -------WEBRTC MANAGEMENT-------
            socket.on('Event:offer',async (data:{
                roomId : string,
                userId : string,
                offer : RTCSessionDescriptionInit
            })=>{
                console.log('[WEBRTC]:New Created offer recieved',data)
                await signalingServiceManager.addOffer(data.roomId,data.offer,5*60)
            })
            socket.on('Event:answer',async (data:{
                roomId : string,
                offererSocketId : string,
                userId : string,
                userSocketId : string,
                answer : RTCSessionDescriptionInit
            })=>{
                console.log('[WEBRTC]:New Created answer recieved',data)
                await signalingServiceManager.addAnswer(data.roomId,data.userId,data.answer,5*60)
                const answer = await signalingServiceManager.getAnswer(data.roomId,data.userId)
                this._io.to(data.offererSocketId).emit('Event:answer-recieved',{
                    roomId:data.roomId,
                    offererSocketId:data.offererSocketId,
                    userId:data.userId,
                    userSocketId:data.userSocketId,
                    answer:answer
                })
            });

            socket.on('Event:exchangeICEcandidate',async (data:{
                candidate : RTCIceCandidateInit,
                roomId : string,
                senderSocketId: string,
                receiverSocketId : string
                isOfferer : boolean
            })=>{
                // console.log('[WEBRTC]:New ICE candidate recieved',data)
                // await signalingServiceManager.addIceCandidate(
                //     data.roomId,
                //     data.senderSocketId,
                //     data.receiverSocketId,
                //     data.candidate,
                //     5*60
                // )
                // const iceCandidates = await signalingServiceManager.getIceCandidates(
                //     data.roomId,
                //     data.senderSocketId,
                //     data.receiverSocketId
                // )
                // for (const candidateObj in iceCandidates){
                //     const candidate = JSON.parse(iceCandidates[candidateObj])
                //     console.log('[WEBRTC-TEST]:ICE candidate sent',candidate)
                //     this._io.to(data.receiverSocketId).emit('Event:ice-candidate-recieved',
                //         data.roomId,data.senderSocketId,data.receiverSocketId,candidate)
                // }
                console.log(`[WEBRTC]:ICE candidate sent by ${data.senderSocketId} to ${data.receiverSocketId}`,data)
                this._io.to(data.receiverSocketId).emit('Event:ice-candidate-recieved',data.candidate,data.senderSocketId)

            });

            socket.on('Event:changeOfferer',async (data:{
                roomId:string,
                newOffererId:string
                newOffererSocketId:string
            })=>{
                console.log('[WEBRTC]:New offerer requested for offer creation')
                this._io.to(data.newOffererSocketId).emit('Event:createOffer',{
                    roomId : data.roomId,
                    userId : data.newOffererId
                })
            })
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

                
                let roomSize = await (await roomManager.extractRoomData(roomId)).users.length
                //Room size constraint
                if (roomSize >= 2) {
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

                /** HANDLE WEBRTC ON ROOM JOIN 
                 * 0. When user joins first then it creates an offer and store it and when someone else joins then it sends the offer
                 * 1. Get all users in room
                 * 2. asked them to create new offer 
                 * 3. Send offer to all users in room accept the offerer
                 * 4. If user leave then signaling data of that user is deleted ,while data for other users are reused from redis server if user in rejoin or new user joins
                 */

                if(roomSize === 1){
                    this._io.to(socket.id).emit('Event:createOffer',{
                        roomId : roomId,
                        userId : userId
                    })
                    await signalingServiceManager.changeOfferer(roomId,roomManager)
                    console.log('[WEBRTC]:Offerer Requested for offer creation',userId)
                }
                else{
                    const roomData = await roomManager.extractRoomData(roomId)
                    const offerer = await signalingServiceManager.getOfferer(roomId)
                    const offer = await signalingServiceManager.getOffer(roomId)
                    for(const user of roomData.users){
                        if(user.socketId !== offerer){
                            this._io.to(socket.id).emit('Event:offer-recieved',{
                                roomId : roomId,
                                offererSocketId : offerer,
                                userId : userId,
                                userSocketId : socket.id,
                                offer : offer
                            })
                            console.log('[WEBRTC]:Offerer Send offer to users for their answer.',user.userId)
                        }
                    }
                }
                   
                
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
                    
                    const offerer = await signalingServiceManager.getOfferer(roomId)
                    if(offerer === userId){
                        await signalingServiceManager.changeOfferer(roomId,roomManager)
                        const newOffererId = await signalingServiceManager.getOfferer(roomId)
                        this._io.to(roomId).emit('Event:offerer-changed',{
                            roomId,
                            newOffererId,
                            newOffererSocketId : socket.id
                        })
                    }
                    
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