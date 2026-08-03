// ─────────────────────────────────────────────────────────────────
// screens-mech.jsx — Dashboard do Mecânico
// ─────────────────────────────────────────────────────────────────

const MechDashboard = ({ osList, onUpdate, onViewOS }) => {
  const mechOS  = osList.filter(o => o.mecanico==='Carlos Andrade');
  const active  = mechOS.filter(o => o.status!=='Finalizada' && o.status!=='Entregue');
  const done    = mechOS.filter(o => o.status==='Finalizada'  || o.status==='Entregue');
  const [updating, setUpdating] = useState(null);
  const [toast,    setToast]    = useState(null);
  const [obs,      setObs]      = useState('');

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(null), 3000); };

  const handleSave = (novoStatus) => {
    onUpdate(updating.id, novoStatus, obs.trim() || `Status atualizado para "${novoStatus}".`);
    showToast(`${updating.id} → "${novoStatus}"`);
    setUpdating(null); setObs('');
  };

  const OSCard = ({ os }) => {
    const cfg = STATUS_CFG[os.status];
    const totalMO = os.maoDeObra.reduce((s,x)=>s+x.total,0);
    const totalPe = os.pecas.reduce((s,x)=>s+x.total,0);
    return (
      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden',
        border:os.prioridade==='Alta'?`1.5px solid ${C.error.dot}`:`1.5px solid transparent` }}>
        <div style={{ height:4, background:cfg?.color.dot||C.border }}/>
        <div style={{ padding:'16px 18px' }}>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <span style={{ fontSize:18, fontWeight:800, color:C.p800 }}>{os.id}</span>
              {os.prioridade==='Alta' && <span style={{ marginLeft:8, fontSize:10, fontWeight:700, background:C.error.bg, color:C.error.text, borderRadius:4, padding:'2px 7px' }}>PRIORIDADE ALTA</span>}
            </div>
            <StatusBadge status={os.status}/>
          </div>
          {/* Vehicle */}
          <div style={{ background:C.p50, borderRadius:8, padding:'10px 14px', marginBottom:12 }}>
            <div style={{ fontSize:15, fontWeight:700, color:C.p800, marginBottom:2 }}>{os.veiculo}</div>
            <div style={{ display:'flex', gap:16, fontSize:12, color:C.fgSubtle }}>
              <span style={{ fontFamily:'monospace', fontWeight:600, letterSpacing:'0.04em' }}>{os.placa}</span>
              <span>Cliente: <strong style={{color:C.fg}}>{os.cliente}</strong></span>
            </div>
          </div>
          {/* Service */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:3 }}>Serviço</div>
            <div style={{ fontSize:13, color:C.fg, lineHeight:1.45 }}>{os.problema?.slice(0,100)}{os.problema?.length>100?'…':''}</div>
          </div>
          <div style={{ display:'flex', gap:16, fontSize:12, color:C.fgSubtle, marginBottom:14 }}>
            <span>Entrada: <strong style={{color:C.fg}}>{os.entrada}</strong></span>
            {totalMO+totalPe > 0 && <span>Orçamento: <strong style={{color:C.p800}}>{fmt(totalMO+totalPe)}</strong></span>}
          </div>
          {/* Actions */}
          <div style={{ display:'flex', gap:8 }}>
            {STATUS_CFG[os.status]?.next && (
              <Btn variant="accent" size="md" style={{flex:1}} onClick={()=>{ setUpdating(os); setObs(''); }}>
                Atualizar status
              </Btn>
            )}
            <Btn variant="secondary" size="md" onClick={()=>onViewOS&&onViewOS(os)}>Ver detalhes</Btn>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:20 }}>

      {/* Summary strip */}
      <div style={{ display:'flex', gap:12 }}>
        {[['OS ativas',active.length,C.amber],['Em alta prioridade',active.filter(o=>o.prioridade==='Alta').length,C.error.dot],['Concluídas hoje',done.length,C.success.dot]].map(([l,v,col])=>(
          <div key={l} style={{ background:'#fff', borderRadius:12, padding:'16px 20px', flex:1,
            boxShadow:'0 2px 8px rgba(0,0,0,0.07)', borderTop:`3px solid ${col}` }}>
            <div style={{ fontSize:10, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>{l}</div>
            <div style={{ fontSize:28, fontWeight:800, color:C.p800 }}>{v}</div>
          </div>
        ))}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', borderRadius:12, padding:'16px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', border:`1.5px solid ${C.success.border}` }}>
          <span style={{ width:10, height:10, borderRadius:'50%', background:C.success.dot, animation:'pulse 2s infinite' }}/>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:C.fgMuted }}>Turno ativo</div>
            <div style={{ fontSize:13, fontWeight:700, color:C.success.text }}>24/04/2026</div>
          </div>
        </div>
      </div>

      {/* Active OS */}
      {active.length > 0 ? (
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>OS ativas ({active.length})</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
            {active.map((os,i) => <OSCard key={i} os={os}/>)}
          </div>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
          <EmptyState icon={<IcWrench size={34}/>} title="Nenhuma OS ativa no momento" desc="Assim que uma OS for atribuída a você, ela aparecerá aqui."/>
        </div>
      )}

      {/* Done OS */}
      {done.length > 0 && (
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Concluídas ({done.length})</div>
          <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <tbody>
                {done.map((os,i)=>(
                  <tr key={i} style={{ borderBottom:i<done.length-1?`1px solid ${C.borderLight}`:'none' }}>
                    <td style={{ padding:'12px 16px', fontWeight:700, color:C.p800, fontSize:14 }}>{os.id}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{os.veiculo}</div>
                      <div style={{ fontSize:11, color:C.fgSubtle }}>{os.placa}</div>
                    </td>
                    <td style={{ padding:'12px 16px' }}><StatusBadge status={os.status}/></td>
                    <td style={{ padding:'12px 16px', fontWeight:700, fontSize:13, color:C.p800 }}>{fmt(os.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status modal */}
      {updating && (
        <Modal title="Atualizar status da OS" subtitle={`${updating.id} — ${updating.veiculo}`} onClose={()=>setUpdating(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
            {Object.keys(STATUS_CFG).filter(s=>s!=='Entregue'&&s!=='Cancelada').map(s=>{
              const c = STATUS_CFG[s];
              const active = updating.status===s;
              return (
                <button key={s} onClick={()=>setUpdating(u=>({...u,_next:s}))}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
                    borderRadius:8, border:`1.5px solid ${updating._next===s||(!updating._next&&active)?c.color.dot:C.border}`,
                    background:updating._next===s||(!updating._next&&active)?c.color.bg:'#fff', cursor:'pointer', textAlign:'left', transition:'all 140ms' }}>
                  <span style={{ width:10, height:10, borderRadius:'50%', background:c.color.dot, flexShrink:0 }}/>
                  <span style={{ fontSize:14, fontWeight:updating._next===s||active?700:500, color:updating._next===s||active?c.color.text:C.fg }}>{s}</span>
                  {active && <span style={{ marginLeft:'auto', fontSize:11, color:C.fgSubtle }}>atual</span>}
                </button>
              );
            })}
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:C.fg, display:'block', marginBottom:6 }}>Observação (opcional)</label>
            <textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Descreva o que foi feito..."
              style={{ width:'100%', height:80, padding:'10px 14px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, fontFamily:'Inter', resize:'none', outline:'none' }}
              onFocus={e=>e.target.style.borderColor=C.amber} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="ghost" full onClick={()=>setUpdating(null)}>Cancelar</Btn>
            <Btn variant="accent" full disabled={!updating._next||updating._next===updating.status}
              onClick={()=>handleSave(updating._next)}>Salvar</Btn>
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast}/>}
    </div>
  );
};

Object.assign(window, { MechDashboard });
