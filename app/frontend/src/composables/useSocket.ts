import { io } from 'socket.io-client';
import { reactive, ref, Ref } from 'vue';

export default class SocketClient{
    private _io:any
    public isDisconnected : boolean = true
    public messageQueue: any[] = reactive([])
    private initialized: boolean = false;

    public currentRoomId : Ref<string> = ref('');
    public roomUsers : Ref<string[]> = ref([]);
    public roomError : Ref<any> = ref(null);

    public roomData : Ref<any> = ref(null);
    constructor(){
        const SOCKET_URL = 'http://localhost:4000'
        this._io = io(SOCKET_URL,{
            transports: ['websocket'],
            autoConnect: true,
        })
        //Automatically update connection state
        
        this.initializeConnectionListener()
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
        this.ioConnect()
        await this._io.emit('Event:join-room',roomId,userId,userObj)
    }
    public async leaveRoom(roomId:string,userId:string){
        this.currentRoomId.value = ''
        await this._io.emit('Event:leave-room',roomId,userId)
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