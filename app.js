// Lógica do app. Blocos: navegação, manual, banco de dados, estoque, mochila,
// calculadoras, plano da família, bússola/GPS, backup, SOS e offline.
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

const numero = (valor, casas = 0) =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

const plural = (n, um, varios) => `${numero(n)} ${n === 1 ? um : varios}`;

/* ================= NAVEGAÇÃO ENTRE TELAS ================= */

const TITULOS = {
  manual: "Manual", estoque: "Estoque", mochila: "Mochila", sos: "SOS", mais: "Mais",
  calc: "Calculadoras", plano: "Plano da família", bussola: "Bússola e GPS", backup: "Backup"
};
// Telas que ficam "dentro" da aba Mais e ganham o botão de voltar.
const SUBTELAS = ["calc", "plano", "bussola", "backup"];
let telaAtual = "manual";

function abrirTela(nome) {
  if (telaAtual === "bussola" && nome !== "bussola") pararSensores();
  if (telaAtual === "plano") salvarPlano();
  telaAtual = nome;
  const aba = SUBTELAS.includes(nome) ? "mais" : nome;
  document.querySelectorAll(".tela").forEach((t) => t.classList.toggle("ativa", t.id === "tela-" + nome));
  document.querySelectorAll(".aba").forEach((a) => a.classList.toggle("ativa", a.dataset.tela === aba));
  $("#titulo-tela").textContent = TITULOS[nome];
  $("#botao-voltar").hidden = !SUBTELAS.includes(nome);
  window.scrollTo(0, 0);
}

document.querySelectorAll(".aba, .item-menu").forEach((botao) => {
  botao.addEventListener("click", () => abrirTela(botao.dataset.tela));
});
$("#botao-voltar").addEventListener("click", () => abrirTela("mais"));

// Botões − e + ao lado de campos numéricos (usados no Estoque e nas Calculadoras).
function lerInteiro(campo) {
  const valor = Math.floor(Number(campo.value));
  return Math.min(999, Math.max(1, valor || 1));
}

document.querySelectorAll(".contador .botao").forEach((botao) => {
  botao.addEventListener("click", () => {
    const campo = $("#" + botao.dataset.alvo);
    campo.value = Math.min(999, Math.max(1, lerInteiro(campo) + Number(botao.dataset.passo)));
    campo.dispatchEvent(new Event("input"));
  });
});

