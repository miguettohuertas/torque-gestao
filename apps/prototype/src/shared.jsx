// ─────────────────────────────────────────────────────────────────
// shared.jsx — Tokens, componentes base e Sidebar unificados
// Exporta tudo via window para uso nos demais scripts
// ─────────────────────────────────────────────────────────────────
const { useState, useEffect, useRef, useCallback } = React;

// ── Tokens ──────────────────────────────────────────────────────
const C = {
  p900:'#111d33', p800:'#1B2B4B', p700:'#243760', p600:'#2e4578',
  p500:'#3d5a99', p400:'#5b7ab8', p300:'#8aa1cc', p200:'#bbc9e4',
  p100:'#dde4f1', p50:'#f0f3f9',
  amber:'#F0A500', amber700:'#c98300', amber200:'#fbe0a3', amber100:'#fdf0d1',
  bg:'#f5f5f2', surface:'#fff',
  border:'#d8d8d3', borderLight:'#ebebе7',
  fg:'#1c1c1a', fgMuted:'#5e5e59', fgSubtle:'#787872',
  success:{ bg:'#dcfce7', text:'#166534', dot:'#22c55e', border:'#bbf7d0' },
  warning:{ bg:'#fef3c7', text:'#92400e', dot:'#f59e0b', border:'#fde68a' },
  error:  { bg:'#fee2e2', text:'#991b1b', dot:'#ef4444', border:'#fecaca' },
  info:   { bg:'#dbeafe', text:'#1e40af', dot:'#3b82f6', border:'#bfdbfe' },
  purple: { bg:'#f3e8ff', text:'#6b21a8', dot:'#a855f7', border:'#e9d5ff' },
  teal:   { bg:'#f0fdfa', text:'#134e4a', dot:'#14b8a6', border:'#99f6e4' },
  orange: { bg:'#ffedd5', text:'#9a3412', dot:'#f97316', border:'#fed7aa' },
};

const STATUS_CFG = {
  'Aguardando Diagnóstico': { color:C.info,    icon:<IcSearch size={18}/>,      step:0, next:'Em Execução' },
  'Em Execução':            { color:C.warning,  icon:<IcWrench size={18}/>,      step:1, next:'Aguardando Peças' },
  'Aguardando Peças':       { color:C.purple,   icon:<IcBox size={18}/>,         step:2, next:'Finalizada' },
  'Finalizada':             { color:C.success,  icon:<IcCheckCircle size={18}/>, step:3, next:'Entregue' },
  'Entregue':               { color:C.teal,     icon:<IcFlag size={18}/>,        step:4, next:null },
  'Cancelada':              { color:C.error,    icon:<IcX size={18}/>,           step:-1, next:null },
};
const STATUS_LIST = ['Aguardando Diagnóstico','Em Execução','Aguardando Peças','Finalizada','Entregue'];

const PERFIL_CFG = {
  admin:  { label:'Administrador', bg:C.p800, fg:'#fff', desc:'Acesso completo' },
  mech:   { label:'Mecânico',      bg:C.p700, fg:C.amber, desc:'OS atribuídas' },
  client: { label:'Cliente',       bg:C.p50,  fg:C.p800, border:`1.5px solid ${C.p100}`, desc:'Portal próprio' },
};

