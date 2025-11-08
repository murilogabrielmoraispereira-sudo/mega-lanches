// ===================== SELETORES =====================
const btnPedidos = document.getElementById("btn-pedidos");
const btnCardapio = document.getElementById("btn-cardapio");
const btnPedidosEntregues = document.getElementById("btn-pedidos-entregues");

const painelPedidos = document.getElementById("painel-pedidos");
const painelCardapio = document.getElementById("painel-cardapio");
const painelEntregues = document.getElementById("painel-entregues");

const listaLanches = document.getElementById("lista-lanches");
const aviso = document.getElementById("aviso");

// Modal cardápio
const modal = document.getElementById("modal-lanche");
const fecharModal = document.getElementById("fechar-modal-lanche");
const btnAdicionarLanche = document.getElementById("btn-adicionar-lanche");
const salvarLancheBtn = document.getElementById("salvar-lanche");

// Campos do modal
const novoNome = document.getElementById("novo-nome");
const novoPreco = document.getElementById("novo-preco");
const novaCategoria = document.getElementById("nova-categoria");
const novosIngredientes = document.getElementById("novos-ingredientes");
const novaImg = document.getElementById("nova-img");

let editIndex = null;

// Pedidos
const pedidosRecebidosDiv = document.getElementById("pedidos-recebidos");
const pedidosPreparoDiv = document.getElementById("pedidos-preparo");
const pedidosProntoDiv = document.getElementById("pedidos-pronto");
const pedidosEntreguesDiv = document.getElementById("pedidos-entregues");

// ADICIONAIS (elementos)
const adicionaisContainer = document.getElementById("adicionais-container");
const novoAdicionalInput = document.getElementById("novo-adicional");
const valorAdicionalInput = document.getElementById("valor-adicional");
const btnAdicionarAdicional = document.getElementById("btn-adicionar-adicional");

// ===================== AVISO =====================
function mostrarAviso(texto) {
  if (!aviso) return;
  aviso.innerText = texto;
  aviso.style.display = "block";
  setTimeout(() => (aviso.style.display = "none"), 3000);
}

// ===================== TROCA DE ABAS =====================
function mostrarPainel(painelAtivo) {
  // Esconde todos
  painelPedidos.style.display = "none";
  painelCardapio.style.display = "none";
  painelEntregues.style.display = "none";

  // Mostra o escolhido
  painelAtivo.style.display = "flex";

  // Garante que o painel se atualiza no momento certo
  if (painelAtivo === painelPedidos) carregarPedidos();
  else if (painelAtivo === painelCardapio) carregarCardapio();
  else if (painelAtivo === painelEntregues) carregarPedidosEntregues();
}

btnPedidos.addEventListener("click", () => mostrarPainel(painelPedidos));
btnCardapio.addEventListener("click", () => mostrarPainel(painelCardapio));
btnPedidosEntregues.addEventListener("click", () => mostrarPainel(painelEntregues));


btnCardapio.addEventListener("click", () => {
  painelPedidos.style.display = "none";
  painelCardapio.style.display = "block";
  painelEntregues.style.display = "none";
  carregarCardapio();
});

btnPedidosEntregues.addEventListener("click", () => {
  painelPedidos.style.display = "none";
  painelCardapio.style.display = "none";
  painelEntregues.style.display = "block";
  carregarPedidosEntregues();
});

// ===================== MODAL CARDÁPIO =====================
btnAdicionarLanche.onclick = () => {
  modal.style.display = "flex";
  editIndex = null;
  salvarLancheBtn.innerText = "Salvar";
  novoNome.value = "";
  novoPreco.value = "";
  novaCategoria.value = "";
  novosIngredientes.innerHTML = "";
  novaImg.value = "";
  carregarIngredientesModal();
};
fecharModal.onclick = () => (modal.style.display = "none");
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

// ===================== INGREDIENTES =====================
const categoriasIngredientes = {
  hamburguer: ["Pão", "Hambúrguer", "Mussarela", "Presunto", "Tomate", "Milho", "Batata Palha", "Bacon", "Ovo"],
  frango: ["Pão", "Filé de Frango", "Mussarela", "Presunto", "Tomate", "Milho", "Batata Palha", "Bacon", "Ovo"],
  lombo: ["Pão", "Filé de Lombo", "Mussarela", "Presunto", "Tomate", "Milho", "Batata Palha", "Bacon", "Ovo"],
  refrigerante: []
};