document.querySelectorAll(".contador .campo").forEach((campo) => {
  // Ao sair do campo, corrige valores vazios ou fora do limite.
  campo.addEventListener("blur", () => {
    campo.value = lerInteiro(campo);
    campo.dispatchEvent(new Event("input"));
  });
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
}

$("#busca").addEventListener("input", desenharManual);
desenharManual();

/* ================= BANCO DE DADOS (IndexedDB, só neste aparelho) ================= */

// Três "gavetas": estoque, mochila e config (ajustes e o plano da família).
const LOJAS = ["estoque", "mochila", "config"];
let banco = null;
let itens = [];     // estoque em memória
let mochila = [];   // checklist em memória
let config = {};    // ajustes em memória: { pessoas, plano, mochilaSemeada, ultimoBackup }

// Abre o banco. Na primeira vez (ou quando a versão sobe) cria as gavetas que faltam.
function abrirBanco() {
  return new Promise((resolver, rejeitar) => {
    const pedido = indexedDB.open("sobrevivencia", 2);
    pedido.onupgradeneeded = () => {
      const db = pedido.result;
      if (!db.objectStoreNames.contains("estoque")) db.createObjectStore("estoque", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("mochila")) db.createObjectStore("mochila", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("config")) db.createObjectStore("config", { keyPath: "chave" });
    };
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rejeitar(pedido.error);
  });
}

// Executa uma operação em uma gaveta e devolve o resultado.
function operar(loja, modo, acao) {
  return new Promise((resolver, rejeitar) => {
    const transacao = banco.transaction(loja, modo);
    const pedido = acao(transacao.objectStore(loja));
    transacao.oncomplete = () => resolver(pedido && pedido.result);
    transacao.onerror = () => rejeitar(transacao.error);
    transacao.onabort = () => rejeitar(transacao.error);
  });
}

async function salvarConfig(chave, valor) {
  config[chave] = valor;
  if (banco) await operar("config", "readwrite", (t) => t.put({ chave, valor }));
}

// Lê tudo do banco para a memória e redesenha as telas.
async function carregarTudo() {
  const registros = await operar("config", "readonly", (t) => t.getAll());
  config = {};
  registros.forEach((r) => (config[r.chave] = r.valor));

  // Primeira abertura: preenche a mochila com a lista pronta.
  if (!config.mochilaSemeada) {
    await operar("mochila", "readwrite", (t) => {
      MOCHILA_PADRAO.forEach((nome) => t.add({ nome, tem: false }));
    });
    await salvarConfig("mochilaSemeada", true);
  }

  $("#aut-pessoas").value = config.pessoas || 2;
  preencherPlano();
  mostrarUltimoBackup();
  await Promise.all([carregarEstoque(), carregarMochila()]);
}

async function iniciarDados() {
  try {
    banco = await abrirBanco();
    await carregarTudo();
    // Pede ao navegador para não apagar os dados sozinho quando faltar espaço.
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  } catch (erro) {
    console.warn("Banco de dados indisponível:", erro);
    $("#erro-banco").hidden = false;
  }
}

/* ================= ESTOQUE ================= */

const DIAS_AVISO = 30;   // avisa quando faltam 30 dias ou menos para vencer
const AGUA_BEBER = 2;    // litros por pessoa por dia, só para beber (mínimo)
const AGUA_TOTAL = 4;    // litros por pessoa por dia: beber + cozinhar + higiene básica
const KCAL_DIA = 2000;   // calorias por pessoa por dia

// Calorias aproximadas por quilo de cada tipo de comida. Servem para estimar
// quantos dias o estoque dura sem você precisar ler rótulo por rótulo.
const CLASSES_COMIDA = {
  graos:     { nome: "Arroz, feijão, macarrão, farinha", kcalKg: 3500 },
  enlatados: { nome: "Enlatados e conservas", kcalKg: 1300 },
  oleo:      { nome: "Óleo e gorduras", kcalKg: 8800 },
  acucar:    { nome: "Açúcar, mel e doces", kcalKg: 3800 },
  leite:     { nome: "Leite em pó", kcalKg: 4900 },
  biscoito:  { nome: "Biscoitos, barras e castanhas", kcalKg: 4500 },
  outros:    { nome: "Outra comida", kcalKg: 2000 }
};

Object.entries(CLASSES_COMIDA).forEach(([chave, classe]) => {
  const opcao = criar("option", "", classe.nome);
  opcao.value = chave;
  $("#item-classe").append(opcao);
});

let editandoId = null;

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
  if (dias < 0) return `VENCIDO em ${data} (há ${plural(-dias, "dia", "dias")})`;
  if (dias === 0) return `Vence HOJE (${data})`;
  if (dias <= DIAS_AVISO) return `Vence em ${plural(dias, "dia", "dias")} (${data})`;
  return `Validade: ${data}`;
}

function textoTipo(item) {
  if (item.tipo === "agua") return `Água · ${numero(item.litros || 0, 1)} L por unidade`;
  if (item.tipo === "comida") {
    const classe = CLASSES_COMIDA[item.classe] || CLASSES_COMIDA.outros;
    return `Comida · ${numero(item.kg || 0, 2)} kg por unidade · ${classe.nome}`;
  }
  return "";
}

async function carregarEstoque() {
  itens = await operar("estoque", "readonly", (t) => t.getAll());
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
    const tipo = textoTipo(item);
    if (tipo) cartao.append(criar("div", "tipo", tipo));
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
      await operar("estoque", "readwrite", (t) => t.delete(item.id));
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

  desenharAutonomia();
}

// Mostra dias com uma casa decimal quando são poucos (ex.: 3,5 dias).
function formatarDias(dias) {
  const valor = dias >= 10 ? numero(Math.floor(dias)) : numero(Math.floor(dias * 10) / 10, 1);
  return `${valor} ${dias >= 1 && dias < 2 ? "dia" : "dias"}`;
}