const fmt = v => `R$ ${(parseFloat(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
const nowStr = () => { const n=new Date(); return `${String(n.getDate()).padStart(2,'0')}/${String(n.getMonth()+1).padStart(2,'0')}/${n.getFullYear()} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`; };
const uid = () => Math.random().toString(36).slice(2,8).toUpperCase();

// ── Botão ────────────────────────────────────────────────────────
const Btn = ({ children, variant='primary', size='md', onClick, disabled, full, icon, style:st={} }) => {
  const [h,sH] = useState(false);
  const sz = { sm:{height:36,px:14,fs:13}, md:{height:48,px:20,fs:15}, lg:{height:56,px:26,fs:16} }[size];
  const vs = {
    primary:   { bg:h?C.p700:C.p800,     fg:'#fff',  br:'none' },
    accent:    { bg:h?C.amber700:C.amber, fg:C.p800,  br:'none' },
    secondary: { bg:h?C.p100:C.p50,      fg:C.p800,  br:`1.5px solid ${C.p100}` },
    ghost:     { bg:h?C.bg:'transparent', fg:C.p800,  br:`1.5px solid ${C.border}` },
    danger:    { bg:h?'#dc2626':'#ef4444',fg:'#fff',  br:'none' },
    success:   { bg:h?'#15803d':C.success.dot, fg:'#fff', br:'none' },
  }[variant] || { bg:'#ebebе7', fg:'#9a9a94', br:'none' };
  if (disabled) { vs.bg='#ebebе7'; vs.fg='#9a9a94'; }
  return (
    <button onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)}
      onClick={!disabled?onClick:undefined}
      style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
        height:sz.height, padding:`0 ${sz.px}px`, fontSize:sz.fs, fontWeight:600,
        fontFamily:'Inter', border:vs.br||'none', borderRadius:8, cursor:disabled?'not-allowed':'pointer',
        background:vs.bg, color:vs.fg, transition:'background 140ms',
        width:full?'100%':undefined, whiteSpace:'nowrap', flexShrink:0, ...st }}>
      {icon && <span>{icon}</span>}{children}
    </button>
  );
};

// ── Badges ───────────────────────────────────────────────────────
const StatusBadge = ({ status, large }) => {
  const s = STATUS_CFG[status]; if(!s) return null;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5,
      fontSize:large?13:11, fontWeight:600, borderRadius:9999,
      padding:large?'5px 14px':'3px 10px',
      background:s.color.bg, color:s.color.text, whiteSpace:'nowrap' }}>
      <span style={{ width:large?8:6, height:large?8:6, borderRadius:'50%', background:s.color.dot, flexShrink:0 }}/>
      {status}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const cfg = PERFIL_CFG[role] || PERFIL_CFG.client;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', fontSize:11, fontWeight:700,
      borderRadius:9999, padding:'3px 12px', background:cfg.bg, color:cfg.fg, border:cfg.border||'none' }}>
      {cfg.label}
    </span>
  );
};

const PriBadge = ({ p }) => {
  const m = { Alta:{bg:C.error.bg,fg:C.error.text,ic:'▲'}, Média:{bg:C.warning.bg,fg:C.warning.text,ic:'●'}, Baixa:{bg:C.bg,fg:C.fgSubtle,ic:'▼'} }[p]||{};
  return <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:11, fontWeight:700, borderRadius:6, padding:'2px 8px', background:m.bg, color:m.fg }}>{m.ic} {p}</span>;
};

// ── Campos ───────────────────────────────────────────────────────
const Field = ({ label, type='text', value, onChange, placeholder, error, required, hint, readOnly, style:st={}, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
    <label style={{ fontSize:13, fontWeight:600, color:C.fg }}>{label}{required&&<span style={{color:C.error.dot,marginLeft:3}}>*</span>}</label>
    {children || <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
      style={{ height:48, padding:'0 14px', border:`1.5px solid ${error?C.error.dot:C.border}`,
        borderRadius:8, fontSize:15, fontFamily:'Inter', color:C.fg,
        background:readOnly?C.bg:'#fff', outline:'none', transition:'border-color 150ms', ...st }}
      onFocus={e=>{ if(!readOnly){ e.target.style.borderColor=error?C.error.dot:C.amber; e.target.style.boxShadow=`0 0 0 3px rgba(240,165,0,0.15)`; } }}
      onBlur={e=>{ e.target.style.borderColor=error?C.error.dot:C.border; e.target.style.boxShadow='none'; }}
    />}
    {hint&&!error && <span style={{fontSize:12,color:C.fgSubtle}}>{hint}</span>}
    {error && <span style={{fontSize:12,color:C.error.text,fontWeight:500}}>{error}</span>}
  </div>
);

const SelectField = ({ label, value, onChange, options, required, error }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
    <label style={{ fontSize:13, fontWeight:600, color:C.fg }}>{label}{required&&<span style={{color:C.error.dot,marginLeft:3}}>*</span>}</label>
    <select value={value} onChange={onChange}
      style={{ height:48, padding:'0 14px', border:`1.5px solid ${error?C.error.dot:C.border}`,
        borderRadius:8, fontSize:15, fontFamily:'Inter', color:C.fg, background:'#fff', outline:'none', cursor:'pointer' }}>
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
    {error && <span style={{fontSize:12,color:C.error.text,fontWeight:500}}>{error}</span>}
  </div>
);

const Toggle = ({ value, onChange }) => (
  <button onClick={()=>onChange(!value)}
    style={{ width:48, height:26, borderRadius:13, background:value?C.success.dot:C.border,
      border:'none', cursor:'pointer', position:'relative', transition:'background 200ms', flexShrink:0 }}>
    <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff',
      position:'absolute', top:3, left:value?25:3, transition:'left 200ms',
      boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
  </button>
);

// ── TopBar ───────────────────────────────────────────────────────
const TopBar = ({ title, subtitle, back, onBack, actions }) => (
  <div style={{ background:'#fff', borderBottom:`1px solid ${C.borderLight}`, padding:'0 24px',
    height:64, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, gap:12 }}>
    <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
      {back && <button onClick={onBack}
        style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none',
          cursor:'pointer', fontSize:14, fontWeight:600, color:C.p500, padding:'6px 2px', flexShrink:0 }}>
        <IcArrowLeft size={14}/> {back}
      </button>}
      {back && <span style={{color:C.border, flexShrink:0}}>|</span>}
      <div style={{ minWidth:0 }}>
        <h1 style={{ fontSize:19, fontWeight:700, color:C.p800, lineHeight:1.1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</h1>
        {subtitle && <div style={{ fontSize:12, color:C.fgSubtle, marginTop:2 }}>{subtitle}</div>}
      </div>
    </div>
    <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>{actions}</div>
  </div>
);

// ── Modal ────────────────────────────────────────────────────────
const Modal = ({ title, subtitle, children, onClose, width=480 }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex',
    alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
    onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
    <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:width,
      boxShadow:'0 24px 64px rgba(0,0,0,0.2)', overflow:'hidden', animation:'fadeIn 0.18s ease' }}>
      <div style={{ background:C.p800, padding:'18px 22px', borderBottom:`3px solid ${C.amber}`,
        display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>{title}</div>
          {subtitle && <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{subtitle}</div>}
        </div>
        <button onClick={onClose}
          style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)',
            fontSize:22, lineHeight:1, marginLeft:12, marginTop:-2 }}>×</button>
      </div>
      <div style={{ padding:22, maxHeight:'70vh', overflowY:'auto' }}>{children}</div>
    </div>
  </div>
);

const ConfirmModal = ({ title, msg, onConfirm, onCancel, danger }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex',
    alignItems:'center', justifyContent:'center', zIndex:1100, padding:16 }}>
    <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:400,
      boxShadow:'0 24px 64px rgba(0,0,0,0.2)', overflow:'hidden', animation:'fadeIn 0.18s ease' }}>
      <div style={{ background:danger?'#991b1b':C.p800, padding:'16px 20px', borderBottom:`3px solid ${danger?'#fca5a5':C.amber}` }}>
        <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{title}</div>
      </div>
      <div style={{ padding:20 }}>
        <p style={{ fontSize:14, color:C.fg, marginBottom:20, lineHeight:1.6 }}>{msg}</p>
        <div style={{ display:'flex', gap:8 }}>
          <Btn variant="ghost" full onClick={onCancel}>Cancelar</Btn>
          <Btn variant={danger?'danger':'accent'} full onClick={onConfirm}>{danger?'Excluir':'Confirmar'}</Btn>
        </div>
      </div>
    </div>
  </div>
);

// ── Toast ────────────────────────────────────────────────────────
const Toast = ({ msg, type='success' }) => (
  <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
    background:type==='success'?C.p800:type==='error'?'#991b1b':'#92400e',
    color:'#fff', fontSize:14, fontWeight:600, padding:'12px 22px', borderRadius:10,
    boxShadow:'0 8px 24px rgba(0,0,0,0.2)', zIndex:9999,
    borderLeft:`4px solid ${type==='success'?C.amber:type==='error'?'#fca5a5':'#fde68a'}`,
    whiteSpace:'nowrap', animation:'fadeIn 0.2s ease' }}>
    {type==='success'?<IcCheck size={13}/>:type==='error'?<IcX size={13}/>:<IcAlert size={13}/>} {msg}
  </div>
);

// ── Spinner ──────────────────────────────────────────────────────
const Spinner = ({ size=18, color=C.p800 }) => (
  <span style={{ width:size, height:size, border:`2.5px solid ${color}22`,
    borderTopColor:color, borderRadius:'50%', display:'inline-block',
    animation:'spin 0.75s linear infinite', flexShrink:0 }}/>
);

// ── Skeleton shimmer ─────────────────────────────────────────────
const Sk = ({ w='100%', h=16, radius=6, style:st={} }) => (
  <div style={{ width:w, height:h, borderRadius:radius,
    background:'linear-gradient(90deg,#e8e8e5 25%,#f0f0ed 50%,#e8e8e5 75%)',
    backgroundSize:'600px 100%', animation:'shimmer 1.4s infinite linear', ...st }}/>
);

// ── Empty state ──────────────────────────────────────────────────
const EmptyState = ({ icon, title, desc, action, onAction, compact }) => {
  if (compact) return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'20px 18px', animation:'fadeIn 0.2s ease' }}>
      <div style={{ width:44, height:44, borderRadius:10, background:C.p50, border:`1.5px solid ${C.p100}`,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.p800, marginBottom:3 }}>{title}</div>
        <div style={{ fontSize:13, color:C.fgSubtle, lineHeight:1.5 }}>{desc}</div>
      </div>
      {action && <Btn variant={action.variant||'accent'} size="sm" onClick={onAction}>{action.label}</Btn>}
    </div>
  );
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'56px 32px', textAlign:'center', animation:'bounceIn 0.3s ease' }}>
      <div style={{ width:76, height:76, borderRadius:20, background:C.p50, border:`2px solid ${C.p100}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:34, marginBottom:18, boxShadow:'0 4px 16px rgba(27,43,75,0.08)' }}>{icon}</div>
      <div style={{ fontSize:17, fontWeight:700, color:C.p800, marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:14, color:C.fgSubtle, maxWidth:380, lineHeight:1.65, marginBottom:24 }}>{desc}</div>
      {action && <Btn variant={action.variant||'accent'} onClick={onAction}>{action.label}</Btn>}
    </div>
  );
};

