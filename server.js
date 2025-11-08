const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 3000;

// ===================== MIDDLEWARE =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===================== CONFIGURAÇÃO DO UPLOAD =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ===================== ARQUIVOS DE DADOS =====================
const pedidosFile = path.join(__dirname, "pedidos.json");
const pedidosEntreguesFile = path.join(__dirname, "pedidosEntregues.json");
const cardapioFile = path.join(__dirname, "public", "cardapio.json");
const adicionaisFile = path.join(__dirname, "public", "adicionais.json");

// ===================== FUNÇÕES AUXILIARES =====================
function lerArquivo(arquivo) {
  if (!fs.existsSync(arquivo)) fs.writeFileSync(arquivo, "[]");
  try {
    return JSON.parse(fs.readFileSync(arquivo));
  } catch (err) {
    console.error(`Erro ao ler ${arquivo}:`, err);
    return [];
  }
}

function salvarArquivo(arquivo, conteudo) {
  try {
    fs.writeFileSync(arquivo, JSON.stringify(conteudo, null, 2));
  } catch (err) {
    console.error(`Erro ao salvar ${arquivo}:`, err);
  }
}

// ===================== ROTAS DO PAINEL ADMIN =====================

// Painel admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "adminn", "admin.html"));
});

// Cardápio
app.get("/adminn/cardapio", (req, res) => {
  res.json(lerArquivo(cardapioFile));
});

app.post("/adminn/cardapio/adicionar", (req, res) => {
  const cardapio = lerArquivo(cardapioFile);
  cardapio.push(req.body);
  salvarArquivo(cardapioFile, cardapio);
  res.json({ success: true });
});

app.put("/adminn/cardapio/editar/:index", (req, res) => {
  const index = parseInt(req.params.index);
  const cardapio = lerArquivo(cardapioFile);
  if (cardapio[index]) {
    cardapio[index] = req.body;
    salvarArquivo(cardapioFile, cardapio);
    res.json({ success: true });
  } else res.status(404).json({ success: false });
});

app.delete("/adminn/cardapio/remover/:index", (req, res) => {
  const index = parseInt(req.params.index);
  const cardapio = lerArquivo(cardapioFile);
  if (cardapio[index]) {
    cardapio.splice(index, 1);
    salvarArquivo(cardapioFile, cardapio);
    res.json({ success: true });
  } else res.status(404).json({ success: false });
});

app.post("/adminn/cardapio/atualizar", (req, res) => {
  const { index, disponivel } = req.body;
  const cardapio = lerArquivo(cardapioFile);
  if (cardapio[index] !== undefined) {
    cardapio[index].disponivel = disponivel;
    salvarArquivo(cardapioFile, cardapio);
    res.json({ success: true });
  } else res.json({ success: false });
});

// Upload de imagens
app.post("/adminn/upload", upload.single("imagem"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: "Arquivo não enviado" });
  const imageUrl = "/uploads/" + req.file.filename;
  res.json({ success: true, imageUrl });
});

// ===================== ROTAS DE PEDIDOS =====================
app.post("/pedido", (req, res) => {
  try {
    const pedidos = lerArquivo(pedidosFile);
    const novoPedido = { id: Date.now(), ...req.body, status: "recebido" };
    pedidos.push(novoPedido);
    salvarArquivo(pedidosFile, pedidos);
    res.json({ success: true, pedidoId: novoPedido.id });
  } catch (err) {
    console.error("Erro ao criar pedido:", err);
    res.status(500).json({ success: false });
  }
});

app.get("/pedidos", (req, res) => {
  res.json(lerArquivo(pedidosFile));
});

// Atualizar status
app.post("/pedidos/status", (req, res) => {
  const { id, status, entregador } = req.body;
  const pedidos = lerArquivo(pedidosFile);
  const pedido = pedidos.find((p) => p.id === id);
  if (pedido) {
    pedido.status = status;
    if (entregador) pedido.entregador = entregador;
    if (status === "entregue") pedido.entregueEm = new Date().toLocaleString("pt-BR");
    salvarArquivo(pedidosFile, pedidos);
    return res.json({ success: true });
  }
  res.json({ success: false });
});
// ===================== ATRIBUIR ENTREGADOR =====================
app.post("/pedidos/atribuir-entregador", (req, res) => {
  const { id, entregador } = req.body;

  const pedidos = lerArquivo(pedidosFile);
  const pedido = pedidos.find(p => p.id === id);
  if (!pedido) return res.json({ success: false, error: "Pedido não encontrado" });

  pedido.entregador = entregador;
  pedido.status = "em_entrega";
  pedido.saiuParaEntrega = new Date().toLocaleString("pt-BR");

  salvarArquivo(pedidosFile, pedidos);
  res.json({ success: true, pedido });
});


