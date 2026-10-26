// =====================================================
// CONFIGURAÇÃO FIXA DO ALUNO
// Turma e número de chamada não mudam nesta página.
// =====================================================
const CONFIG_ALUNO = {
  turma: "8C",
  numeroChamada: 35,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// =====================================================
// DADOS — 8º ANO (atualizados)
// Array de objetos: cada objeto é uma disciplina.
// - tri3 com null = nota ainda não lançada
// - faltas segue a ordem [1º Tri, 2º Tri, 3º Tri]
// Estes dados são usados quando a API não retorna dados salvos.
// =====================================================
const disciplinasLocais = [
  { disciplina: "Língua Portuguesa", tri1: "7,4", tri2: "7,4", tri3: null, faltas: [2, 0, 0] },
  { disciplina: "Matemática", tri1: "6,0", tri2: "6,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Ciências", tri1: "7,2", tri2: "7,2", tri3: null, faltas: [1, 0, 0] },
  { disciplina: "História", tri1: "9,0", tri2: "9,0", tri3: null, faltas: [2, 0, 0] },
  { disciplina: "Geografia", tri1: "6,2", tri2: "6,2", tri3: null, faltas: [2, 0, 0] },
  { disciplina: "Língua Inglesa", tri1: "8,9", tri2: "8,9", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Arte", tri1: "7,2", tri2: "7,2", tri3: null, faltas: [2, 1, 0] },
  { disciplina: "Educação Física", tri1: "10,0", tri2: "10,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Educação Digital", tri1: "10,0", tri2: "10,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Educação Financeira", tri1: "8,1", tri2: "8,1", tri3: null, faltas: [2, 0, 0] },
  { disciplina: "Estudo Orientado", tri1: "9,0", tri2: "9,0", tri3: null, faltas: [1, 0, 0] },
  { disciplina: "Redação e Leitura", tri1: "8,4", tri2: "8,4", tri3: null, faltas: [1, 0, 0] },
  { disciplina: "Pensamento Lógico", tri1: "9,7", tri2: "9,7", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Literatura Arte e Movimento", tri1: "9,5", tri2: "9,5", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Práticas Experimentais", tri1: "7,4", tri2: "7,4", tri3: null, faltas: [0, 0, 0] }
];

// Dados que estão sendo exibidos no momento (locais ou da API)
let disciplinas = [];

// Média mínima de referência
const MEDIA_MINIMA = 6.0;

// Frequência fictícia (apenas demonstrativa nesta etapa).
// Em versões futuras ela será calculada de outra forma.
const FREQUENCIA_DEMONSTRATIVA = 92;

// PIN só fica na memória durante a sessão (nunca em localStorage).
let pinDaSessao = "";

// =====================================================
// FUNÇÃO: normalizarNota(valor)
// Converte qualquer formato de nota para a escala 0–10.
// Retorna um número ou null (nota ainda não lançada).
// Regra antiga — usada nos dados do projeto.
// =====================================================
function normalizarNota(valor) {
  // Vazio, null ou undefined = nota ainda não lançada
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Aceita ponto ou vírgula decimal
  let numero;
  if (typeof valor === "string") {
    numero = Number(valor.replace(",", "."));
  } else {
    numero = Number(valor);
  }

  // Se não for um número válido, retorna null
  if (isNaN(numero)) {
    return null;
  }

  // Entre 0 e 10 → fica igual
  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  // Maior que 10 e menor ou igual a 100 → divide por 10
  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }

  // Fora das regras → inválido
  return null;
}

// =====================================================
// FUNÇÃO: formatarNota(nota)
// Devolve o texto que aparece na tabela.
// =====================================================
function formatarNota(nota) {
  if (nota === null) {
    return "Ainda não lançada";
  }
  return nota.toFixed(1).replace(".", ",");
}

// =====================================================
// FUNÇÃO: calcularMedia(notas)
// Média apenas das notas disponíveis (ignora null).
// =====================================================
function calcularMedia(notas) {
  const validas = notas.filter(function (n) { return n !== null; });
  if (validas.length === 0) {
    return null;
  }
  const soma = validas.reduce(function (acc, n) { return acc + n; }, 0);
  return soma / validas.length;
}

// =====================================================
// FUNÇÃO: somarFaltas(faltas)
// Soma as faltas dos três trimestres.
// =====================================================
function somarFaltas(faltas) {
  if (!Array.isArray(faltas)) {
    return 0;
  }
  return faltas.reduce(function (acc, f) { return acc + f; }, 0);
}

// =====================================================
// FUNÇÃO: definirSituacao(media)
// Retorna a situação com base na média disponível.
// =====================================================
function definirSituacao(media) {
  if (media === null) {
    return { texto: "Nota ainda não disponível", classe: "sem-nota" };
  }
  if (media >= MEDIA_MINIMA) {
    return { texto: "Bom desempenho", classe: "bom" };
  }
  return { texto: "Atenção", classe: "atencao" };
}

// =====================================================
// FUNÇÃO: criarCard(rotulo, valor, detalhe)
// Cria o HTML de um card de resumo.
// =====================================================
function criarCard(rotulo, valor, detalhe) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML =
    '<div class="rotulo">' + rotulo + '</div>' +
    '<div class="valor">' + valor + '</div>' +
    (detalhe ? '<div class="detalhe">' + detalhe + '</div>' : '');
  return card;
}