// ── Logo ─────────────────────────────────────────────────────────
const Logo = ({ size='md' }) => {
  const sz = size==='lg' ? { logo:22, sub:12 } : { logo:19, sub:11 };
  return (
    <div>
      <div style={{ fontSize:sz.logo, fontWeight:800, color:'#fff', letterSpacing:'-0.025em', lineHeight:1 }}>
        Torque Gestão
      </div>
    </div>
  );
};

// ── Sidebar ──────────────────────────────────────────────────────
const ADMIN_NAV = [
  { section:'Principal', items:[
    { id:'dashboard', label:'Painel',             icon:<IcGrid size={15}/> },
    { id:'os',        label:'Ordens de Serviço',  icon:<IcClipboard size={15}/> },
    { id:'clientes',  label:'Clientes',            icon:<IcUsers size={15}/> },
    { id:'veiculos',  label:'Veículos',            icon:<IcCar size={15}/> },
  ]},
  { section:'Gestão', items:[
    { id:'catalogo',   label:'Catálogo',           icon:<IcBox size={15}/> },
    { id:'usuarios',   label:'Usuários',           icon:<IcUser size={15}/> },
    { id:'config',     label:'Configurações',      icon:<IcCog size={15}/> },
  ]},
];

const MECH_NAV = [
  { section:'Minhas OS', items:[
    { id:'dashboard', label:'Minha Área',          icon:<IcGrid size={15}/> },
    { id:'historico', label:'Histórico',            icon:<IcClock size={15}/> },
  ]},
];

