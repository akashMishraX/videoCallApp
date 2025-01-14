
<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Logo/Brand Section -->
      <div class="brand-section">
        <div class="logo-wrapper">
          <div class="logo">
            <span>
              VA
            </span>
          </div>
        </div>
        <h1 class="main-title">Welcome to videoapp</h1>
        <p class="subtitle">Let's get started</p>
      </div>

      <!-- Login Card -->
      <div class="login-card">
        <div class="login-content">
          <!-- Sign in Section -->
          <div class="signin-header">
            <h2>Sign In</h2>
            <p>Use your Google account to continue</p>
          </div>

          <!-- Google Login Button -->
          <div style="display: flex;justify-content: center; align-items: center;">
            <GoogleLogin :callback="callback" :auto-login="true" ></GoogleLogin>   
          </div>  
          <!-- Footer Text -->
          <div class="terms-text">
            <p>By continuing, you agree to our Terms of Service</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { GoogleLogin, decodeCredential } from 'vue3-google-login'
import useAuth from '../composables/useAuth'

const router = useRouter()
const { isLogged, handleLogin, initializeAuth } = useAuth()

interface GoogleUser {
  iss: string
  nbf: number
  aud: string
  sub: string
  email: string
  email_verified: boolean
  azp: string
  name: string
  picture: string
  given_name: string
  family_name: string
  iat: number
  exp: number
  jti: string
}



watch(
  () => isLogged.value,
  (newValue) => {
    if (newValue) {
      router.push('/')
    }
  },
  { immediate: true } // This will run the check immediately on mount too
)

onMounted(async () => {
  await initializeAuth()
})



const callback = async (response: any) => {
  try {
    const decodedUser = decodeCredential(response.credential) as GoogleUser
    console.log('Login successful')
    handleLogin(decodedUser)
    router.push('/')
  } catch (error) {
    console.error('Login error:', error)
  }
}


</script>

<style scoped>


/* Base Layout */
.login-page {
  min-height: 90vh;
  background: linear-gradient(to bottom, #f9fafb, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 28rem;
}

/* Brand Section */
.brand-section {
  text-align: center;
  margin-bottom: 3rem;
  animation: fade-in 0.6s ease-out;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.logo {
  width: 4rem;
  height: 4rem;
  background: linear-gradient(to right, #808080, #b2c8f8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo span {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.main-title {
  font-size: 1.875rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6b7280;
}


/* Login Card */
.login-card {
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 2rem;
  animation: slide-up 0.5s ease-out;
  margin: 0 auto;
}

.login-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Sign in Section */
.signin-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.signin-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

.signin-header p {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Google Button */
.google-button {
  width: 100%;
  transform: translateY(0);
  transition: all 0.2s;
  background-color: white;
  color: #374151;
  font-weight: 500;
  padding:0rem 0rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.google-button:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.google-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Terms Text */
.terms-text {
  text-align: center;
}

.terms-text p {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Animations */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
