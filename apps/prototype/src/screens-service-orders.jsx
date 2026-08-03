// ─────────────────────────────────────────────────────────────────
// screens-os.jsx — Nova OS (4 steps), Detalhe OS, Histórico Veículo
// ─────────────────────────────────────────────────────────────────

// ── Item de orçamento editável ───────────────────────────────────
const ItemRow = ({ item, onChange, onRemove, tipo }) => {
  const handleChange = (k, v) => {
    const u = { ...item, [k]:v };
    if (k==='qty'||k==='unit') u.total = (parseFloat(u.qty)||0)*(parseFloat(u.unit)||0);
    onChange(u);
  };
  const bg = tipo==='mo' ? C.p50 : C.amber100;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 60px 100px 100px 36px', gap:8,
      alignItems:'center', padding:'10px 14px', background:bg, borderRadius:8, marginBottom:6 }}>
      <input value={item.desc} onChange={e=>handleChange('desc',e.target.value)}
        placeholder={tipo==='mo'?'Descrição do serviço...':'Peça / material...'}
        style={{ height:40, padding:'0 12px', border:`1.5px solid ${C.border}`, borderRadius:6,
          fontSize:14, fontFamily:'Inter', outline:'none', background:'#fff' }}
        onFocus={e=>e.target.style.borderColor=C.amber} onBlur={e=>e.target.style.borderColor=C.border}/>
      <input type="number" value={item.qty} onChange={e=>handleChange('qty',e.target.value)} min="1"
        style={{ height:40, padding:'0 8px', border:`1.5px solid ${C.border}`, borderRadius:6,
          fontSize:14, fontFamily:'Inter', textAlign:'center', outline:'none', background:'#fff' }}
        onFocus={e=>e.target.style.borderColor=C.amber} onBlur={e=>e.target.style.borderColor=C.border}/>
      <input type="number" value={item.unit} onChange={e=>handleChange('unit',e.target.value)} placeholder="0,00"
        style={{ height:40, padding:'0 8px', border:`1.5px solid ${C.border}`, borderRadius:6,
          fontSize:14, fontFamily:'Inter', textAlign:'right', outline:'none', background:'#fff' }}
        onFocus={e=>e.target.style.borderColor=C.amber} onBlur={e=>e.target.style.borderColor=C.border}/>
      <div style={{ fontSize:14, fontWeight:700, color:C.p800, textAlign:'right' }}>{fmt(item.total)}</div>
      <button onClick={onRemove}
        style={{ width:36, height:36, borderRadius:6, border:`1px solid ${C.error.border}`,
          background:C.error.bg, color:C.error.dot, cursor:'pointer', fontSize:16,
          display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
    </div>
  );
};