function carregarIngredientesModal(categoria = "") {
  novosIngredientes.innerHTML = "";
  if (!categoria || !categoriasIngredientes[categoria]) return;
  categoriasIngredientes[categoria].forEach((i) => {
    const label = document.createElement("label");
    label.style.display = "block";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = i;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(i));
    novosIngredientes.appendChild(label);
  });
}

novaCategoria.addEventListener("change", () => carregarIngredientesModal(novaCategoria.value));

// ===================== CARDÁPIO =====================
async function carregarCardapio() {
  try {
    const res = await fetch("/adminn/cardapio");
    const menu = await res.json();

    if (!listaLanches) return;
    listaLanches.innerHTML = "";

    menu.forEach((item, index) => {
      const div = document.createElement("div");
      div.classList.add("lanche-item");
      div.style.position = "relative";
      div.style.opacity = item.disponivel === false ? "0.5" : "1";

      const ingredientesTexto = Array.isArray(item.ingredientes) ? item.ingredientes.join(", ") : item.ingredientes;

      div.innerHTML = `
        <h3>${item.nome}</h3>
        <p>R$ ${Number(item.preco).toFixed(2)}</p>
        <p>Categoria: ${item.categoria}</p>
        <p>Ingredientes: ${ingredientesTexto || "—"}</p>
        <img src="${item.img || ""}" alt="${item.nome}" style="width:90px;height:70px;border-radius:8px;">
        <br>
        <label>
          Disponível:
          <input type="checkbox" ${item.disponivel !== false ? "checked" : ""} onchange="atualizarDisponibilidade(${index}, this.checked)">
        </label>
        <div class="acoes">
          <button onclick="editarLanche(${index})">✏️ Editar</button>
          <button onclick="removerLanche(${index})">🗑️ Remover</button>
        </div>
      `;
      listaLanches.appendChild(div);
    });
  } catch (err) {
    console.error("Erro ao carregar cardápio:", err);
    mostrarAviso("Erro ao carregar cardápio!");
  }
}

// ===================== SALVAR/EDITAR LANCHES =====================
salvarLancheBtn.onclick = async () => {
  try {
    const nome = novoNome.value.trim();
    const preco = parseFloat(novoPreco.value);
    const categoria = novaCategoria.value.trim();
    const ingredientesSelecionados = Array.from(novosIngredientes.querySelectorAll("input:checked")).map((i) => i.value);
    const imagemFile = novaImg.files[0];

    if (!nome || !preco || !categoria) {
      mostrarAviso("Preencha todos os campos obrigatórios!");
      return;
    }

    let imgUrl = "";
    if (imagemFile) {
      const formData = new FormData();
      formData.append("imagem", imagemFile);
      const res = await fetch("/adminn/upload", { method: "POST", body: formData });
      const data = await res.json();
      imgUrl = data.imageUrl || "";
    }

    const lancheData = { nome, preco, categoria, ingredientes: ingredientesSelecionados, img: imgUrl, disponivel: true };
    const url = editIndex !== null ? `/adminn/cardapio/editar/${editIndex}` : "/adminn/cardapio/adicionar";
    const method = editIndex !== null ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(lancheData) });
    const data = await res.json();
    if (data.success) {
      mostrarAviso(editIndex !== null ? "✅ Lanche editado!" : "✅ Lanche adicionado!");
      modal.style.display = "none";
      editIndex = null;
      carregarCardapio();
    } else mostrarAviso("Erro ao salvar lanche!");
  } catch (err) {
    console.error("Erro ao salvar lanche:", err);
    mostrarAviso("Erro ao salvar lanche!");
  }
};