// Soma a água e as calorias do estoque (sem contar o que já venceu) e divide pelo consumo diário.
function desenharAutonomia() {
  const pessoas = lerInteiro($("#aut-pessoas"));
  let litros = 0;
  let kcal = 0;
  let semTipo = 0;
  let vencidos = 0;

  itens.forEach((item) => {
    const contavel = item.tipo === "agua" || item.tipo === "comida";
    if (!item.tipo) semTipo++; // itens cadastrados antes desta versão
    if (!contavel) return;
    const dias = diasParaVencer(item.validade);
    if (dias !== null && dias < 0) { vencidos++; return; }
    if (item.tipo === "agua") litros += item.qtd * (item.litros || 0);
    else kcal += item.qtd * (item.kg || 0) * (CLASSES_COMIDA[item.classe] || CLASSES_COMIDA.outros).kcalKg;
  });

  const caixa = $("#resultado-autonomia");
  caixa.textContent = "";
  const grade = criar("div", "autonomia");

  const agua = criar("div");
  agua.append(
    criar("div", "rotulo", "💧 Água"),
    criar("div", "dias", formatarDias(litros / (pessoas * AGUA_TOTAL))),
    criar("div", "detalhe", `${numero(litros, 1)} L · ${AGUA_TOTAL} L por pessoa/dia`),
    criar("div", "detalhe", `Só para beber: ${formatarDias(litros / (pessoas * AGUA_BEBER))}`)
  );

  const comida = criar("div");
  comida.append(
    criar("div", "rotulo", "🍚 Comida"),
    criar("div", "dias", formatarDias(kcal / (pessoas * KCAL_DIA))),
    criar("div", "detalhe", `${numero(Math.round(kcal))} kcal · ${numero(KCAL_DIA)} por pessoa/dia`),
    criar("div", "detalhe", "Estimativa pelo peso")
  );

  grade.append(agua, comida);
  caixa.append(grade);

  const notas = [];
  if (!itens.some((i) => i.tipo === "agua" || i.tipo === "comida"))
    notas.push('Para a conta funcionar, cadastre os itens com o tipo "Água" ou "Comida".');
  if (semTipo) notas.push(`${plural(semTipo, "item antigo está", "itens antigos estão")} sem tipo e não entram na conta. Toque em Editar para informar.`);
  if (vencidos) notas.push(`${plural(vencidos, "item vencido ficou", "itens vencidos ficaram")} de fora.`);
  notas.forEach((texto) => {
    const p = criar("p", "nota", texto);
    p.style.marginTop = "10px";
    caixa.append(p);
  });
}

$("#aut-pessoas").addEventListener("input", () => {
  desenharAutonomia();
  salvarConfig("pessoas", lerInteiro($("#aut-pessoas"))).catch(() => {});
});

async function mudarQuantidade(item, passo) {
  const nova = Math.max(0, item.qtd + passo);
  if (nova === item.qtd) return;
  await operar("estoque", "readwrite", (t) => t.put({ ...item, qtd: nova }));
  carregarEstoque();
}

// Mostra só os campos que fazem sentido para o tipo escolhido.
function mostrarCamposTipo() {
  const tipo = $("#item-tipo").value;
  $("#campos-agua").hidden = tipo !== "agua";
  $("#campos-comida").hidden = tipo !== "comida";
  $("#item-litros").required = tipo === "agua";
  $("#item-kg").required = tipo === "comida";
}
$("#item-tipo").addEventListener("change", mostrarCamposTipo);

function iniciarEdicao(item) {
  editandoId = item.id;
  $("#item-nome").value = item.nome;
  $("#item-qtd").value = item.qtd;
  $("#item-validade").value = item.validade || "";
  $("#item-tipo").value = item.tipo || "outro";
  $("#item-litros").value = item.litros || "";
  $("#item-kg").value = item.kg || "";
  $("#item-classe").value = CLASSES_COMIDA[item.classe] ? item.classe : "graos";
  mostrarCamposTipo();
  $("#form-titulo").textContent = "Editar item";
  $("#botao-salvar").textContent = "Salvar";
  $("#botao-cancelar").hidden = false;
  $("#caixa-form").open = true;
  $("#caixa-form").scrollIntoView();
}

function encerrarEdicao() {
  editandoId = null;
  $("#form-item").reset();
  mostrarCamposTipo();
  $("#form-titulo").textContent = "Adicionar item";
  $("#botao-salvar").textContent = "Adicionar";
  $("#botao-cancelar").hidden = true;
}

$("#botao-cancelar").addEventListener("click", () => {
  encerrarEdicao();
  $("#caixa-form").open = false;
});

