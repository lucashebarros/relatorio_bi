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
function calcularProgresso(dataInicio) {
  if (!dataInicio) return 0;

  const hoje = new Date();
  const inicio = new Date(dataInicio);

  if (hoje < inicio) return 0;

  const progresso = Math.round(((hoje - inicio) / (30 * 24 * 60 * 60 * 1000)) * 100); // Baseado em 30 dias
  return progresso > 100 ? 100 : progresso;
}

// Função para listar projetos e atualizar tabela e gráfico
async function listarProjetos() {
  try {
    const response = await fetch(API_URL); // Requisição para a API
    const projetos = await response.json();
    const table = document.getElementById('projects-table');
    const chartData = []; // Dados para o gráfico
    const select = document.getElementById('projeto-nome');
select.innerHTML = ''; // Limpa o select antes de popular

projetos.forEach(projeto => {
    const option = document.createElement('option');
    option.value = projeto.id;
    option.textContent = projeto.nome;
    select.appendChild(option);
});


      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${projeto.nome}</td>
        <td>${projeto.status}</td>
        <td>${projeto.dataInicio || 'N/A'}</td>
        <td>${projeto.statusAtual || 'N/A'}</td>
        <td>${progresso}%</td>
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
  const dataInicio = document.getElementById('prazo').value;
  const statusAtual = document.getElementById('status-atual').value;

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, status, dataInicio, statusAtual })
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
      method: 'PATCH',
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
