// ===================== VARIÁVEIS GLOBAIS =====================
window.carrinho = [];
let menu = [];
let categoriaAtual = "hamburguer";
let itemSelecionado = null;
let qtdLanche = 1;
const taxaEntregaValor = 9.00;
let enviando = false;

// Adicionais dinâmicos
let adicionaisDisponiveis = [];

// ===================== ELEMENTOS =====================
const menuDiv = document.getElementById("menu");
const modal = document.getElementById("modal");
const modalNome = document.getElementById("modal-nome");
const modalImg = document.getElementById("modal-img");
const modalIngredientes = document.getElementById("modal-ingredientes");
const modalAdicionais = document.getElementById("modal-adicionais");
const modalObs = document.getElementById("modal-obs");
const modalAdicionar = document.getElementById("modal-adicionar");
const fecharModalBtn = document.getElementById("fechar-modal");

const btnCarrinho = document.getElementById("btn-carrinho");
const modalCarrinho = document.getElementById("modal-carrinho");
const fecharCarrinhoBtn = document.getElementById("fechar-carrinho");
const itensCarrinhoDiv = document.getElementById("itens-carrinho");
const obsGeral = document.getElementById("obs-geral");
const prosseguir = document.getElementById("prosseguir");

const modalFinalizar = document.getElementById("modal-finalizar");
const fecharFinalizarBtn = document.getElementById("fechar-finalizar");
const nomeCliente = document.getElementById("nome-cliente");
const telefoneCliente = document.getElementById("telefone-cliente");
const endereco = document.getElementById("endereco");
const pagamento = document.getElementById("pagamento");
const tipoEntrega = document.getElementById("tipo-entrega");
const chavePix = document.getElementById("chave-pix");
const troco = document.getElementById("troco");
const confirmar = document.getElementById("confirmar");

const subtotalFinal = document.getElementById("subtotal-finalizar");
const taxaFinal = document.getElementById("taxa-finalizar");
const totalFinal = document.getElementById("total-finalizar");

const toastContainer = document.getElementById("toast-container");

// Quantidade lanche
const qtdLancheSpan = document.getElementById("qtd-lanche");
const btnMaisLanche = document.getElementById("mais-lanche");
const btnMenosLanche = document.getElementById("menos-lanche");

