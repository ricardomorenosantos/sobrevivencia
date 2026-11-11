// Lógica do app. Dividido em blocos: navegação, manual, estoque, calculadoras, SOS e offline.
"use strict";

const $ = (seletor) => document.querySelector(seletor);

// Cria um elemento HTML com texto. Usar textContent (e não innerHTML) impede que
// algo digitado pelo usuário seja interpretado como código.
function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

/* ================= NAVEGAÇÃO ENTRE TELAS ================= */

const TITULOS = { manual: "Manual", estoque: "Estoque", calc: "Calculadoras", sos: "SOS" };

function abrirTela(nome) {
  document.querySelectorAll(".tela").forEach((t) => t.classList.toggle("ativa", t.id === "tela-" + nome));
  document.querySelectorAll(".aba").forEach((a) => a.classList.toggle("ativa", a.dataset.tela === nome));
  $("#titulo-tela").textContent = TITULOS[nome];
  window.scrollTo(0, 0);
}

document.querySelectorAll(".aba").forEach((aba) => {
  aba.addEventListener("click", () => abrirTela(aba.dataset.tela));
});

/* ================= MANUAL ================= */

// Tira acentos e deixa minúsculo, para "agua" encontrar "Água".
function normalizar(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Texto de cada artigo já preparado para a busca.
const INDICE_BUSCA = MANUAL.map((a) =>
  normalizar([a.categoria, a.titulo, a.palavras || "", a.passos.join(" "), a.atencao || ""].join(" "))
);

function desenharManual() {
  const termos = normalizar($("#busca").value).split(/\s+/).filter(Boolean);
  const lista = $("#lista-manual");
  lista.textContent = "";
  let categoriaAtual = "";
  let achados = 0;

  MANUAL.forEach((artigo, i) => {
    if (!termos.every((t) => INDICE_BUSCA[i].includes(t))) return;
    achados++;

    if (artigo.categoria !== categoriaAtual) {
      categoriaAtual = artigo.categoria;
      lista.append(criar("h2", "categoria", categoriaAtual));
    }

    const det = criar("details", "artigo");
    det.append(criar("summary", "", artigo.titulo));
    const corpo = criar("div", "corpo");
    const ol = criar("ol");
    artigo.passos.forEach((p) => ol.append(criar("li", "", p)));
    corpo.append(ol);
    if (artigo.atencao) corpo.append(criar("p", "atencao", "⚠️ " + artigo.atencao));
    det.append(corpo);
    lista.append(det);
  });

  // Com busca ativa e poucos resultados, já mostra os artigos abertos.
  if (termos.length && achados <= 3) lista.querySelectorAll("details").forEach((d) => (d.open = true));

  $("#manual-vazio").hidden = achados > 0;
  $("#emergencia").hidden = termos.length > 0;
}

$("#busca").addEventListener("input", desenharManual);
desenharManual();

/* ================= ESTOQUE (IndexedDB) ================= */

const DIAS_AVISO = 30; // avisa quando faltam 30 dias ou menos para vencer
let banco = null;
let itens = [];
let editandoId = null;

// Abre (ou cria, na primeira vez) o banco de dados que fica só neste aparelho.
function abrirBanco() {
  return new Promise((resolver, rejeitar) => {
    const pedido = indexedDB.open("sobrevivencia", 1);
    pedido.onupgradeneeded = () => {
      pedido.result.createObjectStore("estoque", { keyPath: "id", autoIncrement: true });
    };
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rejeitar(pedido.error);
  });
}

// Executa uma operação na tabela "estoque" e devolve o resultado.
function operar(modo, acao) {
  return new Promise((resolver, rejeitar) => {
    const transacao = banco.transaction("estoque", modo);
    const pedido = acao(transacao.objectStore("estoque"));
    transacao.oncomplete = () => resolver(pedido.result);
    transacao.onerror = () => rejeitar(transacao.error);
    transacao.onabort = () => rejeitar(transacao.error);
  });
}

// Quantos dias faltam para a validade (negativo = já venceu). null = sem validade.
function diasParaVencer(validade) {
  if (!validade) return null;
  const [ano, mes, dia] = validade.split("-").map(Number);
  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((new Date(ano, mes - 1, dia) - inicioHoje) / 86400000);
}

function textoValidade(validade, dias) {
  if (dias === null) return "Sem validade informada";
  const data = validade.split("-").reverse().join("/");
  if (dias < 0) return `VENCIDO em ${data} (há ${-dias} ${-dias === 1 ? "dia" : "dias"})`;
  if (dias === 0) return `Vence HOJE (${data})`;
  if (dias <= DIAS_AVISO) return `Vence em ${dias} ${dias === 1 ? "dia" : "dias"} (${data})`;
  return `Validade: ${data}`;
}

async function carregarEstoque() {
  itens = await operar("readonly", (tabela) => tabela.getAll());
  desenharEstoque();
}

function desenharEstoque() {
  // Ordena: o que vence primeiro fica em cima; sem validade vai para o fim.
  const ordenados = itens
    .map((item) => ({ item, dias: diasParaVencer(item.validade) }))
    .sort((a, b) => (a.dias ?? Infinity) - (b.dias ?? Infinity) || a.item.nome.localeCompare(b.item.nome, "pt-BR"));

  const lista = $("#lista-estoque");
  lista.textContent = "";
  let vencidos = 0;
  let perto = 0;

  ordenados.forEach(({ item, dias }) => {
    const cartao = criar("div", "item");
    if (dias !== null && dias < 0) { cartao.classList.add("vencido"); vencidos++; }
    else if (dias !== null && dias <= DIAS_AVISO) { cartao.classList.add("perto"); perto++; }

    cartao.append(criar("div", "nome", item.nome));
    cartao.append(criar("div", "validade", textoValidade(item.validade, dias)));

    const acoes = criar("div", "acoes");
    const menos = criar("button", "botao", "−");
    const qtd = criar("span", "qtd", String(item.qtd));
    const mais = criar("button", "botao", "+");
    const editar = criar("button", "botao texto", "Editar");
    const excluir = criar("button", "botao texto", "Excluir");
    [menos, mais, editar, excluir].forEach((b) => (b.type = "button"));
    menos.setAttribute("aria-label", "Diminuir quantidade");
    mais.setAttribute("aria-label", "Aumentar quantidade");

    menos.addEventListener("click", () => mudarQuantidade(item, -1));
    mais.addEventListener("click", () => mudarQuantidade(item, 1));
    editar.addEventListener("click", () => iniciarEdicao(item));
    excluir.addEventListener("click", async () => {
      if (!confirm(`Excluir "${item.nome}" do estoque?`)) return;
      await operar("readwrite", (tabela) => tabela.delete(item.id));
      if (editandoId === item.id) encerrarEdicao();
      carregarEstoque();
    });

    acoes.append(menos, qtd, mais, editar, excluir);
    cartao.append(acoes);
    lista.append(cartao);
  });

  $("#estoque-vazio").hidden = itens.length > 0;

  // Resumo no topo e bolinha vermelha na aba
  const resumo = $("#resumo-estoque");
  const partes = [];
  if (vencidos) partes.push(`${vencidos} ${vencidos === 1 ? "item vencido" : "itens vencidos"}`);
  if (perto) partes.push(`${perto} ${perto === 1 ? "item vence" : "itens vencem"} em até ${DIAS_AVISO} dias`);
  resumo.hidden = partes.length === 0;
  resumo.classList.toggle("grave", vencidos > 0);
  resumo.textContent = partes.length ? "⚠️ " + partes.join(" · ") : "";
  $("#bolinha-estoque").hidden = partes.length === 0;
}

async function mudarQuantidade(item, passo) {
  const nova = Math.max(0, item.qtd + passo);
  if (nova === item.qtd) return;
  await operar("readwrite", (tabela) => tabela.put({ ...item, qtd: nova }));
  carregarEstoque();
}

function iniciarEdicao(item) {
  editandoId = item.id;
  $("#item-nome").value = item.nome;
  $("#item-qtd").value = item.qtd;
  $("#item-validade").value = item.validade || "";
  $("#form-titulo").textContent = "Editar item";
  $("#botao-salvar").textContent = "Salvar";
  $("#botao-cancelar").hidden = false;
  window.scrollTo(0, 0);
}

function encerrarEdicao() {
  editandoId = null;
  $("#form-item").reset();
  $("#form-titulo").textContent = "Adicionar item";
  $("#botao-salvar").textContent = "Adicionar";
  $("#botao-cancelar").hidden = true;
}

$("#botao-cancelar").addEventListener("click", encerrarEdicao);

$("#form-item").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const nome = $("#item-nome").value.trim();
  if (!nome) return;
  const registro = {
    nome,
    qtd: Math.max(0, Math.floor(Number($("#item-qtd").value) || 0)),
    validade: $("#item-validade").value || ""
  };
  if (editandoId !== null) registro.id = editandoId;
  await operar("readwrite", (tabela) => tabela.put(registro));
  encerrarEdicao();
  document.activeElement.blur(); // fecha o teclado do iPhone
  carregarEstoque();
});

