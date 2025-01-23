import express,{ Request, Response} from "express"
import { createServer} from "node:https"
import fs from 'fs' 
import SocketSetup from './services/socketSetup'
import  cors  from 'cors'
// import getAllParticipants from "./functions/index"

// const privateKey = fs.readFileSync('./src/cert.key', 'utf8'); // Path to your private key
// const certificate = fs.readFileSync('./src/cert.crt', 'utf8'); // Path to your certificate
// const ca = fs.readFileSync('./src/ca.crt', 'utf8'); // Optional, for full chain

const privateKey = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/chain.pem', 'utf8'); // Optional, if you need it

const credentials = { key: privateKey, cert: certificate, ca };

// console.log(credentials)

const app = express()
const httpServer = createServer(credentials, app)
const port = process.env.PORT || 3000;
console.log(process.env.PORT)
const socketSetup = new SocketSetup(httpServer)

app.use(cors())
app.use(express.json())
export default app

socketSetup.ioListener()
app.get('/', (req: Request, res: Response) => {
  res.send(`<h1>⚡️[server]: Server is running</h1>\n
            <h1>⚡️[client]: Client is running on <a href="http://localhost:5173">5173</a></h1>`)
})


// app.get('/api/:roomId/participants',async (req: Request, res: Response) => {
//   try{

//     const participants = getAllParticipants(req.params.roomId)
//     console.log(participants)
//     res.json({
//         code: 200,
//         status: 'success',
//         participants: participants,
//         message: 'Participants fetched successfully'
//     })
//   }
//   catch(error){
//     console.error('Failed to load participants:', error)
//     res.json({
//       code: 500,
//       status: 'error',
//       message: 'Failed to load participants'
//     })
//   }
// })

httpServer.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})

