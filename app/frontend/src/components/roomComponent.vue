<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, Ref } from 'vue'
import ChatBox from './ChatBox.vue'
import router from '../App.vue';
import useAuth from '../composables/useAuth';
import SocketClient from '../composables/useSocket';

// Props definition
const props = defineProps<{
  roomId: string
}>()

// User state management
const userId: Ref<string> = ref('')
const userObj: Ref<any> = ref({})
const isConnected: Ref<boolean> = ref(false)
const socketClient = new SocketClient()
const count = ref(0)
sessionStorage.setItem('count', count.value.toString())

onMounted(() => {
  socketClient.loadExistingParticipants(props.roomId)
  handleConnect()
  count.value = parseInt(sessionStorage.getItem('count') || '0')
  count.value++
  sessionStorage.setItem('count', count.value.toString())
  console.log('count',count.value)

  window.addEventListener('resize', () => gridStyle.value)
})
onload = async () => {
  count.value = parseInt(sessionStorage.getItem('count') || '0')
  count.value++
  sessionStorage.setItem('count', count.value.toString())
  if(count.value > 1){
    await handleLeaveCall()
  }
  console.log('count',count.value)
}
onBeforeUnmount(() => {
  count.value = 0
  sessionStorage.removeItem('count')
  console.log('count',count.value)
})
onUnmounted(() => {
  socketClient.loadExistingParticipants(props.roomId)
  socketClient.leaveRoom(props.roomId, userId.value)
  window.removeEventListener('resize', () => gridStyle.value)
})


// Grid layout for participants
const gridStyle = computed(() => {
  const participants = socketClient.roomData?.value || []
  const count = participants.length || 0
  const width = window.innerWidth

  // Mobile layout
  if (width < 640) {
    if (count === 1) {
      return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100vh',
        padding: '4px',
        boxSizing: 'border-box' as const
      }
    }
    
    return {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gridTemplateRows: `repeat(${count}, minmax(200px, 1fr))`,
      gap: '4px',
      width: '100%',
      height: 'auto',
      padding: '4px',
      boxSizing: 'border-box' as const,
      minHeight: '100vh'
    }
  }
  
  // Desktop/Tablet layout
  let cols: number
  let rows: number

  if (count <= 1) {
    cols = 1
    rows = 1
  } else if (count === 2) {
    cols = 2
    rows = 1
  } else if (count <= 4) {
    cols = 2
    rows = 2
  } else if (count <= 6) {
    cols = 3
    rows = 2
  } else if (count <= 9) {
    cols = 3
    rows = 3
  } else if (count <= 12) {
    cols = 4
    rows = 3
  } else if (count <= 16) {
    cols = 4
    rows = 4
  } else {
    cols = 5
    rows = Math.ceil(count / 5)
  }

  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gap: '8px',
    width: '100%',
    height: '100vh',
    padding: '8px',
    boxSizing: 'border-box' as const
  }
})

const getParticipantStyle = () => {
  const participants = socketClient.roomData?.value || []
  const count = participants.length || 0
  const width = window.innerWidth

  // Mobile styles
  if (width < 640) {
    if (count === 1) {
      return {
        width: '100%',
        aspectRatio: '16/9',
        maxHeight: '40vh', // Limit height for better mobile view
        objectFit: 'fill' as const,
        overflow: 'hidden' as const,
        position: 'relative' as const
      }
    }

    return {
      width: '100%',
      height: '100%',
      minHeight: '200px',
      maxHeight: '300px',
      aspectRatio: '16/9',
      objectFit: 'cover' as const,
      overflow: 'hidden' as const,
      position: 'relative' as const
    }
  }

  // Desktop/Tablet styles
  const baseStyle = {
    width: '100%',
    height: '100%',
    minHeight: '180px',
    objectFit: 'cover' as const,
    overflow: 'hidden' as const,
    position: 'relative' as const,
    aspectRatio: '16/9'
  }

  if (count === 1) {
    return {
      ...baseStyle,
      maxHeight: '85vh',
      width: '90%',
      margin: '0 auto'
    }
  }

  return baseStyle
}
interface userObjInterface {
  avator : string,
  isAudioEnabled : boolean,
  isVideoEnabled : boolean
}
const userString = sessionStorage.getItem('user');
let userPicture = "";
// Check if the user data exists in sessionStorage
if (userString) {
  // Parse the JSON string into an object
  const userData = JSON.parse(userString);

  // Extract the picture URL
  userPicture = userData.picture;

  // Log the picture URL
  console.log(userPicture);
} else {
  userPicture = '../assets/user.png';
  console.log("No user data found in sessionStorage.");
}

const shouldShowVideo = (participantId: string) => {
  if (participantId === userId.value) {
    // Local user
    return socketClient.localVideo.value && socketClient.isVideo.value;
  } else {
    // Remote user
    return socketClient.remoteVideoChild.value;
  }
};

const getVideoSource = (participantId:string) => {
  if (participantId === userId.value) {
    // Local user
    return socketClient.localVideo.value?.srcObject;
  } else {
    // Remote user
    return socketClient.remoteVideoChild.value?.srcObject;
  }
};


const handleConnect = async () => {
  const userData = {
    avator : userPicture,
    isAudioEnabled : true,
    isVideoEnabled : true,
  } as userObjInterface
  await socketClient.joinRoom(props.roomId, userId.value,userData)
  // isConnected.value = true
}
// Chat visibility state
const showMessageBox: Ref<boolean> = ref(false)
const showMessageButton: Ref<boolean> = ref(true)

