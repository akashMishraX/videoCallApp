import { io } from 'socket.io-client';
import { reactive, ref, Ref } from 'vue';

export default class SocketClient{
    private _io:any
    public isDisconnected : boolean = true
    public messageQueue: any[] = reactive([])
    private initialized: boolean = false;

    public currentRoomId : Ref<string> = ref('');
    public currentUserId : Ref<string> = ref('');
    public roomUsers : Ref<string[]> = ref([]);
    public roomError : Ref<any> = ref(null);

    public roomData : Ref<any> = ref(null);

    private peerConnectionConfig: RTCConfiguration = {
        iceServers: [
            {
                urls:[
                  'stun:stun.l.google.com:19302',
                  'stun:stun1.l.google.com:19302'
                ]
            }
        ],
        iceTransportPolicy: 'all',
        bundlePolicy: 'balanced',
        rtcpMuxPolicy: 'require',
        iceCandidatePoolSize: 10 
    }

    private peerConnection: Ref<RTCPeerConnection | null> = ref(null)
    private peerConnections: Ref<RTCPeerConnection[]> = ref([])

    public localVideo : Ref<HTMLVideoElement | null> = ref(null)
    public remoteVideoParent : Ref<HTMLVideoElement | null> = ref(null)
    public remoteVideoChild : Ref<HTMLVideoElement | null> = ref(null)

    private localStream : Ref<MediaStream | null> = ref(null)
    private remoteStream : Ref<MediaStream | null> = ref(null)

    private pendingIceCandidates:  RTCIceCandidate[] = [];

    public isVideo : Ref<boolean> = ref(true)
    public isAudio : Ref<boolean> = ref(false)

