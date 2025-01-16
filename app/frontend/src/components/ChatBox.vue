<script setup lang="ts">
import { ref, Ref, onMounted, nextTick, defineProps } from 'vue'
import SocketClient from '../composables/useSocket'

interface User {
  name: string
  avatar: string
  online: boolean
}

interface Message {
  id: number
  text: string
  timestamp: Date,
  roomId: string | null,
  userId: string | null
}

const props = defineProps<{
  socketClient: SocketClient
  isConnected: boolean
  roomId: string
  userId: string
  handleShowMessageBox: () => void
  showMessageButton: boolean
}>()

// const socketClient = new SocketClient
const message: Ref<string> = ref('')
const isConnected: Ref<boolean> = ref(props.socketClient.isDisconnected)
const messageQueue: Ref<Message[]> = ref(props.socketClient.messageQueue)

const messagesContainerRef = ref<HTMLDivElement | null>(null)

const currentUser = ref<User>({
  name: 'Chat Box',
  avatar: 'https://via.placeholder.com/40',
  online: true
})

const handleSendMessage = async () => {
  if (!message.value.trim()) return
  if (!props.roomId || !props.userId) {
    messageQueue.value.push({
      id: messageQueue.value.length + 1,
      text: 'You have been disconnected from the chat.',
      timestamp: new Date(),
      roomId: null,
      userId: null
    })
    return
  }

  props.socketClient.sendMessage(message.value, props.roomId, props.userId)
  console.log('message is sent', message.value)
  message.value = ''
  await nextTick()
  scrollToBottom()
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

const scrollToBottom = () => {
  if (messagesContainerRef.value) {
    messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
  }
}

if (!props.roomId && !props.userId) {
  isConnected.value = false
}

onMounted(async() => {
  scrollToBottom()
})



</script>


<template>
  <div class="chat" style="display: flex; justify-content: center; align-items: center;">
    <div class="chat-container">
      <div class="chat-header">
        <div class="user-info">
            <!-- <div class="avatar">
              <img :src="currentUser.avatar" :alt="currentUser.name">
            </div> -->
          <div class="user-details">
            <h3 class="box-detail" style="margin-left: 15px;">Message Box</h3>
            <button @click="props.handleShowMessageBox" v-show="props.showMessageButton" class="close-button">
                <span>X</span>
            </button>
          </div>
        </div>
      </div>

      <div class="messages-container" ref="messagesContainerRef">
        <div v-for="message in messageQueue" :key="message.id"
          :class="['message-wrapper', message.userId === userId ? 'sent' : 'received']">
          <div class="message-content" v-if="message.roomId === roomId">
            <div class="avatar" v-if="message.userId !== userId">
              <img src="../assets/user.png" :alt="currentUser.name" style="background-color: aliceblue;">
            </div>
            <div class="message-bubble">
              <div class="message-userid">
                <span v-if="message.userId===userId">You</span>
                <span v-else>{{ message.userId?.toLowerCase() }}</span>
              </div>
              <div class="message-text">{{ message.text }}</div>
              <div class="message-meta">
                <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="input-container">
        <input v-model="message" @keyup.enter="handleSendMessage" type="text" placeholder="Type a message..."
          :disabled="!isConnected" />
        <button @click="handleSendMessage" class="send-button" :disabled="!message.trim() || !isConnected">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Your existing styles remain unchanged */
.chat-container {
  width: 100%;
  /* max-width: 500px; */
  height: 90vh;
  background-color: #222222;
  display: flex;
  flex-direction: column;
}
@media (max-width: 900px) {
  .chat-container {
    width: 100vw;
    height: 85vh;
  }
}
.chat-header {
  padding: 1rem;
  background-color: #1a1a1a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #333;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-info{
  width: 100%;
}
.user-details  {
  display: flex;
  justify-content: space-between; /* Pushes items to opposite ends */
  align-items: center; /* Vertically aligns items */
  padding: 10px;
  background-color: #1a1a1a;
  color: white;
  width: 100%;
}
.box-detail{
  color: #ffffff;
  margin: 0;
  font-size: 1rem;
  font-weight: 500;;
}
.close-button {
  background-color: #333333;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  width: 60px;
  transition: all 0.3s ease-in-out;
  height: 40px;
  font-size: large;
  font-weight: bolder;
}
.close-button:hover{
  transform: scale(1.1);
  background-color: #202020;
  transition: all 0.3s ease-in;
  /* border : 1px solid #292929; */
}
.status {
  font-size: 0.8rem;
  color: #4CAF50;
}

.status.online {
  color: #4CAF50;
}



.messages-container {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-wrapper {
  display: flex;
  width: 100%;
  flex-flow: column nowrap;
}

.message-wrapper.sent {
  align-items: end;
}

.message-wrapper.received {
  align-items: start;
}

.message-content {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  max-width: 80%;
}

.message-bubble {
  position: relative;
}
.message-userid{
  color: #ffffff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 15px;
}
.message-text {
  padding: 0.75rem;
  border-radius: 12px;
  background-color: #333;
  color: white;
  font-size: 0.9rem;
  line-height: 1.4;
}

.sent .message-text {
  background-color: #b1c4fa;
  color: #000;
}

.message-meta {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.25rem;
  gap: 0.5rem;
}

.timestamp {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
}

.input-container {
  padding: 1rem;
  background-color: #1a1a1a;
  border-top: 1px solid #333;
  display: flex;
  gap: 0.5rem;
}

input {
  flex: 1;
  background-color: #333;
  border: none;
  border-radius: 4px;
  padding: 0.75rem;
  color: white;
  font-size: 0.9rem;
}

input:focus {
  outline: none;
  background-color: #404040;
}

input::placeholder {
  color: #808080;
}

.send-button {
  background-color: #2962FF;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.send-button:disabled {
  background-color: #404040;
  cursor: not-allowed;
}

.send-button svg {
  width: 20px;
  height: 20px;
  color: white;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background-color: #404040;
  border-radius: 3px;
}

@media (max-width: 1250px) {
  
}
</style>