async function iniciarEstoque() {
  try {
    banco = await abrirBanco();
    await carregarEstoque();
    // Pede ao navegador para não apagar os dados sozinho quando faltar espaço.
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  } catch (erro) {
    $("#estoque-vazio").hidden = false;
    $("#estoque-vazio").textContent =
      "Não foi possível abrir o armazenamento deste aparelho. Se estiver em aba anônima/privada, abra em uma aba normal.";
    $("#form-item").hidden = true;
  }
}
iniciarEstoque();

// Ao voltar para o app em outro dia, refaz as contas de validade.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && banco) desenharEstoque();
});

/* ================= CALCULADORAS ================= */

const AGUA_BEBER = 2;    // litros por pessoa por dia, só para beber (mínimo)
const AGUA_TOTAL = 4;    // litros por pessoa por dia: beber + cozinhar + higiene básica
const KCAL_DIA = 2000;   // calorias por pessoa por dia

// Cesta básica de exemplo, por pessoa por dia (soma perto de 2.000 kcal).
const CESTA = [
  { nome: "Arroz", qtd: 150, unidade: "g" },
  { nome: "Feijão", qtd: 80, unidade: "g" },
  { nome: "Macarrão", qtd: 100, unidade: "g" },
  { nome: "Óleo", qtd: 30, unidade: "ml" },
  { nome: "Açúcar", qtd: 30, unidade: "g" },
  { nome: "Leite em pó", qtd: 30, unidade: "g" },
  { nome: "Sardinha ou atum (lata 125 g)", qtd: 1, unidade: "lata" },
  { nome: "Sal", qtd: 5, unidade: "g" }
];

