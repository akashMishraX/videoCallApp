import express,{ Request, Response} from "express"

const app = express()
const port = 5000

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!!!!!')
})

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})