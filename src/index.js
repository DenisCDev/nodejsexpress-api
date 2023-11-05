const express = require("express");
const mongoose = require("mongoose");

const app = express()
const port = 2000
mongoose.connect('mongodb+srv://denisscarabelli:px0XOZUqEoTfPQGQ@api-rpg.sc7thba.mongodb.net/?retryWrites=true&w=majority');

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

app.post("/", async (req, res) => {
    const personagem = new Personagem({
        nome: req.body.nome,
        idade: req.body.idade,
        classe: req.body.classe,
        nivel: req.body.nivel,
        raca: req.body.raca,
        antecedente: req.body.antecedente,
        alinhamento: req.body.alinhamento,
        imagemPersonagem: req.body.imagemPersonagem,
    })

    await personagem.save()
    res.send(personagem)
})

app.listen(port, () => {
    console.log(`Estou escutando a "port": ${port}`)
})
