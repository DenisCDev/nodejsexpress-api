const express = require("express")
const app = express()
const port = 2000

app.get('/', (req, res) => {
    res.send('Começando novo projeto node com express')
})

app.listen(port, () => {
    console.log(`Estou escutando a "port": ${port}`)
})