$("#form-item").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const nome = $("#item-nome").value.trim();
  if (!nome) return;
  const tipo = $("#item-tipo").value;
  const registro = {
    nome,
    qtd: Math.max(0, Math.floor(Number($("#item-qtd").value) || 0)),
    validade: $("#item-validade").value || "",
    tipo
  };
  if (tipo === "agua") registro.litros = Math.max(0, Number($("#item-litros").value) || 0);
  if (tipo === "comida") {
    registro.kg = Math.max(0, Number($("#item-kg").value) || 0);
    registro.classe = $("#item-classe").value;
  }
  if (editandoId !== null) registro.id = editandoId;
  const eraEdicao = editandoId !== null;
  await operar("estoque", "readwrite", (t) => t.put(registro));
  encerrarEdicao();
  document.activeElement.blur(); // fecha o teclado do iPhone
  if (eraEdicao) $("#caixa-form").open = false;
  carregarEstoque();
});

/* ================= MOCHILA DE EMERGÊNCIA ================= */

// Lista pronta que aparece na primeira abertura. Depois disso a lista é sua:
// dá para marcar, apagar e acrescentar.
const MOCHILA_PADRAO = [
  "Água (pelo menos 2 litros por pessoa)",
  "Comida pronta para 3 dias (barras, enlatados, biscoitos)",
  "Abridor de latas e talher",
  "Lanterna com pilhas extras",
  "Bateria externa carregada e cabo do celular",
  "Rádio a pilha",
  "Kit de primeiros socorros",
  "Remédios de uso contínuo e receitas",
  "Cópia dos documentos em saco plástico",
  "Dinheiro em notas pequenas",
  "Apito",
  "Isqueiro e fósforos em saco plástico",
  "Canivete ou faca",
  "Fita adesiva resistente e corda",
  "Lona ou capa de chuva",
  "Cobertor térmico ou manta",
  "Muda de roupa, meias e agasalho",
  "Calçado fechado e resistente",
  "Máscaras e luvas",
  "Sabão, álcool em gel e papel higiênico",
  "Sacos de lixo",
  "Água sanitária sem perfume (para tratar água)",
  "Chaves reserva de casa e do carro",
  "Papel, caneta e lista de telefones importantes",
  "Itens de bebê, idoso ou animal de estimação (se houver)"
];

async function carregarMochila() {
  mochila = await operar("mochila", "readonly", (t) => t.getAll());
  desenharMochila();
}

function desenharMochila() {
  const lista = $("#lista-mochila");
  lista.textContent = "";

  mochila.forEach((item) => {
    const linha = criar("div", "check" + (item.tem ? " feito" : ""));

    const alternar = criar("button", "alternar");
    alternar.type = "button";
    alternar.setAttribute("aria-pressed", String(!!item.tem));
    alternar.append(criar("span", "marca", item.tem ? "✓" : ""), criar("span", "nome", item.nome));
    alternar.addEventListener("click", async () => {
      await operar("mochila", "readwrite", (t) => t.put({ ...item, tem: !item.tem }));
      carregarMochila();
    });

    const remover = criar("button", "remover", "×");
    remover.type = "button";
    remover.setAttribute("aria-label", "Remover " + item.nome);
    remover.addEventListener("click", async () => {
      if (!confirm(`Remover "${item.nome}" da mochila?`)) return;
      await operar("mochila", "readwrite", (t) => t.delete(item.id));
      carregarMochila();
    });

    linha.append(alternar, remover);
    lista.append(linha);
  });

  const prontos = mochila.filter((i) => i.tem).length;
  $("#mochila-progresso").textContent = mochila.length
    ? `Mochila: ${prontos} de ${mochila.length} prontos`
    : "Mochila de emergência";
  $("#mochila-barra").style.width = mochila.length ? (100 * prontos) / mochila.length + "%" : "0";
  $("#mochila-desmarcar").hidden = prontos === 0;
}

$("#form-mochila").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const nome = $("#mochila-novo").value.trim();
  if (!nome) return;
  await operar("mochila", "readwrite", (t) => t.add({ nome, tem: false }));
  $("#mochila-novo").value = "";
  carregarMochila();
});

$("#mochila-desmarcar").addEventListener("click", async () => {
  if (!confirm("Desmarcar todos os itens da mochila?")) return;
  await operar("mochila", "readwrite", (t) => {
    mochila.forEach((item) => t.put({ ...item, tem: false }));
  });
  carregarMochila();
});

