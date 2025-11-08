// ===================== RELATÓRIO DE VENDAS =====================

let pedidosCache = [];

async function carregarRelatorio() {
  try {
    const resposta = await fetch("/adminn/relatorio/dados");
    if (!resposta.ok) throw new Error("Erro ao buscar pedidos entregues");

    pedidosCache = await resposta.json();
    if (!pedidosCache || pedidosCache.length === 0) {
      document.querySelector("main").innerHTML = "<p>Nenhum pedido entregue encontrado.</p>";
      return;
    }

    renderizarRelatorio(); // mostra tudo inicialmente
  } catch (erro) {
    console.error("Erro ao gerar relatório:", erro);
    document.querySelector("main").innerHTML =
      "<p style='color:red'>Erro ao carregar relatório. Veja o console.</p>";
  }
}

// ===================== CORRIGE QUALQUER FORMATO DE DATA =====================
function normalizarData(dataOriginal) {
  if (!dataOriginal) return new Date().toISOString().split("T")[0];

  // Se for formato "07/11/2025, 22:23:00"
  if (dataOriginal.includes(",") && dataOriginal.includes("/")) {
    const [data] = dataOriginal.split(",");
    const [dia, mes, ano] = data.trim().split("/");
    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  // Se for formato BR simples "07/11/2025"
  if (dataOriginal.includes("/")) {
    const [dia, mes, ano] = dataOriginal.trim().split("/");
    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  // Se já for ISO (2025-11-07)
  if (dataOriginal.includes("-")) {
    return dataOriginal.split("T")[0];
  }

  // fallback
  return new Date(dataOriginal).toISOString().split("T")[0];
}

// ===================== RENDERIZAR RELATÓRIO =====================
function renderizarRelatorio(filtroInicio = null, filtroFim = null) {
  const porDia = {};

  pedidosCache.forEach((p) => {
    const dataKey = normalizarData(p.entregueEm || new Date());
    if (!porDia[dataKey]) porDia[dataKey] = [];
    porDia[dataKey].push(p);
  });

  const dias = Object.entries(porDia).filter(([dataISO]) => {
    if (!filtroInicio && !filtroFim) return true;
    if (filtroInicio && !filtroFim) return dataISO === filtroInicio;
    if (filtroInicio && filtroFim) return dataISO >= filtroInicio && dataISO <= filtroFim;
  });

  if (dias.length === 0) {
    document.getElementById("dados-entregadores").innerHTML =
      "<p style='color:gray'>Nenhum pedido encontrado nesse período.</p>";
    document.getElementById("dados-gerais").innerHTML = "";
    return;
  }

  let totalVendas = 0,
    totalTaxa = 0,
    totalPix = 0,
    totalCartao = 0,
    totalDinheiro = 0,
    totalRetirada = 0;

  let htmlDiario = "";

  dias.forEach(([dataISO, lista]) => {
    const dataBR = new Date(dataISO).toLocaleDateString("pt-BR");

    let diaTotal = 0,
      diaTaxa = 0,
      diaPix = 0,
      diaCartao = 0,
      diaDinheiro = 0,
      diaRetirada = 0,
      qtdRetiradas = 0,
      qtdEntregas = 0;

    const entregadores = {};
    const retiradaPagamentos = { pix: 0, cartao: 0, dinheiro: 0 };

    lista.forEach((pedido) => {
      let totalPedido = 0;
      pedido.carrinho?.forEach((item) => {
        const preco = parseFloat(item.preco) || 0;
        const qtd = parseInt(item.qtd) || 1;
        totalPedido += preco * qtd;
      });

      const tipo = (pedido.tipoEntrega || "").toLowerCase();
      const taxa = tipo === "entrega" ? 9 : 0;
      diaTaxa += taxa;
      diaTotal += totalPedido;

      const pagamento = (pedido.pagamento || "").toLowerCase();
      if (pagamento.includes("pix")) diaPix += totalPedido;
      else if (pagamento.includes("dinheiro")) diaDinheiro += totalPedido;
      else if (pagamento.includes("cartao") || pagamento.includes("cartão")) diaCartao += totalPedido;

      if (tipo === "retirada") {
        diaRetirada += totalPedido;
        qtdRetiradas++;
        if (pagamento.includes("pix")) retiradaPagamentos.pix += totalPedido;
        else if (pagamento.includes("dinheiro")) retiradaPagamentos.dinheiro += totalPedido;
        else if (pagamento.includes("cartao") || pagamento.includes("cartão")) retiradaPagamentos.cartao += totalPedido;
      } else {
        qtdEntregas++;
        const nomeEntregador = pedido.entregador || "Não atribuído";
        if (!entregadores[nomeEntregador])
          entregadores[nomeEntregador] = { total: 0, entregas: 0, pix: 0, cartao: 0, dinheiro: 0 };

        entregadores[nomeEntregador].total += totalPedido;
        entregadores[nomeEntregador].entregas++;
        if (pagamento.includes("pix")) entregadores[nomeEntregador].pix += totalPedido;
        else if (pagamento.includes("dinheiro")) entregadores[nomeEntregador].dinheiro += totalPedido;
        else if (pagamento.includes("cartao") || pagamento.includes("cartão")) entregadores[nomeEntregador].cartao += totalPedido;
      }
    });

    totalVendas += diaTotal;
    totalTaxa += diaTaxa;
    totalPix += diaPix;
    totalCartao += diaCartao;
    totalDinheiro += diaDinheiro;
    totalRetirada += diaRetirada;

    htmlDiario += `
      <div class="relatorio-dia">
        <h3>📅 ${dataBR}</h3>
        <div class="resumo-topo">
          <span>🚴 Entregas: <strong>${qtdEntregas}</strong></span>
          <span>🛍️ Retiradas: <strong>${qtdRetiradas}</strong></span>
        </div>
        <div class="resumo-dia">
          <p><strong>Total de Vendas:</strong> R$ ${diaTotal.toFixed(2)}</p>
          <p><strong>Total de Taxas:</strong> R$ ${diaTaxa.toFixed(2)}</p>
          <p><strong>Total Retiradas:</strong> R$ ${diaRetirada.toFixed(2)}</p>
          <p><strong>Total Geral:</strong> R$ ${(diaTotal + diaTaxa).toFixed(2)}</p>
        </div>
        <div class="bloco">
          <h4>🚴 Entregadores</h4>
          <div class="entregadores-lista">
            ${Object.entries(entregadores)
              .map(
                ([nome, dados]) => `
              <div class="entregador-card">
                <h5>${nome}</h5>
                <p>Entregas: ${dados.entregas}</p>
                <p>PIX: R$ ${dados.pix.toFixed(2)}</p>
                <p>Cartão: R$ ${dados.cartao.toFixed(2)}</p>
                <p>Dinheiro: R$ ${dados.dinheiro.toFixed(2)}</p>
                <p><strong>Total:</strong> R$ ${dados.total.toFixed(2)}</p>
              </div>`
              )
              .join("")}
          </div>
        </div>
        ${
          diaRetirada > 0
            ? `
          <div class="bloco bloco-retirada">
            <h4>🛍️ Retiradas no Balcão</h4>
            <div class="entregador-card">
              <p>Retiradas: ${qtdRetiradas}</p>
              <p>PIX: R$ ${retiradaPagamentos.pix.toFixed(2)}</p>
              <p>Cartão: R$ ${retiradaPagamentos.cartao.toFixed(2)}</p>
              <p>Dinheiro: R$ ${retiradaPagamentos.dinheiro.toFixed(2)}</p>
              <p><strong>Total:</strong> R$ ${diaRetirada.toFixed(2)}</p>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  });

  document.getElementById("dados-gerais").innerHTML = `
    <p><strong>Total de Vendas:</strong> R$ ${totalVendas.toFixed(2)}</p>
    <p><strong>Total de Taxas:</strong> R$ ${totalTaxa.toFixed(2)}</p>
    <p><strong>Total Retiradas:</strong> R$ ${totalRetirada.toFixed(2)}</p>
    <p><strong>Total Geral (com taxas):</strong> R$ ${(totalVendas + totalTaxa).toFixed(2)}</p>
  `;

  document.getElementById("dados-entregadores").innerHTML = htmlDiario;
}

// ===================== FILTROS =====================
function filtrarPorData() {
  const data = document.getElementById("data-relatorio").value;
  if (data) renderizarRelatorio(data);
}

function filtrarPorPeriodo() {
  const inicio = document.getElementById("data-inicio").value;
  const fim = document.getElementById("data-fim").value;
  if (inicio && fim) renderizarRelatorio(inicio, fim);
}

carregarRelatorio();
