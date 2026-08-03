// ─────────────────────────────────────────────────────────────────
// data.jsx — Mock data unificado para todo o protótipo
// ─────────────────────────────────────────────────────────────────

const MECANICOS = ['Carlos Andrade','Marcos Lima','Ricardo Souza'];

const CLIENTES_DATA = [
  { id:1, tipo:'PF', nome:'João Silva',             doc:'123.456.789-09', email:'joao.silva@email.com',    tel:'(47) 99999-1234', cidade:'Joinville', estado:'SC', cadastro:'12/01/2025', consentimento:true,
    veiculos:[
      { id:'v1', placa:'ABC-1234', formato:'antigo',   marca:'Honda',     modelo:'Civic',    ano:2019, km:87500,  cor:'Prata' },
      { id:'v2', placa:'DEF5G67', formato:'mercosul',  marca:'Honda',     modelo:'Fit',      ano:2017, km:142000, cor:'Preto' },
    ]},
  { id:2, tipo:'PF', nome:'Maria Costa',            doc:'987.654.321-00', email:'maria.costa@email.com',   tel:'(47) 98888-5678', cidade:'Joinville', estado:'SC', cadastro:'03/03/2025', consentimento:true,
    veiculos:[
      { id:'v3', placa:'XYZ-9876', formato:'antigo',   marca:'Toyota',    modelo:'Corolla',  ano:2021, km:42200,  cor:'Preto' },
    ]},
  { id:3, tipo:'PJ', nome:'Transportes Alves Ltda.', doc:'12.345.678/0001-90', email:'contato@alvesltda.com.br', tel:'(47) 3333-9012', cidade:'Joinville', estado:'SC', cadastro:'15/02/2024', consentimento:true,
    veiculos:[
      { id:'v4', placa:'DEF-5678', formato:'antigo',   marca:'VW',        modelo:'Gol',      ano:2018, km:120000, cor:'Branco' },
      { id:'v5', placa:'GHI-3456', formato:'antigo',   marca:'Fiat',      modelo:'Ducato',   ano:2020, km:88000,  cor:'Branco' },
      { id:'v6', placa:'RST8U90',  formato:'mercosul', marca:'VW',        modelo:'Delivery', ano:2022, km:55000,  cor:'Prata'  },
    ]},
  { id:4, tipo:'PF', nome:'Ana Rodrigues',           doc:'111.222.333-44', email:'ana.rod@email.com',       tel:'(47) 97777-3456', cidade:'São Bento do Sul', estado:'SC', cadastro:'20/06/2024', consentimento:true,
    veiculos:[
      { id:'v7', placa:'GHI-3456', formato:'antigo',   marca:'Fiat',      modelo:'Palio',    ano:2016, km:98700,  cor:'Vermelho' },
    ]},
  { id:5, tipo:'PF', nome:'Lucas Ferreira',          doc:'555.666.777-88', email:'lucas@email.com',         tel:'(47) 96666-7890', cidade:'Joinville', estado:'SC', cadastro:'10/04/2026', consentimento:false,
    veiculos:[
      { id:'v8', placa:'JKL7M89',  formato:'mercosul', marca:'Chevrolet', modelo:'Onix',     ano:2022, km:28000,  cor:'Azul' },
    ]},
];