// =====================================================
// FUNÇÃO: montarCards()
// Calcula os resumos e insere os cards na página.
// Limpa antes para poder atualizar várias vezes.
// =====================================================
function montarCards() {
  const container = document.getElementById("cards");
  container.innerHTML = "";

  const mediasValidas = [];
  let totalFaltas = 0;
  let bons = 0;
  let atencao = 0;

  disciplinas.forEach(function (d) {
    const notas = [
      normalizarNota(d.tri1),
      normalizarNota(d.tri2),
      normalizarNota(d.tri3)
    ];
    const media = calcularMedia(notas);
    const faltas = somarFaltas(d.faltas);

    totalFaltas += faltas;

    if (media !== null) {
      mediasValidas.push(media);
      if (media >= MEDIA_MINIMA) {
        bons++;
      } else {
        atencao++;
      }
    }
  });

  // Média geral = média das médias válidas
  let mediaGeralTexto = "—";
  if (mediasValidas.length > 0) {
    const soma = mediasValidas.reduce(function (acc, m) { return acc + m; }, 0);
    const mediaGeral = soma / mediasValidas.length;
    mediaGeralTexto = mediaGeral.toFixed(1).replace(".", ",");
  }

  container.appendChild(criarCard("Média geral", mediaGeralTexto, "escala 0 a 10"));
  container.appendChild(criarCard("Total de faltas", totalFaltas, "soma dos 3 trimestres"));
  container.appendChild(criarCard("Bom desempenho", bons, "disciplinas com média ≥ 6,0"));
  container.appendChild(criarCard("Precisam de atenção", atencao, "disciplinas com média < 6,0"));
  container.appendChild(
    criarCard("Frequência", FREQUENCIA_DEMONSTRATIVA + "%", "Frequência adequada")
  );
}

