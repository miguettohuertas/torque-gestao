# language: pt
Funcionalidade: Notificações de status por Telegram (RF07)
  Como cliente da oficina
  Quero receber um aviso no Telegram quando o status do meu carro mudar
  Para não precisar ligar para a oficina

  Contexto:
    Dado que existe o cliente "Maria Souza" com CPF "111.444.777-35"
    E que o cliente "Maria Souza" possui o veículo Fiat Uno de placa "ABC1D23"
    E que o catálogo tem o serviço "Revisão de freios" a R$ 120.00
    E que estou autenticado como mecânico

  Cenário: O cliente vinculado é avisado a cada mudança de status
    Dado que o cliente "Maria Souza" vinculou o Telegram
    Quando emito uma OS para o cliente "Maria Souza" com o serviço "Revisão de freios"
    E avanço a OS para "Em Execução"
    Então o cliente recebe 2 aviso(s) no Telegram
    E o último aviso menciona "em execução"

  Cenário: O aviso de finalização diz que o carro pode ser retirado
    Dado que o cliente "Maria Souza" vinculou o Telegram
    Quando emito uma OS para o cliente "Maria Souza" com o serviço "Revisão de freios"
    E avanço a OS para "Em Execução"
    E avanço a OS para "Aguardando Peças"
    E avanço a OS para "Finalizada"
    Então o último aviso menciona "já pode ser retirado"
    E o último aviso menciona "Fiat Uno (ABC1D23)"

  Cenário: O cliente que não vinculou o Telegram não recebe avisos
    Dado que o Telegram do sistema está configurado
    Quando emito uma OS para o cliente "Maria Souza" com o serviço "Revisão de freios"
    E avanço a OS para "Em Execução"
    Então o sistema responde 200
    E o cliente recebe 0 aviso(s) no Telegram
