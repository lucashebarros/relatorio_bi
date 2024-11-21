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
      <td>${projeto.progresso || 0}</td>
    `;
    table.appendChild(row);

    chartData.push({
      label: projeto.nome,
      data: projeto.progresso || 0
    });
  });

  renderizarGrafico(chartData);
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
  showSection('overview');
});

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