const OS_DATA_INIT = [
  { id:'#0421', clienteId:1, cliente:'João Silva',             placa:'ABC-1234', veiculo:'Honda Civic 2019',      mecanico:'Carlos Andrade', status:'Em Execução',            prioridade:'Alta',  valor:1083, entrada:'20/04', dataAbertura:'20/04/2026 08:00',
    problema:'Cliente relata barulho ao frear e pedal mole. Solicita revisão completa de freios, troca de óleo e diagnóstico eletrônico.',
    aprovacao:{ status:'aprovado', data:'20/04/2026 09:15' },
    maoDeObra:[ {id:'m1',desc:'Revisão sistema de freios',qty:1,unit:180,total:180}, {id:'m2',desc:'Diagnóstico eletrônico OBD2',qty:1,unit:120,total:120}, {id:'m3',desc:'Alinhamento e balanceamento',qty:1,unit:140,total:140} ],
    pecas:[     {id:'p1',desc:'Pastilha freio dianteira (jogo)',qty:1,unit:220,total:220}, {id:'p2',desc:'Fluido de freio DOT4 1L',qty:2,unit:45,total:90}, {id:'p3',desc:'Filtro de ar',qty:1,unit:65,total:65}, {id:'p4',desc:'Óleo Motor 5W30 1L',qty:4,unit:52,total:208} ],
    historico:[ {status:'Aguardando Diagnóstico',data:'20/04/2026 08:00',user:'Roberto G.',obs:'OS aberta. Veículo recebido.'}, {status:'Em Execução',data:'20/04/2026 09:20',user:'Carlos Andrade',obs:'Diagnóstico concluído. Orçamento aprovado pelo cliente. Serviços iniciados.'} ] },
  { id:'#0420', clienteId:2, cliente:'Maria Costa',            placa:'XYZ-9876', veiculo:'Toyota Corolla 2021',   mecanico:'Marcos Lima',    status:'Aguardando Peças',       prioridade:'Média', valor:467,  entrada:'19/04', dataAbertura:'19/04/2026 08:30',
    problema:'Barulho nos freios traseiros ao reduzir velocidade.',
    aprovacao:{ status:'aprovado', data:'19/04/2026 10:40' },
    maoDeObra:[ {id:'m1',desc:'Troca de pastilhas traseiras',qty:1,unit:160,total:160}, {id:'m2',desc:'Sangria do sistema de freios',qty:1,unit:80,total:80} ],
    pecas:[     {id:'p1',desc:'Pastilha freio traseira (jogo)',qty:1,unit:195,total:195}, {id:'p2',desc:'Fluido de freio DOT4 500ml',qty:1,unit:32,total:32} ],
    historico:[ {status:'Aguardando Diagnóstico',data:'19/04/2026 08:30',user:'Roberto G.',obs:'OS aberta.'}, {status:'Em Execução',data:'19/04/2026 10:00',user:'Marcos Lima',obs:'Diagnóstico realizado.'}, {status:'Aguardando Peças',data:'19/04/2026 14:20',user:'Marcos Lima',obs:'Pastilha traseira em falta no estoque. Pedido ao fornecedor. Previsão: 2 dias.'} ] },
  { id:'#0419', clienteId:3, cliente:'Transportes Alves Ltda.',placa:'DEF-5678', veiculo:'VW Gol 2018',           mecanico:'Carlos Andrade', status:'Aguardando Diagnóstico', prioridade:'Alta',  valor:0,    entrada:'22/04', dataAbertura:'22/04/2026 07:45',
    problema:'Luz de injeção acesa. Motor perdendo potência em aceleração. Cliente relata piora progressiva nos últimos dias.',
    aprovacao:{ status:'pendente', data:null },
    maoDeObra:[], pecas:[],
    historico:[ {status:'Aguardando Diagnóstico',data:'22/04/2026 07:45',user:'Roberto G.',obs:'OS aberta. Veículo recebido na oficina.'} ] },
  { id:'#0418', clienteId:4, cliente:'Ana Rodrigues',          placa:'GHI-3456', veiculo:'Fiat Palio 2016',       mecanico:'Ricardo Souza',  status:'Finalizada',             prioridade:'Baixa', valor:302,  entrada:'17/04', dataAbertura:'17/04/2026 08:00',
    problema:'Revisão preventiva — troca de óleo e filtros.',
    aprovacao:{ status:'aprovado', data:'17/04/2026 09:05' },
    maoDeObra:[ {id:'m1',desc:'Troca de óleo e filtro',qty:1,unit:90,total:90} ],
    pecas:[     {id:'p1',desc:'Óleo Motor 10W40 1L',qty:4,unit:38,total:152}, {id:'p2',desc:'Filtro de óleo',qty:1,unit:28,total:28}, {id:'p3',desc:'Filtro de ar',qty:1,unit:32,total:32} ],
    historico:[ {status:'Aguardando Diagnóstico',data:'17/04/2026 08:00',user:'Roberto G.',obs:'OS aberta.'}, {status:'Em Execução',data:'17/04/2026 09:10',user:'Ricardo Souza',obs:'Revisão iniciada.'}, {status:'Finalizada',data:'17/04/2026 11:30',user:'Ricardo Souza',obs:'Serviço concluído. Veículo pronto para retirada.'} ] },
  { id:'#0417', clienteId:5, cliente:'Lucas Ferreira',         placa:'JKL7M89',  veiculo:'Chevrolet Onix 2022',   mecanico:'Marcos Lima',    status:'Entregue',               prioridade:'Baixa', valor:220,  entrada:'16/04', dataAbertura:'16/04/2026 09:00',
    problema:'Alinhamento e balanceamento de rotina.',
    aprovacao:{ status:'aprovado', data:'16/04/2026 10:00' },
    maoDeObra:[ {id:'m1',desc:'Alinhamento computadorizado',qty:1,unit:120,total:120}, {id:'m2',desc:'Balanceamento (4 rodas)',qty:1,unit:100,total:100} ],
    pecas:[],
    historico:[ {status:'Aguardando Diagnóstico',data:'16/04/2026 09:00',user:'Roberto G.',obs:'OS aberta.'}, {status:'Em Execução',data:'16/04/2026 10:05',user:'Marcos Lima',obs:'Iniciado.'}, {status:'Finalizada',data:'16/04/2026 11:00',user:'Marcos Lima',obs:'Concluído.'}, {status:'Entregue',data:'16/04/2026 15:30',user:'Roberto G.',obs:'Veículo entregue. Cliente satisfeito.'} ] },
];

