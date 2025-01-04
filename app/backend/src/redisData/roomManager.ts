export default class RoomManager {
    public redis
    constructor(redis: any) {
        this.redis = redis
    }

    /**
     * Get room key
     * @param roomId string
     * @return string
    */
    getRoomKey(roomId: string): string {
        return `room:${roomId}`
    }

    /**
     * Get user key
     * @param roomId string
     * @return string
    */
    getUserKey(roomId: string, userId: string): string {
        return `user:${roomId}:${userId}`
    }
    
      /**
     * Check if a room exists (regardless of active status)
     * @param roomId string
     * @returns Promise<boolean>
     */
    async doesRoomExist(roomId: string): Promise<boolean> {
        try {
            const roomKey = this.getRoomKey(roomId)
            const exists = await this.redis.exists(roomKey)
            return exists === 1
        } catch (error) {
            console.error('Failed to check room existence:', error)
            throw error
        }
    }

  
    // Update the createRoom method to use the new existence check
    async createRoom(roomId: string, roomData: {
        roomName: string,
        roomSize: number,
        createdAt?: string
    }): Promise<boolean> {
        try {
            // Check if room already exists using the new method
            const exists = await this.doesRoomExist(roomId)
            if (exists) {
                throw new Error(`Room ${roomId} already exists`)
            }

            const formattedRoomData = {
                ...roomData,
                createdAt: roomData.createdAt || new Date().toISOString()
            }

            const multi = this.redis.multi()
            
            // Set room data
            multi.hmset(this.getRoomKey(roomId), formattedRoomData)
            
            // Add to active rooms
            multi.sadd('activeRooms', roomId)
            
            // Set expiration
            multi.expire(this.getRoomKey(roomId), 24 * 60 * 60)
            
            await multi.exec()
            return true
        } catch (error) {
            console.error('Failed to create room:', error)
            throw error
        }
    }

    // Update the updateRoomData method to use the new existence check
    async updateRoomData(roomId: string, updates: {
        roomName?: string,
        roomSize?: number,
        isActive?: string
    }): Promise<boolean> {
        try {
            // Check if room exists using the new method
            const exists = await this.doesRoomExist(roomId)
            if (!exists) {
                throw new Error(`Room ${roomId} does not exist`)
            }

            // Get current room data
            const currentData = await this.getRoomData(roomId)
            if (!currentData) {
                throw new Error(`No data found for room ${roomId}`)
            }

            // Merge updates with current data
            const updatedData = {
                ...currentData,
                ...updates,
                isActive: updates.isActive || currentData.isActive.toString()
            }

            // Update room data
            await this.redis.hmset(this.getRoomKey(roomId), updatedData)


            return true
        } catch (error) {
            console.error('Failed to update room data:', error)
            throw error
        }
    }

    /**
     * Set room data
     * @param roomId string
     * @return Promise<boolean>
    */
    async setRoomData(roomId: string, roomData: {
        roomName: string,
        roomSize: string,
        createdAt: string
    }): Promise<boolean> {
        const roomKey = this.getRoomKey(roomId)
        try {
            await this.redis.hmset(roomKey, roomData)
            await this.redis.expire(roomKey, 24 * 60 * 60) // 24 hours
            return true
        } catch (error) {
            console.error('Failed to set room data:', error)
            throw error
        }
    }
    
    /**
    * Add user to room
    * @param roomId string
    * @return Promise<boolean>
   */
    async addUserToRoom(roomId: string, userId: string, userData: {
        socketId: string,
        isAudioEnabled: boolean,
        isVideoEnabled: boolean,
        avator: string
    }): Promise<boolean> {
        const roomKey = this.getRoomKey(roomId)
        const userKey = this.getUserKey(roomId, userId)

        try {
            const multi = this.redis.multi()
            multi.sadd('activeRooms', roomId)
            
            // Format boolean values for Redis storage
            multi.hmset(userKey, {
                socketId: userData.socketId,
                isAudioEnabled: userData.isAudioEnabled.toString(),
                isVideoEnabled: userData.isVideoEnabled.toString(),
                avator: userData.avator,
                joinedAt: new Date().toISOString()
            })

            multi.sadd(`${roomKey}:users`, userId)
            multi.expire(`${roomKey}:users`, 24 * 60 * 60)
            await multi.exec()
            return true
        } catch (error) {
            console.error('Failed to add user to room:', error)
            throw error
        }
    }


     /**
     * Get room data
     * @param roomId string
     * @return Promise<any>
    */
    async getRoomData(roomId: string): Promise<any> {
        const roomKey = this.getRoomKey(roomId)
        try {
            const roomData = await this.redis.hgetall(roomKey)
            if (Object.keys(roomData).length === 0) return null
            return {
                roomName: roomData.roomName,
                roomSize: roomData.roomSize,
                isActive: roomData.isActive === 'true',
                createdAt: roomData.createdAt
            }
        } catch (error) {
            console.error('Failed to get room data:', error)
            throw error
        }
    }

    /**
     * Get room users
     * @param roomId string
     * @return Promise<boolean>
    */
    async getRoomUsers(roomId: string): Promise<any> {
        const roomKey = this.getRoomKey(roomId)
        try {
            const userIds = await this.redis.smembers(`${roomKey}:users`)

            const userDataPromises = userIds.map(async (userId: string) => {
                const userData = await this.redis.hgetall(this.getUserKey(roomId, userId))
                
                return {
                    userId,
                    ...userData,
                    isAudioEnabled: userData.isAudioEnabled === 'true',
                    isVideoEnabled: userData.isVideoEnabled === 'true',
                    joinedAt: userData.joinedAt,

                }
            })

            return await Promise.all(userDataPromises)
        } catch (error) {
            console.error('Failed to get room users:', error)
            throw error
        }
    }



 

    /**
     * Check if user is in room
     * @param roomId string
     * @return Promise<boolean>
    */
    async isUserInRoom(roomId: string, userId: string) : Promise<boolean> {
        const userKey = this.getUserKey(roomId, userId)
        try {
            return await this.redis.exists(userKey)
        } catch (error) {
            console.error('Failed to check if user is in room:', error)
            throw error
        }
    }

    async isRooomEmpty(roomId: string): Promise<boolean> {
        const roomKey = this.getRoomKey(roomId)
        try {
            const roomSize = await this.redis.scard(`${roomKey}:users`)
            return roomSize === 0
        } catch (error) {
            console.error('Failed to check if room is empty:', error)
            throw error
        }
    }


    /**
     * Get room size
     * @param roomId string
     * @return Promise<number>
    */
    async getRoomSize(roomId: string): Promise<number> {
        try{
            const roomKey = this.getRoomKey(roomId)
            return await this.redis.scard(`${roomKey}:users`)
        }catch(error){
            console.error('Failed to get room size:', error)
            throw error
        }

    }

    /**
     * remove user from room
     * @param roomId string
     * @param userId string
     * @return Promise<boolean>
    */
    async removeUserFromRoom(roomId: string, userId: string): Promise<boolean> {
        const roomKey = this.getRoomKey(roomId)
        const userKey = this.getUserKey(roomId, userId)
        
        try {
            const multi = this.redis.multi()
            
            // Remove user first
            multi.del(userKey)
            multi.srem(`${roomKey}:users`, userId)
            
            // Check remaining users before removing room
            let roomSize = await this.redis.scard(`${roomKey}:users`)
            if (roomSize <= 1) {  // Using 1 because current user hasn't been removed yet
                return false
            }
            await this.updateRoomData(roomId, {roomSize: roomSize - 1})
            
            await multi.exec()
            return true
        } catch (error) {
            console.error('Failed to remove user from room:', error)
            throw error
        }
    }

    /**
     * Update user data
     * @param roomId string
     * @param userId string
     * @param updates any
     * @return Promise<boolean>
    */
    async updateUserData(roomId: string, userId: string, updates: any): Promise<boolean> {
        const userKey = this.getUserKey(roomId, userId)

        try {
            const formattedUpdates = Object.entries(updates).reduce((acc: any, [key, value]) => {
                if (typeof value === 'boolean') {
                    acc[key] = value ? 'true' : 'false'
                } else if (value instanceof Date) {
                    acc[key] = value.toISOString()
                } else {
                    acc[key] = value
                }
                return acc
            }, {})

            await this.redis.hmset(userKey, formattedUpdates)
            return true
        } catch (error) {
            console.error('Failed to update user data:', error)
            throw error
        }
    }

    /**
     * Get complete room data including room information, users, and their messages
     * @param roomId string
     * @returns Promise<{
     *   roomId: string,
     *   roomData: {
     *     roomName: string,
     *     roomSize: string,
     *     isActive: string,
     *     createdAt: string
     *   },
     *   users: Array<{
     *     userId: string,
     *     socketId: string,
     *     isAudioEnabled: boolean,
     *     isVideoEnabled: boolean,
     *     avator: string,
     *     joinedAt: string,
    
     *     }>
     *   }>
     * }>
     */

    async extractRoomData(roomId: string) {
        try {
            // First check if room exists
            const roomExists = await this.doesRoomExist(roomId)
            if (!roomExists) {
                return {
                    exists: false,
                    isActive: false,
                    roomId,
                    roomData: null,
                    users: [],
                    message: "Room does not exist"
                }
            }
    
            // Get room metadata
            const roomData = await this.getRoomData(roomId)
            if (!roomData) {
                return {
                    exists: true,
                    isActive: false,
                    roomId,
                    roomData: null,
                    users: [],
                    message: "Room exists but has no data"
                }
            }
    
    
            // Get all users and their data
            const users = await this.getRoomUsers(roomId)
            
            interface User {
                userId: string,
                socketId: string,
                isAudioEnabled: boolean,
                isVideoEnabled: boolean,
                avator: string,
                joinedAt: string, 
            }
    
            interface FormattedResponse {
                exists: boolean,
                isActive: boolean,
                roomId: string,
                roomData: {
                    roomName: string,
                    roomSize: string,
                    isActive: string,
                    createdAt: string
                },
                users: User[],
            }
           
            // Format the response to match the desired structure
            const formattedResponse = {
                exists: true,
                isActive: true,
                roomId,
                roomData: {
                    roomName: roomData.roomName,
                    roomSize: roomData.roomSize,
                    isActive: roomData.isActive.toString(),
                    createdAt: roomData.createdAt
                },
                users: users.map((user: User) => ({
                    userId: user.userId,
                    socketId: user.socketId,
                    isAudioEnabled: user.isAudioEnabled.toString(),
                    isVideoEnabled: user.isVideoEnabled.toString(),
                    avator: user.avator,
                    joinedAt: user.joinedAt,
                }))
            } as FormattedResponse
    
            return formattedResponse
        } catch (error) {
            console.error('Failed to extract room data:', error)
            // Return a structured error response instead of throwing
            return {
                exists: false,
                isActive: false,
                roomId,
                roomData: null,
                users: [],
            }
        }
    }

     /**
     * Get complete data for multiple rooms
     * @param roomIds Array of room IDs to fetch data for
     * @returns Promise<Array<RoomData>>
     */
     async extractMultipleRoomsData(roomIds: string[]) {
        try {
            const roomDataPromises = roomIds.map(roomId => 
                this.extractRoomData(roomId)
                    .catch(error => {
                        console.warn(`Failed to get data for room ${roomId}:`, error)
                        return null
                    })
            )

            const rooms = await Promise.all(roomDataPromises)
            return rooms.filter(room => room !== null)
        } catch (error) {
            console.error('Failed to extract multiple rooms data:', error)
            throw error
        }
    }

    /**
     * Get data for all active rooms
     * @returns Promise<Array<RoomData>>
     */
    async extractAllActiveRoomsData() {
        try {
            const activeRooms = await this.redis.smembers('activeRooms')
            return this.extractMultipleRoomsData(activeRooms)
        } catch (error) {
            console.error('Failed to extract all active rooms data:', error)
            throw error
        }
    }


}