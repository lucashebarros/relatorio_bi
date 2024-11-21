const API_URL = "https://relatoriobi.azurewebsites.net/projetos"; // URL pública da API

// Função para listar projetos
async function listarProjetos() {
  const response = await fetch(API_URL);
  const projetos = await response.json();
  const table = document.getElementById('projects-table');

  table.innerHTML = ''; // Limpa a tabela
  projetos.forEach(projeto => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${projeto.nome}</td>
      <td>${projeto.descricao}</td>
      <td>${projeto.status}</td>
      <td>
        <button onclick="deletarProjeto('${projeto.id}')">Deletar</button>
      </td>
    `;
    table.appendChild(row);
  });
}

// Função para criar projeto
document.getElementById('create-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const descricao = document.getElementById('descricao').value;
  const status = document.getElementById('status').value;

  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, descricao, status })
  });

  listarProjetos(); // Atualiza a lista de projetos
});

// Função para deletar projeto
async function deletarProjeto(id) {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  listarProjetos(); // Atualiza a lista de projetos
}

// Chama a função ao carregar a página
listarProjetos();
