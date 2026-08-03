// ─────────────────────────────────────────────────────────────────
// screens-portal.jsx — Portal do Cliente (3 telas)
// ─────────────────────────────────────────────────────────────────

const STATUS_CLIENT_CFG = {
  'Aguardando Diagnóstico': { label:'Aguardando diagnóstico',   desc:'Seu veículo está na oficina e será analisado em breve.', icon:<IcSearch size={18}/>, step:0 },
  'Em Execução':            { label:'Serviço em andamento',     desc:'Nossa equipe está trabalhando no seu veículo. Você será notificado a cada etapa.', icon:<IcWrench size={18}/>, step:1 },
  'Aguardando Peças':       { label:'Aguardando peça',          desc:'Identificamos a necessidade de uma peça que está sendo providenciada.', icon:<IcBox size={18}/>, step:2 },
  'Finalizada':             { label:'Serviço concluído',        desc:'O serviço foi concluído! Entre em contato para agendar a retirada do veículo.', icon:<IcCheckCircle size={18}/>, step:3 },
  'Entregue':               { label:'Veículo entregue',         desc:'Seu veículo foi entregue. Obrigado pela confiança!', icon:<IcFlag size={18}/>, step:4 },
};
const STATUS_CLIENT_LIST = ['Aguardando Diagnóstico','Em Execução','Aguardando Peças','Finalizada','Entregue'];