// ── Nova OS — 4 etapas ───────────────────────────────────────────
const NovaOS = ({ clientes, onSave, onCancel }) => {
  const [step, setStep]         = useState(1);
  const [cliente, setCliente]   = useState(null);
  const [veiculo, setVeiculo]   = useState(null);
  const [mecanico, setMecanico] = useState(MECANICOS[0]);
  const [prioridade, setPrioridade] = useState('Média');
  const [problema, setProblema] = useState('');
  const [maoDeObra, setMaoDeObra] = useState([{id:uid(),desc:'',qty:1,unit:'',total:0}]);
  const [pecas, setPecas]       = useState([{id:uid(),desc:'',qty:1,unit:'',total:0}]);
  const [aprovacao, setAprovacao] = useState('pendente');
  const [saving, setSaving]     = useState(false);
  const [cliSearch, setCliSearch] = useState('');
  const [showDrop, setShowDrop] = useState(false);

  const totalMO = maoDeObra.reduce((s,x)=>s+(x.total||0),0);
  const totalPe = pecas.reduce((s,x)=>s+(x.total||0),0);
  const total   = totalMO + totalPe;

  const canNext = [
    ()=>cliente && veiculo && mecanico,
    ()=>problema.trim().length >= 10,
    ()=>maoDeObra.some(x=>x.desc&&x.total>0) || pecas.some(x=>x.desc&&x.total>0),
    ()=>true,
  ];

  const STEPS = ['Cliente & Veículo','Problema relatado','Orçamento','Aprovação'];

  const filteredCli = clientes.filter(c=>!cliSearch||c.nome.toLowerCase().includes(cliSearch.toLowerCase())||c.doc.includes(cliSearch));

  const handleSave = () => {
    setSaving(true);
    setTimeout(()=>{
      const nova = {
        id:`#${String(Math.floor(Math.random()*500+422)).padStart(4,'0')}`,
        clienteId:cliente.id, cliente:cliente.nome, placa:veiculo.placa,
        veiculo:`${veiculo.marca} ${veiculo.modelo} ${veiculo.ano}`, km:veiculo.km,
        mecanico, prioridade, problema,
        aprovacao:{ status:aprovacao, data:aprovacao!=='pendente'?nowStr():null },
        maoDeObra:maoDeObra.filter(x=>x.desc&&x.total>0),
        pecas:pecas.filter(x=>x.desc&&x.total>0),
        valor:total,
        historico:[{status:'Aguardando Diagnóstico',data:nowStr(),user:'Roberto G.',obs:'OS aberta pelo administrador.'}],
        status:'Aguardando Diagnóstico', dataAbertura:nowStr(), entrada:new Date().toLocaleDateString('pt-BR').slice(0,5),
      };
      setSaving(false); onSave(nova);
    }, 800);
  };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24 }}>

      {/* Step bar */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:24, background:'#fff',
        borderRadius:12, padding:'16px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
        {STEPS.map((s,i)=>(
          <React.Fragment key={s}>
            <button onClick={()=>step>i+1&&setStep(i+1)}
              style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none',
                cursor:step>i+1?'pointer':'default', padding:'4px 0' }}>
              <div style={{ width:28, height:28, borderRadius:'50%',
                background:step===i+1?C.p800:step>i+1?C.success.dot:C.border,
                color:'#fff', fontSize:13, fontWeight:700, display:'flex', alignItems:'center',
                justifyContent:'center', flexShrink:0, transition:'all 200ms' }}>
                {step>i+1?<IcCheck size={13} color="#fff"/>:i+1}
              </div>
              <span style={{ fontSize:13, fontWeight:step===i+1?700:500,
                color:step===i+1?C.p800:step>i+1?C.success.text:C.fgSubtle, transition:'color 200ms' }}>{s}</span>
            </button>
            {i<STEPS.length-1 && <div style={{ flex:1, height:2,
              background:step>i+1?C.success.dot:C.borderLight, margin:'0 12px', transition:'background 300ms' }}/>}
          </React.Fragment>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:8, paddingLeft:16 }}>
          <Btn variant="ghost" size="sm" onClick={onCancel}>Cancelar</Btn>
          {step < 4
            ? <Btn variant="accent" size="sm" disabled={!canNext[step-1]()} onClick={()=>setStep(s=>s+1)}>Próximo →</Btn>
            : <Btn variant="accent" size="sm" disabled={saving} onClick={handleSave}>{saving?'Criando...':'Criar OS'}</Btn>
          }
        </div>
      </div>

      <div style={{ maxWidth:760, margin:'0 auto' }}>

        {/* Step 1 */}
        {step===1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeIn 0.2s ease' }}>
            <div style={{ background:'#fff', borderRadius:12, padding:22, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Cliente</div>
              <div style={{ position:'relative', marginBottom:14 }}>
                <input value={cliSearch} onChange={e=>{setCliSearch(e.target.value);setShowDrop(true);setCliente(null);setVeiculo(null);}}
                  onFocus={()=>setShowDrop(true)}
                  placeholder="Buscar cliente por nome ou CPF/CNPJ..."
                  style={{ width:'100%', height:52, padding:'0 46px 0 14px', border:`2px solid ${cliente?C.success.dot:C.border}`,
                    borderRadius:8, fontSize:15, fontFamily:'Inter', outline:'none' }}/>
                {cliente && <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)' }}><IcCheck size={18} color={C.success.dot}/></span>}
                {showDrop && !cliente && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff',
                    border:`1px solid ${C.border}`, borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
                    zIndex:100, maxHeight:200, overflowY:'auto', marginTop:4 }}>
                    {filteredCli.map(c=>(
                      <div key={c.id} onClick={()=>{setCliente(c);setCliSearch(c.nome);setVeiculo(null);setShowDrop(false);}}
                        style={{ padding:'12px 16px', cursor:'pointer', borderBottom:`1px solid ${C.borderLight}` }}
                        onMouseEnter={e=>e.currentTarget.style.background=C.p50}
                        onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                        <div style={{ fontWeight:600, fontSize:14 }}>{c.nome}</div>
                        <div style={{ fontSize:12, color:C.fgSubtle, fontFamily:'monospace' }}>{c.doc}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cliente && (
                <div style={{ animation:'fadeIn 0.2s ease' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Veículo vinculado</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {cliente.veiculos.map(v=>(
                      <button key={v.id} onClick={()=>setVeiculo(v)}
                        style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                          borderRadius:10, border:`2px solid ${veiculo?.id===v.id?C.p800:C.border}`,
                          background:veiculo?.id===v.id?C.p50:'#fff', cursor:'pointer', textAlign:'left', transition:'all 140ms' }}>
                        <IcCar size={22} color={C.p800}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:14, color:C.p800 }}>{v.marca} {v.modelo} {v.ano} · <span style={{fontFamily:'monospace',letterSpacing:'0.05em'}}>{v.placa}</span></div>
                          <div style={{ fontSize:12, color:C.fgSubtle, marginTop:1 }}>KM: {v.km.toLocaleString('pt-BR')} · {v.cor}</div>
                        </div>
                        {veiculo?.id===v.id && <IcCheck size={18} color={C.success.dot}/>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ background:'#fff', borderRadius:12, padding:22, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Atribuição & Prioridade</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <SelectField label="Mecânico responsável" required value={mecanico} onChange={e=>setMecanico(e.target.value)}
                  options={MECANICOS.map(m=>({value:m,label:m}))}/>
                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:C.fg, display:'block', marginBottom:6 }}>Prioridade <span style={{color:C.error.dot}}>*</span></label>
                  <div style={{ display:'flex', gap:8 }}>
                    {[['Alta',C.error],['Média',C.warning],['Baixa',{bg:C.bg,text:C.fgSubtle,dot:C.border}]].map(([p,col])=>(
                      <button key={p} onClick={()=>setPrioridade(p)}
                        style={{ flex:1, height:48, borderRadius:8, border:`2px solid ${prioridade===p?col.dot:C.border}`,
                          background:prioridade===p?col.bg:'#fff', cursor:'pointer', fontSize:13,
                          fontWeight:700, color:prioridade===p?col.text:C.fgSubtle, transition:'all 140ms' }}>
                        {p==='Alta'?'▲ ':p==='Média'?'● ':'▼ '}{p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step===2 && (
          <div style={{ background:'#fff', borderRadius:12, padding:22, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', animation:'fadeIn 0.2s ease' }}>
            {cliente && veiculo && (
              <div style={{ background:C.p50, border:`1px solid ${C.p100}`, borderRadius:8, padding:'10px 14px', marginBottom:16, display:'flex', gap:16, fontSize:13, flexWrap:'wrap' }}>
                <span><strong style={{color:C.p800}}>Cliente:</strong> {cliente.nome}</span>
                <span style={{color:C.border}}>|</span>
                <span><strong style={{color:C.p800}}>Veículo:</strong> {veiculo.marca} {veiculo.modelo} {veiculo.ano}</span>
                <span style={{color:C.border}}>|</span>
                <span style={{ fontFamily:'monospace', fontWeight:600, color:C.p800 }}>{veiculo.placa}</span>
              </div>
            )}
            <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Problema relatado pelo cliente</div>
            <textarea value={problema} onChange={e=>setProblema(e.target.value)}
              placeholder="Descreva o problema ou sintoma relatado. Ex: barulho ao frear, pedal mole, luz acesa... (mínimo 10 caracteres)"
              style={{ width:'100%', minHeight:180, padding:'14px 16px', border:`1.5px solid ${C.border}`,
                borderRadius:8, fontSize:15, fontFamily:'Inter', resize:'vertical', outline:'none', lineHeight:1.6 }}
              onFocus={e=>{e.target.style.borderColor=C.amber;e.target.style.boxShadow='0 0 0 3px rgba(240,165,0,0.15)';}}
              onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}
            />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:12, color:C.fgSubtle }}>
              <span>{problema.length} caracteres</span>
              {problema.length<10 && <span style={{color:C.error.text}}>Mínimo 10 caracteres</span>}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step===3 && (
          <div style={{ display:'flex', flexDirection:'column', gap:14, animation:'fadeIn 0.2s ease' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 60px 100px 100px 36px', gap:8, padding:'0 14px' }}>
              {['Descrição','Qtd','Unit.','Total',''].map((h,i)=>(
                <div key={i} style={{ fontSize:10, fontWeight:700, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em' }}>{h}</div>
              ))}
            </div>
            {/* Mão de Obra */}
            <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:5, height:26, background:C.p800, borderRadius:2 }}/>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.p800 }}>Mão de Obra</div>
                    <div style={{ fontSize:11, color:C.fgSubtle }}>Serviços executados pela equipe</div>
                  </div>
                </div>
                <span style={{ fontSize:17, fontWeight:800, color:C.p800 }}>{fmt(totalMO)}</span>
              </div>
              {maoDeObra.map(item=>(
                <ItemRow key={item.id} item={item} tipo="mo"
                  onChange={u=>setMaoDeObra(l=>l.map(x=>x.id===item.id?{...x,...u}:x))}
                  onRemove={()=>setMaoDeObra(l=>l.filter(x=>x.id!==item.id))}/>
              ))}
              <button onClick={()=>setMaoDeObra(l=>[...l,{id:uid(),desc:'',qty:1,unit:'',total:0}])}
                style={{ display:'flex', alignItems:'center', gap:6, height:36, padding:'0 14px',
                  border:`1.5px dashed ${C.p300}`, borderRadius:8, background:C.p50,
                  color:C.p600, fontSize:13, fontWeight:600, cursor:'pointer', marginTop:6 }}>
                <IcPlus size={13}/> Adicionar serviço
              </button>
            </div>
            {/* Peças */}
            <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:5, height:26, background:C.amber700, borderRadius:2 }}/>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.p800 }}>Peças Aplicadas</div>
                    <div style={{ fontSize:11, color:C.fgSubtle }}>Peças e materiais utilizados</div>
                  </div>
                </div>
                <span style={{ fontSize:17, fontWeight:800, color:C.amber700 }}>{fmt(totalPe)}</span>
              </div>
              {pecas.map(item=>(
                <ItemRow key={item.id} item={item} tipo="pe"
                  onChange={u=>setPecas(l=>l.map(x=>x.id===item.id?{...x,...u}:x))}
                  onRemove={()=>setPecas(l=>l.filter(x=>x.id!==item.id))}/>
              ))}
              <button onClick={()=>setPecas(l=>[...l,{id:uid(),desc:'',qty:1,unit:'',total:0}])}
                style={{ display:'flex', alignItems:'center', gap:6, height:36, padding:'0 14px',
                  border:`1.5px dashed ${C.amber200}`, borderRadius:8, background:C.amber100,
                  color:C.amber700, fontSize:13, fontWeight:600, cursor:'pointer', marginTop:6 }}>
                <IcPlus size={13}/> Adicionar peça
              </button>
            </div>
            {/* Total */}
            <div style={{ background:C.p800, borderRadius:12, padding:'18px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>Total do orçamento</div>
                <div style={{ display:'flex', gap:20, marginTop:6 }}>
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>MO: <strong style={{color:C.p100}}>{fmt(totalMO)}</strong></span>
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>Peças: <strong style={{color:C.amber200}}>{fmt(totalPe)}</strong></span>
                </div>
              </div>
              <div style={{ fontSize:30, fontWeight:800, color:C.amber }}>{fmt(total)}</div>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step===4 && (
          <div style={{ display:'flex', flexDirection:'column', gap:14, animation:'fadeIn 0.2s ease' }}>
            <div style={{ background:'#fff', borderRadius:12, padding:22, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Resumo</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                {[['Cliente',cliente?.nome],['Veículo',veiculo?`${veiculo.marca} ${veiculo.modelo} ${veiculo.ano}`:'-'],['Placa',veiculo?.placa],['Mecânico',mecanico],['Prioridade',prioridade],['Total',fmt(total)]].map(([k,v])=>(
                  <div key={k} style={{ background:k==='Total'?C.amber100:C.bg, border:k==='Total'?`1px solid ${C.amber200}`:'none', borderRadius:8, padding:'10px 14px' }}>
                    <div style={{ fontSize:10, fontWeight:600, color:k==='Total'?C.amber700:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{k}</div>
                    <div style={{ fontSize:14, fontWeight:k==='Total'?800:600, color:k==='Total'?C.amber700:C.fg }}>{v||'—'}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:'#fff', borderRadius:12, padding:22, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Aprovação do cliente</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[['pendente','Aguardando aprovação','Orçamento enviado ao cliente — aguarda resposta.',C.warning],['aprovado','Aprovado verbalmente','Cliente aprovou o orçamento presencialmente ou por telefone.',C.success],['portal','Aprovação pelo portal','Notificar via portal self-service do cliente.',C.info]].map(([val,label,desc,col])=>(
                  <button key={val} onClick={()=>setAprovacao(val)}
                    style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px',
                      borderRadius:10, border:`2px solid ${aprovacao===val?col.dot:C.border}`,
                      background:aprovacao===val?col.bg:'#fff', cursor:'pointer', textAlign:'left', transition:'all 150ms' }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${aprovacao===val?col.dot:C.border}`,
                      background:aprovacao===val?col.dot:'#fff', display:'flex', alignItems:'center',
                      justifyContent:'center', flexShrink:0, marginTop:2 }}>
                      {aprovacao===val && <IcCheck size={11} color="#fff"/>}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:aprovacao===val?col.text:C.fg }}>{label}</div>
                      <div style={{ fontSize:12, color:C.fgSubtle, marginTop:2 }}>{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Detalhe da OS ────────────────────────────────────────────────
const DetalheOS = ({ os, onBack, onUpdate, onHistorico }) => {
  const [confirmModal, setConfirmModal] = useState(false);
  const [obsAvanco, setObsAvanco]       = useState('');

  const cfg    = STATUS_CFG[os.status] || {};
  const totalMO = os.maoDeObra.reduce((s,x)=>s+x.total, 0);
  const totalPe = os.pecas.reduce((s,x)=>s+x.total, 0);
  const total   = totalMO + totalPe;
  const step    = cfg.step ?? -1;

  const handleAvancar = () => {
    const obs = obsAvanco.trim() || `Status atualizado para "${cfg.next}".`;
    onUpdate(os.id, cfg.next, obs);
    setConfirmModal(false); setObsAvanco('');
  };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:880, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>

        {/* Status progress */}
        <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <StatusBadge status={os.status} large/>
              {os.aprovacao?.status==='aprovado'
                ? <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:C.success.text, background:C.success.bg, borderRadius:9999, padding:'3px 10px' }}><IcCheck size={11}/> Orçamento aprovado</span>
                : <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:C.warning.text, background:C.warning.bg, borderRadius:9999, padding:'3px 10px' }}>Aguardando aprovação</span>
              }
            </div>
            <span style={{ fontSize:12, color:C.fgSubtle }}>Aberta em {os.dataAbertura}</span>
          </div>
          {/* Steps */}
          <div style={{ display:'flex', alignItems:'center', gap:0, overflowX:'auto', paddingBottom:4 }}>
            {STATUS_LIST.map((s,i)=>{
              const c = STATUS_CFG[s]; const done = c.step<step; const active = s===os.status;
              return (
                <React.Fragment key={s}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, minWidth:110 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%',
                      background:active?C.p800:done?C.success.dot:C.border,
                      color:active||done?'#fff':C.fgSubtle,
                      display:'flex', alignItems:'center', justifyContent:'center', transition:'all 200ms' }}>
                      {done ? <IcCheck size={14} color="#fff"/> : c.icon}
                    </div>
                    <span style={{ fontSize:10, fontWeight:active?700:500, color:active?C.p800:done?C.success.text:C.fgSubtle, textAlign:'center', lineHeight:1.3 }}>{s}</span>
                  </div>
                  {i<STATUS_LIST.length-1 && <div style={{ flex:1, height:3, background:done?C.success.dot:C.borderLight, margin:'0 4px', marginBottom:22, minWidth:20, transition:'background 300ms' }}/>}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {[
            { title:'Veículo & Cliente', rows:[['Cliente',os.cliente],['Veículo',os.veiculo],['Placa',os.placa,true],['KM entrada',(os.km||0).toLocaleString('pt-BR')+' km']] },
            { title:'Atribuição', rows:[['Mecânico',os.mecanico],['Prioridade',os.prioridade],['Data abertura',os.dataAbertura],['Aprovação',os.aprovacao?.status==='aprovado'?`Aprovado em ${os.aprovacao.data}`:'Pendente']] },
          ].map(({title,rows})=>(
            <div key={title} style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>{title}</div>
              {rows.map(([k,v,mono])=>(
                <div key={k} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, color:C.fgSubtle, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>{k}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:C.fg, fontFamily:mono?'monospace':undefined }}>{v||'—'}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Problema */}
        <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Problema relatado</div>
          <div style={{ fontSize:15, lineHeight:1.65, color:C.fg, background:C.bg, borderRadius:8, padding:'14px 16px', borderLeft:`4px solid ${C.p300}` }}>{os.problema}</div>
        </div>

        {/* Itens */}
        <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
          {/* MO */}
          <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.borderLight}`, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:5, height:22, background:C.p800, borderRadius:2 }}/>
            <span style={{ fontSize:14, fontWeight:700, color:C.p800, flex:1 }}>Mão de Obra</span>
            <span style={{ fontSize:15, fontWeight:800, color:C.p800 }}>{fmt(totalMO)}</span>
          </div>
          {os.maoDeObra.length===0
            ? <div style={{ padding:'14px 20px', fontSize:13, color:C.fgSubtle, fontStyle:'italic' }}>Nenhum serviço registrado.</div>
            : <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{background:C.p50}}>
                  {['Descrição','Qtd','Unit.','Total'].map((h,i)=>(
                    <th key={i} style={{ padding:'8px 16px', fontSize:10, fontWeight:700, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', textAlign:i===0?'left':'right' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{os.maoDeObra.map((item,i)=>(
                  <tr key={i} style={{ borderTop:`1px solid ${C.borderLight}` }}>
                    <td style={{ padding:'12px 16px', fontSize:14 }}>{item.desc}</td>
                    <td style={{ padding:'12px 16px', fontSize:14, textAlign:'right', color:C.fgMuted }}>{item.qty}</td>
                    <td style={{ padding:'12px 16px', fontSize:14, textAlign:'right', color:C.fgMuted }}>{fmt(item.unit)}</td>
                    <td style={{ padding:'12px 16px', fontSize:14, fontWeight:700, color:C.p800, textAlign:'right' }}>{fmt(item.total)}</td>
                  </tr>
                ))}</tbody>
              </table>
          }
          {/* Peças */}
          <div style={{ padding:'14px 20px', borderTop:`2px solid ${C.borderLight}`, borderBottom:`1px solid ${C.borderLight}`, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:5, height:22, background:C.amber700, borderRadius:2 }}/>
            <span style={{ fontSize:14, fontWeight:700, color:C.p800, flex:1 }}>Peças Aplicadas</span>
            <span style={{ fontSize:15, fontWeight:800, color:C.amber700 }}>{fmt(totalPe)}</span>
          </div>
          {os.pecas.length===0
            ? <div style={{ padding:'14px 20px', fontSize:13, color:C.fgSubtle, fontStyle:'italic' }}>Nenhuma peça registrada.</div>
            : <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{background:C.amber100}}>
                  {['Peça / Material','Qtd','Unit.','Total'].map((h,i)=>(
                    <th key={i} style={{ padding:'8px 16px', fontSize:10, fontWeight:700, color:C.amber700, textTransform:'uppercase', letterSpacing:'0.07em', textAlign:i===0?'left':'right' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{os.pecas.map((item,i)=>(
                  <tr key={i} style={{ borderTop:`1px solid ${C.borderLight}` }}>
                    <td style={{ padding:'12px 16px', fontSize:14 }}>{item.desc}</td>
                    <td style={{ padding:'12px 16px', fontSize:14, textAlign:'right', color:C.fgMuted }}>{item.qty}</td>
                    <td style={{ padding:'12px 16px', fontSize:14, textAlign:'right', color:C.fgMuted }}>{fmt(item.unit)}</td>
                    <td style={{ padding:'12px 16px', fontSize:14, fontWeight:700, color:C.amber700, textAlign:'right' }}>{fmt(item.total)}</td>
                  </tr>
                ))}</tbody>
              </table>
          }
          {/* Total */}
          <div style={{ background:C.p800, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', gap:28 }}>
              <div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>Mão de obra</div><div style={{ fontSize:15, fontWeight:700, color:C.p100 }}>{fmt(totalMO)}</div></div>
              <div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>Peças</div><div style={{ fontSize:15, fontWeight:700, color:C.amber200 }}>{fmt(totalPe)}</div></div>
            </div>
            <div><div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', textAlign:'right' }}>Total</div><div style={{ fontSize:26, fontWeight:800, color:C.amber }}>{fmt(total)}</div></div>
          </div>
        </div>

        {/* Histórico de status */}
        <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:16 }}>Histórico de atualizações</div>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:15, top:0, bottom:0, width:2, background:C.borderLight }}/>
            {[...os.historico].reverse().map((h,i)=>{
              const c = STATUS_CFG[h.status]?.color || C.info;
              return (
                <div key={i} style={{ display:'flex', gap:14, marginBottom:i<os.historico.length-1?20:0, position:'relative' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:c.bg, border:`2px solid ${c.dot}`,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, zIndex:1, fontSize:14 }}>
                    <StatusIcon status={h.status} size={14}/>
                  </div>
                  <div style={{ flex:1, paddingTop:4 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                      <StatusBadge status={h.status}/>
                      <span style={{ fontSize:12, color:C.fgSubtle }}>{h.data} · {h.user}</span>
                    </div>
                    <div style={{ fontSize:13, color:C.fgMuted, lineHeight:1.5, background:C.bg, borderRadius:6, padding:'8px 12px' }}>{h.obs}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Avançar modal */}
      {confirmModal && (
        <Modal title={`Avançar para "${cfg.next}"`} onClose={()=>setConfirmModal(false)}>
          <div style={{ marginBottom:14, fontSize:14, color:C.fg, lineHeight:1.6 }}>
            Confirma o avanço da OS <strong>{os.id}</strong> para <StatusBadge status={cfg.next}/>?
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:13, fontWeight:600, color:C.fg, display:'block', marginBottom:6 }}>Observação (opcional)</label>
            <textarea value={obsAvanco} onChange={e=>setObsAvanco(e.target.value)}
              placeholder="Descreva o que foi feito ou motivo do avanço..."
              style={{ width:'100%', height:80, padding:'10px 14px', border:`1.5px solid ${C.border}`,
                borderRadius:8, fontSize:14, fontFamily:'Inter', resize:'none', outline:'none' }}
              onFocus={e=>e.target.style.borderColor=C.amber} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="ghost" full onClick={()=>setConfirmModal(false)}>Cancelar</Btn>
            <Btn variant="accent" full onClick={handleAvancar}>Confirmar avanço</Btn>
          </div>
        </Modal>
      )}

      {/* Floating action bar */}
      <div style={{ position:'sticky', bottom:0, background:'#fff', borderTop:`1px solid ${C.borderLight}`,
        padding:'12px 24px', display:'flex', justifyContent:'flex-end', gap:10 }}>
        <Btn variant="secondary" size="sm" onClick={()=>onHistorico(os.placa)} icon={<IcCalendar size={14}/>}>Histórico do veículo</Btn>
        {cfg.next && <Btn variant="accent" size="md" onClick={()=>setConfirmModal(true)}>Avançar → {cfg.next}</Btn>}
      </div>
    </div>
  );
};

// ── Histórico do Veículo ─────────────────────────────────────────
const HistoricoVeiculo = ({ placa, onBack }) => {
  const hist = HIST_VEICULO[placa] || [];
  const [expanded, setExpanded] = useState(null);

  const statusCol = {
    'Entregue':C.teal,'Finalizada':C.success,'Em Execução':C.warning,
    'Aguardando Diagnóstico':C.info,'Aguardando Peças':C.purple,'Cancelada':C.error,
  };
  const totalGasto = hist.filter(h=>h.status==='Entregue'||h.status==='Finalizada').reduce((s,h)=>s+h.valor,0);

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:760, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>
        {/* Summary */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {[['Total de OS',hist.length,C.p800],['Concluídas',hist.filter(h=>h.status==='Entregue').length,C.teal.text],['Total investido',fmt(totalGasto),C.amber700]].map(([l,v,col])=>(
            <div key={l} style={{ background:'#fff', borderRadius:10, padding:'14px 18px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', flex:1, minWidth:150 }}>
              <div style={{ fontSize:10, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>{l}</div>
              <div style={{ fontSize:24, fontWeight:800, color:col }}>{v}</div>
            </div>
          ))}
        </div>

        {hist.length===0 ? (
          <div style={{ background:'#fff', borderRadius:12, padding:48, textAlign:'center', color:C.fgSubtle, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ marginBottom:12 }}><IcClipboard size={36} color={C.fgSubtle}/></div>
            <div style={{ fontSize:16, fontWeight:600, color:C.p800, marginBottom:4 }}>Sem histórico</div>
            <div style={{ fontSize:13 }}>Este veículo não possui atendimentos anteriores.</div>
          </div>
        ) : (
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:21, top:20, bottom:20, width:2, background:C.borderLight, zIndex:0 }}/>
            {hist.map((h,i)=>{
              const col = statusCol[h.status] || C.info;
              const isExp = expanded===i;
              return (
                <div key={i} style={{ display:'flex', gap:14, marginBottom:12, position:'relative', zIndex:1 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:col.bg, border:`3px solid ${col.dot}`,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18 }}>
                    <StatusIcon status={h.status} size={18}/>
                  </div>
                  <div style={{ flex:1, background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)',
                    overflow:'hidden', border:`1px solid ${isExp?col.dot:C.borderLight}`, transition:'border 200ms' }}>
                    <button style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'14px 18px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
                      onClick={()=>setExpanded(isExp?null:i)}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                          <span style={{ fontWeight:800, fontSize:14, color:C.p800, fontFamily:'monospace' }}>{h.osId}</span>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:col.text, background:col.bg, borderRadius:9999, padding:'2px 8px' }}>
                            <span style={{width:5,height:5,borderRadius:'50%',background:col.dot}}/>{h.status}
                          </span>
                          <span style={{ fontSize:12, color:C.fgSubtle }}>{h.data}</span>
                        </div>
                        <div style={{ fontSize:14, fontWeight:500, color:C.fg, marginBottom:2 }}>{h.servico}</div>
                        <div style={{ fontSize:12, color:C.fgSubtle }}>Responsável: {h.mecanico}</div>
                      </div>
                      <div style={{ textAlign:'right', marginLeft:16, flexShrink:0 }}>
                        <div style={{ fontSize:16, fontWeight:800, color:h.valor?C.p800:C.fgSubtle }}>{h.valor?fmt(h.valor):'—'}</div>
                        <div style={{ fontSize:11, color:C.fgSubtle, marginTop:4 }}>{isExp?'▲ fechar':'▼ detalhes'}</div>
                      </div>
                    </button>
                    {isExp && (
                      <div style={{ padding:'0 18px 16px', borderTop:`1px solid ${C.borderLight}`, animation:'fadeIn 0.15s ease' }}>
                        <div style={{ fontSize:11, fontWeight:700, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', margin:'12px 0 6px' }}>Diagnóstico registrado</div>
                        <div style={{ fontSize:14, color:C.fg, lineHeight:1.65, background:C.bg, borderRadius:8, padding:'12px 14px', borderLeft:`4px solid ${col.dot}` }}>{h.diag}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { NovaOS, DetalheOS, HistoricoVeiculo });
