const API_URL = "https://relatoriobi.azurewebsites.net/projetos"; // URL da API

// Alterna entre as seções
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(sectionId).classList.add('active');
}

// Configura o formulário de atualização com os dados do projeto
function setUpdateForm(id, statusAtual) {
  document.getElementById('projeto-id').value = id;
  document.getElementById('status-atual').value = statusAtual;
  showSection('update-status');
}

// Função para calcular progresso baseado na data de início
function calcularProgresso(dataInicio, prazo) {
  if (!dataInicio || !prazo) return 0; // Se faltar alguma data, progresso é 0

  const hoje = new Date();
  const inicio = new Date(dataInicio);
  const prazoFinal = new Date(prazo);

  if (hoje < inicio) return 0; // Se hoje está antes do início, progresso é 0
  if (hoje > prazoFinal) return 100; // Se hoje está após o prazo, progresso é 100

  const totalDias = (prazoFinal - inicio) / (1000 * 60 * 60 * 24); // Total de dias entre início e prazo
  const diasPassados = (hoje - inicio) / (1000 * 60 * 60 * 24); // Dias passados desde o início

  return Math.round((diasPassados / totalDias) * 100); // Progresso em %
}


// Função para listar projetos e atualizar tabela e gráfico
async function listarProjetos() {
  try {
    const response = await fetch(API_URL); // Requisição para a API
    const projetos = await response.json();
    const table = document.getElementById('projects-table');
    const chartData = []; // Dados para o gráfico

    table.innerHTML = ''; // Limpa a tabela

    projetos.forEach(projeto => {
      const progresso = calcularProgresso(projeto.dataInicio, projeto.prazo); // Novo cálculo de progresso

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${projeto.nome}</td>
        <td>${projeto.status}</td>
        <td>${projeto.dataInicio || 'N/A'}</td>
        <td>${projeto.statusAtual || 'N/A'}</td>
        <td>${projeto.prazo || 'N/A'}</td> <!-- Nova coluna -->
        <td>${progresso}%</td> <!-- Exibição do progresso -->
        <td>
          <button onclick="setUpdateForm('${projeto.id}', '${projeto.statusAtual}')">Alterar</button>
          <button onclick="deletarProjeto('${projeto.id}')">Excluir</button>
        </td>
      `;
      table.appendChild(row);

      // Prepara os dados para o gráfico
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
      labels: data.map(d => d.label), // Nomes dos projetos
      datasets: [{
        label: 'Progresso (%)',
        data: data.map(d => d.data), // Progresso de cada projeto
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
  const prazo = document.getElementById('prazo').value; // Prazo capturado aqui
  const statusAtual = document.getElementById('status-atual').value;

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, status, dataInicio, prazo, statusAtual }) // Enviando o prazo
    });

    listarProjetos(); // Atualiza a lista de projetos
    showSection('overview'); // Volta para a visão geral
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
  }
});


// Função para atualizar o status de um projeto
document.getElementById('update-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const projetoId = document.getElementById('projeto-id').value;
  const novoStatus = document.getElementById('novo-status').value;
  const statusAtual = document.getElementById('status-atual').value;

  try {
    await fetch(`${API_URL}/${projetoId}`, {
      method: 'PUT', // Altere para 'PATCH' se o backend suportar PATCH
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus, statusAtual })
    });

    alert('Status atualizado com sucesso!');
    listarProjetos(); // Atualiza a lista de projetos
    showSection('overview'); // Volta para a visão geral
  } catch (error) {
    console.error('Erro ao atualizar o status:', error);
  }
});

// Função para deletar projeto
async function deletarProjeto(id) {
  if (confirm('Tem certeza que deseja excluir este projeto?')) {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      alert('Projeto excluído com sucesso!');
      listarProjetos(); // Atualiza a lista de projetos
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
