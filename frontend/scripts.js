const API_URL = "https://relatoriobi.azurewebsites.net/projetos"; // URL da API

// Alterna entre as seções
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(sectionId).classList.add('active');
}

// Função para listar projetos
async function listarProjetos() {
  const response = await fetch(API_URL);
  const projetos = await response.json();
  const table = document.getElementById('projects-table');
  const chartData = [];

  table.innerHTML = ''; // Limpa a tabela
  projetos.forEach(projeto => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${projeto.nome}</td>
      <td>${projeto.status}</td>
      <td>${projeto.dataInicio || 'N/A'}</td>
      <td>${projeto.dataFim || 'N/A'}</td>
      <td>${projeto.progresso || 0}%</td>
      <td>
        <button onclick="setUpdateForm('${projeto.id}', '${projeto.status}')">Alterar</button>
        <button onclick="deletarProjeto('${projeto.id}')">Excluir</button>
      </td>
    `;
    table.appendChild(row);

    chartData.push({
      label: projeto.nome,
      data: projeto.progresso || 0
    });
  });

  renderizarGrafico(chartData);
}

// Função para preencher o formulário de atualização
function setUpdateForm(id, statusAtual) {
  document.getElementById('projeto-id').value = id;
  document.getElementById('novo-status').value = statusAtual;
  showSection('update-status');
}

// Função para criar projeto
document.getElementById('create-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const descricao = document.getElementById('descricao').value;
  const status = document.getElementById('status').value;
  const dataInicio = document.getElementById('data-inicio').value;
  const dataFim = document.getElementById('data-fim').value;

  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, descricao, status, dataInicio, dataFim })
  });

  listarProjetos(); // Atualiza a lista de projetos
  showSection('overview'); // Volta para a visão geral após adicionar o projeto
});

// Função para atualizar o status de um projeto
document.getElementById('update-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const projetoId = document.getElementById('projeto-id').value;
  const novoStatus = document.getElementById('novo-status').value;

  await fetch(`${API_URL}/${projetoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: novoStatus })
  });

  listarProjetos(); // Atualiza a lista de projetos
  showSection('overview'); // Volta para a visão geral após atualizar o status
});

// Função para deletar projeto
async function deletarProjeto(id) {
  if (confirm('Tem certeza que deseja excluir este projeto?')) {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    listarProjetos(); // Atualiza a lista de projetos
  }
}

// Renderiza gráfico de progresso
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

// Carrega projetos na inicialização
listarProjetos();
showSection('overview');
