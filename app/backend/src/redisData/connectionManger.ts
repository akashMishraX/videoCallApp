import Redis from "ioredis";

export default class SignalingServiceManager {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // Helper methods for Redis keys
  private getOfferKey(roomId: string): string {
    return `offer:${roomId}`;
  }

  private getAnswerKey(roomId: string): string {
    return `answers:${roomId}`;
  }

  /**
   * Get key for ICE candidates between two peers
   */
  private getIceCandidateKey(roomId: string, senderId: string, receiverId: string): string {
    return `ice:${roomId}:${senderId}:${receiverId}`;
  }


  private getOffererKey(roomId: string): string {
    return `offerer:${roomId}`;
  }

  /**
   * Add an offer to Redis
   */
  async addOffer(roomId: string, offer: RTCSessionDescriptionInit, ttl: number): Promise<void> {
    const offerKey = this.getOfferKey(roomId);
    await this.redis.set(offerKey, JSON.stringify(offer), "EX", ttl);
  }
 /**
   * Get an offer from Redis
   * @param roomId : string
   * @return Promise<string | null>
   */
    async getOffer(roomId: string): Promise<string | null> {
        const offerKey = this.getOfferKey(roomId);
        const offer = await this.redis.get(offerKey);
        return offer ? JSON.parse(offer) : null;
    }
  /**
   * Get the current offerer for a room
   */
  async getOfferer(roomId: string): Promise<string | null> {
    const offererKey = this.getOffererKey(roomId);
    return this.redis.get(offererKey);
  }

  /**
   * Set a new offerer for a room
   */
  private async setOfferer(roomId: string, newOffererSocketId: string): Promise<void> {
    const offererKey = this.getOffererKey(roomId);
    await this.redis.set(offererKey, newOffererSocketId);
  }

  /**
   * Change the offerer for a room and clean all previous signaling data
   * @param roomId : string
   * @param newOffererId : string
   * @return Promise<void>
   */
  async changeOfferer(roomId: string, roomManager: any): Promise<void> {
    // Fetch room data to get the list of users
    const roomData = await roomManager.extractRoomData(roomId);
  
    // Ensure there are remaining users to assign as the new offerer
    if (!roomData || !roomData.users || roomData.users.length === 0) {
      throw new Error(`No users available in room ${roomId} to assign as the new offerer.`);
    }
  
    // Randomly select a new offerer from the remaining users
    const newOffererId = roomData.users[Math.floor(Math.random() * roomData.users.length)].socketId;
  
    // Remove existing signaling data
    await this.removeOffer(roomId);
    await this.removeAllAnswers(roomId);
    await this.removeRoomIceCandidates(roomId);
  
    // Set the new offerer
    await this.setOfferer(roomId, newOffererId);
  
    // Optionally notify the new offerer to create a new offer
    console.log(`Offerer changed to ${newOffererId} for room ${roomId}`);
  }
  

  /**
   * Remove an offer from Redis
   */
  async removeOffer(roomId: string): Promise<void> {
    const offerKey = this.getOfferKey(roomId);
    await this.redis.del(offerKey);
  }

  /**
   * Add an answer to Redis (answers are keyed by participant ID)
   */
  async addAnswer(roomId: string, participantId: string, answer: RTCSessionDescriptionInit, ttl: number): Promise<void> {
    const answerKey = this.getAnswerKey(roomId);
    await this.redis.hset(answerKey, participantId, JSON.stringify(answer));
    await this.redis.expire(answerKey, ttl);
  }
 /**
   * Get an answer from Redis
   * @param roomId : string
   * @param participantId : string
   * @return Promise<string | null>
   */
 async getAnswer(roomId: string, participantId: string): Promise<string | null> {
     const answerKey = this.getAnswerKey(roomId);
     const answer = await this.redis.hget(answerKey, participantId);
     return answer ? JSON.parse(answer) : null;
 }
  /**
   * Remove all answers from Redis for a room
   */
  async removeAllAnswers(roomId: string): Promise<void> {
    const answerKey = this.getAnswerKey(roomId);
    await this.redis.del(answerKey);
  }

 /**
   * Add an ICE candidate for a specific peer connection
   */
 async addIceCandidate(
  roomId: string, 
  senderSocketId: string, 
  receiverSocketId: string, 
  candidate: RTCIceCandidateInit, 
  ttl: number
): Promise<void> {
  const iceKey = this.getIceCandidateKey(roomId, senderSocketId, receiverSocketId);
  await this.redis.rpush(iceKey, JSON.stringify(candidate));
  await this.redis.expire(iceKey, ttl);
}

/**
 * Get ICE candidates for a specific peer connection
 */
async getIceCandidates(
  roomId: string, 
  senderSocketId: string, 
  receiverSocketId: string
): Promise<string[]> {
  const iceKey = this.getIceCandidateKey(roomId, senderSocketId, receiverSocketId);
  const candidate =  await this.redis.lrange(iceKey, 0, -1);
  return candidate
}

/**
 * Remove ICE candidates for a specific peer connection
 */
async removeIceCandidates(
  roomId: string, 
  senderSocketId: string, 
  receiverSocketId: string
): Promise<void> {
  const iceKey = this.getIceCandidateKey(roomId, senderSocketId, receiverSocketId);
  await this.redis.del(iceKey);
}

/**
 * Remove all ICE candidates for a peer in a room
 */
async removePeerIceCandidates(roomId: string, peerId: string): Promise<void> {
  // Get all keys matching the pattern for this peer
  const pattern = `ice:${roomId}:${peerId}:*`;
  const keys = await this.redis.keys(pattern);
  
  // Also get keys where this peer is the receiver
  const receiverPattern = `ice:${roomId}:*:${peerId}`;
  const receiverKeys = await this.redis.keys(receiverPattern);
  
  // Combine all keys and delete them
  const allKeys = [...keys, ...receiverKeys];
  if (allKeys.length > 0) {
    await this.redis.del(...allKeys);
  }
}

/**
 * Remove all ICE candidates for a room
 */
async removeRoomIceCandidates(roomId: string): Promise<void> {
  const pattern = `ice:${roomId}:*`;
  const keys = await this.redis.keys(pattern);
  if (keys.length > 0) {
    await this.redis.del(...keys);
  }
}
}