/* ================= CALCULADORAS ================= */

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

function formatarQuantidade(total, unidade) {
  if (unidade === "lata") return plural(total, "lata", "latas");
  const grande = unidade === "g" ? "kg" : "L";
  return total >= 1000 ? `${numero(total / 1000, 1)} ${grande}` : `${numero(total)} ${unidade}`;
}

function linhaTabela(tabela, esquerda, direita) {
  const tr = criar("tr");
  tr.append(criar("td", "", esquerda), criar("td", "", direita));
  tabela.append(tr);
}

function calcular() {
  const fator = lerInteiro($("#calc-pessoas")) * lerInteiro($("#calc-dias"));

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

$("#calc-pessoas").addEventListener("input", calcular);
$("#calc-dias").addEventListener("input", calcular);
calcular();

/* ================= PLANO DA FAMÍLIA ================= */

const CAMPOS_PLANO = { encontro: "#plano-encontro", reserva: "#plano-reserva", rota: "#plano-rota", obs: "#plano-obs" };
let planoAlterado = false;
let temporizadorPlano = null;

function preencherPlano() {
  const plano = config.plano || {};
  Object.entries(CAMPOS_PLANO).forEach(([chave, seletor]) => ($(seletor).value = plano[chave] || ""));
  planoAlterado = false;
  $("#plano-status").textContent = "";
}

async function salvarPlano() {
  clearTimeout(temporizadorPlano);
  if (!planoAlterado || !banco) return;
  planoAlterado = false;
  const plano = {};
  Object.entries(CAMPOS_PLANO).forEach(([chave, seletor]) => (plano[chave] = $(seletor).value));
  try {
    await salvarConfig("plano", plano);
    $("#plano-status").textContent = "Salvo ✓";
  } catch (erro) {
    planoAlterado = true;
    $("#plano-status").textContent = "Não foi possível salvar.";
  }
}

// Salva sozinho meio segundo depois que você para de digitar.
Object.values(CAMPOS_PLANO).forEach((seletor) => {
  $(seletor).addEventListener("input", () => {
    planoAlterado = true;
    $("#plano-status").textContent = "Salvando…";
    clearTimeout(temporizadorPlano);
    temporizadorPlano = setTimeout(salvarPlano, 500);
  });
  $(seletor).addEventListener("blur", salvarPlano);
});

/* ================= BÚSSOLA E GPS ================= */

const PONTOS = ["Norte", "Nordeste", "Leste", "Sudeste", "Sul", "Sudoeste", "Oeste", "Noroeste"];
let bussolaLigada = false;
let eventoBussola = "deviceorientation";
let anguloRosa = 0;       // rotação acumulada, para o desenho não dar a volta inteira ao passar de 359° para 0°
let ultimoRumo = null;
let avisoSemSensor = null;
let vigiaGps = null;
let ultimaPosicao = null;

// Desenha os tracinhos da rosa dos ventos (um a cada 10°, mais forte a cada 90°).
for (let grau = 0; grau < 360; grau += 10) {
  const marca = document.createElementNS("http://www.w3.org/2000/svg", "line");
  marca.setAttribute("y1", -95);
  marca.setAttribute("y2", grau % 90 === 0 ? -80 : -87);
  marca.setAttribute("transform", `rotate(${grau})`);
  if (grau % 90 === 0) marca.setAttribute("class", "forte");
  $("#marcas").append(marca);
}

function aoGirar(evento) {
  let rumo = null;
  // iPhone informa o rumo pronto; outros aparelhos informam "alpha", que gira ao contrário.
  if (typeof evento.webkitCompassHeading === "number") rumo = evento.webkitCompassHeading;
  else if (evento.absolute && typeof evento.alpha === "number") rumo = 360 - evento.alpha;
  if (rumo === null || Number.isNaN(rumo)) return;

  rumo = ((rumo % 360) + 360) % 360;
  clearTimeout(avisoSemSensor);
  if (ultimoRumo === null) anguloRosa = rumo;
  else anguloRosa += ((rumo - ultimoRumo + 540) % 360) - 180;
  ultimoRumo = rumo;

  $("#rosa").style.transform = `rotate(${-anguloRosa}deg)`;
  const graus = Math.round(rumo) % 360;
  $("#rumo").textContent = `${graus}° ${PONTOS[Math.round(rumo / 45) % 8]}`;
  $("#bussola-status").textContent = "Bússola ligada.";
}

async function ligarBussola() {
  const status = $("#bussola-status");
  if (typeof DeviceOrientationEvent === "undefined") {
    status.textContent = "Este aparelho ou navegador não tem bússola.";
    return;
  }
  try {
    // No iPhone é obrigatório pedir permissão, e só vale se for dentro de um toque em botão.
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const resposta = await DeviceOrientationEvent.requestPermission();
      if (resposta !== "granted") {
        status.textContent = "Permissão negada. Feche o app por completo, abra de novo e toque em Permitir.";
        return;
      }
    }
  } catch (erro) {
    status.textContent = "Não foi possível pedir permissão para a bússola.";
    return;
  }

  eventoBussola = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
  window.addEventListener(eventoBussola, aoGirar);
  bussolaLigada = true;
  $("#botao-bussola").textContent = "Desligar bússola";
  status.textContent = "Aguardando o sensor…";
  avisoSemSensor = setTimeout(() => {
    status.textContent = "O sensor não respondeu. Este aparelho pode não ter bússola.";
  }, 4000);
}