const numero = (valor, casas = 0) =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

function formatarQuantidade(total, unidade) {
  if (unidade === "lata") return `${numero(total)} ${total === 1 ? "lata" : "latas"}`;
  const grande = unidade === "g" ? "kg" : "L";
  return total >= 1000 ? `${numero(total / 1000, 1)} ${grande}` : `${numero(total)} ${unidade}`;
}

function lerInteiro(id) {
  const valor = Math.floor(Number($(id).value));
  return Math.min(999, Math.max(1, valor || 1));
}

function linhaTabela(tabela, esquerda, direita) {
  const tr = criar("tr");
  tr.append(criar("td", "", esquerda), criar("td", "", direita));
  tabela.append(tr);
}

function calcular() {
  const pessoas = lerInteiro("#calc-pessoas");
  const dias = lerInteiro("#calc-dias");
  const fator = pessoas * dias;

  // Água
  const agua = $("#resultado-agua");
  agua.textContent = "";
  const totalAgua = fator * AGUA_TOTAL;
  const grandeAgua = criar("div", "numero-grande", numero(totalAgua) + " litros ");
  grandeAgua.append(criar("small", "", "recomendado"));
  agua.append(grandeAgua);
  const tabAgua = criar("table");
  linhaTabela(tabAgua, "Mínimo só para beber", numero(fator * AGUA_BEBER) + " L");
  linhaTabela(tabAgua, "Beber + cozinhar + higiene", numero(totalAgua) + " L");
  linhaTabela(tabAgua, "Em galões de 20 L", numero(Math.ceil(totalAgua / 20)));
  linhaTabela(tabAgua, "Em garrafas de 1,5 L", numero(Math.ceil(totalAgua / 1.5)));
  agua.append(tabAgua);

  // Comida
  const comida = $("#resultado-comida");
  comida.textContent = "";
  const grandeComida = criar("div", "numero-grande", numero(fator * KCAL_DIA) + " kcal ");
  grandeComida.append(criar("small", "", `(${numero(KCAL_DIA)} por pessoa/dia)`));
  comida.append(grandeComida);
  comida.append(criar("div", "", "Exemplo de compra que cobre isso:"));
  const tabComida = criar("table");
  CESTA.forEach((c) => linhaTabela(tabComida, c.nome, formatarQuantidade(c.qtd * fator, c.unidade)));
  comida.append(tabComida);
}

