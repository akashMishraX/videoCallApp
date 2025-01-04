import Redis from 'ioredis'
import RoomManager from '../redisData/roomManager';

export function InitRedis(){
    const redisOptions = {
        host : 'localhost',
        port : 6379,
        retryStrategy: (times: number) =>{
            return Math.min(times * 50, 2000);
        }
    } 
    const pub = new Redis(redisOptions)
    const sub = new Redis(redisOptions)

    console.log('Redis init....')
    pub.on('connect',()=>{
        console.log('Pub connected')
    })
    sub.on('connect',()=>{
        console.log('Sub connected')
    })

    const roomManager = new RoomManager(pub)
    return {
        pub,
        sub,
        roomManager
    }
}