const API_URL = "https://relatoriobi.azurewebsites.net/projetos"; // URL da API

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
    const response = await fetch(API_URL); // Faz a requisição para a API
    if (!response.ok) throw new Error('Erro ao carregar projetos');
    const projetos = await response.json();

    const select = document.getElementById('projeto-nome'); // Seleciona o dropdown
    select.innerHTML = ''; // Limpa o campo antes de preencher

    // Adiciona uma opção inicial ao dropdown
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione um projeto';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    // Preenche os projetos no dropdown
    projetos.forEach(projeto => {
      const option = document.createElement('option');
      option.value = projeto.id; // Define o valor como o ID do projeto
      option.textContent = projeto.nome; // Define o texto como o nome do projeto
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar projetos para seleção:', error);
    alert('Erro ao carregar a lista de projetos. Tente novamente mais tarde.');
  }
}

// Função para calcular progresso baseado na data de início
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
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Erro ao listar projetos');
    const projetos = await response.json();
    const table = document.getElementById('projects-table');
    const chartData = [];

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

      chartData.push({
        label: projeto.nome,
        data: progresso
      });
    });

    renderizarGrafico(chartData); // Atualiza o gráfico
  } catch (error) {
    console.error('Erro ao listar projetos:', error);
  }
}

// Renderiza o gráfico de progresso
function renderizarGrafico(data) {
  const ctx = document.getElementById('progress-chart').getContext('2d');
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

    listarProjetos();
    showSection('overview');
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
  }
});

// Função para atualizar o status de um projeto
document.getElementById('update-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const projetoId = document.getElementById('projeto-nome').value; // Obtém o ID selecionado
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

// Função para deletar projeto
async function deletarProjeto(id) {
  if (confirm('Tem certeza que deseja excluir este projeto?')) {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      alert('Projeto excluído com sucesso!');
      listarProjetos();
    } catch (error) {
      console.error('Erro ao excluir o projeto:', error);
    }
  }
}

// Carrega projetos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
  listarProjetos();
  showSection('overview'); // Abre a visão geral
});