// Cancelar pedido
app.delete("/pedidos/cancelar/:id", (req, res) => {
  const id = parseInt(req.params.id);
  let pedidos = lerArquivo(pedidosFile);
  const index = pedidos.findIndex((p) => p.id === id);
  if (index !== -1) {
    pedidos.splice(index, 1);
    salvarArquivo(pedidosFile, pedidos);
    res.json({ success: true });
  } else res.json({ success: false });
});

// Mover pedido para entregues
app.post("/pedidos/mover-para-entregues", (req, res) => {
  const { id } = req.body;
  const pedidos = lerArquivo(pedidosFile);
  const entregues = lerArquivo(pedidosEntreguesFile);

  const index = pedidos.findIndex((p) => p.id === id);
  if (index !== -1) {
    const pedido = pedidos[index];
    pedidos.splice(index, 1);
    pedido.status = "entregue";
    pedido.entregueEm = new Date().toLocaleString("pt-BR");
    entregues.push(pedido);

    salvarArquivo(pedidosFile, pedidos);
    salvarArquivo(pedidosEntreguesFile, entregues);

    res.json({ success: true });
  } else {
    res.json({ success: false, error: "Pedido não encontrado" });
  }
});

// Listar pedidos entregues
app.get("/pedidos/entregues", (req, res) => {
  res.json(lerArquivo(pedidosEntreguesFile));
});

// ===================== ROTAS DE ADICIONAIS =====================
app.get("/adminn/adicionais", (req, res) => {
  res.json(lerArquivo(adicionaisFile));
});

app.post("/adminn/adicionais/adicionar", (req, res) => {
  const adicionais = lerArquivo(adicionaisFile);
  adicionais.push(req.body);
  salvarArquivo(adicionaisFile, adicionais);
  res.json({ success: true });
});

app.delete("/adminn/adicionais/remover/:index", (req, res) => {
  const index = parseInt(req.params.index);
  const adicionais = lerArquivo(adicionaisFile);
  if (adicionais[index]) {
    adicionais.splice(index, 1);
    salvarArquivo(adicionaisFile, adicionais);
    res.json({ success: true });
  } else res.json({ success: false });
});
// ===================== ROTAS DE ENTREGADORES =====================
const entregadoresFile = path.join(__dirname, "entregadores.json");

// Listar entregadores
app.get("/adminn/entregadores", (req, res) => {
  res.json(lerArquivo(entregadoresFile));
});

// Adicionar entregador
app.post("/adminn/entregadores/adicionar", (req, res) => {
  const entregadores = lerArquivo(entregadoresFile);
  const novo = {
    id: Date.now(),
    nome: req.body.nome,
    ativo: true,
  };
  entregadores.push(novo);
  salvarArquivo(entregadoresFile, entregadores);
  res.json({ success: true, entregador: novo });
});

// Remover entregador
app.delete("/adminn/entregadores/remover/:id", (req, res) => {
  const id = parseInt(req.params.id);
  let entregadores = lerArquivo(entregadoresFile);
  entregadores = entregadores.filter(e => e.id !== id);
  salvarArquivo(entregadoresFile, entregadores);
  res.json({ success: true });
});

// Atualizar status (ativo/inativo)
app.post("/adminn/entregadores/status", (req, res) => {
  const { id, ativo } = req.body;
  const entregadores = lerArquivo(entregadoresFile);
  const entregador = entregadores.find(e => e.id === id);
  if (entregador) {
    entregador.ativo = ativo;
    salvarArquivo(entregadoresFile, entregadores);
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});


// ===================== RELATÓRIO =====================
app.get("/adminn/relatorio/pagina", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "adminn", "relatorio.html"));
});

// Agora o relatório busca do arquivo de pedidos entregues
app.get("/adminn/relatorio/dados", (req, res) => {
  const pedidosEntregues = lerArquivo(pedidosEntreguesFile);
  res.json(pedidosEntregues);
});


// ===================== INICIAR SERVIDOR =====================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