// ===================== EDITAR/REMOVER/ATUALIZAR =====================
function editarLanche(index) {
  fetch("/adminn/cardapio")
    .then((res) => res.json())
    .then((menu) => {
      const item = menu[index];
      editIndex = index;
      novoNome.value = item.nome;
      novoPreco.value = item.preco;
      novaCategoria.value = item.categoria;
      carregarIngredientesModal(item.categoria);
      // marca os checkboxes dos ingredientes
      if (item.ingredientes) {
        const ingredientesArray = Array.isArray(item.ingredientes)
          ? item.ingredientes
          : item.ingredientes.split(",").map((i) => i.trim());
        novosIngredientes.querySelectorAll("input").forEach((cb) => {
          cb.checked = ingredientesArray.includes(cb.value);
        });
      }
      modal.style.display = "flex";
      salvarLancheBtn.innerText = "Salvar Alterações";
    })
    .catch((err) => {
      console.error("Erro ao editar lanche:", err);
      mostrarAviso("Erro ao carregar lanche para edição!");
    });
}

async function removerLanche(index) {
  try {
    const res = await fetch(`/adminn/cardapio/remover/${index}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      mostrarAviso("✅ Lanche removido!");
      carregarCardapio();
    } else mostrarAviso("Não foi possível remover!");
  } catch (err) {
    console.error("Erro ao remover lanche:", err);
  }
}

async function atualizarDisponibilidade(index, disponivel) {
  try {
    await fetch("/adminn/cardapio/atualizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index, disponivel }),
    });
    mostrarAviso("✅ Disponibilidade atualizada!");
    carregarCardapio();
  } catch (err) {
    console.error("Erro ao atualizar disponibilidade:", err);
  }
}

// ===================== ENTREGADORES (atribuição) =====================
async function atribuirEntregador(id) {
  try {
    const res = await fetch("/adminn/entregadores");
    const entregadores = await res.json();
    const ativos = entregadores.filter((e) => e.ativo);

    if (ativos.length === 0) {
      alert("Nenhum entregador ativo!");
      return;
    }

    // mostra lista simples e pede nome (pode trocar para modal personalizado depois)
    const nomes = ativos.map((e) => e.nome).join("\n");
    const nomeEscolhido = prompt("Escolha o entregador:\n\n" + nomes);

    if (!nomeEscolhido || !ativos.some((e) => e.nome === nomeEscolhido)) {
      alert("Entregador inválido!");
      return;
    }

    const resposta = await fetch("/pedidos/atribuir-entregador", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, entregador: nomeEscolhido }),
    });
    const data = await resposta.json();

    if (data.success) {
      mostrarAviso(`🚴 Pedido saiu com ${nomeEscolhido}`);
      carregarPedidos();
    } else {
      mostrarAviso("Erro ao atribuir entregador!");
    }
  } catch (err) {
    console.error("Erro ao atribuir entregador:", err);
    mostrarAviso("Erro ao atribuir entregador!");
  }
}

// ===================== PEDIDOS (status / cancelar / mover) =====================
async function mudarStatus(id, novoStatus, entregador = null) {
  try {
    const res = await fetch(`/pedidos/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: novoStatus, entregador }),
    });
    const data = await res.json();

    if (data.success) {
      mostrarAviso("✅ Status atualizado!");
      if (novoStatus === "entregue") {
        try {
          await fetch(`/pedidos/mover-para-entregues`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
        } catch (errMove) {
          console.error("Erro ao mover para entregues:", errMove);
        }
      }
      carregarPedidos();
    } else {
      mostrarAviso("Erro ao atualizar status!");
    }
  } catch (err) {
    console.error("Erro ao mudar status:", err);
    mostrarAviso("Erro ao mudar status!");
  }
}

