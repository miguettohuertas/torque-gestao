// ─────────────────────────────────────────────────────────────────
// screens-clientes.jsx — Lista de Clientes, Perfil, Cadastro Veículo
// ─────────────────────────────────────────────────────────────────

const fmtDoc = (v, tipo) => {
  const d = v.replace(/\D/g,'');
  if (tipo==='PF') return d.length<=3?d:d.length<=6?`${d.slice(0,3)}.${d.slice(3)}`:d.length<=9?`${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`:d.length<=11?`${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`:d.slice(0,14);
  return d.length<=2?d:d.length<=5?`${d.slice(0,2)}.${d.slice(2)}`:d.length<=8?`${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`:d.length<=12?`${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`:d.length<=14?`${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`:d.slice(0,18);
};
const fmtTel = v => { const d=v.replace(/\D/g,''); return d.length<=2?`(${d}`:d.length<=6?`(${d.slice(0,2)}) ${d.slice(2)}`:d.length<=10?`(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`:`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`; };
const validatePlaca = v => /^[A-Z]{3}-\d{4}$/.test(v.toUpperCase())||/^[A-Z]{3}\d[A-Z]\d{2}$/.test(v.toUpperCase().replace(/[^A-Z0-9]/g,''));
const detectFormato = v => { const p=v.toUpperCase().replace(/[^A-Z0-9]/g,''); return /^[A-Z]{3}\d[A-Z]\d{2}$/.test(p)?'Mercosul':/^[A-Z]{3}\d{4}$/.test(p)?'Padrão antigo':''; };