// =====================================================
// FUNÇÃO: montarTabela()
// Preenche o corpo da tabela com as disciplinas atuais.
// Limpa antes para poder atualizar várias vezes.
// =====================================================
function montarTabela() {
  const corpo = document.getElementById("corpo-tabela");
  corpo.innerHTML = "";

  disciplinas.forEach(function (d) {
    const n1 = normalizarNota(d.tri1);
    const n2 = normalizarNota(d.tri2);
    const n3 = normalizarNota(d.tri3);

    const media = calcularMedia([n1, n2, n3]);
    const faltas = somarFaltas(d.faltas);
    const situacao = definirSituacao(media);

    const linha = document.createElement("tr");

    // Nome da disciplina via textContent (segurança do DOM)
    const tdDisciplina = document.createElement("td");
    tdDisciplina.textContent = d.disciplina || "";
    linha.appendChild(tdDisciplina);

    // Notas
    const td1 = document.createElement("td");
    td1.textContent = formatarNota(n1);
    linha.appendChild(td1);

    const td2 = document.createElement("td");
    td2.textContent = formatarNota(n2);
    linha.appendChild(td2);

    const td3 = document.createElement("td");
    td3.textContent = formatarNota(n3);
    linha.appendChild(td3);

    // Média
    const tdMedia = document.createElement("td");
    tdMedia.textContent = media === null ? "—" : media.toFixed(1).replace(".", ",");
    linha.appendChild(tdMedia);

    // Faltas
    const tdFaltas = document.createElement("td");
    tdFaltas.textContent = faltas;
    linha.appendChild(tdFaltas);

    // Situação
    const tdSit = document.createElement("td");
    const spanSit = document.createElement("span");
    spanSit.className = "situacao " + situacao.classe;
    spanSit.textContent = situacao.texto;
    tdSit.appendChild(spanSit);
    linha.appendChild(tdSit);

    corpo.appendChild(linha);
  });
}

// =====================================================
// FUNÇÃO: atualizarTela()
// Atualiza cards e tabela sem duplicar.
// Também atualiza os gráficos (camada somente-leitura).
// =====================================================
function atualizarTela() {
  montarCards();
  montarTabela();
  atualizarGraficos();
}

// =====================================================
// FUNÇÃO: mostrarMensagem(elementoId, texto, tipo)
// tipo: "erro" | "ok" | "" (neutro)
// =====================================================
function mostrarMensagem(elementoId, texto, tipo) {
  const el = document.getElementById(elementoId);
  if (!el) return;
  el.textContent = texto || "";
  el.classList.remove("erro", "ok");
  if (tipo === "erro") el.classList.add("erro");
  if (tipo === "ok") el.classList.add("ok");
}

// =====================================================
// FUNÇÃO: abrirBoletim(pin)
// Faz o POST para a API e retorna a resposta.
// =====================================================
async function abrirBoletim(pin) {
  const resposta = await fetch(CONFIG_ALUNO.apiUrl + "/api/v1/boletins/abrir", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      turma: CONFIG_ALUNO.turma,
      numero_chamada: CONFIG_ALUNO.numeroChamada,
      pin: pin
    })
  });
  return resposta;
}

// =====================================================
// FUNÇÃO: salvarBoletim(dadosParaSalvar)
// Faz o PUT para a API enviando as disciplinas.
// =====================================================
async function salvarBoletim(dadosParaSalvar) {
  const resposta = await fetch(CONFIG_ALUNO.apiUrl + "/api/v1/boletins/salvar", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      turma: CONFIG_ALUNO.turma,
      numero_chamada: CONFIG_ALUNO.numeroChamada,
      pin: pinDaSessao,
      dados: {
        disciplinas: dadosParaSalvar
      }
    })
  });
  return resposta;
}

// =====================================================
// FUNÇÃO: clonarDisciplinas(lista)
// Cópia profunda simples para não alterar o original local.
// =====================================================
function clonarDisciplinas(lista) {
  return lista.map(function (d) {
    return {
      disciplina: d.disciplina,
      tri1: d.tri1,
      tri2: d.tri2,
      tri3: d.tri3,
      faltas: Array.isArray(d.faltas) ? d.faltas.slice() : [0, 0, 0]
    };
  });
}

