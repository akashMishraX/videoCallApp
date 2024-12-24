import express,{ Request, Response} from "express"
import { createServer, Server } from "node:http"
import  setupSocket  from "./sockets/socketSetup";


const app = express()
const httpServer = createServer(app)
const port = process.env.PORT || 3000;

const io = setupSocket(httpServer,2)

app.get('/', (req: Request, res: Response) => {
  res.send('<h1>Hello world</h1>')
})



httpServer.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})