<script setup lang="ts">
import { onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import generateDashedId from '../../util/generateId'
import useAuth from '../composables/useAuth'

import { Video, ChevronLeft, ChevronRight, LogOut} from 'lucide-vue-next'


const router = useRouter()
const isLoading = ref(false)
const roomIdInput = ref('')
const { joinRoom, handleLogout } = useAuth()
const currentSlide = ref(0)
const currentAvatar = ref(0)
const showProfileMenu = ref(false)

const slides = [
  {
    title: "Get a link you can share",
    description: "Click New meeting to get a link you can send to people you want to meet with"
  },
  {
    title: "Plan ahead",
    description: "Click New meeting to schedule meetings in Google Calendar"
  },
  {
    title: "Your meeting is safe",
    description: "No one can join a meeting unless invited or admitted by the host"
  }
]
const avatar = [
  {
    src:'./assets/s1.jpg',
  },
  {
    src:'./assets/s3.jpg',
  },
  {
    src:'./assets/s4.jpg',
  }
]

const createMeeting = async () => {
  isLoading.value = true
  try {
    const roomId = generateDashedId()
    await new Promise(resolve => setTimeout(resolve, 800))
    joinRoom()
    router.push(`/chat/${roomId}`)
  } catch (error) {
    console.error('Failed to create meeting:', error)
  } finally {
    isLoading.value = false
  }
}

const joinExistingRoom = () => {
  if (roomIdInput.value.trim()) {
    joinRoom()
    router.push(`/chat/${roomIdInput.value.trim()}`)
  }
}

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.length
  currentAvatar.value = (currentAvatar.value + 1) % avatar.length
}

const prevSlide = () => {
  currentSlide.value = currentSlide.value === 0 ? slides.length - 1 : currentSlide.value - 1
  currentAvatar.value = currentAvatar.value === 0 ? avatar.length - 1 : currentAvatar.value - 1
}


const user = reactive(JSON.parse(sessionStorage.getItem('user') || '{}'))

onUnmounted(() => {
  
})


</script>

<template>
  <main>
    <div class="app-container" >

      <!-- Navigation Bar -->
      <nav class="nav-bar" >
        <div class="nav-content" >
          <div class="nav-left">
            <h1 class="nav-title">Video Calling App</h1>
          </div>
          
          <div class="nav-right">
            
            <!-- Profile Menu -->
            <div class="profile-menu-container">
              <button 
                class="profile-button"
                @click="showProfileMenu = !showProfileMenu"
              >
                <div style="color: black;" class="avatar-placeholder">
                  <span>{{ user.name.charAt(0).toUpperCase() }}</span>
                </div>
              </button>

              <!-- Dropdown Menu -->
              <div 
                v-if="showProfileMenu" 
                class="profile-dropdown"
                @blur="showProfileMenu = false"
              >
                <div class="dropdown-header">
                  <div class="user-info">
                    <p class="user-name">{{ user.name }}</p>
                    <p class="user-email">{{ user.email }}</p>
                  </div>
                </div>
                <div class="dropdown-divider"></div>
                <button 
                  class="dropdown-item"
                  @click="handleLogout"
                >
                  <LogOut class="dropdown-icon" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>


      <div class="content-wrapper">
        <div class="grid-container" >
          <!-- Left Column -->
          <div class="left-column">
            <div class="header-content">
              <h1 class="main-title">Video calls and meetings for everyone</h1>
              <p class="subtitle">Connect, collaborate, and celebrate from anywhere with Video Meet</p>
            </div>

            <div class="actions-container">
              <button
                @click="createMeeting"
                :disabled="isLoading"
                class="new-meeting-btn"
              >
                <Video class="icon" />
                <span>New meeting</span>
              </button>

              <div class="join-container">
                <input
                  v-model="roomIdInput"
                  type="text"
                  placeholder="Enter a code or link"
                  class="join-input"
                  v-on:keyup.enter="joinExistingRoom"
                >
                <button
                  @click="joinExistingRoom"
                  :disabled="!roomIdInput.trim()"
                  class="join-btn"
                >
                  Join
                </button>
              </div>
            </div>

            <div class="learn-more" >
              <a href="#" class="learn-more-link">Learn more</a>  about chat and video calls
            </div>
          </div>

          <!-- Right Column -->
          <div class="right-column" >
            <div class="illustration-container">
              <div class="illustration-wrapper">
                <img src="../assets/s1.jpg" alt="Meeting illustration" class="illustration" v-show="currentAvatar === 0"/>
                <img src="../assets/s3.jpg" alt="Meeting illustration" class="illustration" v-show="currentAvatar === 1"/>
                <img src="../assets/s4.jpg" alt="Meeting illustration" class="illustration" v-show="currentAvatar === 2"/>
              </div>
              
              <!-- Navigation Buttons -->
              <button @click="prevSlide" class="nav-btn nav-btn-left">
                <ChevronLeft class="nav-icon" />
              </button>
              <button @click="nextSlide" class="nav-btn nav-btn-right">
                <ChevronRight class="nav-icon" />
              </button>
            </div>

            <!-- Slide Content -->
            <div class="slide-content" >
              <h2 class="slide-title">{{ slides[currentSlide].title }}</h2>
              <p class="slide-description">{{ slides[currentSlide].description }}</p>
              
              <!-- Slide Indicators -->
              <div class="slide-indicators">
                <button 
                  v-for="(_, index) in slides" 
                  :key="index"
                  @click="currentSlide = index"
                  class="indicator-dot"
                  :class="{ active: index === currentSlide }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style>