// =====================================================
// LOGIN — botão Entrar
// =====================================================
document.addEventListener("DOMContentLoaded", function () {
  const btnEntrar = document.getElementById("btn-entrar");
  const inputPin = document.getElementById("input-pin");

  btnEntrar.addEventListener("click", async function () {
    const pin = inputPin.value.trim();

    if (pin === "") {
      mostrarMensagem("msg-acesso", "Digite o PIN para entrar.", "erro");
      return;
    }

    mostrarMensagem("msg-acesso", "Conectando...", "");
    btnEntrar.disabled = true;

    let resposta;
    try {
      resposta = await abrirBoletim(pin);
    } catch (erro) {
      mostrarMensagem("msg-acesso", "Não foi possível conectar ao servidor. Tente novamente.", "erro");
      btnEntrar.disabled = false;
      return;
    }

    if (resposta.status === 401) {
      mostrarMensagem("msg-acesso", "Turma, chamada ou PIN inválidos.", "erro");
      btnEntrar.disabled = false;
      return;
    }

    if (resposta.status === 429) {
      mostrarMensagem("msg-acesso", "Muitas tentativas. Aguarde um minuto e tente novamente.", "erro");
      btnEntrar.disabled = false;
      return;
    }

    if (!resposta.ok) {
      mostrarMensagem("msg-acesso", "Não foi possível abrir o boletim. Tente novamente.", "erro");
      btnEntrar.disabled = false;
      return;
    }

    // Login deu certo — guarda o PIN só na memória
    pinDaSessao = pin;

    // Limpa o campo do PIN
    inputPin.value = "";
    mostrarMensagem("msg-acesso", "", "");

    // Lê a resposta
    let corpo = null;
    try {
      corpo = await resposta.json();
    } catch (e) {
      corpo = null;
    }

    // Decide quais dados usar:
    // Se a API retornou dados, usa os da API.
    // Se não retornou (novo true ou dados null), usa os locais.
    if (corpo && corpo.dados && Array.isArray(corpo.dados.disciplinas)) {
      disciplinas = clonarDisciplinas(corpo.dados.disciplinas);
    } else {
      disciplinas = clonarDisciplinas(disciplinasLocais);
    }

    // Mostra o boletim
    document.getElementById("tela-acesso").classList.add("oculto");
    document.getElementById("conteudo-boletim").classList.remove("oculto");

    atualizarTela();
    configurarEdicao();
  });

  // Permite apertar Enter no campo do PIN
  inputPin.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
      btnEntrar.click();
    }
  });
});

// =====================================================
// MODO EDIÇÃO
// =====================================================
let modoEdicao = false;

function configurarEdicao() {
  const btnAlterar = document.getElementById("btn-alterar");
  if (!btnAlterar) return;

  // Evita adicionar o listener várias vezes
  if (btnAlterar.dataset.configurado === "true") return;
  btnAlterar.dataset.configurado = "true";

  btnAlterar.addEventListener("click", function () {
    if (!modoEdicao) {
      entrarModoEdicao();
    }
  });
}

// =====================================================
// FUNÇÃO: entrarModoEdicao()
// Transforma a tabela em campos editáveis.
// =====================================================
function entrarModoEdicao() {
  modoEdicao = true;
  const corpo = document.getElementById("corpo-tabela");
  corpo.innerHTML = "";

  disciplinas.forEach(function (d, indice) {
    const linha = document.createElement("tr");

    // Nome (não editável)
    const tdDisciplina = document.createElement("td");
    tdDisciplina.textContent = d.disciplina || "";
    linha.appendChild(tdDisciplina);

    // 3 notas
    for (let i = 1; i <= 3; i++) {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.className = "campo-nota";
      input.dataset.indice = indice;
      input.dataset.trimestre = i;

      const chave = "tri" + i;
      const valorAtual = d[chave];
      const numero = normalizarNota(valorAtual);
      input.value = numero === null ? "" : String(numero).replace(".", ",");
      td.appendChild(input);
      linha.appendChild(td);
    }

    // Média e Faltas (faltas vai ser editável em uma célula só? Não)
    // Na tabela original, faltas é uma coluna só (total).
    // Vamos editar cada trimestre de faltas numa célula só, com 3 campos pequenos.
    const tdMedia = document.createElement("td");
    tdMedia.textContent = "—";
    linha.appendChild(tdMedia);

    const tdFaltas = document.createElement("td");
    for (let i = 1; i <= 3; i++) {
      const inputF = document.createElement("input");
      inputF.type = "text";
      inputF.className = "campo-falta";
      inputF.dataset.indice = indice;
      inputF.dataset.trimestre = i;
      const faltasArr = Array.isArray(d.faltas) ? d.faltas : [0, 0, 0];
      inputF.value = String(faltasArr[i - 1] != null ? faltasArr[i - 1] : 0);
      tdFaltas.appendChild(inputF);
      if (i < 3) tdFaltas.appendChild(document.createTextNode(" "));
    }
    linha.appendChild(tdFaltas);

    const tdSit = document.createElement("td");
    tdSit.textContent = "—";
    linha.appendChild(tdSit);

    corpo.appendChild(linha);
  });

  // Botões Salvar e Cancelar
  const tabelaArea = document.querySelector(".tabela-area");
  let acoes = document.getElementById("acoes-edicao");
  if (!acoes) {
    acoes = document.createElement("div");
    acoes.id = "acoes-edicao";
    acoes.className = "acoes-edicao";
    tabelaArea.appendChild(acoes);
  }
  acoes.innerHTML = "";

  const btnSalvar = document.createElement("button");
  btnSalvar.type = "button";
  btnSalvar.className = "btn-principal";
  btnSalvar.textContent = "Salvar alterações";
  btnSalvar.addEventListener("click", salvarEdicao);

  const btnCancelar = document.createElement("button");
  btnCancelar.type = "button";
  btnCancelar.className = "btn-secundario";
  btnCancelar.textContent = "Cancelar";
  btnCancelar.addEventListener("click", function () {
    modoEdicao = false;
    acoes.innerHTML = "";
    mostrarMensagem("msg-salvar", "", "");
    atualizarTela();
  });

  acoes.appendChild(btnSalvar);
  acoes.appendChild(btnCancelar);

  const btnAlterar = document.getElementById("btn-alterar");
  if (btnAlterar) btnAlterar.disabled = true;
}

