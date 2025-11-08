async function carregarEntregadores() {
  const res = await fetch("/adminn/entregadores");
  const entregadores = await res.json();
  const lista = document.getElementById("listaEntregadores");
  lista.innerHTML = "";
  entregadores.forEach(e => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${e.nome} 
      - <b>${e.ativo ? "Ativo" : "Inativo"}</b>
      <button onclick="remover(${e.id})">❌</button>
      <button onclick="alternarStatus(${e.id}, ${!e.ativo})">
        ${e.ativo ? "Desativar" : "Ativar"}
      </button>
    `;
    lista.appendChild(li);
  });
}

async function adicionar() {
  const nome = document.getElementById("nomeEntregador").value.trim();
  if (!nome) return alert("Digite o nome do entregador!");
  await fetch("/adminn/entregadores/adicionar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome })
  });
  document.getElementById("nomeEntregador").value = "";
  carregarEntregadores();
}

async function remover(id) {
  await fetch(`/adminn/entregadores/remover/${id}`, { method: "DELETE" });
  carregarEntregadores();
}

async function alternarStatus(id, ativo) {
  await fetch("/adminn/entregadores/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ativo })
  });
  carregarEntregadores();
}

document.getElementById("btnAdicionar").addEventListener("click", adicionar);
carregarEntregadores();
