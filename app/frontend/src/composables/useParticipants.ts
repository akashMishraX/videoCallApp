import { ref } from 'vue'
import type { Ref } from 'vue'

interface Participant {
  id: string
  name: string
  avatar: string
  email: string
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  joinedAt: Date
}

export function useParticipants() {
    const participants: Ref<Participant[]> = ref([])
    const activeParticipant: Ref<Participant | null> = ref(null)

    const addParticipant = (userData: any) => {
        const newParticipant: Participant = {
            id: userData.sub || userData.email,
            name: userData.name,
            avatar: userData.picture,
            email: userData.email,
            isAudioEnabled: true,
            isVideoEnabled: true,
            joinedAt: new Date()
        }

        // Check if participant already exists
        const exists = participants.value.some(p => p.id === newParticipant.id)
        if (!exists) {
            participants.value.push(newParticipant)
        }
        
        return newParticipant
    }

    const removeParticipant = (participantId: string) => {
        participants.value = participants.value.filter(p => p.id !== participantId)
    }

    const updateParticipant = (participantId: string, updates: Partial<Participant>) => {
        const index = participants.value.findIndex(p => p.id === participantId)
        if (index !== -1) {
          participants.value[index] = { ...participants.value[index], ...updates }
        }
    }

    return {
        participants,
        activeParticipant,
        addParticipant,
        removeParticipant,
        updateParticipant
    }

}