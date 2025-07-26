document.addEventListener('DOMContentLoaded', () => {
  const formularioMedicamento = document.getElementById('medForm');
  const listaDeMedicamentos = document.getElementById('listaMedicamentos');
  const inputNome = document.getElementById('nome');
  const sugestoes = document.getElementById('sugestoes');
  const modal = document.getElementById('modalConfirmacao');
  const btnCancelarModal = document.getElementById('btnCancelarModal');
  const btnConfirmarModal = document.getElementById('btnConfirmarModal');
  const btnPararAlarme = document.getElementById('btnPararAlarme');
  const controleDoAlarme = document.getElementById('controle-alarme')


  let indiceEditando = null; // esse let vai guardar qual item está editando, se for null, significa que não está editando nada, só adicionando novo
  let bancoDeMedicamentos = [];
  let medicamentoSelecionado = null;
  const medicamentosSalvos = JSON.parse(localStorage.getItem('medicamentos')) || [];
  let nomesMedicamentos = [];
  let indiceParaRemover = null;
  const alarmesJaTocados = new Set();
  let intervaloSomAlarme = null;

  // Salva no localStorage
  function salvarNoArmazenamento() {
    localStorage.setItem('medicamentos', JSON.stringify(medicamentosSalvos));
  }

  // Mostra a mensagem de sucesso
  function mostrarMensagemDeSucesso() {
    const mensagem = document.getElementById('mensagemDeSucesso');
    mensagem.style.display = 'block';

    setTimeout(() => {
      mensagem.style.display = 'none';
    }, 3000);
  }


  function iniciarAlarmeRepetitivo (){
  const audio = document.getElementById('alarme-audio');
  if (!audio) return;

  controleDoAlarme.style.display = 'block';

  // Aqui estava o erro (FALTAVA os parênteses em play)
  audio.play().catch((erro) =>{
    console.warn('erro ao tocar áudio:', erro);
  });

  intervaloSomAlarme = setInterval(() =>{
    audio.currentTime = 0;
    audio.play().catch((erro) =>{
      console.warn('Erro ao repetir áudio', erro);
    });
  }, 7000);

}

  function pararAlarmeRepetitivo (){
    const audio = document.getElementById('alarme-audio');
    if(!audio) return;

    clearInterval(intervaloSomAlarme);// para o setInterval
    intervaloSomAlarme = null
    audio.pause(); //pausa o som atual
    audio.currentTime = 0; //volta pro começo
    controleDoAlarme.style.display = 'none'
  }
  // Cria o item da lista com os dados
  function criarItemDaLista(medicamento, index) {
  const item = document.createElement('li');
  item.classList.add('medicamento-item');

  const tempoRestanteSpan = document.createElement('span');
  tempoRestanteSpan.classList.add('tempo-restante');

  const horaAlvo = new Date(medicamento.tempoAlvoEmMilessegundos);
  let intervalo;

  const atualizarContador = () => {
    const agora = new Date();
    const diferenca = horaAlvo - agora;
     
    if (diferenca <= 0) {
   clearInterval(intervalo);
  tempoRestanteSpan.textContent = '⏰ Tempo esgotado!';

  const idUnico = medicamento.nome + medicamento.tempoAlvoEmMilessegundos;

  if (!alarmesJaTocados.has(idUnico)) {
    iniciarAlarmeRepetitivo();
    alarmesJaTocados.add(idUnico);
  }

  return;
}
    const totalSegundos = Math.floor(diferenca / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    tempoRestanteSpan.textContent = `⏳ Faltam ${horas}h ${minutos}min ${segundos}s`;
  };

  atualizarContador();
  intervalo = setInterval(atualizarContador, 1000);

  // Parte textual principal
  const textoPrincipal = document.createElement('div');
  textoPrincipal.innerHTML = `
    <strong>${medicamento.nome}</strong> - ${medicamento.dosagem} - a cada ${medicamento.intervaloHoras}hr
  `;

  const observacoes = document.createElement('div');
  observacoes.innerHTML = `<strong> Observação: </strong>${medicamento.observacoes}`;

  const botoes = document.createElement('div');
  botoes.innerHTML = `
    <button class="btn-remover" data-index="${index}">Remover</button>
    <button class="btn-editar" data-index="${index}">Editar</button>
  `;

  item.appendChild(textoPrincipal);
  item.appendChild(tempoRestanteSpan);
  item.appendChild(observacoes);

  // Condicional de informações do JSON
  if (medicamento.fabricante || medicamento.tipo || medicamento.classe || medicamento.via) {
    const infoJson = document.createElement('div');
    infoJson.classList.add('dados-json');
    infoJson.innerHTML = `
      <p><strong>Informações do medicamento:</strong></p>
      <ul>
        <li><strong>Fabricante:</strong> ${medicamento.fabricante || 'Não informado'}</li>
        <li><strong>Tipo:</strong> ${medicamento.tipo || 'Não informado'}</li>
        <li><strong>Classe:</strong> ${medicamento.classe || 'Não informado'}</li>
        <li><strong>Via:</strong> ${medicamento.via || 'Não informado'}</li>
      </ul>
    `;
    item.appendChild(infoJson);
  }

  item.appendChild(botoes);

  return item;
}

  // Renderiza a lista de medicamentos salvos
  function renderizarListaDeMedicamentos() {
    listaDeMedicamentos.innerHTML = '';

    medicamentosSalvos.forEach((medicamento, index) => {
      const item = criarItemDaLista(medicamento, index);
      listaDeMedicamentos.appendChild(item);
    });

    // Ativar os botões de editar
    const botoesDeEditar = document.querySelectorAll('.btn-editar');
    botoesDeEditar.forEach((botao) => {
      botao.addEventListener('click', () => {
        const index = botao.dataset.index;
        const medicamento = medicamentosSalvos[index];

        // Preenche os campos do formulário com os dados do item já existentes
        formularioMedicamento.nome.value = medicamento.nome;
        formularioMedicamento.dosagem.value = medicamento.dosagem;
        formularioMedicamento.horario.value = medicamento.horario;
        formularioMedicamento.obs.value = medicamento.observacoes;

        inputNome.focus();
        formularioMedicamento.classList.add('editando');
        indiceEditando = index;

        document.getElementById('status-edicao').style.display = 'block';
        formularioMedicamento.classList.add('modo-edicao');
        document.querySelector('button[type="submit"]').textContent = 'Atualizar';
      });
    });

    // Ativar os botões de remover
    const botoesRemover = document.querySelectorAll('.btn-remover');
    botoesRemover.forEach((botao) => {
      botao.addEventListener('click', () => {
        const index = botao.dataset.index;
        indiceParaRemover = index; // armazena temporariamente o índice
        modal.style.display = 'flex';
      });
    });
  }

  // Modal de confirmação
  btnCancelarModal.addEventListener("click", () => {
    modal.style.display = 'none';
    indiceParaRemover = null;
  });

  btnConfirmarModal.addEventListener('click', () => {
    if (indiceParaRemover !== null) {
      medicamentosSalvos.splice(indiceParaRemover, 1);
      salvarNoArmazenamento();
      renderizarListaDeMedicamentos();
    }
    indiceParaRemover = null;
    modal.style.display = 'none';
  });

  // Função ao enviar o formulário
  function aoEnviarFormulario(evento) {
  evento.preventDefault();

  const nomeDigitado = formularioMedicamento.nome.value.trim();
  const intervaloDigitado = parseFloat(formularioMedicamento.horario.value); // número de horas

  if (isNaN(intervaloDigitado) || intervaloDigitado <= 0) {
    alert('Informe o intervalo em horas corretamente.');
    return;
  }

  const dadosDoJson = bancoDeMedicamentos.find(
    (med) => med.nome.toLowerCase() === nomeDigitado.toLowerCase()
  );

  const novoMedicamento = {
    nome: nomeDigitado,
    dosagem: formularioMedicamento.dosagem.value.trim(),
    intervaloHoras: intervaloDigitado,
    tempoAlvoEmMilessegundos: Date.now() + intervaloDigitado * 60 * 60 * 1000,
    observacoes: formularioMedicamento.obs.value.trim(),
    ...dadosDoJson
  };

  if (indiceEditando !== null) {
    medicamentosSalvos.splice(indiceEditando, 1, novoMedicamento);
    indiceEditando = null;
  } else {
    medicamentosSalvos.push(novoMedicamento);
  }

  salvarNoArmazenamento();
  renderizarListaDeMedicamentos();
  formularioMedicamento.reset();
  sugestoes.innerHTML = '';
  medicamentoSelecionado = null;

  document.getElementById('status-edicao').style.display = 'none';
  formularioMedicamento.classList.remove('modo-edicao');
  formularioMedicamento.classList.remove('editando');
  document.querySelector('button[type="submit"]').textContent = 'Adicionar Medicamento';

  mostrarMensagemDeSucesso();
}

  // Parte do autocomplete do nome do medicamento
  inputNome.addEventListener('input', () => {
    const termo = inputNome.value.toLowerCase();
    sugestoes.innerHTML = '';

    if (termo.length === 0) return;

    const filtrados = nomesMedicamentos.filter((nome) =>
      nome.toLowerCase().startsWith(termo)
    );

    filtrados.forEach((nome) => {
      const item = document.createElement('li');
      item.textContent = nome;
      item.classList.add('sugestao-item');

      item.addEventListener('click', () => {
        const nomeSelecionado = item.textContent;
        medicamentoSelecionado = bancoDeMedicamentos.find((med) => med.nome === nomeSelecionado);
        inputNome.value = nomeSelecionado;
        sugestoes.innerHTML = '';
      });

      sugestoes.appendChild(item);
    });
  });

  const mensagensBanner = [
  "🎁 Adicione todos os detalhes para não esquecer nada!",
  "🔔 Agora com alerta sonoro automático ao final do horário da sua dosagem!",
  "💡 Dica: você pode editar um medicamento clicando em 'Editar'.",
  
  // 🔔 Mensagens explicativas importantes:
  "⚠️ Para o alarme funcionar, mantenha a aba do navegador aberta (mesmo que em segundo plano).",
  "⏱️ Quer colocar menos de 1 hora? Exemplo: 30 minutos = escreva 0.5 | 15 minutos = 0.25 | ou 0,01 para 1 minuto"
];
    let indiceMensagem = 0;
    const textoBnner = document.getElementById("texto-banner");

   setInterval (() =>{
    //fade out
    textoBnner.style.opacity = 0;

     setTimeout(() =>{
      // troca o texto
      indiceMensagem = (indiceMensagem + 1) % mensagensBanner.length;
      textoBnner.textContent = mensagensBanner[indiceMensagem];

      //fade in
      textoBnner.style.opacity = 1
    }, 500)

   }, 6000)
  // Carrega o JSON de medicamentos
  fetch('data/medicamentos.json')
    .then((res) => res.json())
    .then((dados) => {
      bancoDeMedicamentos = dados;
      nomesMedicamentos = dados.map((med) => med.nome);
      console.log('Medicamentos carregados:', nomesMedicamentos);
    })
    .catch((erro) => console.error('Erro ao carregar medicamentos:', erro));

  formularioMedicamento.addEventListener('submit', aoEnviarFormulario);
  btnPararAlarme.addEventListener('click', pararAlarmeRepetitivo); 
  renderizarListaDeMedicamentos();

});11






/*dica pra mim no futuro que aprendi rezolvendo bug da função criarItemDaLista:
Sempre que for usar setInterval() ou setTimeout() e exibir atualizações no DOM, certifique-se de que o elemento que você está atualizando não será destruído ou sobrescrito depois. Prefira createElement + appendChild em vez de .innerHTML += .... */


/* 
Revisão: funcionalidades e conceitos usados no projeto LembreMed 💊

Palavra-chave / Método           O que faz

.addEventListener()              Escuta eventos como clique, input, submit, etc.
.value                           Pega o valor de um input ou textarea.
.trim()                          Remove espaços em branco do início e do fim da string.
.push()                          Adiciona um item no final de um array.
.splice()                        Remove, substitui ou adiciona itens em um array em uma posição específica.
localStorage                     Armazena dados no navegador de forma persistente.
localStorage.setItem()           Salva dados no localStorage (em formato string).
localStorage.getItem()           Recupera dados do localStorage.
.forEach()                       Executa uma função para cada item de um array.
.filter()                        Filtra os itens de um array com base em uma condição.
.find()                          Retorna o primeiro item de um array que satisfaça a condição.
.startsWith()                    Verifica se uma string começa com um determinado texto.
.createElement()                 Cria um elemento HTML pelo JavaScript.
.appendChild()                   Adiciona um elemento dentro de outro no HTML.
.innerHTML                       Define ou pega o conteúdo HTML interno de um elemento.
.reset()                         Limpa todos os campos de um formulário.
.classList.add()                 Adiciona uma ou mais classes a um elemento HTML.
.classList.remove()              Remove classes de um elemento HTML.
.classList.contains()            Verifica se um elemento possui determinada classe.
.dataset                         Acessa os atributos personalizados (data-*) de um elemento HTML.
setTimeout()                     Executa uma função depois de um tempo definido (em milissegundos).
setInterval()                    Executa uma função repetidamente em intervalos regulares.
clearInterval()                  Para a execução de um setInterval().
Date()                           Cria um objeto de data/hora (data atual ou com parâmetros definidos).
getTime()                        Retorna o tempo em milissegundos desde 01/01/1970.
JSON.stringify()                 Converte um objeto ou array em texto JSON.
JSON.parse()                     Converte texto JSON em objeto ou array JavaScript.
fetch()                          Faz requisições HTTP para buscar arquivos ou APIs.
.then()                          Executa código depois que uma Promise (como fetch) é resolvida.
.catch()                         Executa código quando uma Promise dá erro.
.map()                           Cria um novo array com base no original, aplicando uma função.
toLowerCase()                    Converte todos os caracteres de uma string para minúsculo.

Conceitos do projeto:

- Formulário com modo de edição (editar medicamentos já cadastrados)
- Salvamento e carregamento persistente com localStorage
- Sugestões automáticas com base no JSON (autocomplete)
- Contador regressivo com base em data e hora
- Modal de confirmação com lógica para exclusão segura
- Organização visual dos dados puxados do JSON (via, tipo, classe, etc.)
- Organização com DOMContentLoaded para garantir que o JS só execute depois do HTML carregar
- Separação de funções (responsabilidade única) para facilitar manutenção

*/


/*
🧠 Explicação do funcionamento do botão "Remover"
📌 Caso eu (ou qualquer outra pessoa) precise entender ou replicar essa funcionalidade futuramente.

=======================================================
1. Criei o atributo data-index no botão:
=======================================================

Dentro da função criarItemDaLista(medicamento, index), usei:
<button class="btn-remover" data-index="${index}">Remover</button>

Esse data-index guarda a posição real do item no array medicamentosSalvos.
Assim, cada botão "lembra" de qual item ele está cuidando.

=======================================================
2. Selecionei todos os botões com querySelectorAll:
=======================================================

const botoesRemover = document.querySelectorAll('.btn-remover');

Isso pega todos os botões "Remover" que foram criados dinamicamente.

=======================================================
3. Adicionei um evento de clique em cada botão:
=======================================================

botoesRemover.forEach((botao) => {
  botao.addEventListener('click', () => {
    // ação de remoção
  });
});

Cada botão vai escutar seu próprio clique individualmente.

=======================================================
4. Peguei o índice salvo no botão com dataset.index:
=======================================================

const index = botao.dataset.index;

Assim consigo saber exatamente a posição no array para remover aquele item.

=======================================================
5. Removi o item do array com .splice():
=======================================================

medicamentosSalvos.splice(index, 1);

.splice(posição, quantidade) remove elementos do array.
Aqui, removo 1 item a partir da posição index.

=======================================================
6. Atualizei o localStorage:
=======================================================

salvarNoArmazenamento();

Isso salva a nova versão do array no armazenamento local do navegador,
já sem o item que foi removido.

=======================================================
7. Atualizei a interface:
=======================================================

renderizarListaDeMedicamentos();

Isso redesenha a lista de medicamentos na tela, já sem o item excluído.

=======================================================
📌 Recapitulando: se eu precisar refazer do zero...
=======================================================

✅ Passo a passo rápido:

1. Adicione o atributo data-index="${index}" no botão.
2. Após renderizar os itens, selecione todos os botões com .btn-remover.
3. Adicione um addEventListener('click') em cada botão.
4. Use dataset.index para descobrir a posição.
5. Use splice() para remover do array.
6. Salve no localStorage.
7. Recarregue a lista com a função de renderização.

=======================================================
💬 Observação para mim mesmo:
=======================================================

Essa lógica é super útil e pode ser reaproveitada em qualquer lista dinâmica, como:
✔ tarefas
✔ produtos em carrinho
✔ itens salvos
✔ anotações
✔ e claro, medicamentos!

*/




/*
⏳ Explicação do funcionamento do cronômetro regressivo ("Tempo restante") + alerta sonoro 🔊
📌 Caso eu (ou qualquer outra pessoa) precise entender ou replicar essa funcionalidade futuramente.

=======================================================
1. Calculamos o horário futuro com base no intervalo digitado:
=======================================================

Ao salvar o medicamento, fazemos isso:

tempoAlvoEmMilessegundos: Date.now() + intervaloDigitado * 60 * 60 * 1000

💡 Isso pega o horário atual (Date.now()) e soma as horas convertidas em milissegundos.
Ex: Se digitei "8 horas", ele soma 8 * 60 * 60 * 1000 milissegundos.

Esse valor é salvo no objeto do medicamento e armazenado no localStorage.

🧠 Obs: Se for usado um número com casa decimal (tipo 0.05), ele também funcionará corretamente, 
desde que o type="number" do input aceite casas decimais (via atributo step="0.01" no HTML).

=======================================================
2. Criamos um elemento <span> que vai exibir o tempo restante:
=======================================================

const tempoRestanteSpan = document.createElement('span');
tempoRestanteSpan.classList.add('tempo-restante');

Esse span será atualizado a cada segundo com a contagem regressiva.

⚠️ Atenção: nunca sobrescreva esse span usando .innerHTML += ..., senão ele é perdido.

=======================================================
3. Pegamos o horário alvo (futuro) ao renderizar a lista:
=======================================================

const horaAlvo = new Date(medicamento.tempoAlvoEmMilessegundos);

Isso converte os milissegundos (salvos antes) de volta para um objeto Date.

=======================================================
4. Criamos a função atualizarContador para calcular e exibir o tempo:
=======================================================

A lógica dentro dela é:

- Pega a hora atual (com new Date())
- Calcula a diferença entre agora e o horário alvo
- Converte a diferença para horas, minutos e segundos
- Atualiza o conteúdo do span com a frase:

⏳ Faltam Xh Ymin Zs

Exemplo:
⏳ Faltam 3h 45min 20s

=======================================================
5. Usamos setInterval para atualizar a cada segundo:
=======================================================

const intervalo = setInterval(atualizarContador, 1000);

Assim o contador será atualizado "ao vivo", a cada 1 segundo.

=======================================================
6. Quando o tempo acaba, o cronômetro para e exibe mensagem:
=======================================================

if (diferenca <= 0) {
  clearInterval(intervalo);
  tempoRestanteSpan.textContent = '⏰ Tempo esgotado!';
}

Isso evita que o contador fique negativo ou continue rodando após o fim do tempo.

=======================================================
7. Toca o som de alarme quando o tempo acaba:
=======================================================

Dentro do mesmo bloco onde o tempo acaba, usamos:

const audio = document.getElementById('alarme-audio');
if (audio) {
  audio.play().catch((erroDeReproducao) => {
    console.warn('Autoplay bloqueado pelo navegador. Interação do usuário pode ser necessária.', erroDeReproducao);
  });
}

🎵 Isso tenta tocar o som do alarme. Se o navegador bloquear o autoplay (por segurança), mostramos uma mensagem de aviso com console.warn.

🧼 Dica de clean code: nomeie o parâmetro como erroDeReproducao em vez de apenas e, para deixar o código mais claro.

=======================================================
8. Colocamos o <span> na tela junto com os dados do medicamento:
=======================================================

item.appendChild(tempoRestanteSpan);

Esse item é um <li> criado dinamicamente na função criarItemDaLista.

=======================================================
📌 Recapitulando: se eu precisar refazer do zero...
=======================================================

✅ Passo a passo rápido:

1. Calcule e salve a hora alvo com:
   Date.now() + intervaloHoras * 60 * 60 * 1000

2. Guarde esse valor no objeto do medicamento.

3. Ao exibir o item na tela, converta de volta com:
   new Date(medicamento.tempoAlvoEmMilessegundos)

4. Crie um <span> e atualize ele com a função atualizarContador()

5. Use setInterval para atualizar o contador a cada 1s

6. Quando a diferença chegar a 0 ou menos:
   - Pare o contador com clearInterval()
   - Atualize o texto para "⏰ Tempo esgotado!"
   - Toque o som de alarme com audio.play()

7. Adicione o <span> no HTML com appendChild()

=======================================================
💬 Observações importantes:
=======================================================

✔ A contagem regressiva continuará correta mesmo se a página for recarregada,
   pois a hora alvo foi salva no localStorage.

✔ O áudio só tocará se o navegador permitir autoplay — em alguns casos, 
   o usuário precisa clicar em algum botão na página antes.

✔ Essa lógica pode ser reaproveitada para:
- ✔ lembretes com alarme
- ✔ contagem de tempo em tarefas
- ✔ timers de estudo
- ✔ pausa para café
- ✔ qualquer app que use contagem regressiva

🎁 Dica bônus: se quiser testar com intervalos pequenos (ex: 0.05h = 3min), use step="0.01" no input HTML,
e no JS, use parseFloat em vez de parseInt para aceitar casas decimais.

Agradecemos por utilizar nossos serviços! Esperamos trabalhar com você novamente em breve.
*/