// ── Lista de Clientes ────────────────────────────────────────────
const ListaClientes = ({ clientes, osList=[], onView, onNew }) => {
  const [search, setSearch]       = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos');

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase();
    const mQ = !q || c.nome.toLowerCase().includes(q) || c.doc.replace(/\D/g,'').includes(q.replace(/\D/g,'')) || c.email.toLowerCase().includes(q);
    const mT = tipoFiltro==='todos' || (tipoFiltro==='pf'&&c.tipo==='PF') || (tipoFiltro==='pj'&&c.tipo==='PJ');
    return mQ && mT;
  });

  // Detectar duplicatas por CPF/CNPJ
  const docCount = {};
  clientes.forEach(c=>{ const d=c.doc.replace(/\D/g,''); docCount[d]=(docCount[d]||0)+1; });
  const dupSet = new Set(clientes.filter(c=>docCount[c.doc.replace(/\D/g,'')]>1).map(c=>c.id));

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:16 }}>
      {/* Filters */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:240 }}>
          <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><IcSearch size={15} color={C.fgSubtle}/></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome, CPF, CNPJ ou e-mail..."
            style={{ width:'100%', height:48, paddingLeft:42, paddingRight:14, border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, fontFamily:'Inter', outline:'none', background:'#fff' }}
            onFocus={e=>{e.target.style.borderColor=C.amber;e.target.style.boxShadow='0 0 0 3px rgba(240,165,0,0.15)';}}
            onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {[['todos','Todos'],['pf','Pessoa Física'],['pj','Pessoa Jurídica']].map(([v,l])=>(
            <button key={v} onClick={()=>setTipoFiltro(v)}
              style={{ height:48, padding:'0 16px', borderRadius:8, border:`1.5px solid ${tipoFiltro===v?C.p800:C.border}`,
                background:tipoFiltro===v?C.p800:'#fff', color:tipoFiltro===v?'#fff':C.fgMuted,
                fontFamily:'Inter', fontSize:14, fontWeight:600, cursor:'pointer', transition:'all 140ms' }}>{l}</button>
          ))}
        </div>
        <Btn variant="accent" icon={<IcPlus size={15}/>} onClick={onNew}>Novo cliente</Btn>
      </div>

      {dupSet.size>0 && (
        <div style={{ background:C.warning.bg, border:`1px solid ${C.warning.border}`, borderRadius:8,
          padding:'10px 16px', display:'flex', alignItems:'center', gap:8, fontSize:13, color:C.warning.text, fontWeight:500 }}>
          <IcAlert size={15}/>
          <span><strong>{dupSet.size}</strong> cadastro(s) com possível duplicidade de documento.</span>
        </div>
      )}

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden', flex:1 }}>
        {filtered.length===0 ? (
          <EmptyState icon={<IcUsers size={34}/>} title="Nenhum cliente encontrado" desc="Tente ajustar o filtro ou cadastre um novo cliente." action={{label:'+ Novo cliente',variant:'accent'}} onAction={onNew}/>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['Cliente','Documento','Contato','Cidade','Veículos','OS','LGPD',''].map((h,i)=>(
                  <th key={i} style={{ textAlign:'left', fontSize:10, fontWeight:700, color:C.fgSubtle,
                    letterSpacing:'0.07em', textTransform:'uppercase', padding:'10px 16px',
                    borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c,i)=>{
                const isDup = dupSet.has(c.id);
                return (
                  <tr key={c.id} style={{ borderBottom:i<filtered.length-1?`1px solid ${C.borderLight}`:'none',
                    cursor:'pointer', transition:'background 120ms', background:isDup?'#fffbf0':undefined }}
                    onMouseEnter={e=>e.currentTarget.style.background=isDup?'#fef3c7':C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background=isDup?'#fffbf0':'transparent'}
                    onClick={()=>onView(c)}>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:38, height:38, borderRadius:'50%',
                          background:c.tipo==='PJ'?C.p100:C.amber100,
                          border:`2px solid ${c.tipo==='PJ'?C.p300:C.amber200}`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:12, fontWeight:700, color:c.tipo==='PJ'?C.p800:C.amber700, flexShrink:0 }}>
                          {c.tipo==='PJ'?'PJ':c.nome.split(' ').map(n=>n[0]).slice(0,2).join('')}
                        </div>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontWeight:600, fontSize:14 }}>{c.nome}</span>
                            {isDup && <span style={{ fontSize:10, fontWeight:700, background:C.warning.bg, color:C.warning.text, borderRadius:4, padding:'1px 6px', display:'inline-flex', alignItems:'center', gap:3 }}><IcAlert size={9}/> DUPLICADO</span>}
                          </div>
                          <div style={{ fontSize:11, color:C.fgSubtle, marginTop:1 }}>{c.tipo==='PJ'?'Pessoa Jurídica':'Pessoa Física'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px', fontFamily:'monospace', fontSize:13, letterSpacing:'0.02em' }}>{c.doc}</td>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ fontSize:13 }}>{c.tel}</div>
                      <div style={{ fontSize:12, color:C.fgSubtle }}>{c.email}</div>
                    </td>
                    <td style={{ padding:'13px 16px', fontSize:13 }}>{c.cidade} — {c.estado}</td>
                    <td style={{ padding:'13px 16px', fontSize:14, fontWeight:600, textAlign:'center' }}>{c.veiculos.length}</td>
                    <td style={{ padding:'13px 16px', fontSize:14, fontWeight:600, textAlign:'center', color:C.p800 }}>{osList.filter(o=>o.clienteId===c.id).length}</td>
                    <td style={{ padding:'13px 16px' }}>
                      {c.consentimento
                        ? <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:C.success.text, background:C.success.bg, borderRadius:9999, padding:'3px 10px' }}><span style={{width:5,height:5,borderRadius:'50%',background:C.success.dot}}/>Consentido</span>
                        : <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:C.warning.text, background:C.warning.bg, borderRadius:9999, padding:'3px 10px' }}><span style={{width:5,height:5,borderRadius:'50%',background:C.warning.dot}}/>Pendente</span>
                      }
                    </td>
                    <td style={{ padding:'13px 16px' }} onClick={e=>e.stopPropagation()}>
                      <Btn variant="ghost" size="sm" onClick={()=>onView(c)}>Ver perfil</Btn>
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

