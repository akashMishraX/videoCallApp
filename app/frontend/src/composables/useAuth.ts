import { Ref, ref } from "vue";
import router from "../App.vue";

// types/auth.ts
export default function useAuth() {
    interface GoogleUser {
        iss: string;
        nbf: number;
        aud: string;
        sub: string;
        email: string;
        email_verified: boolean;
        azp: string;
        name: string;
        picture: string;
        given_name: string;
        family_name: string;
        iat: number;
        exp: number;
        jti: string;
    }
    const isLogged: Ref<boolean> = ref(false)
    const user: Ref<GoogleUser | null> = ref(null)  

    const initializeAuth = () => {
        const storedIsLogged = sessionStorage.getItem('isLogged')
        const storedUser = sessionStorage.getItem('user')

        if (storedIsLogged && storedUser) {
            isLogged.value = storedIsLogged === 'true'
            user.value = JSON.parse(storedUser)
        }
    }

    const handleLogin = (userData: GoogleUser) => {
        isLogged.value = true
        user.value = userData
        clearSessionStorage()
        createSessionStorage(userData)
    }

    const handleLogout = () => {
        isLogged.value = false
        leaveRoom()
        user.value = null
        clearSessionStorage()
        router.push('/login')
    }

    const clearSessionStorage = () => {
        sessionStorage.removeItem('isLogged')
        sessionStorage.removeItem('isJoined')
        sessionStorage.removeItem('user')
    }

    const createSessionStorage = (userData: GoogleUser) => {
        sessionStorage.setItem('isLogged', 'true')
        sessionStorage.setItem('isJoined', 'false')
        sessionStorage.setItem('user', JSON.stringify(userData))
    }
    const joinRoom = () => {
        sessionStorage.setItem('isJoined', 'true')
    }
    const leaveRoom = () => {
        sessionStorage.removeItem('isJoined')
    }
    return {
        isLogged,
        user,
        initializeAuth,
        handleLogin,
        handleLogout,
        clearSessionStorage,
        joinRoom,
        leaveRoom
    }
}