function desligarBussola() {
  window.removeEventListener(eventoBussola, aoGirar);
  clearTimeout(avisoSemSensor);
  bussolaLigada = false;
  ultimoRumo = null;
  $("#botao-bussola").textContent = "Ativar bússola";
  $("#bussola-status").textContent = "Bússola desligada.";
}

$("#botao-bussola").addEventListener("click", () => (bussolaLigada ? desligarBussola() : ligarBussola()));

// Converte graus decimais em graus, minutos e segundos (ex.: 23°33'01,2"S).
function grausMinutosSegundos(valor, positivo, negativo) {
  const letra = valor >= 0 ? positivo : negativo;
  const absoluto = Math.abs(valor);
  let graus = Math.floor(absoluto);
  let minutos = Math.floor((absoluto - graus) * 60);
  let segundos = Math.round(((absoluto - graus) * 60 - minutos) * 600) / 10;
  if (segundos >= 60) { segundos = 0; minutos++; }
  if (minutos >= 60) { minutos = 0; graus++; }
  return `${graus}°${String(minutos).padStart(2, "0")}'${numero(segundos, 1).padStart(4, "0")}"${letra}`;
}

function aoLocalizar(posicao) {
  ultimaPosicao = posicao;
  const c = posicao.coords;
  const caixa = $("#gps-resultado");
  caixa.textContent = "";
  caixa.append(criar("div", "numero-grande", `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`));
  const tabela = criar("table");
  linhaTabela(tabela, "Latitude", grausMinutosSegundos(c.latitude, "N", "S"));
  linhaTabela(tabela, "Longitude", grausMinutosSegundos(c.longitude, "L", "O"));
  linhaTabela(tabela, "Precisão", `± ${numero(Math.round(c.accuracy))} m`);
  if (typeof c.altitude === "number") linhaTabela(tabela, "Altitude", `${numero(Math.round(c.altitude))} m`);
  linhaTabela(tabela, "Lido às", new Date(posicao.timestamp).toLocaleTimeString("pt-BR"));
  caixa.append(tabela);
  $("#gps-status").textContent = "GPS ligado. A posição se atualiza sozinha.";
  $("#botao-copiar").hidden = false;
}

function aoFalharGps(erro) {
  const mensagens = {
    1: "Permissão negada. No iPhone: Ajustes > Privacidade e Segurança > Serviços de Localização, ligue e permita para Sites do Safari. Depois feche e abra o app.",
    2: "Não foi possível obter a posição. Vá para um lugar aberto e tente de novo.",
    3: "O GPS está demorando. Fique ao ar livre, com o céu à vista; continuo tentando."
  };
  $("#gps-status").textContent = mensagens[erro.code] || "Erro no GPS.";
  if (erro.code === 1) desligarGps(true);
}

function ligarGps() {
  if (!("geolocation" in navigator)) {
    $("#gps-status").textContent = "Este aparelho ou navegador não tem GPS.";
    return;
  }
  $("#gps-status").textContent = "Procurando satélites…";
  vigiaGps = navigator.geolocation.watchPosition(aoLocalizar, aoFalharGps, {
    enableHighAccuracy: true, // usa o GPS de verdade, não só redes
    maximumAge: 5000,
    timeout: 60000
  });
  $("#botao-gps").textContent = "Desligar GPS";
}

