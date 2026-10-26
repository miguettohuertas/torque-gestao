# language: pt
Funcionalidade: Cadastro de clientes e veículos (RF01 e RF02)
  Como atendente da oficina
  Quero cadastrar clientes e seus veículos
  Para abrir ordens de serviço com os dados corretos

  Cenário: Cadastrar um cliente com CPF válido
    Dado que estou autenticado como administrador
    Quando cadastro o cliente "Maria Souza" com e-mail "maria@example.com" e CPF "111.444.777-35"
    Então o sistema responde 201
    E a resposta traz cpf igual a "11144477735"

  Cenário: O sistema recusa um CPF com dígito verificador errado
    Dado que estou autenticado como administrador
    Quando cadastro o cliente "Maria Souza" com e-mail "maria@example.com" e CPF "111.444.777-36"
    Então o sistema responde 422

  Cenário: O sistema recusa dois clientes com o mesmo e-mail
    Dado que estou autenticado como administrador
    E que existe o cliente "Maria Souza" com CPF "111.444.777-35"
    Quando cadastro o cliente "Outra Maria" com e-mail "maria.souza@example.com" e CPF "529.982.247-25"
    Então o sistema responde 409

  Cenário: O mecânico também cadastra clientes
    Dado que estou autenticado como mecânico
    Quando cadastro o cliente "João Lima" com e-mail "joao@example.com" e CPF "529.982.247-25"
    Então o sistema responde 201

  Cenário: Cadastrar um veículo com placa no padrão Mercosul
    Dado que estou autenticado como administrador
    E que existe o cliente "Maria Souza" com CPF "111.444.777-35"
    Quando cadastro o veículo Fiat Uno de placa "abc1d23" para o cliente "Maria Souza"
    Então o sistema responde 201
    E a resposta traz plate igual a "ABC1D23"

  Cenário: Cadastrar um veículo com placa no padrão antigo
    Dado que estou autenticado como administrador
    E que existe o cliente "Maria Souza" com CPF "111.444.777-35"
    Quando cadastro o veículo VW Gol de placa "abc-1234" para o cliente "Maria Souza"
    Então o sistema responde 201
    E a resposta traz plate igual a "ABC1234"

  Cenário: O sistema recusa uma placa inválida
    Dado que estou autenticado como administrador
    E que existe o cliente "Maria Souza" com CPF "111.444.777-35"
    Quando cadastro o veículo Fiat Uno de placa "12345" para o cliente "Maria Souza"
    Então o sistema responde 422

  Cenário: O sistema recusa uma placa já cadastrada
    Dado que estou autenticado como administrador
    E que existe o cliente "Maria Souza" com CPF "111.444.777-35"
    E que o cliente "Maria Souza" possui o veículo Fiat Uno de placa "ABC1D23"
    Quando cadastro o veículo Ford Ka de placa "abc1d23" para o cliente "Maria Souza"
    Então o sistema responde 409

  Cenário: O cliente do portal não cadastra veículos
    Dado que existe o cliente "Maria Souza" com CPF "111.444.777-35"
    E que o cliente "Maria Souza" tem acesso ao portal
    Quando cadastro o veículo Fiat Uno de placa "ABC1D23" para o cliente "Maria Souza"
    Então o sistema responde 403
