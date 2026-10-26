# language: pt
Funcionalidade: Ordem de serviço, orçamento e fluxo de status (RF03 e RF04)
  Como mecânico
  Quero emitir a OS com orçamento automático e acompanhar cada etapa
  Para que o cliente saiba o valor e o andamento do conserto

  Contexto:
    Dado que existe o cliente "Maria Souza" com CPF "111.444.777-35"
    E que o cliente "Maria Souza" possui o veículo Fiat Uno de placa "ABC1D23"
    E que o catálogo tem o serviço "Revisão de freios" a R$ 120.00
    E que o catálogo tem a peça "Pastilha de freio" a R$ 35.50

  Cenário: O orçamento é calculado pelo catálogo
    Dado que estou autenticado como mecânico
    Quando emito uma OS para o cliente "Maria Souza" com 2 x o serviço "Revisão de freios" e 3 x a peça "Pastilha de freio"
    Então o sistema responde 201
    E o orçamento total é R$ 346.50
    E a OS fica com o status "Aguardando Diagnóstico"

  Cenário: A OS nasce com um registro no histórico
    Dado que estou autenticado como administrador
    Quando emito uma OS para o cliente "Maria Souza" com o serviço "Revisão de freios"
    Então o histórico da OS tem 1 registros

  Esquema do Cenário: Cada etapa avança para a seguinte do fluxo
    Dado que estou autenticado como mecânico
    E que existe uma OS aberta para o cliente "Maria Souza" com o serviço "Revisão de freios"
    E que a OS já está com o status "<atual>"
    Quando avanço a OS para "<proximo>"
    Então o sistema responde 200
    E a OS fica com o status "<proximo>"

    Exemplos:
      | atual                  | proximo                |
      | Aguardando Diagnóstico | Em Execução            |
      | Em Execução            | Aguardando Peças       |
      | Aguardando Peças       | Finalizada             |
      | Finalizada             | Entregue               |

  Cenário: A OS chega até Entregue com todo o histórico
    Dado que estou autenticado como mecânico
    E que existe uma OS aberta para o cliente "Maria Souza" com o serviço "Revisão de freios"
    Quando avanço a OS para "Em Execução"
    E avanço a OS para "Aguardando Peças"
    E avanço a OS para "Finalizada"
    E avanço a OS para "Entregue"
    Então a OS fica com o status "Entregue"
    E o histórico da OS tem 5 registros

  Cenário: Não é permitido pular uma etapa do fluxo
    Dado que estou autenticado como mecânico
    E que existe uma OS aberta para o cliente "Maria Souza" com o serviço "Revisão de freios"
    Quando avanço a OS para "Finalizada"
    Então o sistema responde 409

  Cenário: Não é permitido voltar uma etapa
    Dado que estou autenticado como mecânico
    E que existe uma OS aberta para o cliente "Maria Souza" com o serviço "Revisão de freios"
    Quando avanço a OS para "Em Execução"
    E avanço a OS para "Aguardando Diagnóstico"
    Então o sistema responde 409

  Cenário: O cliente do portal não emite OS
    Dado que o cliente "Maria Souza" tem acesso ao portal
    Quando emito uma OS para o cliente "Maria Souza" com o serviço "Revisão de freios"
    Então o sistema responde 403

  Cenário: Quem não fez login não emite OS
    Dado que não estou autenticado
    Quando emito uma OS para o cliente "Maria Souza" com o serviço "Revisão de freios"
    Então o sistema responde 401
