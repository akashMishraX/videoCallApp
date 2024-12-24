import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';


export default function useSocket() {
    const socket = ref<any>(null);
    const messages = ref<string[]>([]);
    const isSocketConnected = ref<boolean>(false);
    const currentRoom = ref<any>(null)
    const roomUsers = ref<string[]>([])
    const roomError = ref<any>(null)


    const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    
    function connect(){
        socket.value = io(SOCKET_URL,{
            transports: ['websocket'],
            autoConnect: true,
        });

        socket.value.on('connect', () => {
            console.log('Connected to the server');
            isSocketConnected.value = true;
        });
        socket.value.on('disconnect', () => {
            console.log('Disconnected from the server');
            isSocketConnected.value = false;
            currentRoom.value = null
            roomUsers.value = []
        })

        socket.value.on('message',(message: string) => {
            messages.value.push(message)
        })

        socket.value.on('room-joined',({ roomId }: any) => {
            currentRoom.value = roomId
            messages.value = [];
            roomError.value = null;

        })

        socket.value.on('room-users',({ users } : any)=>{
            roomUsers.value = users
        })


        socket.value.on('room-error',( error :any )=>{
            roomError.value = error
        })
    }
    function joinRoom(roomId:any,userId:any){
        if(socket.value?.connected){
            socket.value.emit('join-room', { roomId ,userId })
        }
    }

    function sendMessage(message: string,userId:any) {
        if(socket.value?.connected && currentRoom.value){
            socket.value.emit('message', {
                roomId: currentRoom.value,
                message,
                userId
            });
        }
    }


    onMounted(()=>{
        connect();
    })

    onUnmounted(()=>{
        socket.value.disconnect();
    })

    const returnObj={
        isSocketConnected,
        messages,
        sendMessage,
        joinRoom,
        currentRoom,
        roomUsers,
        roomError
    }
    return returnObj;
}