// ── Portal Header ────────────────────────────────────────────────
const PortalHeader = ({ page, onNav, onLogout }) => {
  const NAV = [
    { id:'painel',    label:'Meus Veículos', icon:<IcCar size={14}/> },
    { id:'os',        label:'Acompanhar OS', icon:<IcClipboard size={14}/> },
    { id:'historico', label:'Histórico',      icon:<IcClock size={14}/> },
  ];
  return (
    <header style={{ background:C.p800, flexShrink:0, boxShadow:'0 2px 12px rgba(0,0,0,0.15)' }}>
      <div style={{ maxWidth:940, margin:'0 auto', padding:'0 24px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:36, height:36, background:C.amber, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:C.p800, flexShrink:0 }}>T</div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'#fff', letterSpacing:'-0.02em', lineHeight:1 }}>Torque Gestão</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:500 }}>Portal do Cliente</div>
          </div>
        </div>
        <nav style={{ display:'flex', gap:4, flex:1, justifyContent:'center' }}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>onNav(n.id)}
              style={{ display:'flex', alignItems:'center', gap:6, height:40, padding:'0 16px', borderRadius:8,
                border:'none', cursor:'pointer', fontSize:13, fontWeight:page===n.id?700:500,
                background:page===n.id?'rgba(240,165,0,0.15)':'transparent',
                color:page===n.id?C.amber:'rgba(255,255,255,0.65)', transition:'all 150ms' }}
              onMouseEnter={e=>{if(page!==n.id)e.currentTarget.style.background='rgba(255,255,255,0.07)';}}
              onMouseLeave={e=>{if(page!==n.id)e.currentTarget.style.background='transparent';}}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{PORTAL_CLIENTE.nome.split(' ')[0]} {PORTAL_CLIENTE.nome.split(' ').slice(-1)[0]}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>Cliente</div>
          </div>
          <div style={{ width:36, height:36, background:'#22c55e', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
            {PORTAL_CLIENTE.initials}
          </div>
          <button onClick={onLogout} title="Sair"
            style={{ width:34, height:34, background:'rgba(255,255,255,0.07)', border:'none', borderRadius:8, cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}><IcLogOut size={14}/></button>
        </div>
      </div>
    </header>
  );
};

// ── TELA 1: Painel do Cliente ────────────────────────────────────
const PortalPainel = ({ onVerOS, onVerHistorico }) => {
  const veiculos = PORTAL_CLIENTE.veiculos;
  const osAtivas = veiculos.filter(v=>v.osAtiva).length;

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'32px 24px', background:'#f0f3f9' }}>
      <div style={{ maxWidth:940, margin:'0 auto', display:'flex', flexDirection:'column', gap:24 }}>

        {/* Welcome banner */}
        <div style={{ background:`linear-gradient(135deg,${C.p800} 0%,${C.p700} 100%)`, borderRadius:16, padding:'28px 32px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 4px 20px rgba(27,43,75,0.25)', flexWrap:'wrap', gap:16 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>Olá, {PORTAL_CLIENTE.nome.split(' ')[0]}! 👋</div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', lineHeight:1.5 }}>
              Você tem <strong style={{color:C.amber}}>{veiculos.length} veículo(s)</strong> cadastrado(s)
              {osAtivas>0 && <> e <strong style={{color:C.amber}}>{osAtivas} OS em andamento</strong></>}.
            </div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:10, padding:'12px 16px', textAlign:'right' }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Acesso seguro</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', animation:'pulse 2s infinite' }}/>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>Portal ativo</span>
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4 }}>{PORTAL_CLIENTE.email}</div>
          </div>
        </div>

        {/* Vehicle cards */}
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:14 }}>Meus veículos</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))', gap:16 }}>
            {veiculos.map(v=>{
              const os  = v.osAtiva;
              const cfg = os ? (STATUS_CFG[os.status]||{}) : null;
              return (
                <div key={v.id} style={{ background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.08)', overflow:'hidden', transition:'box-shadow 200ms' }}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow='0 6px 24px rgba(27,43,75,0.14)'}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.08)'}>
                  <div style={{ background:C.p800, padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.5)', marginBottom:4 }}>{v.marca} {v.modelo}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.01em' }}>{v.ano}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Placa</div>
                      <div style={{ fontSize:18, fontWeight:800, color:C.amber, fontFamily:'monospace', letterSpacing:'0.08em' }}>{v.placa}</div>
                    </div>
                  </div>
                  <div style={{ padding:'12px 20px', display:'flex', gap:20, borderBottom:`1px solid ${C.borderLight}` }}>
                    {[['Cor',v.cor],['KM',v.km.toLocaleString('pt-BR')+' km'],['Atendimentos',v.historico.length+(v.osAtiva?1:0)]].map(([k,val])=>(
                      <div key={k}>
                        <div style={{ fontSize:10, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{k}</div>
                        <div style={{ fontSize:14, fontWeight:600, color:C.fg }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding:'14px 20px' }}>
                    {os ? (
                      <div style={{ background:cfg?.color?.bg||C.info.bg, border:`1px solid ${(cfg?.color?.dot||C.info.dot)+'33'}`, borderRadius:10, padding:'12px 16px', marginBottom:12 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ display:'inline-flex', alignItems:'center' }}>{STATUS_CLIENT_CFG[os.status]?.icon||<IcWrench size={18}/>}</span>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:cfg?.color?.text||C.info.text }}>{STATUS_CLIENT_CFG[os.status]?.label||os.status}</div>
                            <div style={{ fontSize:11, color:C.fgSubtle, marginTop:1 }}>OS {os.id} · desde {os.dataAbertura}</div>
                          </div>
                          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5 }}>
                            <span style={{ width:7, height:7, borderRadius:'50%', background:cfg?.color?.dot||C.info.dot, animation:os.status==='Em Execução'?'pulse 1.5s infinite':undefined }}/>
                            <span style={{ fontSize:10, fontWeight:600, color:cfg?.color?.text||C.info.text }}>ao vivo</span>
                          </div>
                        </div>
                        <div style={{ fontSize:12, color:C.fgMuted, lineHeight:1.5 }}>{os.problema}</div>
                      </div>
                    ) : (
                      <div style={{ background:C.bg, borderRadius:10, padding:'10px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                        <IcCheck size={18} color={C.success.dot}/>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:C.fgMuted }}>Nenhuma OS em andamento</div>
                          <div style={{ fontSize:11, color:C.fgSubtle, marginTop:1 }}>Último: {v.historico[0]?.data||'—'}</div>
                        </div>
                      </div>
                    )}
                    <div style={{ display:'flex', gap:8 }}>
                      {os && <Btn variant="accent" size="sm" full onClick={()=>onVerOS(v)}>Acompanhar OS</Btn>}
                      <Btn variant="ghost" size="sm" full={!os} onClick={()=>onVerHistorico(v)}>Ver histórico</Btn>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background:'#fff', borderRadius:10, padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', flexWrap:'wrap', gap:10 }}>
          <div style={{ fontSize:12, color:C.fgSubtle, display:'flex', alignItems:'center', gap:6 }}>
            <IcLock size={14} color={C.fgSubtle}/>
            <span>Dados protegidos conforme a <strong style={{color:C.p800}}>LGPD</strong>. Apenas você acessa suas informações.</span>
          </div>
          <div style={{ fontSize:12, color:C.fgSubtle }}>Dúvidas? <strong style={{color:C.p500,cursor:'pointer'}}>{PORTAL_CLIENTE.tel}</strong></div>
        </div>
      </div>
    </div>
  );
};

// ── TELA 2: Acompanhamento de OS ─────────────────────────────────
const PortalAcompanhamento = ({ veiculo }) => {
  const [sel, setSel] = useState(veiculo || PORTAL_CLIENTE.veiculos.find(v=>v.osAtiva) || PORTAL_CLIENTE.veiculos[0]);
  const os  = sel.osAtiva;
  const cfg = os ? STATUS_CLIENT_CFG[os.status] : null;
  const scfg= os ? STATUS_CFG[os.status] : null;
  const totalMO = os ? os.maoDeObra.reduce((s,x)=>s+x.total,0) : 0;
  const totalPe = os ? os.pecas.reduce((s,x)=>s+x.total,0) : 0;

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'32px 24px', background:'#f0f3f9' }}>
      <div style={{ maxWidth:940, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>

        {/* Vehicle selector */}
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Selecionar veículo</div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {PORTAL_CLIENTE.veiculos.map(v=>(
              <button key={v.id} onClick={()=>setSel(v)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 18px', borderRadius:12,
                  border:`2px solid ${sel.id===v.id?C.p800:C.border}`, background:sel.id===v.id?C.p50:'#fff', cursor:'pointer', transition:'all 150ms' }}>
                <IcCar size={20} color={C.p800}/>
                <div style={{textAlign:'left'}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.p800}}>{v.marca} {v.modelo} {v.ano}</div>
                  <div style={{fontSize:12,fontFamily:'monospace',color:C.fgSubtle,letterSpacing:'0.06em'}}>{v.placa}</div>
                </div>
                {v.osAtiva && <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:C.warning.text, background:C.warning.bg, borderRadius:9999, padding:'2px 8px', marginLeft:4 }}>
                  <span style={{width:5,height:5,borderRadius:'50%',background:C.warning.dot,animation:'pulse 1.5s infinite'}}/>Ativa
                </span>}
              </button>
            ))}
          </div>
        </div>

        {!os ? (
          <div style={{ background:'#fff', borderRadius:16, padding:48, textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', animation:'fadeIn 0.2s ease' }}>
            <div style={{marginBottom:16}}><IcCheckCircle size={48} color={C.success.dot}/></div>
            <div style={{fontSize:20,fontWeight:700,color:C.p800,marginBottom:8}}>Nenhuma OS em andamento</div>
            <div style={{fontSize:14,color:C.fgSubtle,maxWidth:400,margin:'0 auto',lineHeight:1.6}}>
              O <strong>{sel.marca} {sel.modelo} {sel.ano}</strong> não possui ordens de serviço ativas no momento.
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeIn 0.2s ease' }}>

            {/* Status hero */}
            <div style={{ background:`linear-gradient(135deg,${C.p800} 0%,${C.p700} 100%)`, borderRadius:16, padding:'28px 32px', boxShadow:'0 4px 20px rgba(27,43,75,0.25)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>OS {os.id} · {sel.marca} {sel.modelo} {sel.ano}</div>
                  <div style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:6, display:'flex', alignItems:'center', gap:10 }}>
                    <StatusIcon status={os.status} size={24} color="#fff"/>{cfg?.label}
                  </div>
                  <div style={{ fontSize:14, color:'rgba(255,255,255,0.65)', maxWidth:480, lineHeight:1.6 }}>{cfg?.desc}</div>
                </div>
                <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:'14px 18px', textAlign:'center', flexShrink:0 }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Previsão</div>
                  <div style={{ fontSize:18, fontWeight:700, color:C.amber }}>{os.previsao}</div>
                </div>
              </div>

              {/* Progress */}
              <div style={{ background:'rgba(0,0,0,0.15)', borderRadius:12, padding:'14px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                  {STATUS_CLIENT_LIST.map((s,i)=>{
                    const c   = STATUS_CLIENT_CFG[s];
                    const step= scfg?.step ?? 0;
                    const done= c.step < step;
                    const act = s===os.status;
                    return (
                      <React.Fragment key={s}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, flex:1, minWidth:0 }}>
                          <div style={{ width:32, height:32, borderRadius:'50%',
                            border:`2px solid ${act?C.amber:done?'rgba(34,197,94,0.7)':'rgba(255,255,255,0.2)'}`,
                            background:act?'rgba(240,165,0,0.2)':done?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.05)',
                            color:act?C.amber:done?'rgba(34,197,94,0.9)':'rgba(255,255,255,0.35)',
                            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {done ? <IcCheck size={13} color="rgba(34,197,94,0.9)"/> : <span style={{opacity:act?1:0.5}}>{c.icon}</span>}
                          </div>
                          <span style={{ fontSize:9, fontWeight:act?700:400, color:act?C.amber:done?'rgba(34,197,94,0.8)':'rgba(255,255,255,0.35)', textAlign:'center', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:72 }}>{c.label.split(' ')[0]}</span>
                        </div>
                        {i<STATUS_CLIENT_LIST.length-1 && <div style={{ flex:1, height:2, background:done?'rgba(34,197,94,0.5)':'rgba(255,255,255,0.1)', margin:'0 3px', marginBottom:18, minWidth:8, transition:'background 400ms' }}/>}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Updates timeline */}
            <div style={{ background:'#fff', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.p800, marginBottom:16 }}>Atualizações da sua OS</div>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:16, top:0, bottom:0, width:2, background:C.borderLight }}/>
                {[...os.historico].reverse().map((h,i)=>{
                  const c  = STATUS_CFG[h.status];
                  const cc = STATUS_CLIENT_CFG[h.status];
                  return (
                    <div key={i} style={{ display:'flex', gap:14, marginBottom:i<os.historico.length-1?20:0, position:'relative' }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', background:c?.color.bg||C.info.bg, border:`2px solid ${c?.color.dot||C.info.dot}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, zIndex:1, fontSize:14 }}>
                        <StatusIcon status={h.status} size={14}/>
                      </div>
                      <div style={{ flex:1, paddingTop:5 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                          <span style={{ fontSize:13, fontWeight:700, color:c?.color.text||C.fg }}>{cc?.label||h.status}</span>
                          <span style={{ fontSize:11, color:C.fgSubtle }}>{h.data}</span>
                        </div>
                        <div style={{ fontSize:13, color:C.fgMuted, lineHeight:1.5, background:C.bg, borderRadius:8, padding:'8px 12px' }}>{h.msg}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Budget (client view) */}
            <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }}>
              <div style={{ padding:'16px 24px', borderBottom:`1px solid ${C.borderLight}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:C.p800 }}>Orçamento aprovado</div>
                  <div style={{ fontSize:12, color:C.fgSubtle, marginTop:1 }}>Serviços e peças autorizados por você</div>
                </div>
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:C.success.text, background:C.success.bg, borderRadius:9999, padding:'4px 12px' }}><IcCheck size={12}/> Aprovado</span>
              </div>
              <div style={{ padding:'12px 24px', borderBottom:`1px solid ${C.borderLight}`, display:'flex', alignItems:'center', gap:8 }}>
                <div style={{width:4,height:20,background:C.p800,borderRadius:2}}/>
                <span style={{fontSize:13,fontWeight:700,color:C.p800,flex:1}}>Serviços</span>
                <span style={{fontSize:15,fontWeight:800,color:C.p800}}>{fmt(totalMO)}</span>
              </div>
              {os.maoDeObra.map((item,i)=>(
                <div key={i} style={{ padding:'9px 24px 9px 36px', borderBottom:`1px solid ${C.borderLight}`, display:'flex', justifyContent:'space-between', fontSize:13 }}>
                  <span>{item.desc}</span><span style={{fontWeight:600,color:C.p800}}>{fmt(item.total)}</span>
                </div>
              ))}
              <div style={{ padding:'12px 24px', borderBottom:`1px solid ${C.borderLight}`, display:'flex', alignItems:'center', gap:8 }}>
                <div style={{width:4,height:20,background:C.amber700,borderRadius:2}}/>
                <span style={{fontSize:13,fontWeight:700,color:C.p800,flex:1}}>Peças e materiais</span>
                <span style={{fontSize:15,fontWeight:800,color:C.amber700}}>{fmt(totalPe)}</span>
              </div>
              {os.pecas.map((item,i)=>(
                <div key={i} style={{ padding:'9px 24px 9px 36px', borderBottom:`1px solid ${C.borderLight}`, display:'flex', justifyContent:'space-between', fontSize:13 }}>
                  <span>{item.desc} <span style={{color:C.fgSubtle}}>×{item.qty}</span></span><span style={{fontWeight:600,color:C.fg}}>{fmt(item.total)}</span>
                </div>
              ))}
              <div style={{ background:C.p800, padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', gap:20 }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>Serviços: <strong style={{color:C.p100}}>{fmt(totalMO)}</strong></span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>Peças: <strong style={{color:C.amber200}}>{fmt(totalPe)}</strong></span>
                </div>
                <div style={{ fontSize:26, fontWeight:800, color:C.amber }}>{fmt(totalMO+totalPe)}</div>
              </div>
            </div>

            <div style={{ background:'#fff', borderRadius:12, padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:13, color:C.fgMuted }}>Dúvidas sobre sua OS?</div>
              <div style={{ display:'flex', gap:8 }}>
                <Btn variant="ghost" size="sm" icon="📞">Ligar</Btn>
                <Btn variant="ghost" size="sm" icon="💬">WhatsApp</Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── TELA 3: Histórico do Veículo (visão cliente) ──────────────────
const PortalHistorico = ({ veiculo }) => {
  const [sel,      setSel]      = useState(veiculo || PORTAL_CLIENTE.veiculos[0]);
  const [expanded, setExpanded] = useState(null);

  const v = sel;
  const allOS = [
    ...(v.osAtiva ? [{ id:v.osAtiva.id, data:v.osAtiva.dataAbertura, servico:v.osAtiva.problema, status:v.osAtiva.status, valor:v.osAtiva.maoDeObra.reduce((s,x)=>s+x.total,0)+v.osAtiva.pecas.reduce((s,x)=>s+x.total,0), ativa:true, detOS:v.osAtiva }] : []),
    ...v.historico,
  ];

  const statusCol = { 'Entregue':C.teal, 'Finalizada':C.success, 'Em Execução':C.warning, 'Aguardando Diagnóstico':C.info, 'Aguardando Peças':C.purple };
  const clientLabel = { 'Entregue':'Concluído e entregue', 'Finalizada':'Serviço concluído', 'Em Execução':'Em andamento', 'Aguardando Diagnóstico':'Em diagnóstico', 'Aguardando Peças':'Aguardando peça' };
  const totalInvestido = v.historico.filter(h=>h.status==='Entregue'||h.status==='Finalizada').reduce((s,h)=>s+(h.valor||0),0);

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'32px 24px', background:'#f0f3f9' }}>
      <div style={{ maxWidth:940, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>

        {/* Selector */}
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Selecionar veículo</div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {PORTAL_CLIENTE.veiculos.map(v=>(
              <button key={v.id} onClick={()=>{setSel(v);setExpanded(null);}}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 18px', borderRadius:12, border:`2px solid ${sel.id===v.id?C.p800:C.border}`, background:sel.id===v.id?C.p50:'#fff', cursor:'pointer', transition:'all 150ms' }}>
                <IcCar size={20} color={C.p800}/>
                <div style={{textAlign:'left'}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.p800}}>{v.marca} {v.modelo} {v.ano}</div>
                  <div style={{fontSize:12,fontFamily:'monospace',color:C.fgSubtle,letterSpacing:'0.06em'}}>{v.placa}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12 }}>
          {[['Atendimentos',allOS.length,C.p800],['Concluídos',v.historico.filter(h=>h.status==='Entregue').length,C.teal.text],['Total investido',fmt(totalInvestido),C.amber700]].map(([l,val,col])=>(
            <div key={l} style={{ background:'#fff', borderRadius:12, padding:'14px 18px', boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:10, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>{l}</div>
              <div style={{ fontSize:22, fontWeight:800, color:col, lineHeight:1 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        {allOS.length===0 ? (
          <div style={{ background:'#fff', borderRadius:16, padding:48, textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }}>
            <div style={{marginBottom:12}}><IcClock size={40} color={C.fgSubtle}/></div>
            <div style={{fontSize:17,fontWeight:600,color:C.p800,marginBottom:6}}>Sem histórico</div>
            <div style={{fontSize:13,color:C.fgSubtle}}>Nenhum atendimento registrado para este veículo ainda.</div>
          </div>
        ) : (
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:21, top:20, bottom:20, width:2, background:C.borderLight, zIndex:0 }}/>
            {allOS.map((os,i)=>{
              const col    = statusCol[os.status] || C.info;
              const clabel = clientLabel[os.status] || os.status;
              const isExp  = expanded===i;
              return (
                <div key={i} style={{ display:'flex', gap:14, marginBottom:12, position:'relative', zIndex:1 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:col.bg, border:`3px solid ${col.dot}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18, boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
                    <StatusIcon status={os.status} size={18}/>
                  </div>
                  <div style={{ flex:1, background:'#fff', borderRadius:14, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden', border:`1px solid ${isExp?col.dot:C.borderLight}`, transition:'border 200ms' }}>
                    <button style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
                      onClick={()=>setExpanded(isExp?null:i)}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                          <span style={{ fontWeight:800, fontSize:14, color:C.p800, fontFamily:'monospace' }}>{os.id}</span>
                          {os.ativa && <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:col.text, background:col.bg, borderRadius:9999, padding:'2px 8px' }}><span style={{width:5,height:5,borderRadius:'50%',background:col.dot,animation:'pulse 1.5s infinite'}}/>ao vivo</span>}
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:col.text, background:col.bg, borderRadius:9999, padding:'2px 8px' }}>{clabel}</span>
                        </div>
                        <div style={{ fontSize:14, fontWeight:500, color:C.fg, marginBottom:3, lineHeight:1.4 }}>{os.servico?.slice(0,80)}{os.servico?.length>80?'…':''}</div>
                        <div style={{ fontSize:12, color:C.fgSubtle }}>{os.data}</div>
                      </div>
                      <div style={{ textAlign:'right', marginLeft:16, flexShrink:0 }}>
                        <div style={{ fontSize:17, fontWeight:800, color:os.valor>0?C.p800:C.fgSubtle }}>{os.valor>0?fmt(os.valor):'—'}</div>
                        <div style={{ fontSize:11, color:C.fgSubtle, marginTop:4 }}>{isExp?'▲ fechar':'▼ detalhes'}</div>
                      </div>
                    </button>
                    {isExp && (
                      <div style={{ padding:'0 20px 16px', borderTop:`1px solid ${C.borderLight}`, animation:'fadeIn 0.15s ease' }}>
                        {os.ativa && os.detOS ? (
                          <div style={{ marginTop:12 }}>
                            <div style={{ fontSize:12, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Serviços previstos</div>
                            {[...os.detOS.maoDeObra.map(s=>({...s,tipo:'mo'})),...os.detOS.pecas.map(p=>({...p,tipo:'pe'}))].map((item,j)=>(
                              <div key={j} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 10px', background:item.tipo==='mo'?C.p50:C.amber100, borderRadius:6, marginBottom:4 }}>
                                <span>{item.desc}</span><span style={{fontWeight:600,color:item.tipo==='mo'?C.p800:C.amber700}}>{fmt(item.total)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ marginTop:12 }}>
                            <div style={{ display:'flex', gap:20, flexWrap:'wrap', marginBottom:10 }}>
                              {[['Data',os.data],['Status',clabel],['Valor pago',fmt(os.valor)]].map(([k,val])=>(
                                <div key={k}>
                                  <div style={{ fontSize:10, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{k}</div>
                                  <div style={{ fontSize:14, fontWeight:600, color:C.fg }}>{val}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ padding:'10px 14px', background:C.success.bg, border:`1px solid ${C.success.border}`, borderRadius:8, fontSize:12, color:C.success.text, display:'flex', alignItems:'center', gap:6 }}>
                              <IcCheck size={12}/> Atendimento concluído. Dúvidas? Entre em contato com a oficina.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ background:'#fff', borderRadius:10, padding:'12px 18px', fontSize:12, color:C.fgSubtle, display:'flex', alignItems:'center', gap:8, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <IcLock size={14} color={C.fgSubtle}/>
          <span>Você visualiza apenas os dados dos seus próprios veículos, conforme a LGPD. Para portabilidade ou exclusão dos dados, entre em contato com a oficina.</span>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { PortalHeader, PortalPainel, PortalAcompanhamento, PortalHistorico });