// =====================================================
// FUNÇÃO: validarNotaDigitada(texto)
// Regra do editor: aceita 0–10, ponto ou vírgula, ou vazio.
// Retorna { valido, valor }.
// =====================================================
function validarNotaDigitada(texto) {
  const limpo = String(texto || "").trim();
  if (limpo === "") {
    return { valido: true, valor: null };
  }
  // Aceita apenas número (com ponto ou vírgula)
  if (!/^\d+([.,]\d+)?$/.test(limpo)) {
    return { valido: false, valor: null };
  }
  const numero = Number(limpo.replace(",", "."));
  if (isNaN(numero) || numero < 0 || numero > 10) {
    return { valido: false, valor: null };
  }
  return { valido: true, valor: numero };
}

// =====================================================
// FUNÇÃO: validarFaltaDigitada(texto)
// Aceita inteiro >= 0. Vazio é inválido.
// =====================================================
function validarFaltaDigitada(texto) {
  const limpo = String(texto || "").trim();
  if (limpo === "") {
    return { valido: false, valor: null };
  }
  if (!/^\d+$/.test(limpo)) {
    return { valido: false, valor: null };
  }
  const numero = Number(limpo);
  if (isNaN(numero) || numero < 0) {
    return { valido: false, valor: null };
  }
  return { valido: true, valor: numero };
}