const Sidebar = ({ role, activePage, onNav, onLogout, osCount }) => {
  const isAdmin = role==='admin';
  const isMech  = role==='mech';
  const nav = isAdmin ? ADMIN_NAV : MECH_NAV;
  const userCfg = {
    admin:  { name:'Roberto Gestão', role:'Administrador', initials:'RG', avatarBg:C.amber, avatarFg:C.p800 },
    mech:   { name:'Carlos Andrade', role:'Mecânico',       initials:'CA', avatarBg:'#5b7ab8', avatarFg:'#fff' },
    client: { name:'João Silva',     role:'Cliente',         initials:'JS', avatarBg:'#22c55e', avatarFg:'#fff' },
  }[role] || {};

  return (
    <div style={{ width:232, background:C.p800, display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden' }}>
      <div style={{ padding:'22px 20px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <Logo/>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'6px 10px' }}>
        {nav.map(sec=>(
          <div key={sec.section}>
            <div style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.28)', letterSpacing:'0.08em',
              textTransform:'uppercase', padding:'12px 10px 4px' }}>{sec.section}</div>
            {sec.items.map(item=>{
              const isA = activePage===item.id || activePage.startsWith(item.id+':');
              const badge = item.id==='dashboard'&&osCount>0 ? osCount : null;
              return (
                <button key={item.id} onClick={()=>onNav(item.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 12px',
                    borderRadius:8, border:'none', cursor:'pointer', fontSize:14,
                    fontWeight:isA?600:500, color:isA?C.amber:'rgba(255,255,255,0.62)',
                    background:isA?'rgba(240,165,0,0.12)':'transparent',
                    marginBottom:2, textAlign:'left', transition:'all 140ms' }}
                  onMouseEnter={e=>{ if(!isA){ e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.88)'; }}}
                  onMouseLeave={e=>{ if(!isA){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.62)'; }}}>
                  <span style={{ fontSize:15, width:18, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                  <span style={{ flex:1 }}>{item.label}</span>
                  {badge && <span style={{ background:C.amber, color:C.p800, fontSize:10, fontWeight:700, borderRadius:9999, padding:'1px 6px' }}>{badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:userCfg.avatarBg,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:13, fontWeight:700, color:userCfg.avatarFg, flexShrink:0 }}>
          {userCfg.initials}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userCfg.name}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)' }}>{userCfg.role}</div>
        </div>
        <button onClick={onLogout} title="Sair"
          style={{ width:30, height:30, background:'rgba(255,255,255,0.06)', border:'none',
            borderRadius:6, cursor:'pointer', color:'rgba(255,255,255,0.4)', fontSize:14,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IcLogOut size={14}/></button>
      </div>
    </div>
  );
};

// ── Tabela genérica ──────────────────────────────────────────────
const Table = ({ heads, rows, onRow, emptyNode }) => (
  <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
    {rows.length===0 ? (emptyNode||null) : (
      <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
        <thead>
          <tr style={{ background:C.bg }}>
            {heads.map((h,i)=>(
              <th key={i} style={{ textAlign:'left', fontSize:10, fontWeight:700, color:C.fgSubtle,
                letterSpacing:'0.07em', textTransform:'uppercase', padding:'10px 16px',
                borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={i}
              style={{ borderBottom:i<rows.length-1?`1px solid ${C.borderLight}`:'none',
                cursor:onRow?'pointer':'default', transition:'background 120ms' }}
              onMouseEnter={e=>{ if(onRow) e.currentTarget.style.background=C.bg; }}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              onClick={()=>onRow&&onRow(i)}>
              {row.map((cell,j)=>(
                <td key={j} style={{ padding:'13px 16px', fontSize:14, verticalAlign:'middle' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

// Export everything to window
Object.assign(window, {
  C, STATUS_CFG, STATUS_LIST, PERFIL_CFG,
  fmt, nowStr, uid,
  Btn, StatusBadge, RoleBadge, PriBadge,
  Field, SelectField, Toggle,
  TopBar, Modal, ConfirmModal, Toast, Spinner, Sk,
  EmptyState, Logo, Sidebar, Table,
});
