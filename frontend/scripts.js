const API_URL = "https://relatoriobi.azurewebsites.net/projetos"; // URL da API
let projetosCache = null; // Cache local no frontend

// Alterna entre as seções
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(sectionId).classList.add('active');
}

// Carrega os projetos para o campo de seleção no Atualizar Status
async function carregarProjetosParaSelecao() {
  try {
    // Usa o cache local se disponível
    if (projetosCache) {
      preencherDropdown(projetosCache);
      return;
    }

    console.log('Buscando nomes dos projetos do backend...');
    const response = await fetch(`${API_URL}/names`); // Chama a rota otimizada para nomes
    if (!response.ok) throw new Error('Erro ao carregar projetos');
    const projetos = await response.json();

    projetosCache = projetos; // Armazena no cache local
    preencherDropdown(projetos);
  } catch (error) {
    console.error('Erro ao carregar projetos para seleção:', error);
    alert('Erro ao carregar a lista de projetos. Tente novamente mais tarde.');
  }
}

// Preenche o dropdown com os projetos
function preencherDropdown(projetos) {
  const select = document.getElementById('projeto-nome');
  select.innerHTML = ''; // Limpa o campo antes de preencher

  if (!projetos || projetos.length === 0) {
    const noProjectsOption = document.createElement('option');
    noProjectsOption.value = '';
    noProjectsOption.textContent = 'Nenhum projeto disponível';
    noProjectsOption.disabled = true;
    noProjectsOption.selected = true;
    select.appendChild(noProjectsOption);
    return;
  }

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Selecione um projeto';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  select.appendChild(defaultOption);

  projetos.forEach(projeto => {
    const option = document.createElement('option');
    option.value = projeto.id; // Define o valor como o ID do projeto
    option.textContent = projeto.nome; // Define o texto como o nome do projeto
    select.appendChild(option);
  });
}

// Calcula o progresso com base nas datas
function calcularProgresso(dataInicio, prazo) {
  if (!dataInicio || !prazo) return 0;

  const hoje = new Date();
  const inicio = new Date(dataInicio);
  const prazoFinal = new Date(prazo);

  if (hoje < inicio) return 0;
  if (hoje > prazoFinal) return 100;

  const totalDias = (prazoFinal - inicio) / (1000 * 60 * 60 * 24); // Total de dias
  const diasPassados = (hoje - inicio) / (1000 * 60 * 60 * 24); // Dias passados

  return Math.round((diasPassados / totalDias) * 100); // Progresso em %
}

// Função para listar projetos e atualizar tabela e gráfico
async function listarProjetos() {
  try {
    if (projetosCache) {
      renderizarTabela(projetosCache);
      return;
    }

    console.log('Buscando lista completa de projetos do backend...');
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Erro ao listar projetos');
    const projetos = await response.json();

    projetosCache = projetos; // Armazena no cache local
    renderizarTabela(projetos);
  } catch (error) {
    console.error('Erro ao listar projetos:', error);
  }
}

// Renderiza a tabela de projetos
function renderizarTabela(projetos) {
  const table = document.getElementById('projects-table');
  table.innerHTML = ''; // Limpa a tabela

  projetos.forEach(projeto => {
    const progresso = calcularProgresso(projeto.dataInicio, projeto.prazo);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${projeto.nome}</td>
      <td>${projeto.status}</td>
      <td>${projeto.dataInicio || 'N/A'}</td>
      <td>${projeto.prazo || 'N/A'}</td>
      <td>${projeto.statusAtual || 'N/A'}</td>
      <td>${progresso}%</td>
      <td>
        <button onclick="abrirAtualizarStatus()">Alterar</button>
        <button onclick="deletarProjeto('${projeto.id}')">Excluir</button>
      </td>
    `;
    table.appendChild(row);
  });

  renderizarGrafico(projetos);
}

// Renderiza o gráfico de progresso
function renderizarGrafico(projetos) {
  const ctx = document.getElementById('progress-chart').getContext('2d');
  const data = projetos.map(projeto => ({
    label: projeto.nome,
    data: calcularProgresso(projeto.dataInicio, projeto.prazo)
  }));

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        label: 'Progresso (%)',
        data: data.map(d => d.data),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Função para criar projeto
document.getElementById('create-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const status = document.getElementById('status').value;
  const dataInicio = document.getElementById('data-inicio').value;
  const prazo = document.getElementById('prazo').value;
  const statusAtual = document.getElementById('status-atual').value;

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, status, dataInicio, prazo, statusAtual })
    });

    projetosCache = null; // Invalida o cache local
    listarProjetos();
    showSection('overview');
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
  }
});

// Função para atualizar o status de um projeto
document.getElementById('update-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const projetoId = document.getElementById('projeto-nome').value;
  const statusAtual = document.getElementById('status-atual').value;
  const prazo = document.getElementById('prazo').value;

  if (!projetoId) {
    alert('Por favor, selecione um projeto!');
    return;
  }

  try {
    await fetch(`${API_URL}/${projetoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statusAtual, prazo })
    });

    alert('Status atualizado com sucesso!');
    projetosCache = null; // Invalida o cache local
    listarProjetos();
    showSection('overview');
  } catch (error) {
    console.error('Erro ao atualizar o status:', error);
  }
});

// Abre a seção Atualizar Status
function abrirAtualizarStatus() {
  carregarProjetosParaSelecao(); // Preenche o dropdown
  showSection('update-status'); // Mostra a seção Atualizar Status
}

// Carrega projetos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
  listarProjetos();
  showSection('overview'); // Abre a visão geral
});