// =====================================================
// FUNÇÃO: salvarEdicao()
// Valida tudo, monta os dados e envia para a API.
// =====================================================
async function salvarEdicao() {
  const inputsNotas = document.querySelectorAll("input.campo-nota");
  const inputsFaltas = document.querySelectorAll("input.campo-falta");

  // Limpa marcações anteriores
  inputsNotas.forEach(function (inp) { inp.classList.remove("campo-invalido"); });
  inputsFaltas.forEach(function (inp) { inp.classList.remove("campo-invalido"); });

  // Prepara uma cópia editada das disciplinas
  const novas = clonarDisciplinas(disciplinas);
  let temErro = false;

  // Notas
  inputsNotas.forEach(function (inp) {
    const indice = Number(inp.dataset.indice);
    const trimestre = Number(inp.dataset.trimestre);
    const resultado = validarNotaDigitada(inp.value);
    if (!resultado.valido) {
      inp.classList.add("campo-invalido");
      temErro = true;
      return;
    }
    novas[indice]["tri" + trimestre] = resultado.valor;
  });

  // Faltas
  inputsFaltas.forEach(function (inp) {
    const indice = Number(inp.dataset.indice);
    const trimestre = Number(inp.dataset.trimestre);
    const resultado = validarFaltaDigitada(inp.value);
    if (!resultado.valido) {
      inp.classList.add("campo-invalido");
      temErro = true;
      return;
    }
    if (!Array.isArray(novas[indice].faltas)) {
      novas[indice].faltas = [0, 0, 0];
    }
    novas[indice].faltas[trimestre - 1] = resultado.valor;
  });

  if (temErro) {
    mostrarMensagem("msg-salvar", "Há campos inválidos. Corrija os campos em vermelho.", "erro");
    return;
  }

  const btnSalvar = document.querySelector("#acoes-edicao .btn-principal");
  if (btnSalvar) btnSalvar.disabled = true;
  mostrarMensagem("msg-salvar", "Salvando...", "");

  let resposta;
  try {
    resposta = await salvarBoletim(novas);
  } catch (erro) {
    mostrarMensagem("msg-salvar", "Não foi possível salvar. Tente novamente.", "erro");
    if (btnSalvar) btnSalvar.disabled = false;
    return;
  }

  if (resposta.status === 401) {
    mostrarMensagem("msg-salvar", "Sessão inválida. Entre novamente.", "erro");
    if (btnSalvar) btnSalvar.disabled = false;
    return;
  }

  if (!resposta.ok) {
    mostrarMensagem("msg-salvar", "Não foi possível salvar. Tente novamente.", "erro");
    if (btnSalvar) btnSalvar.disabled = false;
    return;
  }

  // Sucesso
  disciplinas = novas;
  modoEdicao = false;

  const acoes = document.getElementById("acoes-edicao");
  if (acoes) acoes.innerHTML = "";

  const btnAlterar = document.getElementById("btn-alterar");
  if (btnAlterar) btnAlterar.disabled = false;

  atualizarTela();
  mostrarMensagem("msg-salvar", "Dados salvos com sucesso.", "ok");
}

// =====================================================
// GRÁFICOS — camada SOMENTE LEITURA
// Usam a variável global "disciplinas" (mesma fonte da tabela).
// Nunca alteram dados, notas, faltas ou estado principal.
// =====================================================

// Instâncias do Chart.js (recriadas a cada atualização)
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Referência interna de risco de faltas (não mostrar na tela).
// Serve apenas para acionar o estado visual "Perigo".
const REFERENCIA_INTERNA_FALTAS = 350;

// Cores lidas do CSS para manter a identidade visual
function lerCoresTema() {
  const estilo = getComputedStyle(document.documentElement);
  return {
    azul: estilo.getPropertyValue("--azul-claro").trim() || "#3b82f6",
    azulPrincipal: estilo.getPropertyValue("--azul").trim() || "#2563eb",
    texto: estilo.getPropertyValue("--texto").trim() || "#f1f5f9",
    textoFraco: estilo.getPropertyValue("--texto-fraco").trim() || "#94a3b8",
    grade: "rgba(148, 163, 184, 0.18)",
    bom: estilo.getPropertyValue("--bom").trim() || "#22c55e",
    atencao: estilo.getPropertyValue("--atencao").trim() || "#f59e0b",
    perigo: estilo.getPropertyValue("--perigo").trim() || "#dc2626"
  };
}

// Helper: média de cada disciplina (usa normalizarNota + calcularMedia)
function mediaDaDisciplina(d) {
  const n1 = normalizarNota(d.tri1);
  const n2 = normalizarNota(d.tri2);
  const n3 = normalizarNota(d.tri3);
  return calcularMedia([n1, n2, n3]);
}