    constructor(){
        const SOCKET_URL = import.meta.env.VITE_BACKEND_URL
        this._io = io(SOCKET_URL,{
            transports: ['websocket'],
            autoConnect: true,
        })
        //Automatically update connection state
        console.log('Socket client initialized:- ',SOCKET_URL)
        this.initializeConnectionListener()
        this.initializeWebRTCListeners()
        this.initializeMessageListener()
    }
    private initializeConnectionListener() {
        this._io.on('connect', () => {
            this.isDisconnected = false;
            console.log('Connected to the server');
        });

        this._io.on('disconnect', () => {
            this.isDisconnected = true;
            console.log('Disconnected from the server');
        });
    }
    private initializeMessageListener(){
        if (!this.initialized) {
            const io = this._io
            
            // client listener
            io.on('Event:message-recieved',async (message:string,roomId:string,userId:string)=>{
                interface Message {
                    id: number;
                    text: string;
                    timestamp: Date;
                    roomId: string;
                    userId: string;
                }
                
                const data = {
                    id: 1,
                    text: message,
                    timestamp: new Date(Date.now() - 3600000),
                    roomId,
                    userId
                } as Message

                
                this.messageQueue.push(data)
                console.log('Client recieved message',data)

            })
            
            io.on('Event:room-joined',async (roomId:string,userId:string)=>{
                console.log('Client',userId,' joined room',roomId)
            })

            io.on('Event:room-users',async (roomId:string,users:string[])=>{
                this.roomUsers.value.push(...users) // add users
                console.log('Client',users,' joined room',roomId)
                this.getRoomData(roomId)
            })

            io.on('Event:room-left',async (roomId:string,userId:string)=>{
                console.log('Client',userId,' left room',roomId)
            })

            io.on('Event:room-error',async (error:string)=>{
                this.roomError.value = error
            })
            
            this.initialized = true
        }
    }
// ------------- WEBRTC -----------------
    private async initializeWebRTCListeners(){
        const socket = this._io

        socket.on('Event:createOffer',async (data:{
            roomId : string,
            userId : string
        })=>{
            console.log('[CLIENT]:Offer creation request recieved.',data)
            const offer = await this.handleCreateOffer()
            socket.emit('Event:offer',{
                roomId : data.roomId,
                userId : data.userId,
                offer : offer
            })
        })

        socket.on('Event:offer-recieved',async (data:{
            roomId:string,
            offererSocketId:string,
            userId:string,
            userSocketId:string,
            offer:RTCSessionDescriptionInit
        })=>{
            console.log('[WEBRTC]:Offer recieved.',data)
            // handle offer and create new answer
            const answer = await this.handleOffer({
                offer : data.offer,
                offererSocketId : data.offererSocketId
            })
            socket.emit('Event:answer',{
                roomId : data.roomId,
                offererSocketId : data.offererSocketId,
                userId : data.userId,
                userSocketId : data.userSocketId,
                answer : answer
            })
        })
        socket.on('Event:answer-recieved',async (data:{
            roomId:string,
            offererSocketId:string,
            userId:string,
            userSocketId:string,
            answer:RTCSessionDescriptionInit
        })=>{
          console.log('[WEBRTC]:Offerer got the answer.',data)  
          await this.handleAnswer({
            userSocketId : data.userSocketId,
            offererSocketId : data.offererSocketId,
            answer : data.answer
          })
        })
        socket.on('Event:ice-candidate-recieved',async (candidate: RTCIceCandidate,senderSocketId:string)=>{
            console.log('[WEBRTC]:Ice candidate recieved from ',senderSocketId,':-',candidate)
            await this.handleIceCandidate(candidate)
        })
        socket.on('Event:offerer-changed',async (data:{
            roomId:string,
            newOffererId:string
            newOffererSocketId:string
        })=>{
            console.log('[WEBRTC]:Offerer changed.',data)
            if(this.currentRoomId.value === data.roomId && this.currentUserId.value === data.newOffererId){
                socket.emit('Event:changeOfferer',{
                    roomId : data.roomId,
                    newOfferId : this.currentUserId.value,
                    newOffererSocketId: data.newOffererSocketId
                })
            }
            // after this  each client will check for their userId and offererUserId if this matches then they will create offer and send it.
        })
        
    }
    private async handleCreateOffer() {
        try {
            await this.fecthUserMedia(this.isVideo.value,this.isAudio.value)
            await this.handlePeerConnection(true)

            //CREATE OFFER
            const offer = await this.peerConnection.value?.createOffer()
            await this.peerConnection.value?.setLocalDescription(offer)
            console.log('[WEBRTC]:offer created....', offer);
            return offer     
        } catch (error) {
            
        }
    }
    private async handleOffer(data:{
        offer : RTCSessionDescriptionInit,
        offererSocketId : string
    }) {
        try {
            await this.fecthUserMedia(this.isVideo.value,this.isAudio.value)
            await this.handlePeerConnection(false,{offer: data.offer},{
                receiverId : data.offererSocketId
            })

            // CREATE ANSWER
            const answer = await this.peerConnection.value?.createAnswer()
            if(answer){
                await this.peerConnection.value!.setLocalDescription(answer);
                console.log('Answer created set to LocalDescription');
            }
            else{
                throw new Error('Error creating Answer.')
            }
            console.log('[WEBRTC]:Answer created...', answer);
            return answer
        } catch (error) {
            
        }
    }
    private async handleAnswer(data:{userSocketId: string,offererSocketId: string,answer : RTCSessionDescriptionInit}) {
        try {
            console.log('TESTING ANSWER',data.answer)
            if(data.answer){
                await this.peerConnection.value?.setRemoteDescription(data.answer)
                console.log('Answer set to RemoteDescription');
                await this.sendPendingIceCandidates(data.userSocketId,data.offererSocketId)

            }
        } catch (error) {
            console.error('Error setting remote description:', error);
        }
    }
    private async handleIceCandidate(candidate: RTCIceCandidate) {
        
        try {
            if (this.peerConnection.value?.remoteDescription && candidate) {
                this.peerConnection.value?.addIceCandidate(candidate)
            }
            else{
                throw new Error('The remote description was null')
            }
        } catch (error) {
            if (error === 'The remote description was null') {
                this.pendingIceCandidates = this.pendingIceCandidates || []
                this.pendingIceCandidates.push(candidate)
            }
        }
    }