// Methods
const handleShowMessageBox = () => {
  showMessageBox.value = !showMessageBox.value
}

const toggleVideo = async () => {
  await socketClient.toggleVideo();
};

const toggleAudio = async () => {
  await socketClient.toggleAudio();
};


const { leaveRoom } = useAuth();
const handleLeaveCall = async () => {
  console.log('Leaving call...')
  await socketClient.leaveRoom(props.roomId, userId.value)
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

// Hide chat if no room or user
if (!props.roomId && !userId.value) {
  showMessageBox.value = false
  showMessageButton.value = false
}



</script>

<template>
  <main>
  <div class="container">
    <div class="video-container" :class="{ 'video-container-small': showMessageBox, 'video-container-large': !showMessageBox }">
      <div class="video-grid" :style="gridStyle">
        <div v-for="(participant, index) in (socketClient.roomData?.value || [])" 
             :key="participant?.id || index"
             class="video-placeholder" 
             :style="getParticipantStyle()">

              <div class="participant-container"  v-show="socketClient.localVideo.value">
                <video
                class="videos"
                v-if="shouldShowVideo(participant.userId)"
                :id="participant?.id"
                :srcObject="getVideoSource(participant.userId)"
                autoplay
                playsinline
                ></video>
                <div class="avatar" v-else>
                  <img  src="../assets/user.png" :alt="participant?.userId" >
                </div>
                <div class="participant-name">
                  <span v-if="participant?.userId !== userId">{{ participant?.userId }}</span>
                  <span v-else>You</span>
                </div>
              </div>
        </div>
      </div>
    </div>

    <div class="chat-container" :class="{ 'chat-container-large': showMessageBox, 'chat-container-small': !showMessageBox }">
      <ChatBox v-show="showMessageBox"   :socketClient="socketClient" :isConnected="isConnected" :roomId="roomId"
        :userId="userId"  :handleShowMessageBox="handleShowMessageBox" :showMessageButton="showMessageButton"/>
    </div>
  </div>

  <div class="controls-container">
    <div class="video-controls">
      <button class="control-button" :class="{ 'disabled': !socketClient.isAudio.value }" @click="toggleAudio">
        <img src="../assets/audio-call.png" alt="Toggle audio" class="control-icon">
      </button>

      <button class="control-button" :class="{ 'disabled': !socketClient.isVideo.value }" @click="toggleVideo">
        <img src="../assets/video-call.png" alt="Toggle video" class="control-icon">
      </button>

      <button class="control-button leave" @click="handleLeaveCall">
        <img src="../assets/leave-call.png" alt="Leave call" class="control-icon">
      </button>
    </div>

    <div id="notification" class="notification" v-show="socketClient.isNewMsg.value && !showMessageBox">
      <div v-show="socketClient.isNewMsg.value && !showMessageBox">
        <span v-show="socketClient.newMessage.value.userId !== userId" style="display: flex;gap: 10px; justify-content: center;align-items: center; transition: all 0.5s ease-in-out;">
          <span style="font-size: 20px; color: white; font-style: italic;">{{ socketClient.newMessage.value.userId }}:-</span>
          <span style="font-size: 30px; color: white; font-style:normal;">{{ socketClient.newMessage.value.msg }}</span>
        </span>
      </div>
    </div>
    <button v-show="showMessageButton" class="control-button chat" @click="handleShowMessageBox">
      <img src="../assets/chat-call.png" alt="Toggle chat" class="control-icon">
    </button>
  </div>
</main>
</template>

<style >
:root {
  background-color: #222222
}
</style>
<style scoped>

main{
  width: 100%;
  height: 98vh;
  background-color: #222222;
  margin: 0;
  padding: 0;
}
.container {
  display: flex;
  height: 90vh;
  min-width: 90vw;
  background-color: #222222;
  color: white;
  overflow: hidden;
  margin: 0;
  padding: 0;
  border: 10px solid #3b3b3b;
  
}


.video-container {
  flex: 1;
  background: #222222;
  transition: width 0.3s ease;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column
}

.video-grid {
  height: 100%;
  width: 100%;
}

.video-container-large {
  width: 100%;
}

.video-container-small {
  width: 75%;
}

.videos{
  width: 100%;
  height: 150%;
  object-fit:contain;
  transform: scaleX(-1)
}

.video-placeholder {
  position: relative;
  background: #222222;
  border-radius: 1px;
  overflow: hidden;

  aspect-ratio: 16/9;
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
  background: rgba(61, 61, 61, 0.5);
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.875rem;
}

.chat-container {
  height: 100%;
  border: 2px solid #535353;
  transition: width 0.3s ease;
}

.chat-container-large {
  width: 25%;
}

.chat-container-small {
  width: 0%;
}
@media (max-width: 900px) {
  .video-container-small {
    width: 0%;
  }

  .chat-container-large {
    width: 100%;
  }
  .videos{
    object-fit: cover;
  }
  
  
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


.notification {
  position: fixed;
  bottom: 80px;
  right: 30px;
  background-color: #3f52ff;
  min-width:fit-content;
  color: rgb(0, 0, 0);
  padding: 15px;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(49, 49, 49, 0.1);
  opacity: 1;
  transition: opacity 1s ease, bottom 1s ease;
}


</style>