const HIST_VEICULO = {
  'ABC-1234':[ {osId:'#0421',data:'20/04/2026',servico:'Revisão completa + freios',status:'Em Execução',mecanico:'Carlos Andrade',valor:1083,diag:'Sistema de freios desgastado. Pastilhas abaixo do mínimo. Fluido oxidado.'}, {osId:'#0380',data:'10/01/2026',servico:'Troca de óleo 5W30 + filtros',status:'Entregue',mecanico:'Carlos Andrade',valor:360,diag:'Óleo com 12.000 km de uso. Filtros saturados.'}, {osId:'#0330',data:'05/08/2025',servico:'Revisão 80k km',status:'Entregue',mecanico:'Marcos Lima',valor:820,diag:'Revisão preventiva. Verificação geral em bom estado.'}, {osId:'#0210',data:'12/09/2024',servico:'Troca de correia dentada',status:'Entregue',mecanico:'Carlos Andrade',valor:680,diag:'Correia com 60k km. Troca preventiva.'} ],
  'XYZ-9876':[ {osId:'#0420',data:'19/04/2026',servico:'Troca de freios traseiros',status:'Aguardando Peças',mecanico:'Marcos Lima',valor:467,diag:'Pastilhas traseiras com espessura crítica (1,5mm).'}, {osId:'#0310',data:'14/08/2025',servico:'Revisão 40k km',status:'Entregue',mecanico:'Marcos Lima',valor:1100,diag:'Revisão completa. Filtros, óleo, freios e suspensão verificados.'} ],
  'DEF-5678':[ {osId:'#0419',data:'22/04/2026',servico:'Diagnóstico — injeção eletrônica',status:'Aguardando Diagnóstico',mecanico:'Carlos Andrade',valor:0,diag:'—'}, {osId:'#0360',data:'08/12/2025',servico:'Injeção eletrônica + bicos',status:'Entregue',mecanico:'Carlos Andrade',valor:740,diag:'Bicos de injeção entupidos. Sensor MAP com falha.'} ],
  'GHI-3456':[ {osId:'#0418',data:'17/04/2026',servico:'Troca de óleo e filtros',status:'Finalizada',mecanico:'Ricardo Souza',valor:302,diag:'Óleo 10W40 com 8.000 km. Filtros em bom estado.'}, {osId:'#0350',data:'20/11/2025',servico:'Embreagem completa',status:'Entregue',mecanico:'Ricardo Souza',valor:1800,diag:'Disco e platô desgastados.'} ],
  'JKL7M89': [ {osId:'#0417',data:'16/04/2026',servico:'Alinhamento e balanceamento',status:'Entregue',mecanico:'Marcos Lima',valor:220,diag:'Desvio no alinhamento dianteiro.'} ],
};

