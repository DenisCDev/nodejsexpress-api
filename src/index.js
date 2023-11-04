const express = require("express");
const moongose = require("mongoose");

const app = express()
const port = 2000
mongoose.connect('mongodb+srv://denisscarabelli:<password>@api-rpg.sc7thba.mongodb.net/?retryWrites=true&w=majority');

const Personagem = mongoose.model('Personagem', {
    nome: String,
    idade: Number,
    classe: String,
    nivel: Number,
    raca: String,
    antecedente: String,
    alinhamento: String,
    imagemPersonagem: String
});

app.get("/", (req, res) => {
    res.send('Começando novo projeto node com express')
})

app.post("/", (req, res) => {
    const film = new Film({
        nome: req.body.nome,
        idade: req.body.idade,
        classe: req.body.classe,
        nivel: req.body.nivel,
        raca: req.body.raca,
        antecedente: req.body.antecedente,
        alinhamento: req.body.alinhamento,
        imagemPersonagem: req.body.imagemPersonagem,
    })
})

app.listen(port, () => {
    console.log(`Estou escutando a "port": ${port}`)
})