main{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background-color: white;
}
.app-container {
  min-height: 98vh;
  min-width: 90vw;
  background-color: #fefeff;
  color: #0a2f4d;
  font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-y: hidden;
}
.nav-bar {
  position: relative;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background-color: #ffffff;
  border-bottom: 1px solid #303134;
  z-index: 50;
  
}
.nav-content {
  max-width: 95vw;
  margin: 0 auto;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}
.nav-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: #000000;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

}
.nav-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.icon-button {
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;
}
.icon-button:hover {
  background-color: #303134;
}
.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #ffffff;
}

.profile-menu-container {
  position: relative;
  animation: fade-in 0.6s ease-out;
}

.profile-button {
  padding: 0.25rem;
  border-radius: 50%;
  transition: background-color 0.2s;
  display: flex;
  justify-content: center;
}

.profile-button:hover {
  background-color: #303134;
}

.avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 100%;
  overflow: hidden;
  background-color: #ffffff;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  
}
.avatar-placeholder {
  width: 2rem;
  height: 2rem;
  background: linear-gradient(to right, #123f79, #ffffff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-placeholder span{
  font-size: 1.5rem;
  font-weight: bold;
  color: rgb(255, 255, 255);
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 320px;
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 50;

}

.dropdown-header {
  padding: 1rem;
}

.user-info {
  text-align: center;
}

.user-name {
  font-weight: 500;
  color: #313131;
}

.user-email {
  font-size: 0.875rem;
  color: #9aa0a6;
}

.dropdown-divider {
  height: 1px;
  background-color: #ffffff;
  margin: 0.5rem 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  color: #ffffff;
  transition: background-color 0.2s;
  background-color: #333333;
  border-radius: 0px 0px 1rem 1rem;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #000000;
}

.dropdown-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.nav-left {
  display: flex;
  align-items: center;
}

.content-wrapper {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0 1rem;
  height: 80vh;

}

.grid-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  min-height: 80vh;
  align-items: center;
  padding: 2rem 0;
  
  
}

@media (min-width: 1024px) {
  .grid-container {
    grid-template-columns: 1fr 1fr;
  }
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-title {
  font-size: 2.5rem;
  line-height: 1.2;
  font-weight: 300;
}

@media (min-width: 640px) {
  .main-title {
    font-size: 3rem;
  }
}

.subtitle {
  color: #9aa0a6;
  font-size: 1.25rem;
}

.actions-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.new-meeting-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #3f60b9;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
  cursor: pointer;
}

.new-meeting-btn:hover {
  background-color: #b1c4fa;
}

.join-container {
  display: flex;
  gap: 0.5rem;
}

.join-input {
  flex: 1;
  background-color: #ffffff;
  color: rgb(0, 0, 0);
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  border: 1px solid #5f6368;
  transition: border-color 0.2s;
}

.join-input:focus {
  outline: none;
  border-color: #1a73e8;
}

.join-btn {
  color: #000000;
  background-color: #5a84f8;
  padding: 0 1rem;
  font-weight: 500;
  transition: color 0.2s;
  border-radius: 10px;
}

.join-btn:hover {
  color: #1557b0;
}

.join-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.learn-more {
  font-size: 0.875rem;
}

.learn-more-link {
  color: #1a73e8;
  text-decoration: none;
}

.learn-more-link:hover {
  color: #1557b0;
}

.right-column {
  position: relative;
}

.illustration-container {
  position: relative;
  width: 100%;
  margin-left: 70px;
  aspect-ratio: 1;
}

.illustration-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.illustration {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.5rem;
  border-radius: 50%;
  background-color: #303134;
  transition: background-color 0.2s;
}

.nav-btn:hover {
  background-color: #404144;
}

.nav-btn-left {
  left: 0;
  transform: translate(-3rem, -50%);
}

.nav-btn-right {
  right: 0;
  transform: translate(3rem, -50%);
}

.nav-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.slide-content {
  text-align: center;
  margin-top: 5rem;
  margin-left: 70px;
}

.slide-title {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #202124;
}

.slide-description {
  font-style: italic;
  color: #3e5266;
  height: 20px;
}

.slide-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.75rem;
}

.indicator-dot {
  width: 0.5rem;
  height: 1rem;
  border-radius: 50%;
  background-color: #5f6368;
  transition: background-color 0.2s;
}

.indicator-dot:hover {
  background-color: #7f8388;
}

.indicator-dot.active {
  background-color: #2c705f;
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
}

@media (min-width: 640px) {
  .right-column{
    display: hidden;
  }
}
</style>