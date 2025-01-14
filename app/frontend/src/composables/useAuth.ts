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

    const initializeAuth = async () => {
        const storedIsLogged = sessionStorage.getItem('isLogged')
        const storedUser = sessionStorage.getItem('user')
        
        if (storedIsLogged && storedUser) {
            isLogged.value = storedIsLogged === 'true'
            user.value = JSON.parse(storedUser)
        }
    }

    const handleLogin = async(userData: GoogleUser) => {
        isLogged.value = true
        // let base64Image = ''
        // await fetchAndStoreImage(userData.picture, userData)
  
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

    // Function to fetch image and store in sessionStorage
    // async function fetchAndStoreImage(imageUrl: string, userObj: GoogleUser) {
    //     return fetch(imageUrl)
    //     .then(response => response.blob())
    //     .then(blob => {
    //         return new Promise((resolve, reject) => {
    //             const reader = new FileReader();
                
    //             reader.onloadend = () => {
    //                 try {
    //                     // console.log('Image fetched and stored:', userObj.picture);
    //                     if (reader.result !== null) {
    //                         userObj.picture = reader.result as string;
    //                         resolve(reader.result as string);
    //                     } else {
    //                         reject(new Error('Failed to read image result'));
    //                     }
    //                 } catch (error) {
    //                     reject(error);
    //                 }
    //             }
                
    //             reader.onerror = () => {
    //                 reject(new Error('Failed to convert blob to base64'));
    //             };
                
    //             // Convert blob to base64
    //             reader.readAsDataURL(blob);
    //         });
        
    //     })
    // }
  
    // Function to retrieve and display stored image
    
  
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