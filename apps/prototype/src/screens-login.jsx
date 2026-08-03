// ─────────────────────────────────────────────────────────────────
// screens-login.jsx — Tela de autenticação
// ─────────────────────────────────────────────────────────────────

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [selected, setSelected] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPw, setShowPw]     = useState(false);

  const DEMO = [
    { role:'admin',  label:'Administrador', email:'admin@torquegestao.com.br',  desc:'Acesso completo ao sistema' },
    { role:'mech',   label:'Mecânico',       email:'carlos@torquegestao.com.br', desc:'OS atribuídas a Carlos A.' },
    { role:'client', label:'Cliente',         email:'joao.silva@email.com',       desc:'Portal de acompanhamento' },
  ];

  const pick = (d) => { setSelected(d.role); setEmail(d.email); setPassword('senha123'); setError(''); };

  const submit = (e) => {
    e && e.preventDefault();
    if (!email || !password) { setError('Preencha e-mail e senha para continuar.'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(selected || 'admin'); }, 900);
  };

  return (
    <div style={{ height:'100vh', background:`linear-gradient(145deg,${C.p900} 0%,${C.p800} 55%,#1e3460 100%)`,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16, position:'relative' }}>
      <div style={{ position:'absolute', inset:0,
        backgroundImage:'radial-gradient(rgba(240,165,0,0.04) 1px, transparent 1px)',
        backgroundSize:'32px 32px', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:460, position:'relative', animation:'fadeIn 0.3s ease' }}>
        <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 24px 64px rgba(0,0,0,0.35)', overflow:'hidden' }}>

          {/* Header */}
          <div style={{ background:C.p800, padding:'28px 32px 24px', borderBottom:`3px solid ${C.amber}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
              <div style={{ width:44, height:44, background:C.amber, borderRadius:10,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:20, fontWeight:800, color:C.p800, flexShrink:0 }}>T</div>
              <div>
                <div style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.02em', lineHeight:1 }}>
                  Torque Gestão
                </div>
              </div>
            </div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.55)' }}>
              Entre com suas credenciais para acessar o sistema.
            </div>
          </div>

          {/* Form */}
          <form onSubmit={submit} style={{ padding:'28px 32px 32px' }}>

            {/* Demo selector */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:11, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase',
                letterSpacing:'0.07em', marginBottom:8 }}>Acesso rápido — demonstração</div>
              <div style={{ display:'flex', gap:8 }}>
                {DEMO.map(d=>(
                  <button key={d.role} type="button" onClick={()=>pick(d)}
                    style={{ flex:1, padding:'10px 6px', borderRadius:8,
                      border:`2px solid ${selected===d.role?C.amber:C.border}`,
                      background:selected===d.role?C.amber100:'#fff',
                      cursor:'pointer', textAlign:'center', transition:'all 150ms' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.p800 }}>{d.label}</div>
                    <div style={{ fontSize:10, color:C.fgSubtle, marginTop:1, lineHeight:1.3 }}>{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fields */}
            <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:8 }}>
              <Field label="E-mail" type="email" value={email} placeholder="seu@email.com"
                onChange={e=>{setEmail(e.target.value);setError('');}}/>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <label style={{ fontSize:13, fontWeight:600, color:C.fg }}>Senha</label>
                  <button type="button" onClick={()=>setShowPw(!showPw)}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:C.p500, fontWeight:600 }}>
                    {showPw?'Ocultar':'Mostrar'}
                  </button>
                </div>
                <input type={showPw?'text':'password'} value={password} placeholder="Sua senha"
                  onChange={e=>{setPassword(e.target.value);setError('');}}
                  style={{ width:'100%', height:52, padding:'0 14px', border:`1.5px solid ${C.border}`,
                    borderRadius:8, fontSize:15, fontFamily:'Inter', color:C.fg, background:'#fff', outline:'none' }}
                  onFocus={e=>{e.target.style.borderColor=C.amber;e.target.style.boxShadow='0 0 0 3px rgba(240,165,0,0.15)';}}
                  onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}
                />
              </div>
            </div>

            {error && (
              <div style={{ background:C.error.bg, color:C.error.text, fontSize:13, fontWeight:500,
                padding:'10px 14px', borderRadius:8, marginBottom:14 }}>{error}</div>
            )}

            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
              <button type="button" style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:C.p500, fontWeight:600 }}>
                Esqueci minha senha
              </button>
            </div>

            <button type="submit" disabled={loading}
              style={{ width:'100%', height:56, background:loading?C.p700:C.amber, color:C.p800,
                fontSize:16, fontWeight:700, fontFamily:'Inter', border:'none', borderRadius:8,
                cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center',
                justifyContent:'center', gap:8, transition:'background 150ms' }}>
              {loading
                ? <><span style={{ width:18, height:18, border:`2.5px solid ${C.p800}`, borderTopColor:'transparent',
                    borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/>Entrando...</>
                : 'Entrar no sistema'}
            </button>

            <div style={{ marginTop:18, padding:'12px 14px', background:C.p50, borderRadius:8,
              border:`1px solid ${C.p100}`, fontSize:12, color:C.fgMuted, lineHeight:1.5 }}>
              <strong style={{color:C.p800}}>Segurança:</strong> Sessão protegida por JWT + TLS. Dados armazenados conforme LGPD.
            </div>
          </form>
        </div>

        <div style={{ textAlign:'center', marginTop:14, fontSize:11, color:'rgba(255,255,255,0.25)' }}>
          Torque Gestão © 2026 — Joinville, SC
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { LoginScreen });
