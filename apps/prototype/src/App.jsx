// ─────────────────────────────────────────────────────────────────
// App.jsx — Shell and routing for the unified prototype
// ─────────────────────────────────────────────────────────────────

const App = () => {
  // ── Global State ────────────────────────────────────────────────
  const [screen,  setScreen]  = useState(() => localStorage.getItem('tq_screen')  || 'login');
  const [role,    setRole]    = useState(() => localStorage.getItem('tq_role')    || 'admin');
  const [page,    setPage]    = useState(() => localStorage.getItem('tq_page')    || 'dashboard');
  const [osList,  setOsList]  = useState(OS_DATA_INIT);
  const [clientes, setClientes] = useState(CLIENTES_DATA);
  const [toast,   setToast]   = useState(null);

  // For inter-screen navigation
  const [selectedOS,      setSelectedOS]      = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [histPlaca,       setHistPlaca]       = useState(null);
  const [portalVeiculo,   setPortalVeiculo]   = useState(null);

  useEffect(()=>{ localStorage.setItem('tq_screen', screen); }, [screen]);
  useEffect(()=>{ localStorage.setItem('tq_role',   role);   }, [role]);
  useEffect(()=>{ localStorage.setItem('tq_page',   page);   }, [page]);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null), 3200); };

  // ── Handlers ─────────────────────────────────────────────────────
  const handleLogin    = (r) => { setRole(r); setPage('dashboard'); setScreen(r==='client'?'portal':'app'); };
  const handleLogout   = () => { setScreen('login'); setPage('dashboard'); };

  const handleNav = (id) => {
    if (id==='nova-os') { setPage('nova-os'); return; }
    if (id.startsWith('os:')) { const os=osList.find(o=>o.id===id.slice(3)); if(os){ setSelectedOS(os); setPage('os-detalhe'); } return; }
    setPage(id);
  };

  const handleViewOS  = (os) => { setSelectedOS(os); setPage('os-detalhe'); };
  const handleNovaOS  = ()   => setPage('nova-os');

  const handleSaveNovaOS = (nova) => {
    setOsList(l=>[nova,...l]);
    setSelectedOS(nova);
    setPage('os-detalhe');
    showToast(`OS ${nova.id} criada com sucesso!`);
  };

  const handleUpdateOS = (id, novoStatus, obs) => {
    const entrada = { status:novoStatus, data:nowStr(), user:role==='admin'?'Roberto G.':'Carlos Andrade', obs };
    setOsList(l=>l.map(os=>os.id!==id?os:{ ...os, status:novoStatus, historico:[...os.historico,entrada] }));
    setSelectedOS(prev=>prev?.id===id ? { ...prev, status:novoStatus, historico:[...prev.historico,entrada] } : prev);
    showToast(`OS ${id} → "${novoStatus}"`);
  };

  const handleViewCliente  = (c) => { setSelectedCliente(c); setPage('cliente-perfil'); };
  const handleNovoVeiculo  = (c) => { setSelectedCliente(c); setPage('cadastro-veiculo'); };

  const handleSaveVeiculo = (veiculo) => {
    setClientes(cs=>cs.map(c=>c.id===selectedCliente.id?{...c,veiculos:[...c.veiculos,veiculo]}:c));
    setSelectedCliente(prev=>prev?{...prev,veiculos:[...prev.veiculos,veiculo]}:prev);
    setPage('cliente-perfil');
    showToast(`Veículo ${veiculo.placa} cadastrado!`);
  };

  const handleHistorico = (placa) => { setHistPlaca(placa); setPage('historico-veiculo'); };

  // Portal
  const handlePortalVerOS   = (v) => { setPortalVeiculo(v); setPage('portal-os'); };
  const handlePortalVerHist = (v) => { setPortalVeiculo(v); setPage('portal-historico'); };

  const handleSaveCliente = (novo) => {
    const newId = Math.max(0, ...clientes.map(c=>c.id)) + 1;
    const novoComId = { ...novo, id:newId };
    setClientes(cs=>[...cs, novoComId]);
    setSelectedCliente(novoComId);
    setPage('cliente-perfil');
    showToast(`Cliente ${novo.nome} cadastrado!`);
  };

  // ── OS count para badge ───────────────────────────────────────────
  const activeOSCount = osList.filter(o=>o.status!=='Entregue'&&o.status!=='Cancelada').length;

  // ── PORTAL SHELL ─────────────────────────────────────────────────
  if (screen==='portal') {
    const portalPage = page.startsWith('portal')?page:'painel';
    const portalNav  = (p) => setPage(p);

    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
        <PortalHeader page={portalPage==='painel'?'painel':portalPage==='portal-os'?'os':portalPage==='portal-historico'?'historico':'painel'} onNav={p=>{setPage(p==='os'?'portal-os':p==='historico'?'portal-historico':'painel');setPortalVeiculo(null);}} onLogout={handleLogout}/>
        {(portalPage==='painel'||!portalPage.startsWith('portal'))&&<PortalPainel onVerOS={handlePortalVerOS} onVerHistorico={handlePortalVerHist}/>}
        {portalPage==='portal-os'       && <PortalAcompanhamento veiculo={portalVeiculo}/>}
        {portalPage==='portal-historico'&& <PortalHistorico veiculo={portalVeiculo}/>}
        {toast && <Toast msg={toast.msg} type={toast.type}/>}
      </div>
    );
  }

  // ── LOGIN ─────────────────────────────────────────────────────────
  if (screen==='login') return <LoginScreen onLogin={handleLogin}/>;

  // ── APP SHELL (admin + mech) ──────────────────────────────────────
  // Titles e actions por página
  const PAGE_META = {
    dashboard:         { title:role==='mech'?'Minha Área':'Painel do Administrador',  subtitle:role==='mech'?`${osList.filter(o=>o.mecanico==='Carlos Andrade'&&o.status!=='Finalizada'&&o.status!=='Entregue').length} OS ativas`:'Hoje, 24 abr 2026', actions:role==='admin'?[<Btn key="new" variant="accent" onClick={handleNovaOS} icon={<IcPlus size={15}/>}>Nova OS</Btn>]:[] },
    os:                { title:'Ordens de Serviço', subtitle:`${osList.length} ordens`, actions:[<Btn key="new" variant="accent" onClick={handleNovaOS} icon={<IcPlus size={15}/>}>Nova OS</Btn>] },
    'nova-os':         { title:'Nova Ordem de Serviço', back:'Ordens de Serviço', onBack:()=>setPage('os') },
    'os-detalhe':      { title:selectedOS?`OS ${selectedOS.id}`:'Detalhe', subtitle:selectedOS?`${selectedOS.veiculo} · ${selectedOS.placa} · ${selectedOS.cliente}`:'', back:'Ordens de Serviço', onBack:()=>setPage('os') },
    'historico-veiculo':{ title:`Histórico — ${histPlaca||''}`, back:'Detalhe da OS', onBack:()=>setPage('os-detalhe') },
    clientes:          { title:'Clientes', subtitle:`${clientes.length} cadastrados`, actions:[<Btn key="new" variant="accent" icon={<IcPlus size={15}/>} onClick={()=>setPage('cliente-form')}>Novo cliente</Btn>] },
    'cliente-form':    { title:'Novo Cliente', back:'Clientes', onBack:()=>setPage('clientes') },
    'cliente-perfil':  { title:selectedCliente?.nome||'Perfil do Cliente', back:'Clientes', onBack:()=>setPage('clientes') },
    'cadastro-veiculo':{ title:'Cadastrar Veículo', back:`Perfil — ${selectedCliente?.nome||''}`, onBack:()=>setPage('cliente-perfil') },
    veiculos:          { title:'Veículos', subtitle:`${clientes.reduce((s,c)=>s+c.veiculos.length,0)} cadastrados` },
    catalogo:          { title:'Catálogo de Serviços e Peças' },
    usuarios:          { title:'Gestão de Usuários' },
    config:            { title:'Configurações do Sistema' },
    historico:         { title:'Histórico', subtitle:role==='mech'?'Suas OS finalizadas':'Ordens finalizadas e entregues' },
  };

  const meta = PAGE_META[page] || { title:page };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return role==='mech'
          ? <MechDashboard osList={osList} onUpdate={handleUpdateOS} onViewOS={handleViewOS}/>
          : <AdminDashboard osList={osList} onNav={handleNav}/>;

      case 'os':
        return <ListaOS osList={osList} onView={handleViewOS} onNew={handleNovaOS}/>;

      case 'nova-os':
        return <NovaOS clientes={clientes} onSave={handleSaveNovaOS} onCancel={()=>setPage('os')}/>;

      case 'os-detalhe':
        return selectedOS
          ? <DetalheOS os={osList.find(o=>o.id===selectedOS.id)||selectedOS} onBack={()=>setPage(role==='mech'?'dashboard':'os')} onUpdate={handleUpdateOS} onHistorico={handleHistorico}/>
          : null;

      case 'historico-veiculo':
        return <HistoricoVeiculo placa={histPlaca} onBack={()=>setPage('os-detalhe')}/>;

      case 'clientes':
        return <ListaClientes clientes={clientes} osList={osList} onView={handleViewCliente} onNew={()=>setPage('cliente-form')}/>;

      case 'cliente-form':
        return <NovoCliente onSave={handleSaveCliente} onCancel={()=>setPage('clientes')}/>;

      case 'cliente-perfil':
        return selectedCliente
          ? <PerfilCliente
              cliente={clientes.find(c=>c.id===selectedCliente.id)||selectedCliente}
              osHistorico={osList.filter(o=>o.clienteId===selectedCliente.id)}
              onBack={()=>setPage('clientes')}
              onNovoVeiculo={handleNovoVeiculo}
              onVerOS={(id)=>{ const os=osList.find(o=>o.id===id); if(os){ setSelectedOS(os); setPage('os-detalhe'); }}}/>
          : <ListaClientes clientes={clientes} osList={osList} onView={handleViewCliente} onNew={()=>setPage('cliente-form')}/>;

      case 'cadastro-veiculo':
        return selectedCliente
          ? <CadastroVeiculo cliente={clientes.find(c=>c.id===selectedCliente.id)||selectedCliente} onSave={handleSaveVeiculo} onCancel={()=>setPage('cliente-perfil')}/>
          : null;

      case 'veiculos':
        return <ListaVeiculos clientes={clientes} onViewCliente={handleViewCliente}/>;

      case 'historico':
        return <ListaOS
          osList={osList.filter(o=>(o.status==='Finalizada'||o.status==='Entregue')&&(role!=='mech'||o.mecanico==='Carlos Andrade'))}
          onView={handleViewOS} onNew={handleNovaOS}/>;

      case 'catalogo':
        return <Catalogo showToast={showToast}/>;

      case 'usuarios':
        return <GestaoUsuarios showToast={showToast}/>;

      case 'config':
        return <Configuracoes showToast={showToast}/>;

      default:
        return (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:C.fgSubtle }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ marginBottom:12 }}><IcCog size={36} color={C.fgSubtle}/></div>
              <div style={{ fontSize:17, fontWeight:600, color:C.p800, marginBottom:4 }}>Tela em desenvolvimento</div>
              <div style={{ fontSize:13 }}>Disponível na próxima versão do protótipo.</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:C.bg }}>
      <Sidebar role={role} activePage={page} onNav={handleNav} onLogout={handleLogout} osCount={activeOSCount}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Only show TopBar for pages that don't manage their own header */}
        {!['nova-os','os-detalhe','historico-veiculo','cliente-perfil','cadastro-veiculo'].includes(page) && (
          <TopBar title={meta.title} subtitle={meta.subtitle} back={meta.back} onBack={meta.onBack} actions={meta.actions||[]}/>
        )}
        {/* Pages with built-in TopBar */}
        {page==='nova-os' && (
          <div style={{ display:'flex', flex:1, flexDirection:'column', overflow:'hidden' }}>
            <TopBar title="Nova Ordem de Serviço" back="Ordens de Serviço" onBack={()=>setPage('os')}/>
            <NovaOS clientes={clientes} onSave={handleSaveNovaOS} onCancel={()=>setPage('os')}/>
          </div>
        )}
        {page==='os-detalhe' && selectedOS && (
          <div style={{ display:'flex', flex:1, flexDirection:'column', overflow:'hidden' }}>
            <TopBar title={`OS ${selectedOS.id}`} subtitle={`${selectedOS.veiculo} · ${selectedOS.placa} · ${selectedOS.cliente}`}
              back={role==='mech'?'Minha Área':'Ordens de Serviço'} onBack={()=>setPage(role==='mech'?'dashboard':'os')}
              actions={[
                <Btn key="hist" variant="secondary" size="sm" onClick={()=>handleHistorico(selectedOS.placa)} icon={<IcCalendar size={14}/>}>Histórico veículo</Btn>,
              ]}/>
            <DetalheOS os={osList.find(o=>o.id===selectedOS.id)||selectedOS} onBack={()=>setPage(role==='mech'?'dashboard':'os')} onUpdate={handleUpdateOS} onHistorico={handleHistorico}/>
          </div>
        )}
        {page==='historico-veiculo' && (
          <div style={{ display:'flex', flex:1, flexDirection:'column', overflow:'hidden' }}>
            <TopBar title={`Histórico — ${histPlaca}`} back="Detalhe da OS" onBack={()=>setPage('os-detalhe')}/>
            <HistoricoVeiculo placa={histPlaca} onBack={()=>setPage('os-detalhe')}/>
          </div>
        )}
        {page==='cliente-perfil' && selectedCliente && (
          <div style={{ display:'flex', flex:1, flexDirection:'column', overflow:'hidden' }}>
            <TopBar title={(clientes.find(c=>c.id===selectedCliente.id)||selectedCliente).nome} back="Clientes" onBack={()=>setPage('clientes')}
              actions={[
                <Btn key="vei" variant="accent" size="sm" icon={<IcPlus size={13}/>} onClick={()=>handleNovoVeiculo(clientes.find(c=>c.id===selectedCliente.id)||selectedCliente)}>Novo veículo</Btn>,
              ]}/>
            <PerfilCliente
              cliente={clientes.find(c=>c.id===selectedCliente.id)||selectedCliente}
              osHistorico={osList.filter(o=>o.clienteId===selectedCliente.id)}
              onBack={()=>setPage('clientes')}
              onNovoVeiculo={handleNovoVeiculo}
              onVerOS={(id)=>{ const os=osList.find(o=>o.id===id); if(os){ setSelectedOS(os); setPage('os-detalhe'); }}}/>
          </div>
        )}
        {page==='cadastro-veiculo' && selectedCliente && (
          <div style={{ display:'flex', flex:1, flexDirection:'column', overflow:'hidden' }}>
            <TopBar title="Cadastrar Veículo" back={`Perfil — ${selectedCliente.nome}`} onBack={()=>setPage('cliente-perfil')}
              actions={[<Btn key="cancel" variant="ghost" size="sm" onClick={()=>setPage('cliente-perfil')}>Cancelar</Btn>]}/>
            <CadastroVeiculo cliente={clientes.find(c=>c.id===selectedCliente.id)||selectedCliente} onSave={handleSaveVeiculo} onCancel={()=>setPage('cliente-perfil')}/>
          </div>
        )}
        {!['nova-os','os-detalhe','historico-veiculo','cliente-perfil','cadastro-veiculo'].includes(page) && renderPage()}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
