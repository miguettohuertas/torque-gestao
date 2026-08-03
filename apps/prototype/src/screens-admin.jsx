// ─────────────────────────────────────────────────────────────────
// screens-admin.jsx — Dashboard Admin + Lista OS
// ─────────────────────────────────────────────────────────────────

// ── Dashboard Admin ──────────────────────────────────────────────
const AdminDashboard = ({ osList, onNav }) => {
  const counts = {
    'Aguardando Diagnóstico': osList.filter(o=>o.status==='Aguardando Diagnóstico').length,
    'Em Execução':            osList.filter(o=>o.status==='Em Execução').length,
    'Aguardando Peças':       osList.filter(o=>o.status==='Aguardando Peças').length,
    'Finalizada':             osList.filter(o=>o.status==='Finalizada').length,
    'Entregue':               osList.filter(o=>o.status==='Entregue').length,
  };
  const receita = osList.filter(o=>o.status==='Entregue'||o.status==='Finalizada').reduce((s,o)=>s+o.valor,0);

  const STAT_CARDS = [
    { label:'Aguardando Diagnóstico', value:counts['Aguardando Diagnóstico'], color:C.info,    accent:C.info.dot },
    { label:'Em Execução',            value:counts['Em Execução'],            color:C.warning,  accent:C.amber },
    { label:'Aguardando Peças',       value:counts['Aguardando Peças'],       color:C.purple,   accent:C.purple.dot },
    { label:'Finalizadas',            value:counts['Finalizada'],             color:C.success,  accent:C.success.dot },
    { label:'Entregues (mês)',        value:counts['Entregue'],               color:C.teal,     accent:C.teal.dot },
    { label:'Receita (concl.)',       value:fmt(receita),                     color:C.info,     accent:C.amber, big:true },
  ];

  const QuickAction = ({ icon, label, id }) => (
    <button onClick={()=>onNav(id)}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:6, padding:'14px 12px', background:'#fff', borderRadius:10, border:`1.5px solid ${C.borderLight}`,
        cursor:'pointer', flex:1, minWidth:90, transition:'all 150ms' }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.amber;e.currentTarget.style.background=C.amber100;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.borderLight;e.currentTarget.style.background='#fff';}}>
      <span style={{fontSize:22}}>{icon}</span>
      <span style={{fontSize:11,fontWeight:600,color:C.p800,textAlign:'center',lineHeight:1.3}}>{label}</span>
    </button>
  );

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:20 }}>

      {/* Stat cards */}
      <div>
        <div style={{ fontSize:11, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Resumo operacional · hoje, 24 abr 2026</div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {STAT_CARDS.map((s,i)=>(
            <div key={i} style={{ background:'#fff', borderRadius:12, padding:'18px 20px', flex:1, minWidth:120,
              boxShadow:'0 2px 8px rgba(0,0,0,0.07)', borderTop:`3px solid ${s.accent}` }}>
              <div style={{ fontSize:10, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>{s.label}</div>
              <div style={{ fontSize:s.big?20:32, fontWeight:800, color:C.p800, lineHeight:1 }}>{s.value}</div>
              <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:s.color.dot }}/>
                <span style={{ fontSize:11, fontWeight:600, color:s.color.text }}>{s.color===C.teal||s.color===C.success?'concluídas':'ativas'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div style={{ fontSize:11, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Acesso rápido</div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <QuickAction icon={<IcClipboard size={22}/>} label="Nova OS"     id="nova-os"/>
          <QuickAction icon={<IcUsers size={22}/>}    label="Clientes"    id="clientes"/>
          <QuickAction icon={<IcCar size={22}/>}      label="Veículos"    id="veiculos"/>
          <QuickAction icon={<IcBox size={22}/>}      label="Catálogo"    id="catalogo"/>
          <QuickAction icon={<IcUser size={22}/>}     label="Usuários"    id="usuarios"/>
          <QuickAction icon={<IcCog size={22}/>}      label="Config."     id="config"/>
        </div>
      </div>

      {/* Recent OS */}
      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden', flex:1 }}>
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.borderLight}`,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <span style={{ fontSize:15, fontWeight:700, color:C.p800 }}>Últimas Ordens de Serviço</span>
            <span style={{ fontSize:12, color:C.fgSubtle, marginLeft:8 }}>· {osList.length} no sistema</span>
          </div>
          <Btn variant="ghost" size="sm" onClick={()=>onNav('os')}>Ver todas →</Btn>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['Nº OS','Veículo','Cliente','Mecânico','Status','Orçamento',''].map((h,i)=>(
                  <th key={i} style={{ textAlign:'left', fontSize:10, fontWeight:700, color:C.fgSubtle,
                    letterSpacing:'0.07em', textTransform:'uppercase', padding:'9px 16px',
                    borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {osList.slice(0,5).map((os,i)=>{
                const total = [...os.maoDeObra,...os.pecas].reduce((s,x)=>s+x.total,0);
                return (
                  <tr key={i} style={{ borderBottom:i<4?`1px solid ${C.borderLight}`:'none', cursor:'pointer', transition:'background 120ms' }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    onClick={()=>onNav('os:'+os.id)}>
                    <td style={{ padding:'12px 16px', fontWeight:700, color:C.p800, fontSize:14 }}>{os.id}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{os.veiculo}</div>
                      <div style={{ fontSize:11, color:C.fgSubtle, fontFamily:'monospace', letterSpacing:'0.04em' }}>{os.placa}</div>
                    </td>
                    <td style={{ padding:'12px 16px', fontSize:13 }}>{os.cliente}</td>
                    <td style={{ padding:'12px 16px', fontSize:13, color:C.fgMuted }}>{os.mecanico}</td>
                    <td style={{ padding:'12px 16px' }}><StatusBadge status={os.status}/></td>
                    <td style={{ padding:'12px 16px', fontWeight:700, fontSize:13, color:total>0?C.p800:C.fgSubtle }}>
                      {total>0?fmt(total):<span style={{fontStyle:'italic'}}>A definir</span>}
                    </td>
                    <td style={{ padding:'12px 16px' }} onClick={e=>e.stopPropagation()}>
                      <Btn variant="ghost" size="sm" onClick={()=>onNav('os:'+os.id)}>Abrir</Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Lista de OS ──────────────────────────────────────────────────
const ListaOS = ({ osList, onView, onNew }) => {
  const [search, setSearch]           = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [prioFiltro, setPrioFiltro]   = useState('todos');

  const filtered = osList.filter(os => {
    const q = search.toLowerCase();
    const mQ = !q || [os.id,os.cliente,os.placa,os.veiculo].some(v=>v.toLowerCase().includes(q));
    const mS = statusFiltro==='todos' || os.status===statusFiltro;
    const mP = prioFiltro==='todos'   || os.prioridade===prioFiltro;
    return mQ && mS && mP;
  });

  const counts = {};
  STATUS_LIST.forEach(s=>{ counts[s]=osList.filter(o=>o.status===s).length; });

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:16 }}>

      {/* Status pill filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['todos','Todas',osList.length,null],...STATUS_LIST.map(s=>[s,s,counts[s],STATUS_CFG[s].color])].map(([val,label,cnt,col])=>(
          <button key={val} onClick={()=>setStatusFiltro(val)}
            style={{ display:'flex', alignItems:'center', gap:6, height:36, padding:'0 14px',
              borderRadius:9999, border:`1.5px solid ${statusFiltro===val?(col?col.dot:C.p800):C.border}`,
              background:statusFiltro===val?(col?col.bg:C.p50):'#fff', cursor:'pointer',
              fontSize:13, fontWeight:600, color:statusFiltro===val?(col?col.text:C.p800):C.fgMuted, transition:'all 140ms' }}>
            {col && <span style={{width:7,height:7,borderRadius:'50%',background:col.dot,flexShrink:0}}/>}
            {label} <span style={{fontSize:11,fontWeight:700,opacity:0.7}}>({cnt})</span>
          </button>
        ))}
      </div>

      {/* Search + priority */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:240 }}>
          <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><IcSearch size={15} color={C.fgSubtle}/></span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar por Nº OS, cliente, placa ou veículo..."
            style={{ width:'100%', height:48, paddingLeft:42, paddingRight:14, border:`1.5px solid ${C.border}`,
              borderRadius:8, fontSize:14, fontFamily:'Inter', outline:'none', background:'#fff' }}
            onFocus={e=>{e.target.style.borderColor=C.amber;e.target.style.boxShadow='0 0 0 3px rgba(240,165,0,0.15)';}}
            onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}
          />
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {[['todos','Todas'],['Alta','▲ Alta'],['Média','● Média'],['Baixa','▼ Baixa']].map(([v,l])=>(
            <button key={v} onClick={()=>setPrioFiltro(v)}
              style={{ height:48, padding:'0 14px', borderRadius:8,
                border:`1.5px solid ${prioFiltro===v?C.p800:C.border}`,
                background:prioFiltro===v?C.p800:'#fff',
                color:prioFiltro===v?'#fff':C.fgMuted,
                fontFamily:'Inter', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 140ms' }}>{l}</button>
          ))}
        </div>
        <Btn variant="accent" icon={<IcPlus size={15}/>} onClick={onNew}>Nova OS</Btn>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden', flex:1 }}>
        {filtered.length===0 ? (
          <EmptyState icon={<IcClipboard size={34}/>} title="Nenhuma ordem de serviço encontrada"
            desc="Não há OS correspondentes aos filtros aplicados. Tente ampliar a busca ou abra uma nova ordem."
            action={{label:'+ Nova OS',variant:'accent'}} onAction={onNew}/>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['Nº OS','Veículo / Placa','Cliente','Mecânico','Status','Prioridade','Orçamento','Entrada',''].map((h,i)=>(
                  <th key={i} style={{ textAlign:'left', fontSize:10, fontWeight:700, color:C.fgSubtle,
                    letterSpacing:'0.07em', textTransform:'uppercase', padding:'10px 14px',
                    borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((os,i)=>{
                const total = [...os.maoDeObra,...os.pecas].reduce((s,x)=>s+x.total,0);
                return (
                  <tr key={os.id} style={{ borderBottom:i<filtered.length-1?`1px solid ${C.borderLight}`:'none',
                    cursor:'pointer', transition:'background 120ms' }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    onClick={()=>onView(os)}>
                    <td style={{ padding:'12px 14px', fontWeight:700, color:C.p800, fontSize:14 }}>{os.id}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ fontWeight:600, fontSize:13 }}>{os.veiculo}</div>
                      <div style={{ fontSize:11, color:C.fgSubtle, fontFamily:'monospace', letterSpacing:'0.04em' }}>{os.placa}</div>
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:13 }}>{os.cliente}</td>
                    <td style={{ padding:'12px 14px', fontSize:13, color:C.fgMuted }}>{os.mecanico}</td>
                    <td style={{ padding:'12px 14px' }}><StatusBadge status={os.status}/></td>
                    <td style={{ padding:'12px 14px' }}><PriBadge p={os.prioridade}/></td>
                    <td style={{ padding:'12px 14px', fontWeight:700, fontSize:13, color:total>0?C.p800:C.fgSubtle }}>
                      {total>0?fmt(total):'—'}
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:12, color:C.fgSubtle }}>{os.entrada}</td>
                    <td style={{ padding:'12px 14px' }} onClick={e=>e.stopPropagation()}>
                      <Btn variant="ghost" size="sm" onClick={()=>onView(os)}>Abrir</Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { AdminDashboard, ListaOS });
