<script setup lang="ts">
import useSocket from '../composables/useSocket';
import {ref, type Ref} from 'vue';

interface useSocketInterface {
    isSocketConnected: Ref<boolean>;
    messages: Ref<string[]>;
    sendMessage: (message: string, userId: string) => void;
    joinRoom: (roomId: any,userId: any) => void;
    currentRoom: Ref<any>;
    roomUsers: Ref<string[]>
    roomError: Ref<any>
}
const roomId: Ref<string>= ref('')
const userId: Ref<string> = ref('')
const newMessage: Ref<string> = ref('')


const { isSocketConnected, messages, sendMessage , joinRoom, currentRoom, roomUsers, roomError } = useSocket() as useSocketInterface;




const  handleJoinRoom = () => {
    if(roomId.value && userId.value){
        joinRoom(roomId.value,userId.value)
    }
}

const handleSendMessage = () => {
    if (newMessage.value.trim() && userId.value) {
        sendMessage(newMessage.value, userId.value)
        newMessage.value = ''
    }
}

</script>

<template lang="html">
        
        <div class="join-form" v-if="!currentRoom">
            <input v-model="roomId" placeholder="Enter room Id">
            <input v-model="userId" placeholder="Enter your user Id">
            <button @click="handleJoinRoom">Join Room</button>
            <div v-if="roomError" class="error">{{ roomError }}</div>
        </div> 
        <div v-else class="chat-room"> 
            <h1>Chat Room !!</h1>
            <h3>RoomId: {{ currentRoom }}</h3>
            <p> Users in room: {{ roomUsers.join(', ') }}</p>
            <div class="chat-container">
                <div class="status">
                    Connection Status: {{ isSocketConnected ? 'Connected' : 'Disconnected' }}
                </div>
                
                <div class="messages">
                    <div v-for="(message, index) in messages" :key="index" class="message">
                        {{ message }}
                    </div>
                </div>
                
                <div class="input-area">
                    <input 
                        v-model="newMessage" 
                        @keyup.enter="handleSendMessage"
                        placeholder="Type a message..."
                    />
                <button @click="handleSendMessage">Send</button>
                </div>
            </div>
        </div>

</template>


<style>
    h1{
    color: #42b883
    }
</style>