// ===================== FUNÇÕES AUXILIARES =====================
function showToast(msg) {
  const div = document.createElement("div");
  div.className = "toast";
  div.innerText = msg;
  toastContainer.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// ===================== CARREGAR ADICIONAIS =====================
// ===================== CARREGAR ADICIONAIS (do arquivo adicionais.json) =====================
async function carregarAdicionaisJSON() {
  try {
    const res = await fetch("adicionais.json"); // busca o arquivo direto na pasta do site
    if (!res.ok) throw new Error("Falha ao carregar adicionais.json");
    adicionaisDisponiveis = await res.json();

    // Ordena por nome só pra deixar organizado no modal
    adicionaisDisponiveis.sort((a, b) => a.nome.localeCompare(b.nome));

    console.log("Adicionais carregados:", adicionaisDisponiveis);
  } catch (err) {
    console.error("Erro ao carregar adicionais:", err);
    showToast("Erro ao carregar adicionais!");
    adicionaisDisponiveis = []; // Evita crash se der erro
  }
}
// ===================== CARREGAR CARDÁPIO =====================
async function carregarCardapio() {
  try {
    const res = await fetch("/adminn/cardapio");
    menu = await res.json();
    renderMenu();
  } catch (err) {
    console.error(err);
    showToast("Erro ao carregar cardápio!");
  }
}

// ===================== RENDER MENU =====================
function renderMenu() {
  menuDiv.innerHTML = "";

  let itens;
  if (categoriaAtual === "promocao") {
    itens = menu.filter(item => item.nome.toLowerCase().includes("x-tudo"));
  } else {
    itens = menu.filter(item => item.categoria === categoriaAtual);
  }

  itens.forEach(item => {
    const div = document.createElement("div");
    div.className = "menu-item";
    const imgSrc = item.img.startsWith("/") ? item.img : "/uploads/" + item.img;

    if (item.disponivel === false) {
      div.innerHTML = `<img src="${imgSrc}" alt="${item.nome}" style="opacity:0.5;">
        <div class="info"><h3>${item.nome}</h3><p class="indisponivel">🚫 Indisponível</p></div>
        <button class="btn-adicionar" disabled style="opacity:0.5;cursor:not-allowed;">X</button>`;
    } else {
      div.innerHTML = `<img src="${imgSrc}" alt="${item.nome}">
        <div class="info"><h3>${item.nome}</h3><p>R$ ${Number(item.preco).toFixed(2)}</p></div>
        <button class="btn-adicionar">+</button>`;
      div.querySelector(".btn-adicionar").onclick = () => abrirModal(item);
    }

    menuDiv.appendChild(div);
  });

  if (categoriaAtual === "promocao") {
    showToast("💥 Promoção! X-Tudo: 1 por R$22, 2 ou mais por R$20 cada!");
  }
}

// ===================== ABRIR MODAL LANCHES =====================
function abrirModal(item) {
  itemSelecionado = JSON.parse(JSON.stringify(item));
  modalNome.innerText = item.nome;
  modalImg.src = item.img.startsWith("/") ? item.img : "/uploads/" + item.img;
  modal.style.display = "flex";

  qtdLanche = 1;
  qtdLancheSpan.innerText = qtdLanche;

  // Ingredientes
  modalIngredientes.innerHTML = "";
  const ingredientesList = Array.isArray(item.ingredientes) ? item.ingredientes : (item.ingredientes ? item.ingredientes.split(",") : []);
  ingredientesList.forEach(ing => {
    ing = ing.trim();
    let qtd = 1;
    let nome = ing;
    const match = ing.match(/^(\d+)\s+(.*)$/);
    if(match){ qtd = parseInt(match[1]); nome = match[2]; }
    const div = document.createElement("div");
    div.className = "ingrediente-item";
    div.innerHTML = `<span>${nome}</span><button class="menos">-</button><span class="quantidade">${qtd}</span><button class="mais">+</button>`;
    const qtdSpan = div.querySelector(".quantidade");
    div.querySelector(".menos").onclick = () => { if(parseInt(qtdSpan.innerText)>0) qtdSpan.innerText = parseInt(qtdSpan.innerText)-1; };
    div.querySelector(".mais").onclick = () => { qtdSpan.innerText = parseInt(qtdSpan.innerText)+1; };
    modalIngredientes.appendChild(div);
  });

  // Adicionais dinâmicos
  modalAdicionais.innerHTML = "";
  adicionaisDisponiveis.forEach(add => {
    const div = document.createElement("div");
    div.className = "ingrediente-item";
    div.innerHTML = `<span>${add.nome} + R$ ${Number(add.preco).toFixed(2)}</span>
                     <button class="menos">-</button>
                     <span class="quantidade">0</span>
                     <button class="mais">+</button>`;
    const qtdSpan = div.querySelector(".quantidade");
    div.querySelector(".menos").onclick = () => { if(parseInt(qtdSpan.innerText)>0) qtdSpan.innerText = parseInt(qtdSpan.innerText)-1; };
    div.querySelector(".mais").onclick = () => { qtdSpan.innerText = parseInt(qtdSpan.innerText)+1; };
    modalAdicionais.appendChild(div);
  });

  modalObs.value = "";
}

// ===================== CONTROLE QUANTIDADE =====================
btnMaisLanche.onclick = () => { qtdLanche++; qtdLancheSpan.innerText = qtdLanche; };
btnMenosLanche.onclick = () => { if(qtdLanche>1){ qtdLanche--; qtdLancheSpan.innerText = qtdLanche; } };

// ===================== ADICIONAR AO CARRINHO =====================
modalAdicionar.onclick = () => {
  const adicionais = [];
  modalAdicionais.querySelectorAll(".ingrediente-item").forEach(div => {
    const qtd = parseInt(div.querySelector(".quantidade").innerText);
    if(qtd>0){
      const nome = div.querySelector("span").innerText.split(" + ")[0];
      const preco = parseFloat(div.querySelector("span").innerText.split("R$ ")[1]);
      adicionais.push({nome, preco, qtd});
    }
  });

  const removidos = [];
  modalIngredientes.querySelectorAll(".ingrediente-item").forEach(div=>{
    const qtd = parseInt(div.querySelector(".quantidade").innerText);
    const nome = div.querySelector("span").innerText;
    if(qtd===0) removidos.push(nome);
  });

  let precoBase = itemSelecionado.nome.toLowerCase().includes("x-tudo") ? 22 : itemSelecionado.preco;

  const existIndex = window.carrinho.findIndex(i =>
    i.nome===itemSelecionado.nome &&
    JSON.stringify(i.adicionais)===JSON.stringify(adicionais) &&
    JSON.stringify(i.removidos)===JSON.stringify(removidos)
  );

  if(existIndex>-1){
    window.carrinho[existIndex].qtd += qtdLanche;
  } else {
    window.carrinho.push({
      nome: itemSelecionado.nome,
      preco: precoBase,
      adicionais,
      removidos,
      obs: modalObs.value,
      qtd: qtdLanche
    });
  }

  modal.style.display="none";
  renderCarrinho();
  showToast("Item adicionado ao carrinho!");
};

// ===================== FILTRO CATEGORIAS =====================
document.querySelectorAll(".categorias button").forEach(btn => {
  btn.onclick = () => {
    categoriaAtual = btn.dataset.categoria;
    document.querySelectorAll(".categorias button").forEach(b => b.classList.remove("ativo"));
    btn.classList.add("ativo");
    renderMenu();
  };
});

// ===================== RENDER CARRINHO =====================
function renderCarrinho(){
  itensCarrinhoDiv.innerHTML="";
  window.carrinho.forEach((item,index)=>{
    // Promoção X-Tudo
    if(item.nome.toLowerCase().includes("x-tudo")){
      item.preco = item.qtd === 1 ? 22 : 20;
    }

    let subtotalItem = item.preco*item.qtd + item.adicionais.reduce((a,b)=>a+b.preco*b.qtd,0)*item.qtd;

    const div = document.createElement("div");
    div.innerHTML=`<strong>${item.nome}</strong> - R$ ${subtotalItem.toFixed(2)}<br>
      Qtd: <button class="menos">-</button> <span class="quantidade">${item.qtd}</span> <button class="mais">+</button><br>
      Observações: ${item.obs||"-"}<br>
      Adicionais: ${item.adicionais.map(a=>`${a.nome} x${a.qtd}`).join(", ")||"-"}<br>
      Removidos: ${item.removidos.join(",")||"-"}<br>
      <button class="remover">Remover</button>`;

    const qtdSpan = div.querySelector(".quantidade");
    div.querySelector(".menos").onclick=()=>{
      if(item.qtd>1) item.qtd-=1;
      if(item.nome.toLowerCase().includes("x-tudo")) item.preco = item.qtd===1?22:20;
      renderCarrinho();
    };
    div.querySelector(".mais").onclick=()=>{
      item.qtd+=1;
      if(item.nome.toLowerCase().includes("x-tudo")) item.preco = item.qtd===1?22:20;
      renderCarrinho();
    };
    div.querySelector(".remover").onclick=()=>{ window.carrinho.splice(index,1); renderCarrinho(); };
    itensCarrinhoDiv.appendChild(div);
  });
}

// ===================== MODAIS E FINALIZAÇÃO =====================
btnCarrinho.onclick=()=>{ modalCarrinho.style.display="flex"; renderCarrinho(); };
fecharCarrinhoBtn.onclick=()=>{ modalCarrinho.style.display="none"; };
fecharModalBtn.onclick=()=>{ modal.style.display="none"; };
fecharFinalizarBtn.onclick=()=>{ modalFinalizar.style.display="none"; };

// Prosseguir pedido
prosseguir.onclick=()=>{
  if(!window.carrinho.length){ showToast("Carrinho vazio"); return; }
  let subtotal=0;
  window.carrinho.forEach(item=>{
    subtotal+=item.preco*item.qtd;
    item.adicionais.forEach(a=>subtotal+=a.preco*a.qtd*item.qtd);
  });
  let taxa=tipoEntrega.value==="Entrega"?taxaEntregaValor:0;
  subtotalFinal.innerText=`Subtotal: R$ ${subtotal.toFixed(2)}`;
  taxaFinal.innerText=`Taxa de entrega: R$ ${taxa.toFixed(2)}`;
  totalFinal.innerText=`Total: R$ ${(subtotal+taxa).toFixed(2)}`;
  modalCarrinho.style.display="none";
  modalFinalizar.style.display="flex";
};

// Tipo entrega
tipoEntrega.onchange=()=>{
  endereco.style.display=tipoEntrega.value==="Entrega"?"block":"none";
  if(modalFinalizar.style.display==="flex"){
    let subtotal=window.carrinho.reduce((sum,item)=>sum+item.preco*item.qtd+item.adicionais.reduce((a,b)=>a+b.preco*b.qtd*item.qtd,0),0);
    let taxa=tipoEntrega.value==="Entrega"?taxaEntregaValor:0;
    subtotalFinal.innerText=`Subtotal: R$ ${subtotal.toFixed(2)}`;
    taxaFinal.innerText=`Taxa de entrega: R$ ${taxa.toFixed(2)}`;
    totalFinal.innerText=`Total: R$ ${(subtotal+taxa).toFixed(2)}`;
  }
};

// Pagamento
pagamento.onchange=()=>{
  if(pagamento.value==="Pix"){ chavePix.style.display="block"; troco.style.display="none"; }
  else if(pagamento.value==="Dinheiro"){ chavePix.style.display="none"; troco.style.display="block"; }
  else{ chavePix.style.display="none"; troco.style.display="none"; }
};

// Confirmar pedido
confirmar.onclick = async () => {
  if (enviando) return;

  if (!nomeCliente.value || !telefoneCliente.value || !tipoEntrega.value || !pagamento.value) {
    showToast("Preencha todos os campos!");
    return;
  }

  const pedido = {
    cliente: nomeCliente.value,
    telefone: telefoneCliente.value,
    endereco: endereco.value,
    tipoEntrega: tipoEntrega.value,
    pagamento: pagamento.value,
    troco: troco.value,
    chavePix: chavePix.value,
    carrinho: window.carrinho,
    obsGeral: obsGeral.value
  };

  enviando = true;

  try {
    const resposta = await fetch("/pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedido)
    });

    const data = await resposta.json();

    if (data.success) {
      showToast("✅ Pedido enviado com sucesso!");
      window.carrinho = [];
      modalFinalizar.style.display = "none";
    } else {
      showToast("❌ Erro ao enviar pedido!");
    }

  } catch (e) {
    console.error(e);
    showToast("❌ Erro ao enviar pedido!");
  }

  enviando = false;
};

// ===================== INICIALIZAÇÃO =====================
carregarAdicionaisJSON().then(() => {
  carregarCardapio();
});