// ── Perfil do Cliente ────────────────────────────────────────────
const PerfilCliente = ({ cliente, osHistorico, onBack, onNovoVeiculo, onVerOS }) => {
  const totalGasto = osHistorico.filter(o=>o.status==='Entregue'||o.status==='Finalizada').reduce((s,o)=>s+(o.valor||0),0);
  const osAtiva    = osHistorico.find(o=>o.status==='Em Execução'||o.status==='Aguardando Peças'||o.status==='Aguardando Diagnóstico');

  const InfoRow = ({ label, value, mono }) => (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:10, color:C.fgSubtle, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:500, color:C.fg, fontFamily:mono?'monospace':undefined }}>{value||'—'}</div>
    </div>
  );

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:960, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>

        {/* Header */}
        <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
          <div style={{ background:C.p800, padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:C.amber,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, fontWeight:800, color:C.p800, flexShrink:0 }}>
              {cliente.tipo==='PJ'?'PJ':cliente.nome.split(' ').map(n=>n[0]).slice(0,2).join('')}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:20, fontWeight:800, color:'#fff' }}>{cliente.nome}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:2, fontFamily:'monospace' }}>{cliente.doc} · {cliente.tipo==='PJ'?'Pessoa Jurídica':'Pessoa Física'}</div>
            </div>
            {cliente.consentimento
              ? <span style={{ fontSize:12, fontWeight:600, background:'rgba(34,197,94,0.2)', color:'#86efac', borderRadius:9999, padding:'4px 12px', display:'inline-flex', alignItems:'center', gap:4 }}><IcCheck size={11}/> LGPD Consentido</span>
              : <span style={{ fontSize:12, fontWeight:600, background:'rgba(251,191,36,0.2)', color:'#fde68a', borderRadius:9999, padding:'4px 12px', display:'inline-flex', alignItems:'center', gap:4 }}><IcAlert size={11}/> Consentimento pendente</span>
            }
          </div>
          <div style={{ padding:'16px 24px', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:20, borderBottom:`1px solid ${C.borderLight}` }}>
            {[['Telefone',cliente.tel],['E-mail',cliente.email],['Cidade',`${cliente.cidade} — ${cliente.estado}`],['Cadastro',cliente.cadastro]].map(([l,v])=>(
              <div key={l}>
                <div style={{ fontSize:10, color:C.fgSubtle, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:14, fontWeight:500, color:C.fg }}>{v||'—'}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:'14px 24px', display:'flex', gap:0, flexWrap:'wrap' }}>
            {[['Veículos',cliente.veiculos.length,C.p800],['Total de OS',osHistorico.length,C.p800],['Total investido',fmt(totalGasto),C.amber700]].map(([l,v,col])=>(
              <div key={l} style={{ padding:'0 24px 0 0', marginRight:24, borderRight:`1px solid ${C.borderLight}` }}>
                <div style={{ fontSize:10, color:C.fgSubtle, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:22, fontWeight:800, color:col }}>{v}</div>
              </div>
            ))}
            {osAtiva && (
              <div style={{ marginLeft:'auto', background:C.warning.bg, border:`1px solid ${C.warning.border}`, borderRadius:8, padding:'10px 16px', display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={()=>onVerOS(osAtiva.id)}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:C.warning.dot, animation:'pulse 1.5s infinite' }}/>
                <span style={{ fontSize:13, fontWeight:600, color:C.warning.text }}>OS ativa: {osAtiva.id}</span>
              </div>
            )}
          </div>
        </div>

        {/* Veículos */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.06em' }}>Veículos vinculados ({cliente.veiculos.length})</div>
            <Btn variant="secondary" size="sm" icon={<IcPlus size={13}/>} onClick={()=>onNovoVeiculo(cliente)}>Cadastrar veículo</Btn>
          </div>
          {cliente.veiculos.length===0 ? (
            <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <EmptyState compact icon={<IcCar size={22}/>} title="Nenhum veículo cadastrado" desc="Cadastre o primeiro veículo deste cliente para iniciar OS." action={{label:'+ Cadastrar',variant:'accent'}} onAction={()=>onNovoVeiculo(cliente)}/>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
              {cliente.veiculos.map(v=>(
                <div key={v.id} style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
                  <div style={{ background:C.p800, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Placa</span>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:17, fontWeight:800, color:C.amber, fontFamily:'monospace', letterSpacing:'0.06em' }}>{v.placa}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:1 }}>{v.formato==='mercosul'?'Mercosul':'Padrão antigo'}</div>
                    </div>
                  </div>
                  <div style={{ padding:'14px 16px' }}>
                    <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>{v.marca} {v.modelo} {v.ano}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {[['Cor',v.cor],['KM atual',v.km.toLocaleString('pt-BR')]].map(([k,val])=>(
                        <div key={k}>
                          <div style={{ fontSize:10, color:C.fgSubtle, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{k}</div>
                          <div style={{ fontSize:13, fontWeight:600 }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico OS */}
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Histórico de Ordens de Serviço</div>
          {osHistorico.length===0 ? (
            <div style={{ background:'#fff', borderRadius:12, padding:24, textAlign:'center', color:C.fgSubtle, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', fontSize:14 }}>Nenhuma OS registrada para este cliente.</div>
          ) : (
            <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:C.bg }}>
                    {['Nº OS','Veículo','Serviço','Status','Data','Valor'].map((h,i)=>(
                      <th key={i} style={{ textAlign:'left', fontSize:10, fontWeight:700, color:C.fgSubtle, letterSpacing:'0.07em', textTransform:'uppercase', padding:'10px 16px', borderBottom:`1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {osHistorico.map((os,i)=>(
                    <tr key={i} style={{ borderBottom:i<osHistorico.length-1?`1px solid ${C.borderLight}`:'none', cursor:'pointer', transition:'background 120ms' }}
                      onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      onClick={()=>onVerOS(os.id)}>
                      <td style={{ padding:'12px 16px', fontWeight:700, color:C.p800, fontSize:14 }}>{os.id}</td>
                      <td style={{ padding:'12px 16px', fontSize:13 }}>{os.veiculo}</td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:C.fgMuted }}>{os.problema?.slice(0,50)}{os.problema?.length>50?'…':''}</td>
                      <td style={{ padding:'12px 16px' }}><StatusBadge status={os.status}/></td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:C.fgSubtle }}>{os.entrada}</td>
                      <td style={{ padding:'12px 16px', fontWeight:700, fontSize:13, color:os.valor>0?C.p800:C.fgSubtle }}>{os.valor>0?fmt(os.valor):'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Cadastro de Veículo ──────────────────────────────────────────
const MARCAS = ['Chevrolet','Citroën','Fiat','Ford','Honda','Hyundai','Jeep','Kia','Mercedes-Benz','Mitsubishi','Nissan','Peugeot','Renault','Subaru','Toyota','Volkswagen','Volvo','Outro'];
const CORES  = ['Branco','Preto','Prata','Cinza','Vermelho','Azul','Verde','Amarelo','Laranja','Vinho','Bege','Outro'];
const ANOS   = Array.from({length:40},(_,i)=>new Date().getFullYear()-i);

const CadastroVeiculo = ({ cliente, onSave, onCancel }) => {
  const [form, setForm]     = useState({ placa:'', marca:'', modelo:'', ano:new Date().getFullYear(), km:'', cor:'', obs:'' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:undefined})); };

  const handlePlaca = raw => {
    const up   = raw.toUpperCase().replace(/[^A-Z0-9-]/g,'');
    const clean= up.replace(/-/g,'');
    let fmt    = up;
    if (/^[A-Z]{3}\d{4}$/.test(clean)) fmt = `${clean.slice(0,3)}-${clean.slice(3)}`;
    set('placa', fmt.slice(0,8));
  };

  const validate = () => {
    const e = {};
    if (!form.placa || !validatePlaca(form.placa)) e.placa = 'Placa inválida — use AAA-9999 ou ABC1D23 (Mercosul)';
    if (!form.marca) e.marca = 'Selecione a marca';
    if (!form.modelo.trim()) e.modelo = 'Modelo é obrigatório';
    if (!form.km) e.km = 'Quilometragem é obrigatória';
    return e;
  };

  const handleSave = () => {
    const e = validate(); if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setTimeout(()=>{
      setSaving(false);
      onSave({ ...form, id:`v${uid()}`, formato:detectFormato(form.placa), km:parseInt(String(form.km).replace(/\D/g,'')) });
    }, 700);
  };

  const plaStatus = form.placa.length>0 ? (validatePlaca(form.placa)?'valid':form.placa.length>=7?'invalid':'typing') : 'empty';
  const formato   = detectFormato(form.placa);

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:680, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>

        {/* Cliente info */}
        <div style={{ background:C.p50, border:`1.5px solid ${C.p100}`, borderRadius:10, padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
          <IcCar size={20} color={C.p800}/>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.06em' }}>Vinculando ao cliente</div>
            <div style={{ fontSize:15, fontWeight:700, color:C.p800 }}>{cliente.nome} <span style={{ fontSize:13, fontWeight:400, color:C.fgSubtle, fontFamily:'monospace' }}>· {cliente.doc}</span></div>
          </div>
        </div>

        {/* Placa */}
        <div style={{ background:'#fff', borderRadius:12, padding:22, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:16 }}>Identificação</div>
          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:13, fontWeight:600, color:C.fg, display:'block', marginBottom:6 }}>Placa <span style={{color:C.error.dot}}>*</span></label>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ position:'relative', width:200 }}>
                <input value={form.placa} onChange={e=>handlePlaca(e.target.value)} placeholder="ABC-1234 ou ABC1D23" maxLength={8}
                  style={{ width:'100%', height:56, padding:'0 46px 0 16px', border:`2px solid ${plaStatus==='valid'?C.success.dot:plaStatus==='invalid'?C.error.dot:C.border}`,
                    borderRadius:8, fontSize:18, fontFamily:'monospace', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', outline:'none', color:C.fg, transition:'border-color 150ms' }}
                  onFocus={e=>{e.target.style.borderColor=C.amber;e.target.style.boxShadow='0 0 0 3px rgba(240,165,0,0.15)';}}
                  onBlur={e=>{e.target.style.borderColor=plaStatus==='valid'?C.success.dot:plaStatus==='invalid'?C.error.dot:C.border;e.target.style.boxShadow='none';}}/>
                {plaStatus==='valid'   && <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }}><IcCheck size={16} color={C.success.dot}/></span>}
                {plaStatus==='invalid' && <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }}><IcX size={16} color={C.error.dot}/></span>}
              </div>
              {formato && (
                <div style={{ background:formato==='Mercosul'?C.info.bg:C.p50, border:`1px solid ${formato==='Mercosul'?C.info.border:C.p100}`, borderRadius:8, padding:'8px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:600, color:formato==='Mercosul'?C.info.text:C.p500, textTransform:'uppercase', letterSpacing:'0.06em' }}>Formato</div>
                  <div style={{ fontSize:14, fontWeight:700, color:formato==='Mercosul'?C.info.text:C.p800 }}>{formato}</div>
                </div>
              )}
            </div>
            {errors.placa && <div style={{ fontSize:12, color:C.error.text, fontWeight:500, marginTop:6, display:'flex', alignItems:'center', gap:4 }}><IcAlert size={12}/> {errors.placa}</div>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <SelectField label="Marca" required value={form.marca} onChange={e=>set('marca',e.target.value)} error={errors.marca}
              options={[{value:'',label:'Selecione a marca'},...MARCAS.map(m=>({value:m,label:m}))]}/>
            <Field label="Modelo" required value={form.modelo} onChange={e=>set('modelo',e.target.value)} placeholder="Ex: Civic, Gol, Onix..." error={errors.modelo}/>
            <SelectField label="Ano" required value={form.ano} onChange={e=>set('ano',parseInt(e.target.value))}
              options={ANOS.map(a=>({value:a,label:a}))}/>
            <SelectField label="Cor" value={form.cor} onChange={e=>set('cor',e.target.value)}
              options={[{value:'',label:'Selecione'},...CORES.map(c=>({value:c,label:c}))]}/>
          </div>
        </div>

        {/* KM */}
        <div style={{ background:'#fff', borderRadius:12, padding:22, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Dados adicionais</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Field label="Quilometragem atual" required value={form.km?Number(form.km).toLocaleString('pt-BR'):''} inputMode="numeric"
              onChange={e=>set('km',parseInt(e.target.value.replace(/\D/g,''))||'')} placeholder="Ex: 87.500" error={errors.km}
              hint="KM no momento do cadastro"/>
            <Field label="Observações" value={form.obs} onChange={e=>set('obs',e.target.value)} placeholder="Informações adicionais..."/>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingBottom:8 }}>
          <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
          <Btn variant="accent" size="lg" disabled={saving} onClick={handleSave}>{saving?'Salvando...':'Cadastrar veículo'}</Btn>
        </div>
      </div>
    </div>
  );
};

// ── Lista de Veículos ────────────────────────────────────────────
const ListaVeiculos = ({ clientes, onViewCliente }) => {
  const [search, setSearch] = useState('');
  const all = clientes.flatMap(c => c.veiculos.map(v => ({ ...v, clienteNome:c.nome, _cliente:c })));
  const filtered = all.filter(v => {
    const q = search.toLowerCase();
    return !q || v.placa.toLowerCase().includes(q) || v.marca.toLowerCase().includes(q) || v.modelo.toLowerCase().includes(q) || v.clienteNome.toLowerCase().includes(q);
  });

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ position:'relative', maxWidth:420 }}>
        <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><IcSearch size={15} color={C.fgSubtle}/></span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por placa, modelo ou proprietário..."
          style={{ width:'100%', height:48, paddingLeft:42, paddingRight:14, border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, fontFamily:'Inter', outline:'none', background:'#fff' }}
          onFocus={e=>{e.target.style.borderColor=C.amber;e.target.style.boxShadow='0 0 0 3px rgba(240,165,0,0.15)';}}
          onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
      </div>
      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden', flex:1 }}>
        {filtered.length===0 ? (
          <EmptyState icon={<IcCar size={34}/>} title="Nenhum veículo encontrado" desc="Nenhum veículo corresponde à busca realizada."/>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:640 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['Placa','Veículo','Proprietário','KM','Formato',''].map((h,i)=>(
                  <th key={i} style={{ textAlign:'left', fontSize:10, fontWeight:700, color:C.fgSubtle, letterSpacing:'0.07em', textTransform:'uppercase', padding:'10px 16px', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v,i)=>(
                <tr key={v.id} style={{ borderBottom:i<filtered.length-1?`1px solid ${C.borderLight}`:'none', cursor:'pointer', transition:'background 120ms' }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  onClick={()=>onViewCliente(v._cliente)}>
                  <td style={{ padding:'13px 16px', fontFamily:'monospace', fontWeight:700, fontSize:15, color:C.amber700, letterSpacing:'0.06em' }}>{v.placa}</td>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{v.marca} {v.modelo}</div>
                    <div style={{ fontSize:12, color:C.fgSubtle, marginTop:1 }}>{v.ano} · {v.cor}</div>
                  </td>
                  <td style={{ padding:'13px 16px', fontSize:14 }}>{v.clienteNome}</td>
                  <td style={{ padding:'13px 16px', fontSize:14, color:C.fgMuted }}>{v.km.toLocaleString('pt-BR')} km</td>
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ display:'inline-flex', fontSize:11, fontWeight:600, borderRadius:6, padding:'3px 9px',
                      background:v.formato==='mercosul'?C.info.bg:C.p50, color:v.formato==='mercosul'?C.info.text:C.p600 }}>
                      {v.formato==='mercosul'?'Mercosul':'Padrão antigo'}
                    </span>
                  </td>
                  <td style={{ padding:'13px 16px' }} onClick={e=>e.stopPropagation()}>
                    <Btn variant="ghost" size="sm" onClick={()=>onViewCliente(v._cliente)}>Ver cliente</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ── Novo Cliente ─────────────────────────────────────────────────
const UFS_BR = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

const NovoCliente = ({ onSave, onCancel }) => {
  const [tipo, setTipo]   = useState('PF');
  const [form, setForm]   = useState({ nome:'', doc:'', email:'', tel:'', cidade:'Joinville', estado:'SC' });
  const [consentimento, setConsentimento] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:undefined})); };

  const handleDoc = raw => set('doc', fmtDoc(raw, tipo));
  const handleTel = raw => set('tel', fmtTel(raw));

  const validate = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório';
    const cleanDoc = form.doc.replace(/\D/g,'');
    if (tipo==='PF' && cleanDoc.length!==11) e.doc = 'CPF inválido — informe 11 dígitos';
    if (tipo==='PJ' && cleanDoc.length!==14) e.doc = 'CNPJ inválido — informe 14 dígitos';
    if (!form.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido';
    if (!consentimento) e.consentimento = 'Consentimento LGPD é obrigatório para prosseguir';
    return e;
  };

  const handleSave = () => {
    const e = validate(); if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setTimeout(()=>{
      setSaving(false);
      onSave({ tipo, nome:form.nome.trim(), doc:form.doc, email:form.email,
        tel:form.tel, cidade:form.cidade||'', estado:form.estado||'SC',
        cadastro:new Date().toLocaleDateString('pt-BR'), consentimento, veiculos:[] });
    }, 700);
  };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:680, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>

        {/* Tipo */}
        <div style={{ background:'#fff', borderRadius:12, padding:22, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Tipo de cadastro</div>
          <div style={{ display:'flex', gap:10 }}>
            {[['PF','Pessoa Física','CPF'],['PJ','Pessoa Jurídica','CNPJ']].map(([v,l,doc])=>(
              <button key={v} onClick={()=>{setTipo(v);set('doc','');}}
                style={{ flex:1, padding:'14px 16px', borderRadius:10, border:`2px solid ${tipo===v?C.p800:C.border}`,
                  background:tipo===v?C.p50:'#fff', cursor:'pointer', textAlign:'left', transition:'all 150ms' }}>
                <div style={{ fontSize:14, fontWeight:700, color:tipo===v?C.p800:C.fgMuted }}>{l}</div>
                <div style={{ fontSize:12, color:C.fgSubtle, marginTop:2 }}>Documento: {doc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dados */}
        <div style={{ background:'#fff', borderRadius:12, padding:22, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Dados {tipo==='PJ'?'da empresa':'pessoais'}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label={tipo==='PJ'?'Razão social':'Nome completo'} required value={form.nome} onChange={e=>set('nome',e.target.value)} error={errors.nome}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Field label={tipo==='PJ'?'CNPJ':'CPF'} required value={form.doc}
                onChange={e=>handleDoc(e.target.value)} error={errors.doc}
                placeholder={tipo==='PJ'?'00.000.000/0001-00':'000.000.000-00'}/>
              <Field label="Telefone" value={form.tel} onChange={e=>handleTel(e.target.value)} placeholder="(47) 99999-0000"/>
            </div>
            <Field label="E-mail" type="email" required value={form.email} onChange={e=>set('email',e.target.value)} error={errors.email}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 100px', gap:14 }}>
              <Field label="Cidade" value={form.cidade} onChange={e=>set('cidade',e.target.value)} placeholder="Ex: Joinville"/>
              <SelectField label="Estado" value={form.estado} onChange={e=>set('estado',e.target.value)} options={UFS_BR.map(u=>({value:u,label:u}))}/>
            </div>
          </div>
        </div>

        {/* LGPD */}
        <div style={{ background:'#fff', borderRadius:12, padding:22, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.p800, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Consentimento LGPD</div>
          <div style={{ background:consentimento?C.success.bg:C.bg, border:`1.5px solid ${errors.consentimento?C.error.dot:consentimento?C.success.border:C.borderLight}`, borderRadius:10, padding:'14px 18px', transition:'all 200ms' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <Toggle value={consentimento} onChange={v=>{setConsentimento(v);setErrors(e=>({...e,consentimento:undefined}));}}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.fg, marginBottom:4 }}>O titular autoriza o uso dos dados</div>
                <div style={{ fontSize:12, color:C.fgSubtle, lineHeight:1.6 }}>
                  Conforme a LGPD (Lei nº 13.709/2018), o cliente autoriza o armazenamento e uso dos seus dados pessoais exclusivamente para a prestação de serviços automotivos pela oficina.
                </div>
              </div>
            </div>
            {errors.consentimento && <div style={{ fontSize:12, color:C.error.text, fontWeight:500, marginTop:8, display:'flex', alignItems:'center', gap:4 }}><IcAlert size={12}/> {errors.consentimento}</div>}
          </div>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingBottom:8 }}>
          <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
          <Btn variant="accent" size="lg" disabled={saving} onClick={handleSave}>{saving?'Salvando...':'Cadastrar cliente'}</Btn>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ListaClientes, PerfilCliente, CadastroVeiculo, ListaVeiculos, NovoCliente });
