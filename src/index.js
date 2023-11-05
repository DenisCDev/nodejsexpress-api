const express = require("express")
const mongoose = require('mongoose');

const app = express()
app.use(express.json())
const port = 2000

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

app.get("/", async (req, res) => {
    const personagens = await Personagem.find()
    res.send(personagens)
})

app.delete("/:id", async(req, res) => {
    const personagem = await Personagem.findByIdAndDelete(req.params.id)
    return res.send(personagem)
})

app.put("/:id", async(req, res) => {
    const personagem = await Personagem.findByIdAndUpdate(req.params.id, {
        nome: req.body.nome,
        idade: req.body.idade,
        classe: req.body.classe,
        nivel: req.body.nivel,
        raca: req.body.raca,
        antecedente: req.body.antecedente,
        alinhamento: req.body.alinhamento,
        imagemPersonagem: req.body.imagemPersonagem
    }, {
        new: true
    })

    return res.send(personagem)
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
        imagemPersonagem: req.body.imagemPersonagem
    })

    await personagem.save()
    res.send(personagem)
})

app.listen(port, () => {
    mongoose.connect('mongodb+srv://denisscarabelli:R06VlSvqNNCcVBcK@api-rpg.sc7thba.mongodb.net/?retryWrites=true&w=majority');
    console.log(`Estou escutando a porta: ${port}`)
})