const CATALOGO_SERVICOS_INIT = [
  {id:'s1',nome:'Alinhamento computadorizado',cat:'Pneus',preco:120,unid:'por eixo',ativo:true,obs:''},
  {id:'s2',nome:'Balanceamento (4 rodas)',cat:'Pneus',preco:80,unid:'serviço',ativo:true,obs:''},
  {id:'s3',nome:'Troca de óleo e filtro',cat:'Revisão',preco:90,unid:'serviço',ativo:true,obs:'Não inclui óleo/filtro'},
  {id:'s4',nome:'Diagnóstico eletrônico OBD2',cat:'Motor',preco:150,unid:'serviço',ativo:true,obs:'Leitura completa de falhas'},
  {id:'s5',nome:'Revisão completa 10k km',cat:'Revisão',preco:200,unid:'serviço',ativo:true,obs:''},
  {id:'s6',nome:'Troca de pastilhas de freio',cat:'Freios',preco:160,unid:'eixo',ativo:true,obs:'Inclui limpeza dos pinos'},
  {id:'s7',nome:'Higienização ar-condicionado',cat:'Ar Condicionado',preco:180,unid:'serviço',ativo:false,obs:'Temporariamente suspenso'},
  {id:'s8',nome:'Troca de correia dentada',cat:'Motor',preco:250,unid:'serviço',ativo:true,obs:'Não inclui kit correia'},
];

const CATALOGO_PECAS_INIT = [
  {id:'p1',nome:'Pastilha de freio dianteira',cat:'Freios',preco:195,unid:'jogo',ativo:true,ref:'FTE-1234',obs:'Compatível c/ Honda Civic, Toyota Corolla 2018+'},
  {id:'p2',nome:'Pastilha de freio traseira',cat:'Freios',preco:175,unid:'jogo',ativo:true,ref:'FTE-1235',obs:''},
  {id:'p3',nome:'Fluido de freio DOT4 500ml',cat:'Freios',preco:32,unid:'frasco',ativo:true,ref:'ATE-DOT4',obs:''},
  {id:'p4',nome:'Óleo Motor 5W30 Sintético',cat:'Lubrificantes',preco:52,unid:'litro',ativo:true,ref:'CASTROL-5W30',obs:''},
  {id:'p5',nome:'Óleo Motor 10W40 Semissintético',cat:'Lubrificantes',preco:38,unid:'litro',ativo:true,ref:'MOB-10W40',obs:''},
  {id:'p6',nome:'Filtro de óleo universal',cat:'Filtros',preco:28,unid:'peça',ativo:true,ref:'TECFIL-PSL625',obs:''},
  {id:'p7',nome:'Filtro de ar',cat:'Filtros',preco:32,unid:'peça',ativo:true,ref:'TECFIL-AE100',obs:''},
  {id:'p8',nome:'Kit correia dentada',cat:'Motor',preco:280,unid:'kit',ativo:true,ref:'GATES-K015607XS',obs:'Inclui correia, tensor e polia'},
];

const USUARIOS_INIT = [
  {id:'u1',nome:'Roberto Gestão',   email:'roberto@torque.com.br',  perfil:'admin', status:true, cadastro:'10/01/2024', ultimo:'22/04/2026 08:15', tel:'(47) 99111-0001'},
  {id:'u2',nome:'Carlos Andrade',   email:'carlos@torque.com.br',   perfil:'mech',  status:true, cadastro:'15/02/2024', ultimo:'22/04/2026 07:50', tel:'(47) 99111-0002'},
  {id:'u3',nome:'Marcos Lima',      email:'marcos@torque.com.br',   perfil:'mech',  status:true, cadastro:'15/02/2024', ultimo:'21/04/2026 17:20', tel:'(47) 99111-0003'},
  {id:'u4',nome:'Ricardo Souza',    email:'ricardo@torque.com.br',  perfil:'mech',  status:false,cadastro:'01/03/2024', ultimo:'10/04/2026 12:00', tel:'(47) 99111-0004'},
  {id:'u5',nome:'João Silva',       email:'joao.silva@email.com',   perfil:'client',status:true, cadastro:'12/01/2025', ultimo:'20/04/2026 09:30', tel:'(47) 99999-1234'},
  {id:'u6',nome:'Maria Costa',      email:'maria.costa@email.com',  perfil:'client',status:true, cadastro:'03/03/2025', ultimo:'19/04/2026 10:45', tel:'(47) 98888-5678'},
  {id:'u7',nome:'Ana Rodrigues',    email:'ana.rod@email.com',      perfil:'client',status:true, cadastro:'20/06/2024', ultimo:'17/04/2026 08:00', tel:'(47) 97777-3456'},
];

