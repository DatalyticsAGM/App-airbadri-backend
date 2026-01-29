import express from 'express'

const app = express()
const port = 3333

app.get('/', (req, res) => {
  res.send('Hello Worlddddda! esto es un cambio')
})

app.listen(port, () => {
  console.log(`listo para abrir http://localhost:${port}`)
})
