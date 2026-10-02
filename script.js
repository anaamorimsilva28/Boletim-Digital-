// =====================================================
// DADOS — 8º ANO (atualizados)
// Array de objetos: cada objeto é uma disciplina.
// - tri3 com null = nota ainda não lançada
// - faltas segue a ordem [1º Tri, 2º Tri, 3º Tri]
// =====================================================
const disciplinas = [
  { disciplina: "Língua Portuguesa", tri1: "7,4", tri2: "7,4", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Matemática", tri1: "6,0", tri2: "6,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Ciências", tri1: "7,2", tri2: "7,2", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "História", tri1: "9,0", tri2: "9,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Geografia", tri1: "6,2", tri2: "6,2", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Língua Inglesa", tri1: "8,9", tri2: "8,9", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Arte", tri1: "7,2", tri2: "7,2", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Educação Física", tri1: "10,0", tri2: "10,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Educação Digital", tri1: "10,0", tri2: "10,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Educação Financeira", tri1: "8,1", tri2: "8,1", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Estudo Orientado", tri1: "9,0", tri2: "9,0", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Redação e Leitura", tri1: "8,4", tri2: "8,4", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Pensamento Lógico", tri1: "9,7", tri2: "9,7", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Literatura Arte e Movimento", tri1: "9,5", tri2: "9,5", tri3: null, faltas: [0, 0, 0] },
  { disciplina: "Práticas Experimentais", tri1: "7,4", tri2: "7,4", tri3: null, faltas: [0, 0, 0] }
];

// Média mínima de referência
const MEDIA_MINIMA = 6.0;

// Frequência fictícia (apenas demonstrativa nesta etapa).
// Em versões futuras ela será calculada de outra forma.
const FREQUENCIA_DEMONSTRATIVA = 92;

// =====================================================
// FUNÇÃO: normalizarNota(valor)
// Converte qualquer formato de nota para a escala 0–10.
// Retorna um número ou null (nota ainda não lançada).
// =====================================================
function normalizarNota(valor) {
  // Vazio, null ou undefined = nota ainda não lançada
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Aceita ponto ou vírgula decimal
  // Se for string, trocamos a vírgula por ponto
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
// =====================================================
function montarCards() {
  const container = document.getElementById("cards");
  container.innerHTML = "";

  // Vamos percorrer as disciplinas e juntar as médias válidas
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

  // Cria os cards
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
// Preenche o corpo da tabela com as 15 disciplinas.
// =====================================================
function montarTabela() {
  const corpo = document.getElementById("corpo-tabela");
  corpo.innerHTML = "";

  disciplinas.forEach(function (d) {
    // Normaliza as três notas
    const n1 = normalizarNota(d.tri1);
    const n2 = normalizarNota(d.tri2);
    const n3 = normalizarNota(d.tri3);

    const media = calcularMedia([n1, n2, n3]);
    const faltas = somarFaltas(d.faltas);
    const situacao = definirSituacao(media);

    // Cria a linha da tabela
    const linha = document.createElement("tr");

    linha.innerHTML =
      "<td>" + d.disciplina + "</td>" +
      "<td>" + formatarNota(n1) + "</td>" +
      "<td>" + formatarNota(n2) + "</td>" +
      "<td>" + formatarNota(n3) + "</td>" +
      "<td>" + (media === null ? "—" : media.toFixed(1).replace(".", ",")) + "</td>" +
      "<td>" + faltas + "</td>" +
      '<td><span class="situacao ' + situacao.classe + '">' + situacao.texto + "</span></td>";

    corpo.appendChild(linha);
  });
}

// =====================================================
// INICIALIZAÇÃO
// Roda quando o HTML já estiver carregado.
// =====================================================
document.addEventListener("DOMContentLoaded", function () {
  montarCards();
  montarTabela();
});