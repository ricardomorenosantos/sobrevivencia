// Conteúdo do Manual. Para acrescentar um artigo, copie um bloco { ... } e mude os textos.
// Depois de editar, aumente o número da VERSAO no arquivo sw.js para o iPhone baixar a novidade.
//
// Cada artigo tem:
//   categoria: grupo em que aparece
//   titulo:    nome do artigo
//   passos:    lista do que fazer, em ordem
//   atencao:   (opcional) aviso importante em vermelho
//   palavras:  (opcional) palavras extras que a busca deve encontrar

const MANUAL = [
  // ---------------- PRIMEIROS SOCORROS ----------------
  {
    categoria: "Primeiros socorros",
    titulo: "Sangramento forte",
    palavras: "hemorragia corte ferida sangue torniquete",
    passos: [
      "Aperte direto em cima do ferimento com pano limpo, com força, sem parar.",
      "Se o pano encharcar, coloque outro por cima. Não tire o primeiro.",
      "Mantenha a pressão por pelo menos 10 minutos sem espiar.",
      "Se for braço ou perna, levante acima do coração enquanto aperta.",
      "Quando parar, enfaixe firme, sem cortar a circulação (dedos não podem ficar roxos ou frios).",
      "Sangue que jorra de braço ou perna e não para com pressão: amarre uma faixa larga 5 a 7 cm acima do ferimento, aperte até parar e anote a hora. Não afrouxe."
    ],
    atencao: "Não retire objetos cravados. Fixe o objeto no lugar e aperte em volta."
  },
  {
    categoria: "Primeiros socorros",
    titulo: "Queimadura",
    palavras: "fogo bolha escaldadura água quente",
    passos: [
      "Coloque em água corrente fria (não gelada) por 20 minutos.",
      "Tire anéis, relógio e roupa da região antes de inchar. Se a roupa grudou, não puxe.",
      "Cubra com pano limpo e úmido ou filme plástico, sem apertar.",
      "Não estoure bolhas.",
      "Dê água para beber se a pessoa estiver acordada."
    ],
    atencao: "Nunca passe pasta de dente, manteiga, óleo, pó de café nem gelo. Queimadura maior que a palma da mão, no rosto, mãos, genitais ou por eletricidade/produto químico precisa de médico."
  },
  {
    categoria: "Primeiros socorros",
    titulo: "Engasgo (adulto e criança)",
    palavras: "asfixia heimlich sufocando engasgou",
    passos: [
      "Se a pessoa tosse ou fala, incentive a tossir. Não bata nas costas ainda.",
      "Se não consegue tossir, falar ou respirar: incline-a para frente e dê 5 tapas fortes entre as escápulas.",
      "Não resolveu: fique atrás, feche uma mão acima do umbigo, segure com a outra e puxe para dentro e para cima, 5 vezes.",
      "Alterne 5 tapas e 5 compressões até sair o objeto.",
      "Se desmaiar, deite no chão e comece a massagem cardíaca."
    ],
    atencao: "Bebê com menos de 1 ano: de bruços no seu antebraço, cabeça mais baixa, 5 tapas nas costas; vire e faça 5 compressões no meio do peito com 2 dedos. Nunca aperte a barriga de bebê."
  },
  {
    categoria: "Primeiros socorros",
    titulo: "Parada cardíaca (RCP)",
    palavras: "massagem cardíaca coração ressuscitação não respira infarto",
    passos: [
      "Chame a pessoa e sacuda os ombros. Não responde e não respira normal? Comece.",
      "Peça para alguém ligar 192 e buscar um desfibrilador (DEA) se houver.",
      "Deite a pessoa de costas em chão duro.",
      "Mãos uma sobre a outra no centro do peito, braços esticados.",
      "Aperte forte e rápido: afundar uns 5 cm, cerca de 2 compressões por segundo.",
      "Deixe o peito voltar todo entre uma e outra. Não pare.",
      "Reveze com outra pessoa a cada 2 minutos. Continue até chegar ajuda ou a pessoa reagir."
    ],
    atencao: "Em criança, use uma mão só; em bebê, dois dedos. Afunde cerca de um terço do peito."
  },
  {
    categoria: "Primeiros socorros",
    titulo: "Pessoa desmaiada que respira",
    palavras: "inconsciente desmaio posição lateral de segurança convulsão",
    passos: [
      "Confira se respira: olhe o peito subir por 10 segundos.",
      "Vire a pessoa de lado, com a perna de cima dobrada para não rolar.",
      "Incline a cabeça levemente para trás para o ar passar.",
      "Afrouxe roupa apertada e mantenha aquecida.",
      "Não dê nada para beber ou comer.",
      "Fique junto e confira a respiração a cada minuto."
    ],
    atencao: "Em convulsão: afaste objetos, proteja a cabeça, não segure a pessoa e não coloque nada na boca. Depois que passar, vire de lado."
  },
  {
    categoria: "Primeiros socorros",
    titulo: "Fratura ou torção",
    palavras: "osso quebrado tala entorse imobilizar",
    passos: [
      "Não tente colocar o osso no lugar.",
      "Imobilize do jeito que está, pegando a articulação de cima e a de baixo.",
      "Use tala improvisada: madeira, papelão dobrado, revista enrolada. Acolchoe com pano.",
      "Amarre firme, mas sem cortar a circulação.",
      "Gelo enrolado em pano por 20 minutos ajuda no inchaço.",
      "Se o osso furou a pele, cubra com pano limpo e não empurre de volta."
    ],
    atencao: "Suspeita de lesão no pescoço ou coluna (queda, acidente): não mova a pessoa, a não ser que haja perigo imediato."
  },
  {
    categoria: "Primeiros socorros",
    titulo: "Desidratação e soro caseiro",
    palavras: "diarreia vômito soro sede fraqueza reidratação",
    passos: [
      "Sinais: boca seca, urina escura e pouca, tontura, olhos fundos, criança sem lágrima.",
      "Soro caseiro: 1 litro de água limpa (fervida ou tratada).",
      "Junte 1 colher de sopa rasa de açúcar (20 g).",
      "Junte 1 colher de café rasa de sal (3,5 g).",
      "Mexa bem. Prove: não pode ser mais salgado que lágrima.",
      "Dê em goles pequenos, o tempo todo, principalmente após cada diarreia ou vômito.",
      "Jogue fora o que sobrar depois de 24 horas."
    ],
    atencao: "Sal demais faz mal, principalmente a crianças. Na dúvida, coloque menos sal."
  },
  {
    categoria: "Primeiros socorros",
    titulo: "Calor demais (insolação)",
    palavras: "insolação hipertermia calor sol febre",
    passos: [
      "Leve para a sombra ou lugar fresco.",
      "Tire o excesso de roupa.",
      "Molhe a pele e abane. Panos molhados em pescoço, axilas e virilha.",
      "Se estiver acordada, dê água em goles.",
      "Deite com as pernas um pouco elevadas."
    ],
    atencao: "Pele quente e seca, confusão ou desmaio é emergência: resfrie sem parar."
  },
  {
    categoria: "Primeiros socorros",
    titulo: "Frio demais (hipotermia)",
    palavras: "hipotermia frio tremor molhado",
    passos: [
      "Tire do vento e da chuva.",
      "Troque roupa molhada por seca.",
      "Enrole em cobertores, cobrindo cabeça e pescoço.",
      "Aqueça o tronco primeiro: contato corpo a corpo ou garrafa de água morna enrolada em pano.",
      "Se estiver acordada, dê bebida morna e doce."
    ],
    atencao: "Não dê álcool, não esfregue a pele e não coloque em água quente."
  },
  {
    categoria: "Primeiros socorros",
    titulo: "Limpar um ferimento",
    palavras: "curativo corte infecção machucado arranhão",
    passos: [
      "Lave as mãos antes.",
      "Lave o ferimento com bastante água limpa e sabão em volta.",
      "Tire a sujeira visível com a água corrente.",
      "Seque em volta e cubra com gaze ou pano limpo.",
      "Troque o curativo todo dia ou quando molhar ou sujar."
    ],
    atencao: "Sinais de infecção: vermelhidão que cresce, calor, pus, febre. Procure atendimento."
  },

  // ---------------- ÁGUA ----------------
  {
    categoria: "Água",
    titulo: "Ferver (o método mais seguro)",
    palavras: "purificar tratar água potável fervura",
    passos: [
      "Se a água estiver turva, coe antes em pano limpo ou filtro de café.",
      "Ferva até levantar bolhas grandes e mantenha por 1 minuto (3 minutos em lugares muito altos, acima de 2.000 m).",
      "Deixe esfriar tampada.",
      "Guarde em recipiente limpo e com tampa.",
      "Para melhorar o gosto, passe de um recipiente limpo para outro algumas vezes."
    ],
    atencao: "Ferver mata micróbios, mas não tira veneno, combustível ou metais. Não use água com cheiro de produto químico."
  },
  {
    categoria: "Água",
    titulo: "Água sanitária ou hipoclorito",
    palavras: "cloro purificar tratar água potável gotas candida",
    passos: [
      "Use só água sanitária comum (2% a 2,5% de cloro ativo), sem perfume, sem alvejante colorido.",
      "Coe a água se estiver turva.",
      "Coloque 2 gotas para cada 1 litro de água.",
      "Para 20 litros: 40 gotas (mais ou menos meia colher de chá).",
      "Misture e espere 30 minutos antes de beber.",
      "Deve ficar um leve cheiro de cloro. Se não ficar, repita a dose e espere mais 15 minutos."
    ],
    atencao: "Confira no rótulo se serve para tratar água. Produto vencido perde força."
  },
  {
    categoria: "Água",
    titulo: "Desinfecção pelo sol (SODIS)",
    palavras: "garrafa pet sol purificar tratar água solar",
    passos: [
      "Use garrafa PET transparente, sem cor, de até 2 litros, sem arranhões.",
      "Só funciona com água clara. Coe se estiver turva.",
      "Encha, tampe e deite a garrafa no sol direto, de preferência sobre telha ou chapa de metal.",
      "Deixe 6 horas com sol forte.",
      "Com céu nublado, deixe 2 dias seguidos.",
      "Beba da própria garrafa."
    ],
    atencao: "Não funciona em dia de chuva o tempo todo. Use quando não puder ferver nem clorar."
  },
  {
    categoria: "Água",
    titulo: "Onde achar e como guardar água",
    palavras: "armazenar reserva caixa d'água chuva estoque galão",
    passos: [
      "Ao primeiro sinal de falta, encha garrafas, panelas, baldes e a banheira.",
      "Fontes dentro de casa: caixa d'água, aquecedor (boiler), gelo do freezer.",
      "Água da chuva: descarte os primeiros minutos, colete e trate antes de beber.",
      "Rio, poço e lago: sempre coe e trate.",
      "Guarde em recipiente próprio para alimento, limpo, tampado, longe do sol e de produtos químicos.",
      "Anote a data. Troque a água guardada a cada 6 meses."
    ],
    atencao: "Nunca beba água do mar, de piscina, de radiador ou da caixa acoplada do vaso sanitário."
  },

  // ---------------- COMIDA ----------------
  {
    categoria: "Comida",
    titulo: "Geladeira e freezer sem energia",
    palavras: "apagão conservar comida estragada perecível carne",
    passos: [
      "Mantenha as portas fechadas. Abra o mínimo possível.",
      "Geladeira fechada segura o frio por cerca de 4 horas.",
      "Freezer cheio segura por cerca de 48 horas; pela metade, 24 horas.",
      "Coma primeiro o que estraga rápido: carnes, leite, sobras. Depois o freezer. Por último os secos e enlatados.",
      "Carne, frango, peixe, leite, ovos e sobras que ficaram mais de 4 horas fora do frio (acima de 5 °C): jogue fora.",
      "Comida do freezer que ainda tem cristais de gelo pode ser cozida ou recongelada."
    ],
    atencao: "Nunca prove para saber se está boa. Na dúvida, jogue fora."
  },
  {
    categoria: "Comida",
    titulo: "Guardar alimentos secos",
    palavras: "estoque despensa arroz feijão armazenar validade caruncho",
    passos: [
      "Lugar fresco, seco, escuro e longe do chão.",
      "Passe grãos e farinhas para potes ou garrafas PET bem fechados.",
      "Uma folha de louro no pote ajuda a afastar carunchos.",
      "Escreva a validade na frente com caneta grossa.",
      "Use sempre o mais antigo primeiro e reponha por trás.",
      "Bons para estocar: arroz, feijão, macarrão, farinha, açúcar, sal, óleo, enlatados, leite em pó, aveia, rapadura, mel."
    ]
  },
  {
    categoria: "Comida",
    titulo: "Enlatados: quando não comer",
    palavras: "lata estufada botulismo conserva vidro",
    passos: [
      "Jogue fora lata estufada, muito amassada na emenda, enferrujada ou vazando.",
      "Jogue fora se espirrar líquido ou sair gás ao abrir.",
      "Jogue fora se tiver cheiro estranho, espuma ou mofo.",
      "Vidros de conserva: a tampa não pode estar alta nem fazer 'cloc' ao apertar.",
      "Depois de aberta, passe para outro pote e consuma no mesmo dia se não tiver geladeira."
    ],
    atencao: "Botulismo pode matar e nem sempre muda o cheiro ou o gosto. Conserva caseira suspeita: ferva por 10 minutos antes de comer ou descarte."
  },
  {
    categoria: "Comida",
    titulo: "Conservar sem geladeira",
    palavras: "salgar secar charque defumar desidratar carne de sol",
    passos: [
      "Salgar: corte a carne em mantas finas, cubra todos os lados com bastante sal grosso e deixe escorrer em lugar fresco e ventilado.",
      "Secar: fatias finas de carne salgada, frutas ou legumes ao sol e vento, protegidas de moscas com tela ou pano fino. Recolha à noite.",
      "Cozinhar de novo: sobras fervidas por inteiro duas vezes ao dia duram mais um dia.",
      "Gordura: carne cozida totalmente coberta por banha em pote limpo dura semanas em lugar fresco.",
      "Ovos frescos e sem rachadura duram cerca de 2 semanas fora da geladeira em lugar fresco."
    ],
    atencao: "Com muito calor e umidade a secagem falha. Cheiro ruim, limo ou mofo: descarte."
  },
  {
    categoria: "Comida",
    titulo: "Cozinhar com segurança na emergência",
    palavras: "fogareiro gás lenha fogo cozinhar monóxido",
    passos: [
      "Fogareiro, churrasqueira e fogueira só em lugar aberto ou muito ventilado.",
      "Deixe balde de água ou areia por perto.",
      "Tampe a panela e deixe grãos de molho antes: gasta menos combustível.",
      "Lave as mãos antes de mexer na comida. Sem água, use álcool em gel.",
      "Cozinhe só o que vai ser comido na hora."
    ],
    atencao: "Carvão ou fogareiro dentro de casa fechada solta monóxido de carbono, que mata sem cheiro."
  },

  // ---------------- APAGÃO ----------------
  {
    categoria: "Apagão",
    titulo: "Primeiros 10 minutos",
    palavras: "falta de luz energia blecaute queda disjuntor",
    passos: [
      "Veja se é só na sua casa: olhe o disjuntor e os vizinhos.",
      "Pegue a lanterna. Evite velas.",
      "Tire da tomada TV, computador, micro-ondas e outros eletrônicos (a volta da energia pode queimar).",
      "Deixe uma lâmpada ligada para saber quando a luz voltar.",
      "Feche geladeira e freezer e não abra.",
      "Encha baldes e garrafas: a água pode acabar se o prédio ou o bairro usa bomba."
    ]
  },
  {
    categoria: "Apagão",
    titulo: "Poupar bateria do celular",
    palavras: "bateria celular iphone carregar powerbank modo pouca energia",
    passos: [
      "Ligue o Modo Pouca Energia (Ajustes > Bateria).",
      "Abaixe o brilho da tela.",
      "Sem sinal? Ative o modo avião: procurar rede gasta muita bateria.",
      "Desligue Wi‑Fi e Bluetooth se não estiver usando.",
      "Prefira mensagem de texto a ligação e vídeo.",
      "Combine horários fixos para ligar o aparelho e dar notícias.",
      "Carregue no carro ou em bateria externa. Mantenha a bateria externa sempre cheia."
    ]
  },
  {
    categoria: "Apagão",
    titulo: "Apagão longo (mais de um dia)",
    palavras: "blecaute dias sem luz plano rádio dinheiro",
    passos: [
      "Rádio a pilha ou do carro para ouvir notícias.",
      "Tenha dinheiro em espécie: cartão e Pix podem não funcionar.",
      "Abasteça o carro cedo: bomba de posto depende de energia.",
      "Remédio que precisa de geladeira: use caixa térmica com gelo e pergunte na farmácia ou posto de saúde.",
      "Quem usa aparelho médico elétrico deve procurar um lugar com energia.",
      "Coma primeiro o que está na geladeira, depois o freezer, depois os secos.",
      "Veja como estão vizinhos idosos ou sozinhos.",
      "À noite, tranque a casa e evite sair."
    ]
  },
  {
    categoria: "Apagão",
    titulo: "Velas, gás e gerador",
    palavras: "incêndio vela gerador monóxido vazamento gás fogo",
    passos: [
      "Vela só em suporte firme, longe de cortina e papel, e nunca acesa enquanto dorme.",
      "Gerador sempre do lado de fora, longe de portas e janelas.",
      "Nunca ligue gerador direto na tomada da casa.",
      "Não use forno ou fogão para aquecer a casa.",
      "Cheiro de gás: não acenda nada, não mexa em interruptor, abra tudo, feche o registro e saia.",
      "Dor de cabeça, tontura e enjoo em várias pessoas ao mesmo tempo: saia para o ar livre na hora."
    ],
    atencao: "Monóxido de carbono não tem cheiro nem cor. Motor, carvão e fogareiro só em área aberta."
  },
  {
    categoria: "Apagão",
    titulo: "Kit para deixar pronto",
    palavras: "mochila emergência lista preparar kit 72 horas",
    passos: [
      "Água: 4 litros por pessoa por dia, para pelo menos 3 dias.",
      "Comida que não precisa de geladeira nem de muito cozimento, e abridor de latas.",
      "Lanterna, pilhas extras e bateria externa carregada.",
      "Rádio a pilha.",
      "Caixa de primeiros socorros e os remédios de uso contínuo.",
      "Fósforos ou isqueiro, velas, fogareiro com gás reserva.",
      "Dinheiro em notas pequenas.",
      "Cópia dos documentos em saco plástico.",
      "Água sanitária sem perfume, sabão, papel higiênico, sacos de lixo.",
      "Cobertor, apito, canivete, fita adesiva."
    ]
  }
];
