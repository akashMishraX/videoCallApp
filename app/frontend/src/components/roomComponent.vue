<script setup lang="ts">
import { computed, onMounted, ref, Ref } from 'vue'
import ChatBox from './ChatBox.vue'
import router from '../App.vue';
import useAuth from '../composables/useAuth';
import { useParticipants } from '../composables/useParticipants';


// Props definition
const props = defineProps<{
  roomId: string
}>()

// User state management
const userId: Ref<string> = ref('')
const userObj: Ref<any> = ref({})
const isAudioEnabled: Ref<boolean> = ref(true)
const isVideoEnabled: Ref<boolean> = ref(true)
const isConnected: Ref<boolean> = ref(false)

// interface Participant {
//   id: string
//   name: string
//   picture: string
//   email: string
//   isAudioEnabled: boolean
//   isVideoEnabled: boolean
//   joinedAt: Date
// }
const { user } = useAuth()
const { 
  participants, 
  addParticipant, 
  removeParticipant,
  updateParticipant 
} = useParticipants()

onMounted(() => {
  if (user.value) {
    const currentUser = addParticipant(user.value)
    console.log('Current user joined:', currentUser)
  }

  // Example: Load existing participants from backend
  loadExistingParticipants()
})

const loadExistingParticipants =async() => {
  try {
    const URL = `http://localhost:4000/${props.roomId}/participants`
    const response = fetch(URL,{
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    })
    const data = (await response).json()

    // data.participants.forEach((participant: any) => {
    //   addParticipant(participant)
    // })
  } catch (error) {
    console.error('Failed to load participants:', error)
  }
}


// Grid layout for participants
const containerStyle = computed(() => {
  const count = participants.value.length
  let cols, rows

  // Optimize grid layout based on participant count
  if (count <= 2) {
    cols = count
    rows = 1
  } else if (count === 3) {
    cols = 2
    rows = 2
  } else {
    cols = Math.ceil(Math.sqrt(count))
    rows = Math.ceil(count / cols)
  }

  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gap: '8px',
    width: '100%',
    height: '100%',
    padding: '16px'
  }
})

const getParticipantStyle = (index: number) => {
  const count = participants.value.length
  if (count === 3 && index === 2) {
    return {
      gridColumn: 'span 2',
      display: 'flex',
      justifyContent: 'center'
    }
  }
  return {}
}

// Chat visibility state
const showMessageBox: Ref<boolean> = ref(false)
const showMessageButton: Ref<boolean> = ref(true)

// Methods
const handleShowMessageBox = () => {
  showMessageBox.value = !showMessageBox.value
}

const toggleAudio = () => {
  isAudioEnabled.value = !isAudioEnabled.value
}

const toggleVideo = () => {
  isVideoEnabled.value = !isVideoEnabled.value
}


const { leaveRoom } = useAuth();
const handleLeaveCall = () => {
  console.log('Leaving call...')
  leaveRoom()
  router.push('/')
}

const getUserIdFromSessionStorage = () => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}')
  return user
}

// Initialize user data
userObj.value = getUserIdFromSessionStorage()
userId.value = userObj.value.given_name + ' ' + userObj.value.family_name



participants.value =[
  {
    id: userObj.value.given_name + ' ' + userObj.value.family_name,
    name: userObj.value.given_name + ' ' + userObj.value.family_name,
    avatar: 'https://via.placeholder.com/40',
    email: userObj.value.email,
    isAudioEnabled: true,
    isVideoEnabled: true,
    joinedAt: new Date()
  }
]


// Hide chat if no room or user
if (!props.roomId && !userId.value) {
  showMessageBox.value = false
  showMessageButton.value = false
}

// function handleLogout() {
//   throw new Error('Function not implemented.');
// }
</script>

<template>
  <div class="container">
    <!-- Main video area with dynamic grid layout -->
    <div 
      class="video-container"
      :class="{ 'video-container-small': showMessageBox, 'video-container-large': !showMessageBox }"
      :style="containerStyle"
    >
      <div 
        v-for="(participant, index) in participants" 
        :key="participant.id"
        class="video-placeholder"
        :style="getParticipantStyle(index)"
      >
        <div class="participant-container">
          <div class="avatar">
            <img :src="participant.avatar" :alt="participant.name">
          </div>
          <div class="participant-name">
            {{ participant.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- Chat container -->
    <div 
      class="chat-container"
      :class="{ 'chat-container-large': showMessageBox, 'chat-container-small': !showMessageBox }"
    >
      <ChatBox 
        v-show="showMessageBox" 
        :isConnected="isConnected"
        :roomId="roomId" 
        :userId="userId" 
      />
    </div>
  </div>

  <!-- Control buttons -->
  <div class="controls-container">
    <div class="video-controls">
      <button 
        class="control-button"
        :class="{ 'disabled': !isAudioEnabled }"
        @click="toggleAudio"
      >
        <img src="../assets/audio-call.png" alt="Toggle audio" class="control-icon">
      </button>

      <button 
        class="control-button"
        :class="{ 'disabled': !isVideoEnabled }"
        @click="toggleVideo"
      >
        <img src="../assets/video-call.png" alt="Toggle video" class="control-icon">
      </button>

      <button 
        class="control-button leave"
        @click="handleLeaveCall"
      >
        <img src="../assets/leave-call.png" alt="Leave call" class="control-icon">
      </button>
    </div>

    <button 
      v-show="showMessageButton"
      class="control-button chat"
      @click="handleShowMessageBox"
    >
      <img src="../assets/chat-call.png" alt="Toggle chat" class="control-icon">
    </button>
  </div>
</template>
<style scoped>
.container {
  display: flex;
  height: 90vh;
  min-width: 90vw;
  background-color: #1a1a1a;
  color: white;
  overflow: hidden;
}

.video-container {
  background: #1a1a1a;
  transition: width 0.3s ease;
}

.video-container-large {
  width: 100%;
}

.video-container-small {
  width: 75%;
}

.video-placeholder {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
}

.participant-container {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #404040;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.participant-name {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.875rem;
}

.chat-container {
  height: 100%;
  transition: width 0.3s ease;
}

.chat-container-large {
  width: 25%;
}

.chat-container-small {
  width: 0%;
}

.controls-container {
  position: fixed;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 0 20px;
}

.video-controls {
  display: flex;
  gap: 16px;
}

.control-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #cfcfcf;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.control-button:hover {
  background: #444;
  transform: scale(1.1);
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
}

.control-button.disabled {
  background: #ea4335;
}

.control-button.leave {
  background: #ffcfcb;
}

.control-button.chat {
  position: fixed;
  right: 20px;
  bottom: 20px;
}

.control-icon {
  width: 24px;
  height: 24px;
}
</style>