function desligarGps(manterMensagem) {
  if (vigiaGps !== null) navigator.geolocation.clearWatch(vigiaGps);
  vigiaGps = null;
  $("#botao-gps").textContent = "Ativar GPS";
  if (!manterMensagem) $("#gps-status").textContent = "GPS desligado.";
}

$("#botao-gps").addEventListener("click", () => (vigiaGps === null ? ligarGps() : desligarGps()));

$("#botao-copiar").addEventListener("click", async () => {
  if (!ultimaPosicao) return;
  const texto = `${ultimaPosicao.coords.latitude.toFixed(6)}, ${ultimaPosicao.coords.longitude.toFixed(6)}`;
  try {
    await navigator.clipboard.writeText(texto);
    $("#gps-status").textContent = "Coordenadas copiadas: " + texto;
  } catch (erro) {
    $("#gps-status").textContent = "Não deu para copiar. Anote: " + texto;
  }
});

// Ao sair da tela, desliga os sensores para poupar bateria.
function pararSensores() {
  if (bussolaLigada) desligarBussola();
  if (vigiaGps !== null) desligarGps();
}

/* ================= BACKUP ================= */

function mostrarUltimoBackup() {
  $("#backup-ultimo").textContent = config.ultimoBackup
    ? "Último backup exportado em " + new Date(config.ultimoBackup).toLocaleString("pt-BR")
    : "Você ainda não exportou nenhum backup.";
}

function baixarArquivo(arquivo) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(arquivo);
  link.download = arquivo.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}

const ehIphone = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

$("#botao-exportar").addEventListener("click", async () => {
  const agora = new Date();
  // Monta o arquivo com o que já está na memória, sem esperar o banco: o iPhone só
  // abre a tela de compartilhar se isso acontecer logo depois do toque.
  const dados = {
    app: "sobrevivencia",
    formato: 1,
    exportadoEm: agora.toISOString(),
    estoque: itens,
    mochila,
    config: Object.entries({ ...config, ultimoBackup: agora.toISOString() }).map(([chave, valor]) => ({ chave, valor }))
  };
  const nome = `backup-${agora.toISOString().slice(0, 10)}.json`;
  const arquivo = new File([JSON.stringify(dados, null, 2)], nome, { type: "application/json" });

  try {
    // No iPhone abre a folha de compartilhar ("Salvar em Arquivos"); no PC baixa direto.
    if (ehIphone && navigator.canShare && navigator.canShare({ files: [arquivo] })) {
      await navigator.share({ files: [arquivo] });
    } else {
      baixarArquivo(arquivo);
    }
  } catch (erro) {
    if (erro.name === "AbortError") return; // você fechou a folha sem salvar
    baixarArquivo(arquivo);
  }
  await salvarConfig("ultimoBackup", agora.toISOString()).catch(() => {});
  mostrarUltimoBackup();
});

// Confere e limpa o conteúdo do arquivo antes de gravar, para um arquivo
// estragado ou errado não bagunçar o banco.
function validarBackup(dados) {
  if (!dados || dados.app !== "sobrevivencia" || !LOJAS.every((loja) => Array.isArray(dados[loja]))) {
    throw new Error("Este arquivo não é um backup deste app.");
  }
  const texto = (v, limite) => String(v ?? "").slice(0, limite);
  const positivo = (v) => Math.max(0, Number(v) || 0);
  const comId = (origem, registro) => {
    if (Number.isInteger(origem.id) && origem.id > 0) registro.id = origem.id;
    return registro;
  };
  const objetos = (lista) => lista.filter((r) => r && typeof r === "object");

  const estoque = objetos(dados.estoque).filter((r) => r.nome).map((r) => {
    const registro = comId(r, {
      nome: texto(r.nome, 60),
      qtd: Math.floor(positivo(r.qtd)),
      validade: /^\d{4}-\d{2}-\d{2}$/.test(r.validade) ? r.validade : ""
    });
    if (["agua", "comida", "outro"].includes(r.tipo)) registro.tipo = r.tipo;
    if (registro.tipo === "agua") registro.litros = positivo(r.litros);
    if (registro.tipo === "comida") {
      registro.kg = positivo(r.kg);
      registro.classe = CLASSES_COMIDA[r.classe] ? r.classe : "outros";
    }
    return registro;
  });

  const itensMochila = objetos(dados.mochila).filter((r) => r.nome)
    .map((r) => comId(r, { nome: texto(r.nome, 60), tem: r.tem === true }));

  const ajustes = [{ chave: "mochilaSemeada", valor: true }];
  objetos(dados.config).forEach((r) => {
    if (r.chave === "pessoas") ajustes.push({ chave: "pessoas", valor: Math.min(999, Math.max(1, Math.floor(positivo(r.valor)) || 1)) });
    if (r.chave === "ultimoBackup" && typeof r.valor === "string") ajustes.push({ chave: "ultimoBackup", valor: texto(r.valor, 40) });
    if (r.chave === "plano" && r.valor && typeof r.valor === "object") {
      const plano = {};
      Object.keys(CAMPOS_PLANO).forEach((campo) => (plano[campo] = texto(r.valor[campo], 5000)));
      ajustes.push({ chave: "plano", valor: plano });
    }
  });

  return { estoque, mochila: itensMochila, config: ajustes };
}

