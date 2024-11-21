const API_URL = "https://relatoriobi.azurewebsites.net/projetos"; // URL da API

// Alterna entre as seções
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('hidden'); // Esconde todas as seções
  });
  document.getElementById(sectionId).classList.remove('hidden'); // Mostra a seção desejada
}

// Função para listar projetos
async function listarProjetos() {
  const response = await fetch(API_URL);
  const projetos = await response.json();
  const table = document.getElementById('projects-table');
  const chartData = [];

  table.innerHTML = ''; // Limpa a tabela
  projetos.forEach(projeto => {
    const progresso = calcularProgresso(projeto.dataInicio, projeto.dataFim);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${projeto.nome}</td>
      <td>${projeto.status}</td>
      <td>${projeto.dataInicio || 'Não definida'}</td>
      <td>${projeto.dataFim || 'Não definida'}</td>
      <td>${progresso}%</td>
      <td>
        <button onclick="setUpdateForm('${projeto.id}', '${projeto.status}', '${projeto.dataInicio}', '${projeto.dataFim}')">Alterar</button>
        <button onclick="deletarProjeto('${projeto.id}')">Excluir</button>
      </td>
    `;
    table.appendChild(row);

    chartData.push({
      label: projeto.nome,
      data: progresso
    });
  });

  renderizarGrafico(chartData);
}

// Preenche o formulário de atualização
function setUpdateForm(id, statusAtual, dataInicio, dataFim) {
  document.getElementById('projeto-id').value = id;
  document.getElementById('novo-status').value = statusAtual;
  document.getElementById('novo-data-inicio').value = dataInicio || '';
  document.getElementById('novo-data-fim').value = dataFim || '';
  showSection('update-status');
}

// Adiciona um novo projeto
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

  listarProjetos();
  showSection('overview');
});

// Atualiza status, data de início e data de fim
document.getElementById('update-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('projeto-id').value;
  const status = document.getElementById('novo-status').value;
  const dataInicio = document.getElementById('novo-data-inicio').value;
  const dataFim = document.getElementById('novo-data-fim').value;

  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, dataInicio, dataFim })
  });

  listarProjetos();
  showSection('overview');
});

// Deleta um projeto
async function deletarProjeto(id) {
  if (confirm('Tem certeza que deseja excluir este projeto?')) {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    listarProjetos();
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

// Calcula progresso
function calcularProgresso(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return 0;

  const hoje = new Date();
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  if (hoje < inicio) return 0;
  if (hoje > fim) return 100;

  const progresso = Math.round(((hoje - inicio) / (fim - inicio)) * 100);
  return progresso > 100 ? 100 : progresso;
}

// Inicialização
listarProjetos();
showSection('overview');
