require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { CosmosClient } = require('@azure/cosmos');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
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

// Variável de cache
let cacheProjetos = null;

// Função para verificar o cache ou buscar do banco
async function getProjetosComCache() {
    // Se o cache já está preenchido, retorna os dados
    if (cacheProjetos) {
        console.log('Usando cache');
        return cacheProjetos;
    }

    // Caso contrário, busca do banco e atualiza o cache
    console.log('Atualizando cache do banco');
    const { resources: projetos } = await container.items.readAll().fetchAll();
    cacheProjetos = projetos;
    return projetos;
}

// Rota para verificar se a API está funcionando
app.get('/', (req, res) => {
    res.send('API Backend funcionando!');
});

// Listar Projetos (usando cache)
app.get('/projetos', async (req, res) => {
    try {
        const projetos = await getProjetosComCache(); // Usa a função com cache
        res.status(200).json(projetos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar projetos.' });
    }
});

// Criar Projeto
app.post('/projetos', async (req, res) => {
    const { nome, descricao, status, statusAtual, dataInicio, prazo } = req.body;

    if (!nome || !status) {
        return res.status(400).json({ error: 'Por favor, forneça pelo menos o nome e o status do projeto.' });
    }

    try {
        const novoProjeto = {
            nome,
            descricao: descricao || '',
            status,
            statusAtual: statusAtual || '',
            dataInicio: dataInicio || null,
            prazo: prazo || null,
            data_criacao: new Date().toISOString()
        };

        await container.items.create(novoProjeto);

        // Invalida o cache
        cacheProjetos = null;

        res.status(201).json({ message: 'Projeto criado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar projeto.' });
    }
});

// Atualizar Projeto (PUT)
app.put('/projetos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, status, statusAtual, dataInicio, prazo } = req.body;

    if (!nome || !status) {
        return res.status(400).json({ error: 'Por favor, forneça todos os campos necessários.' });
    }

    try {
        const projetoAtualizado = {
            id,
            nome,
            descricao,
            status,
            statusAtual,
            dataInicio,
            prazo,
            data_atualizacao: new Date().toISOString()
        };

        await container.item(id, id).replace(projetoAtualizado);

        // Invalida o cache
        cacheProjetos = null;

        res.status(200).json({ message: 'Projeto atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar projeto.' });
    }
});

app.patch('/projetos/:id', async (req, res) => {
    const { id } = req.params;
    const { statusAtual, prazo } = req.body;

    if (!statusAtual && !prazo) {
        return res.status(400).json({ error: 'Por favor, forneça pelo menos um campo para atualizar.' });
    }

    try {
        // Busca o projeto existente
        const { resource: projeto } = await container.item(id, id).read();

        // Atualiza apenas os campos fornecidos
        const projetoAtualizado = {
            ...projeto,
            statusAtual: statusAtual || projeto.statusAtual,
            prazo: prazo || projeto.prazo,
            data_atualizacao: new Date().toISOString()
        };

        // Salva o projeto atualizado no banco
        await container.item(id, id).replace(projetoAtualizado);

        res.status(200).json({ message: 'Projeto atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar projeto.' });
    }
});


// Deletar Projeto
app.delete('/projetos/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Por favor, forneça o ID do projeto a ser deletado.' });
    }

    try {
        await container.item(id, id).delete();

        // Invalida o cache
        cacheProjetos = null;

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