async function cancelarPedido(id) {
  if (!confirm("Tem certeza que deseja cancelar este pedido?")) return;
  try {
    const res = await fetch(`/pedidos/cancelar/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      mostrarAviso("❌ Pedido cancelado!");
      carregarPedidos();
    } else {
      mostrarAviso("Erro ao cancelar pedido!");
    }
  } catch (err) {
    console.error("Erro ao cancelar pedido:", err);
    mostrarAviso("Erro ao cancelar pedido!");
  }
}

// ===================== CARREGAR PEDIDOS =====================
// ===================== CARREGAR PEDIDOS =====================
async function carregarPedidos() {
  try {
    const resposta = await fetch("/pedidos");
    const pedidos = await resposta.json();

    pedidosRecebidosDiv.innerHTML = "";
    pedidosPreparoDiv.innerHTML = "";
    pedidosProntoDiv.innerHTML = "";
    pedidosEntreguesDiv.innerHTML = "";

    pedidos.forEach((pedido) => {
      const div = document.createElement("div");
      div.className = "pedido";

      let total = 0;
      pedido.carrinho?.forEach((item) => (total += (item.preco || 0) * (item.qtd || 1)));

      let html = `
        <h3>🧾 Pedido #${pedido.id}</h3>
        <p><strong>Cliente:</strong> ${pedido.cliente || "Não informado"}</p>
        <p><strong>Telefone:</strong> ${pedido.telefone || "—"}</p>
        <p><strong>Endereço:</strong> ${pedido.endereco || "—"}</p>
        <p><strong>Tipo:</strong> ${pedido.tipoEntrega || "—"}</p>
        <p><strong>Pagamento:</strong> ${pedido.pagamento || "—"}</p>
        ${pedido.entregador ? `<p><strong>Entregador:</strong> ${pedido.entregador}</p>` : ""}
        <ul>
      `;

      pedido.carrinho?.forEach((item) => {
        const nome = item?.nome || "Item desconhecido";
        const preco = parseFloat(item?.preco) || 0;
        const quantidade = item?.qtd || 1;
        const adicionais = item?.adicionais?.length ? ` + ${item.adicionais.join(", ")}` : "";
        const removidos = item?.removidos?.length ? ` (sem ${item.removidos.join(", ")})` : "";
        html += `<li>${quantidade}x ${nome}${adicionais}${removidos} — R$ ${(preco * quantidade).toFixed(2)}</li>`;
      });

      html += `</ul><p><strong>Total:</strong> R$ ${total.toFixed(2)}</p>`;

      // ===== BOTÕES POR STATUS =====
      if (pedido.status === "recebido") {
        html += `<button onclick="mudarStatus(${pedido.id}, 'preparo')">👨‍🍳 Iniciar Preparo</button>`;
      } else if (pedido.status === "preparo") {
        html += `<button onclick="mudarStatus(${pedido.id}, 'pronto')">✅ Marcar Pronto</button>`;
      } else if (pedido.status === "pronto") {
        // 🔹 SE FOR RETIRADA → NÃO MOSTRA ENTREGADOR
        if (pedido.tipoEntrega?.toLowerCase() === "retirada") {
          html += `<button onclick="mudarStatus(${pedido.id}, 'entregue')">📦 Pedido Retirado</button>`;
        } else {
          html += `<button onclick="atribuirEntregador(${pedido.id})">🚴 Saiu para Entrega</button>`;
        }
      } else if (pedido.status === "em_entrega") {
        html += `<button onclick="mudarStatus(${pedido.id}, 'entregue')">📦 Entregue</button>`;
      } else if (pedido.status === "entregue") {
        html += `<small>✅ Entregue</small>`;
      }

      // ===== BOTÃO CANCELAR (sempre disponível) =====
      html += `<button style="background:#e63946;color:#fff;margin-left:8px" onclick="cancelarPedido(${pedido.id})">❌ Cancelar</button>`;

      div.innerHTML = html;

      // ===== ORGANIZA POR STATUS =====
      if (pedido.status === "recebido") pedidosRecebidosDiv.appendChild(div);
      else if (pedido.status === "preparo") pedidosPreparoDiv.appendChild(div);
      else if (pedido.status === "pronto") pedidosProntoDiv.appendChild(div);
      else if (pedido.status === "em_entrega") pedidosProntoDiv.appendChild(div);
      else if (pedido.status === "entregue") pedidosEntreguesDiv.appendChild(div);
    });
  } catch (err) {
    console.error("Erro ao carregar pedidos:", err);
    mostrarAviso("Erro ao carregar pedidos!");
  }
}


// ===================== PEDIDOS ENTREGUES =====================
async function carregarPedidosEntregues() {
  try {
    const res = await fetch("/pedidos/entregues");
    if (!res.ok) {
      pedidosEntreguesDiv.innerHTML = "<p>Não foi possível carregar pedidos entregues.</p>";
      return;
    }
    const entregues = await res.json();

    if (!Array.isArray(entregues) || entregues.length === 0) {
  pedidosEntreguesDiv.innerHTML = "<p>Nenhum pedido entregue ainda.</p>";
  return;
}
pedidosEntreguesDiv.innerHTML = "";


    entregues.forEach((pedido) => {
      let total = 0;
      pedido.carrinho?.forEach((item) => (total += (item.preco || 0) * (item.qtd || 1)));
      const div = document.createElement("div");
      div.className = "pedido-entregue";
      div.innerHTML = `
        <h3>Pedido #${pedido.id}</h3>
        <p>Cliente: ${pedido.cliente || "—"}</p>
        <p>Entregador: ${pedido.entregador || "—"}</p>
        <p>Entregue em: ${pedido.entregueEm || "—"}</p>
        <p>Total: R$ ${total.toFixed(2)}</p>
      `;
      pedidosEntreguesDiv.appendChild(div);
    });
  } catch (err) {
    console.error("Erro ao carregar entregues:", err);
    pedidosEntreguesDiv.innerHTML = "<p>Erro ao carregar pedidos entregues.</p>";
  }
}

// ===================== ADICIONAIS =====================
async function carregarAdicionais() {
  try {
    const res = await fetch("/adminn/adicionais");
    const adicionais = await res.json();
    adicionaisContainer.innerHTML = "";
    adicionais.forEach((ad, index) => {
      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.alignItems = "center";
      div.style.justifyContent = "space-between";
      div.style.gap = "6px";
      div.style.marginBottom = "4px";

      const span = document.createElement("span");
      span.textContent = `${ad.nome} — R$ ${Number(ad.preco).toFixed(2)}`;

      const btnRemover = document.createElement("button");
      btnRemover.textContent = "❌";
      btnRemover.style.background = "#ff4d4d";
      btnRemover.style.color = "white";
      btnRemover.style.border = "none";
      btnRemover.style.borderRadius = "4px";
      btnRemover.style.padding = "2px 6px";
      btnRemover.style.cursor = "pointer";
      btnRemover.onclick = () => removerAdicional(index);

      div.appendChild(span);
      div.appendChild(btnRemover);
      adicionaisContainer.appendChild(div);
    });
  } catch (err) {
    console.error("Erro ao carregar adicionais:", err);
  }
}

btnAdicionarAdicional && (btnAdicionarAdicional.onclick = async () => {
  const nome = (novoAdicionalInput.value || "").trim();
  const preco = parseFloat(valorAdicionalInput.value);
  if (!nome || isNaN(preco)) {
    mostrarAviso("Preencha o nome e o valor do adicional!");
    return;
  }
  try {
    const res = await fetch("/adminn/adicionais/adicionar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, preco }),
    });
    const data = await res.json();
    if (data.success) {
      mostrarAviso("✅ Adicional adicionado!");
      novoAdicionalInput.value = "";
      valorAdicionalInput.value = "";
      carregarAdicionais();
    } else mostrarAviso("Erro ao adicionar adicional!");
  } catch (err) {
    console.error("Erro ao adicionar adicional:", err);
    mostrarAviso("Erro ao adicionar adicional!");
  }
});

async function removerAdicional(index) {
  try {
    const res = await fetch(`/adminn/adicionais/remover/${index}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      mostrarAviso("✅ Adicional removido!");
      carregarAdicionais();
    } else mostrarAviso("Erro ao remover adicional!");
  } catch (err) {
    console.error("Erro ao remover adicional:", err);
    mostrarAviso("Erro ao remover adicional!");
  }
}

// ===================== INICIALIZAÇÃO =====================
window.addEventListener("load", () => {
  carregarCardapio();
  carregarPedidos();
  carregarAdicionais();
});
setInterval(() => {
  if (painelPedidos.style.display !== "none") carregarPedidos();
  if (painelEntregues.style.display !== "none") carregarPedidosEntregues();
}, 5000);

