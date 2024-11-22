require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { CosmosClient } = require('@azure/cosmos');

const app = express();
const port = process.env.PORT || 3000;

const cors = require('cors');

// Habilitar CORS
app.use(cors({
    origin: '*', // Permite todas as origens. Ajuste isso para maior segurança.
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));


// Configuração do Cosmos DB
const client = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY,
});
const database = client.database(process.env.COSMOS_DB_DATABASE);
const container = database.container(process.env.COSMOS_DB_CONTAINER);

// Middleware
app.use(bodyParser.json());

// Rotas
app.get('/', (req, res) => {
    res.send('API Backend funcionando!');
});

// Login (exemplo)
app.post('/login', async (req, res) => {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
        return res.status(400).json({ error: 'Por favor, forneça usuário e senha.' });
    }

    try {
        const query = `SELECT * FROM c WHERE c.usuario = @usuario AND c.senha = @senha`;
        const { resources } = await container.items
            .query({
                query,
                parameters: [
                    { name: '@usuario', value: usuario },
                    { name: '@senha', value: senha }
                ]
            })
            .fetchAll();

        if (resources.length > 0) {
            res.status(200).json({ message: 'Login realizado com sucesso!' });
        } else {
            res.status(401).json({ error: 'Usuário ou senha inválidos.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao acessar o banco de dados.' });
    }
});

// Listar Projetos
app.get('/projetos', async (req, res) => {
    try {
        const { resources: projetos } = await container.items.readAll().fetchAll();
        res.status(200).json(projetos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar projetos.' });
    }
});

// Criar Projeto
app.post('/projetos', async (req, res) => {
    const { nome, descricao, status } = req.body;

    if (!nome || !descricao || !status) {
        return res.status(400).json({ error: 'Por favor, forneça todos os campos necessários.' });
    }

    try {
        const novoProjeto = { nome, descricao, status, data_criacao: new Date().toISOString() };
        await container.items.create(novoProjeto);
        res.status(201).json({ message: 'Projeto criado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar projeto.' });
    }
});

// Atualizar Projeto (PUT)
app.put('/projetos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, status } = req.body;

    if (!nome || !descricao || !status) {
        return res.status(400).json({ error: 'Por favor, forneça todos os campos necessários.' });
    }

    try {
        const projetoAtualizado = { id, nome, descricao, status, data_atualizacao: new Date().toISOString() };
        await container.item(id, id).replace(projetoAtualizado);
        res.status(200).json({ message: 'Projeto atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar projeto.' });
    }
});

// Deletar Projeto (DELETE)
app.delete('/projetos/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Por favor, forneça o ID do projeto a ser deletado.' });
    }

    try {
        await container.item(id, id).delete();
        res.status(200).json({ message: 'Projeto deletado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar projeto.' });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