// =====================================================
// GRÁFICO 1 — Média por disciplina (barras horizontais)
// =====================================================
function atualizarGraficoMedias() {
  const canvas = document.getElementById("graficoMediasDisciplinas");
  if (!canvas || typeof Chart === "undefined") return;

  const cores = lerCoresTema();

  // Lê o estado atual SEM modificar nada (cópia só para desenhar)
  const rotulos = disciplinas.map(function (d) { return d.disciplina || ""; });
  const valores = disciplinas.map(function (d) {
    const m = mediaDaDisciplina(d);
    return m === null ? null : Number(m.toFixed(2));
  });

  if (graficoMedias) {
    graficoMedias.destroy();
    graficoMedias = null;
  }

  graficoMedias = new Chart(canvas, {
    type: "bar",
    data: {
      labels: rotulos,
      datasets: [{
        label: "Média",
        data: valores,
        backgroundColor: cores.azul,
        borderColor: cores.azulPrincipal,
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 0,
          max: 10,
          ticks: { color: cores.textoFraco, stepSize: 2 },
          grid: { color: cores.grade },
          title: { display: true, text: "Nota (0 a 10)", color: cores.textoFraco }
        },
        y: {
          ticks: { color: cores.texto, autoSkip: false, font: { size: 11 } },
          grid: { color: cores.grade }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const v = ctx.parsed.x;
              if (v === null || v === undefined) return "Sem nota";
              return v.toFixed(1).replace(".", ",");
            }
          }
        }
      }
    }
  });
}

// =====================================================
// GRÁFICO 2 — Evolução da média geral (linha)
// Média dos tri1 válidos, dos tri2 válidos e dos tri3 válidos.
// Trimestre sem nenhuma nota → null (não vira zero).
// =====================================================
function atualizarGraficoEvolucao() {
  const canvas = document.getElementById("graficoEvolucaoTrimestres");
  if (!canvas || typeof Chart === "undefined") return;

  const cores = lerCoresTema();

  function mediaDoTrimestre(chave) {
    const valores = [];
    disciplinas.forEach(function (d) {
      const n = normalizarNota(d[chave]);
      if (n !== null) valores.push(n);
    });
    if (valores.length === 0) return null;
    const soma = valores.reduce(function (acc, v) { return acc + v; }, 0);
    return Number((soma / valores.length).toFixed(2));
  }

  const dados = [
    mediaDoTrimestre("tri1"),
    mediaDoTrimestre("tri2"),
    mediaDoTrimestre("tri3")
  ];

  if (graficoEvolucao) {
    graficoEvolucao.destroy();
    graficoEvolucao = null;
  }

  graficoEvolucao = new Chart(canvas, {
    type: "line",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Média geral",
        data: dados,
        borderColor: cores.azul,
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        pointBackgroundColor: cores.azul,
        pointBorderColor: cores.azul,
        pointRadius: 5,
        tension: 0.3,
        spanGaps: false,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { color: cores.textoFraco, stepSize: 2 },
          grid: { color: cores.grade },
          title: { display: true, text: "Nota (0 a 10)", color: cores.textoFraco }
        },
        x: {
          ticks: { color: cores.texto },
          grid: { color: cores.grade }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const v = ctx.parsed.y;
              if (v === null || v === undefined) return "Sem nota";
              return v.toFixed(1).replace(".", ",");
            }
          }
        }
      }
    }
  });
}

// =====================================================
// GRÁFICO 3 — Faltas por trimestre (3 barras)
// Usa exclusivamente o array "faltas" de cada disciplina.
// Total interno serve só para avaliar estado "Perigo".
// =====================================================
function atualizarGraficoFaltas() {
  const canvas = document.getElementById("graficoFaltasTrimestres");
  if (!canvas || typeof Chart === "undefined") return;

  const cores = lerCoresTema();

  let f1 = 0, f2 = 0, f3 = 0;
  disciplinas.forEach(function (d) {
    const arr = Array.isArray(d.faltas) ? d.faltas : [0, 0, 0];
    f1 += Number(arr[0]) || 0;
    f2 += Number(arr[1]) || 0;
    f3 += Number(arr[2]) || 0;
  });

  const totalFaltas = f1 + f2 + f3;
  const estaEmPerigo = totalFaltas >= REFERENCIA_INTERNA_FALTAS;

  // Atualiza visual do card (badge "Perigo") sem alterar os dados
  const cardFaltas = document.getElementById("card-faltas");
  const estadoFaltas = document.getElementById("estadoFaltas");
  if