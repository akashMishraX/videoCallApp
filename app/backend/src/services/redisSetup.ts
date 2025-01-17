import Redis from 'ioredis'
import RoomManager from '../redisData/roomManager';
import SignalingServiceManager from '../redisData/connectionManger';
require('dotenv').config()
export function InitRedis(){
    
    console.log('Got redis url:-',process.env.REDIS_URL)
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    // const url = new URL(redisUrl);
    // const redisOptions = {
    //     host: url.hostname, 
    //     port: parseInt(url.port),
    //     password: url.password, 
    //     retryStrategy: (times: number) =>{
    //         return Math.min(times * 50, 2000);
    //     }
    // };
    const pub = new Redis(redisUrl)
    const sub = new Redis(redisUrl)

    console.log('Redis init....')
    pub.on('connect',()=>{
        console.log('Pub connected')
    })
    sub.on('connect',()=>{
        console.log('Sub connected')
    })
    pub.flushall()
    const roomManager = new RoomManager(pub)
    const signalingServiceManager = new SignalingServiceManager(pub)


    return {
        pub,
        sub,
        roomManager,
        signalingServiceManager
    }
}