    private async fecthUserMedia(isvideo:boolean,isaudio:boolean): Promise<void> {
        try {
            // Check if browser supports getUserMedia
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('getUserMedia is not supported in this browser');
            }
    
            // Store stream for later cleanup
            this.localStream.value = await navigator.mediaDevices.getUserMedia({
                video: isvideo,
                audio: isaudio,
            });
    
            // Create and configure video element
            if (!this.localVideo.value) {
                this.localVideo.value = document.createElement('video');
                this.localVideo.value.muted = true; // Mute local video to prevent feedback
                this.localVideo.value.playsInline = true; // Better mobile support
            }
            
            // Set stream as source
            this.localVideo.value.srcObject = this.localStream.value;
            
            // Handle autoplay
            try {
                await this.localVideo.value.play();
            } catch (playError) {
                console.warn('Autoplay failed:', playError);
                // Add play button or other fallback UI if needed
            }
    
            // Optional: Handle stream ending
            this.localStream.value.getTracks().forEach(track => {
                track.onended = () => {
                    console.log(`Track ${track.kind} ended`);
                    // Handle track ending - maybe try to restart stream
                };
            });
    
        }catch (error) {
            
            if (error instanceof DOMException) {
                switch (error.name) {
                    case 'NotFoundError':
                        break;
                    case 'NotAllowedError':
                        break;
                    case 'NotReadableError':
                        break;
                    default:
                }
            }

        }
    }
    public async toggleVideo(): Promise<void> {
        if (this.localStream.value) {
            const videoTracks = this.localStream.value.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            this.isVideo.value = !this.isVideo.value;
    
            // If turning video back on and no video tracks exist
            if (this.isVideo.value && videoTracks.length === 0) {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: this.isAudio.value
                });
    
                // Update local stream and video element
                if (this.localVideo.value) {
                    this.localStream.value = newStream;
                    this.localVideo.value.srcObject = newStream;
                }
    
                // Update peer connection
                const senders = this.peerConnection.value?.getSenders();
                this.localStream.value.getTracks().forEach((track) => {
                    const sender = senders?.find(s => s.track?.kind === track.kind);
                    if (sender) {
                        sender.replaceTrack(track);
                    } else {
                        this.peerConnection.value?.addTrack(track, this.localStream.value!);
                    }
                });
    
                // Trigger renegotiation
                // const offer = await this.peerConnection.value!.createOffer();
                // await this.peerConnection.value!.setLocalDescription(offer);
                // Send offer to remote peer (implementation required)
            }
        }
    }
    
    
    public async toggleAudio(): Promise<void> {
        if (this.localStream.value) {
            const audioTracks = this.localStream.value.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            this.isAudio.value = !this.isAudio.value;
    
            // If turning audio back on and no audio tracks exist
            if (this.isAudio.value && audioTracks.length === 0) {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: this.isVideo.value
                });
    
                // Update local stream
                if (this.localVideo.value) {
                    this.localStream.value = newStream;
                    this.localVideo.value.srcObject = newStream;
                }
    
                // Update peer connection
                const senders = this.peerConnection.value?.getSenders();
                this.localStream.value.getTracks().forEach((track) => {
                    const sender = senders?.find(s => s.track?.kind === track.kind);
                    if (sender) {
                        sender.replaceTrack(track);
                    } else {
                        this.peerConnection.value?.addTrack(track, this.localStream.value!);
                    }
                });
    
                // Trigger renegotiation
                // const offer = await this.peerConnection.value!.createOffer();
                // await this.peerConnection.value!.setLocalDescription(offer);
                // Send offer to remote peer (implementation required)
            }
        }
    }
    
    private async handlePeerConnection(isofferer:boolean,offerObj?:{offer:RTCSessionDescriptionInit},metadata?:{receiverId:string}) {
        try { 
            
            this.peerConnection.value = new RTCPeerConnection(this.peerConnectionConfig)
            
            if(!this.peerConnection.value){
                this.clearPeerConnection()
            }
            this.peerConnections.value.push(this.peerConnection.value)
            
            this.remoteStream.value = new MediaStream()
            
            console.log('PEER-CONNECTION-CHECKPOINT')
            // Handling Local Stream
            if(this.localVideo.value && this.localStream.value){
                this.localStream.value?.getTracks().forEach(track => {
                    this.peerConnection.value!.addTrack(track, this.localStream.value!)
                })
            }
            this.peerConnection.value.onicecandidate = (event) => {
                if(event.candidate){
                    if(!isofferer){
                        console.log('ICE-CHECKPOINT-ANSWERER')
                        if (metadata?.receiverId) {
                            this._io.emit('Event:exchangeICEcandidate', {
                                candidate: event.candidate,
                                roomId: this.currentRoomId.value,
                                senderSocketId: this.currentUserId.value,
                                receiverSocketId: metadata.receiverId,
                                isofferer: isofferer
                            });
                        } 
                    }else{
                        console.log('ICE-CHECKPOINT-OFFERER')
                        this.pendingIceCandidates.push(event.candidate)
                    }
                }
            }
        
            // Handling Remote Stream
            this.peerConnection.value.ontrack = (event) => {
                console.log('Track found:', event);
                event.streams.forEach(stream => {
                    stream.getTracks().forEach(track => {
                        const existingTracks = this.remoteStream.value!.getTracks();
                        const isDuplicate = existingTracks.some(existingTrack => existingTrack.id === track.id);
            
                        if (!isDuplicate) {
                            this.remoteStream.value!.addTrack(track);
                            console.log(`Added track: kind=${track.kind}, id=${track.id}`);
                        } else {
                            console.log(`Duplicate track ignored: kind=${track.kind}, id=${track.id}`);
                        }
                    });
                });
            
                // Ensure remote video is added to DOM correctly
              
                    
                this.remoteVideoChild.value = document.createElement('video');
                this.remoteVideoChild.value.srcObject = this.remoteStream.value;
                this.remoteVideoChild.value.autoplay = true;
                this.remoteVideoChild.value.playsInline = true;
                this.remoteVideoChild.value.className = 'videos';
                this.remoteVideoChild.value.style.display = 'block';

                console.log('Added remote video:', this.remoteVideoChild.value);
                        
                    
                
            };
            if(offerObj){
                console.log(offerObj!.offer)
                await this.peerConnection.value.setRemoteDescription(offerObj!.offer)
            }
            
        } catch (error) {
            console.error('Error creating peer connection:', error);
        }
        
    }
    private sendPendingIceCandidates(receiverSocketId: string,senderSocketId:string) {
        try {
            this.pendingIceCandidates.forEach(candidate => {
                this._io.emit('Event:exchangeICEcandidate', {
                    candidate: candidate,
                    roomId: this.currentRoomId.value,
                    senderSocketId: senderSocketId,
                    receiverSocketId: receiverSocketId,
                    isofferer: true
                });
               
           })
            this.pendingIceCandidates = [];
        } catch (error) {
            console.error('Error sending pending ICE candidates:', error);
        }
    }
    public async clearPeerConnection() {
        try {
            // Stop all tracks in local stream
            if (this.localStream.value) {
                this.localStream.value.getTracks().forEach(track => {
                    track.stop();
                });
            }
    
            // Stop all tracks in remote stream
            if (this.remoteStream.value) {
                this.remoteStream.value.getTracks().forEach(track => {
                    track.stop();
                });
            }
    
            // Clean up peer connection
            if (this.peerConnection.value) {
                // Stop all transceivers
                const transceivers = this.peerConnection.value.getTransceivers();
                transceivers.forEach(transceiver => {
                    if (transceiver.stop) {
                        transceiver.stop();
                    }
                });
    
                // Remove all tracks
                const senders = this.peerConnection.value.getSenders();
                senders.forEach(sender => {
                    if (sender.track) {
                        sender.track.stop();
                    }
                });
    
                // Remove all event listeners
                this.peerConnection.value.ontrack = null;
                this.peerConnection.value.onicecandidate = null;
                this.peerConnection.value.oniceconnectionstatechange = null;
                this.peerConnection.value.onsignalingstatechange = null;
                this.peerConnection.value.onicegatheringstatechange = null;
                this.peerConnection.value.onconnectionstatechange = null;
                this.peerConnection.value.ondatachannel = null;
    
                // Close the connection
                this.peerConnection.value.close();
                this.peerConnection.value = null;
            }
    
            // Clean up video elements
            if (this.localVideo.value) {
                this.localVideo.value.srcObject = null;
                this.localVideo.value.remove();
                this.localVideo.value = null;
            }
    
            if (this.remoteVideoChild.value) {
                this.remoteVideoChild.value.srcObject = null;
                this.remoteVideoChild.value.remove();
                this.remoteVideoChild.value = null;
            }
    
            // Clear streams
            this.localStream.value = null;
            this.remoteStream.value = null;
    
            this.pendingIceCandidates = [];

    
            console.log('Peer connection and related resources cleared successfully');
        } catch (error) {
            console.error('Error during peer connection cleanup:', error);
        }
    }
    