// Apaga tudo e grava o conteúdo do backup numa transação só: ou entra tudo, ou nada muda.
function gravarBackup(limpo) {
  return new Promise((resolver, rejeitar) => {
    const transacao = banco.transaction(LOJAS, "readwrite");
    LOJAS.forEach((loja) => {
      const gaveta = transacao.objectStore(loja);
      gaveta.clear();
      limpo[loja].forEach((registro) => gaveta.put(registro));
    });
    transacao.oncomplete = resolver;
    transacao.onerror = () => rejeitar(transacao.error);
    transacao.onabort = () => rejeitar(transacao.error);
  });
}

$("#botao-restaurar").addEventListener("click", () => $("#arquivo-backup").click());

$("#arquivo-backup").addEventListener("change", async (evento) => {
  const arquivo = evento.target.files[0];
  evento.target.value = ""; // permite escolher o mesmo arquivo de novo depois
  if (!arquivo) return;
  const status = $("#backup-status");
  try {
    if (!banco) throw new Error("O armazenamento deste aparelho não está disponível.");
    let dados;
    try { dados = JSON.parse(await arquivo.text()); }
    catch (erro) { throw new Error("Não consegui ler o arquivo. Ele é mesmo um backup deste app?"); }
    const limpo = validarBackup(dados);
    const resumo = `${plural(limpo.estoque.length, "item", "itens")} de estoque e ${plural(limpo.mochila.length, "item", "itens")} de mochila`;
    if (!confirm(`Restaurar ${resumo}?\n\nTudo o que está no app agora será substituído.`)) return;
    await gravarBackup(limpo);
    encerrarEdicao();
    await carregarTudo();
    status.textContent = `Restaurado: ${resumo}.`;
  } catch (erro) {
    status.textContent = "Nada foi alterado. " + (erro.message || "Erro ao restaurar.");
  }
});

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

// Pede ao aparelho para não apagar a tela enquanto a luz estiver ligada.
// Se o iOS não permitir, avisa na própria tela.
async function manterTelaAcesa() {
  if (travaTela) return;
  try {
    if (!("wakeLock" in navigator)) throw new Error("sem suporte");
    const trava = await navigator.wakeLock.request("screen");
    // A luz pode ter sido desligada enquanto o pedido estava em andamento.
    if (telaLuz.hidden) { trava.release().catch(() => {}); return; }
    travaTela = trava;
    // O sistema solta a trava sozinho quando o app sai da frente.
    trava.addEventListener("release", () => { if (travaTela === trava) travaTela = null; });
    $("#dica-luz").textContent = "toque para sair";
  } catch (erro) {
    $("#dica-luz").textContent = "toque para sair · a tela pode apagar sozinha (veja o aviso na tela SOS)";
  }
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

/* ================= VOLTAR AO APP / SAIR DO APP ================= */

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    salvarPlano(); // não perde o que estava sendo digitado
    return;
  }
  if (!telaLuz.hidden) manterTelaAcesa();  // a trava de tela cai em segundo plano; pede de novo
  if (banco) desenharEstoque();            // em outro dia, as contas de validade mudam
});

/* ================= INÍCIO ================= */

mostrarCamposTipo();
iniciarDados();

// Offline: registra o service worker, que guarda todos os arquivos no aparelho.
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
