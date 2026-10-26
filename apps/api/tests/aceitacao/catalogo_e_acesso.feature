# language: pt
Funcionalidade: Catálogo e controle de acesso (RF05 e RF06)
  Como dono da oficina
  Quero que só o administrador mude preços e que só usuários autenticados entrem
  Para proteger o negócio

  Cenário: O administrador cadastra um serviço no catálogo
    Dado que estou autenticado como administrador
    Quando cadastro o serviço "Alinhamento" a R$ 90.00 no catálogo
    Então o sistema responde 201

  Cenário: O mecânico não altera o catálogo
    Dado que estou autenticado como mecânico
    Quando cadastro o serviço "Alinhamento" a R$ 90.00 no catálogo
    Então o sistema responde 403

  Cenário: Quem não fez login não acessa o catálogo
    Dado que não estou autenticado
    Quando cadastro o serviço "Alinhamento" a R$ 90.00 no catálogo
    Então o sistema responde 401

  Cenário: O sistema recusa um serviço com preço zero
    Dado que estou autenticado como administrador
    Quando cadastro o serviço "Alinhamento" a R$ 0.00 no catálogo
    Então o sistema responde 422

  Cenário: Login com senha correta devolve um token
    Dado que estou autenticado como administrador
    Quando faço login com o e-mail do administrador e a senha "senha123"
    Então o sistema responde 200
    E a resposta traz um token de acesso

  Cenário: Login com senha errada é recusado
    Dado que estou autenticado como administrador
    Quando faço login com o e-mail do administrador e a senha "senha-errada"
    Então o sistema responde 401