// -------------- WEBRTC -------------------


    public async getRoomData(roomId:string){
        console.log('Getting room data....')

        await new Promise((resolve, reject) => {
            this._io.emit(
                "Event:room-data",
                roomId,
                (response: { status: string; message: any }) => {
                  // Handle the acknowledgment response
                  if (response.status === "ok") {
                    resolve(response.message);
                  } else{
                    reject('Failed to get room data');
                  }
                }
            );
        }).then((message) => {
            this.roomData.value = message
            console.log('Room data:', this.roomData.value);
        }).catch((error) => {
            console.error('Error getting room data:', error);
        });
        return this.roomData
    }
    
    public async sendMessage(message:string,roomId:string,userId:string){
        try {
            console.log(this._io)
            await this._io.emit('Event:message', message, roomId, userId);
            // await this._io.emit('Event:message',message,roomId,userId)
            console.log('Client emmited message....')
        } catch (error) {
            console.error('Error sending message:', error)
        }
    }
    public async joinRoom(roomId:string,userId:string,userObj:{
        avator : string,
        isAudioEnabled : boolean,
        isVideoEnabled : boolean
    }){
        this.currentRoomId.value = roomId
        this.currentUserId.value = userId
        this.ioConnect()
        await this._io.emit('Event:join-room',roomId,userId,userObj)
    }
    public async leaveRoom(roomId:string,userId:string){
        this.currentRoomId.value = ''
        this.currentUserId.value = ''
        this.clearPeerConnection()
        await this._io.emit('Event:leave-room',roomId,userId)
        // this._io.emit('Event:resetPeerConnectionForRoom',roomId)
        await this.ioDisconnect()
    }
    
    private ioConnect(){
        this._io.connect()
    }
    private ioDisconnect(){
        this._io.disconnect()
        this.isDisconnected = true
    }
    public removeAllListeners() {
        this._io.removeAllListeners();
    }

    public loadExistingParticipants = async (roomId:string) => {
        try {
          const res = await this.getRoomData(roomId)
          console.log('Participants:', res)
        } catch (error) {
          console.error('Failed to load participants:', error)
        }
    }

}