["#calc-pessoas", "#calc-dias"].forEach((id) => {
  $(id).addEventListener("input", calcular);
  // Ao sair do campo, corrige valores vazios ou fora do limite.
  $(id).addEventListener("blur", () => { $(id).value = lerInteiro(id); calcular(); });
});

document.querySelectorAll(".contador .botao").forEach((botao) => {
  botao.addEventListener("click", () => {
    const campo = $("#" + botao.dataset.alvo);
    campo.value = Math.min(999, Math.max(1, lerInteiro("#" + botao.dataset.alvo) + Number(botao.dataset.passo)));
    calcular();
  });
});
calcular();

/* ================= SOS: LANTERNA E MORSE ================= */

const UNIDADE_MS = 300; // duração de um "ponto" do Morse, em milissegundos
// Tempos em unidades: [aceso, apagado, aceso, apagado, ...]
// ponto = 1, traço = 3, pausa entre sinais = 1, entre letras = 3, entre palavras = 7
const SOS = [
  1, 1, 1, 1, 1, 3,   // S: · · ·
  3, 1, 3, 1, 3, 3,   // O: — — —
  1, 1, 1, 1, 1, 7    // S: · · ·  e pausa longa antes de repetir
];

const telaLuz = $("#tela-luz");
let temporizadorMorse = null;
let travaTela = null;

// Pede ao aparelho para não apagar a tela sozinho (funciona em iPhones mais novos).
async function manterTelaAcesa() {
  try {
    if ("wakeLock" in navigator) travaTela = await navigator.wakeLock.request("screen");
  } catch (erro) { /* sem suporte ou negado: segue sem a trava */ }
}

function acenderLuz(piscando) {
  telaLuz.hidden = false;
  telaLuz.classList.remove("apagada");
  manterTelaAcesa();
  if (!piscando) return;

  let passo = 0;
  const proximo = () => {
    // Posições pares do vetor são "aceso"; ímpares são "apagado".
    telaLuz.classList.toggle("apagada", passo % 2 === 1);
    temporizadorMorse = setTimeout(proximo, SOS[passo] * UNIDADE_MS);
    passo = (passo + 1) % SOS.length;
  };
  proximo();
}

function apagarLuz() {
  clearTimeout(temporizadorMorse);
  temporizadorMorse = null;
  telaLuz.hidden = true;
  if (travaTela) { travaTela.release().catch(() => {}); travaTela = null; }
}

$("#botao-lanterna").addEventListener("click", () => acenderLuz(false));
$("#botao-morse").addEventListener("click", () => acenderLuz(true));
telaLuz.addEventListener("click", apagarLuz);

// Se o app for para segundo plano, o sistema solta a trava; ao voltar, pede de novo.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !telaLuz.hidden) manterTelaAcesa();
});

/* ================= OFFLINE (service worker) ================= */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("sw.js");
      await navigator.serviceWorker.ready; // só resolve depois que os arquivos foram guardados
      $("#status-offline").hidden = false;
    } catch (erro) {
      console.warn("Service worker não registrado:", erro);
    }
  });
}
