import express,{ Request, Response} from "express"
import { createServer} from "node:http"
import  setupSocket  from "./sockets/socketSetup";
import  cors  from 'cors'



const app = express()
const httpServer = createServer(app)
const port = process.env.PORT || 3000;
console.log(process.env.PORT)
const io = setupSocket(httpServer,2)

app.use(cors())
app.use(express.json())


app.get('/', (req: Request, res: Response) => {
  res.send(`<h1>⚡️[server]: Server is running</h1>\n
            <h1>⚡️[client]: Client is running on <a href="http://localhost:5173">5173</a></h1>`)
})



httpServer.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})