const CONFIG_INIT = {
  oficina:{ nome:'Torque Gestão Oficina', cnpj:'12.345.678/0001-90', tel:'(47) 3333-0000', cel:'(47) 99999-0000', email:'contato@torquegestao.com.br', responsavel:'Roberto Gestão', cep:'89200-000', endereco:'Rua das Mecânicas, 1234', bairro:'Centro', cidade:'Joinville', estado:'SC' },
  notif:{ osParada:true, osParadaHoras:48, manPreventiva:true, manPreventivaKm:1000, emailCliente:true, whatsapp:false, statusAvancos:true, orcamentoPendente:true, orcamentoPendenteHoras:24 },
  sistema:{ fuso:'America/Sao_Paulo', autoBackup:true, backupHoras:24 },
};

// Portal do cliente (João Silva)
const PORTAL_CLIENTE = {
  nome:'João Silva', email:'joao.silva@email.com', tel:'(47) 99999-1234', initials:'JS',
  veiculos:[
    { id:'v1', placa:'ABC-1234', marca:'Honda', modelo:'Civic', ano:2019, cor:'Prata', km:87500,
      osAtiva:{ id:'#0421', status:'Em Execução', dataAbertura:'20/04/2026', previsao:'23/04/2026',
        problema:'Revisão completa — freios, óleo e diagnóstico geral solicitados pelo cliente.',
        aprovacao:'aprovado',
        maoDeObra:[{desc:'Revisão sistema de freios',qty:1,unit:180,total:180},{desc:'Diagnóstico eletrônico',qty:1,unit:120,total:120},{desc:'Alinhamento e balanceamento',qty:1,unit:140,total:140}],
        pecas:[{desc:'Pastilha freio dianteira (jogo)',qty:1,unit:220,total:220},{desc:'Fluido de freio DOT4 1L',qty:2,unit:45,total:90},{desc:'Filtro de ar',qty:1,unit:65,total:65},{desc:'Óleo Motor 5W30 1L',qty:4,unit:52,total:208}],
        historico:[
          {status:'Aguardando Diagnóstico',data:'20/04/2026 08:00',msg:'Seu veículo foi recebido pela nossa equipe.'},
          {status:'Em Execução',data:'20/04/2026 09:20',msg:'Orçamento aprovado por você. Os serviços foram iniciados.'},
        ],
      },
      historico:[
        {id:'#0380',data:'10/01/2026',servico:'Troca de óleo e filtros',status:'Entregue',valor:360},
        {id:'#0330',data:'05/08/2025',servico:'Revisão 80.000 km',status:'Entregue',valor:820},
        {id:'#0280',data:'10/03/2025',servico:'Suspensão — amortecedores dianteiros',status:'Entregue',valor:1450},
      ],
    },
    { id:'v2', placa:'DEF5G67', marca:'Honda', modelo:'Fit', ano:2017, cor:'Preto', km:142000,
      osAtiva:null,
      historico:[
        {id:'#0340',data:'05/10/2025',servico:'Alinhamento e balanceamento',status:'Entregue',valor:200},
        {id:'#0290',data:'22/07/2025',servico:'Suspensão traseira — buchas',status:'Entregue',valor:920},
      ],
    },
  ],
};

Object.assign(window, {
  MECANICOS, CLIENTES_DATA, OS_DATA_INIT, HIST_VEICULO,
  CATALOGO_SERVICOS_INIT, CATALOGO_PECAS_INIT,
  USUARIOS_INIT, CONFIG_INIT, PORTAL_CLIENTE,
});
