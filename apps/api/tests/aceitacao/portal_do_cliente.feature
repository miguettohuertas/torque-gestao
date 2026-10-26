# language: pt
Funcionalidade: Portal do cliente (RF06 e proteção de dados)
  Como cliente da oficina
  Quero acompanhar meus veículos e ordens de serviço
  Sem nunca enxergar os dados de outro cliente

  Contexto:
    Dado que existe o cliente "Maria Souza" com CPF "111.444.777-35"
    E que existe o cliente "Pedro Alves" com CPF "529.982.247-25"
    E que o cliente "Maria Souza" possui o veículo Fiat Uno de placa "MAR1A23"
    E que o cliente "Pedro Alves" possui o veículo Ford Ka de placa "PED4B56"
    E que o catálogo tem o serviço "Revisão de freios" a R$ 120.00
    E que existe uma OS aberta para o cliente "Maria Souza" com o serviço "Revisão de freios"
    E que existe uma OS aberta para o cliente "Pedro Alves" com o serviço "Revisão de freios"

  Cenário: O cliente vê apenas os próprios veículos
    Dado que o cliente "Maria Souza" tem acesso ao portal
    Quando consulto a lista de veículos
    Então a lista tem 1 item(ns)
    E a lista inclui a placa "MAR1A23"
    E a lista não inclui a placa "PED4B56"

  Cenário: O cliente vê apenas as próprias ordens de serviço
    Dado que o cliente "Maria Souza" tem acesso ao portal
    Quando consulto a lista de ordens de serviço
    Então a lista tem 1 item(ns)

  Cenário: O cliente acompanha a própria OS
    Dado que o cliente "Maria Souza" tem acesso ao portal
    Quando consulto a OS do cliente "Maria Souza"
    Então o sistema responde 200
    E a resposta traz status igual a "aguardando_diagnostico"

  Cenário: O cliente não acessa a OS de outro cliente
    Dado que o cliente "Maria Souza" tem acesso ao portal
    Quando consulto a OS do cliente "Pedro Alves"
    Então o sistema responde 404

  Cenário: A equipe da oficina vê os veículos de todos os clientes
    Dado que estou autenticado como mecânico
    Quando consulto a lista de veículos
    Então a lista tem 2 item(ns)
