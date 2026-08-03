// ─────────────────────────────────────────────────────────────────
// screens-gestao.jsx — Catálogo, Usuários, Configurações
// ─────────────────────────────────────────────────────────────────

// ── Catálogo ─────────────────────────────────────────────────────
const CAT_SERVICOS = ['Freios','Motor','Suspensão','Elétrico','Ar Condicionado','Câmbio','Revisão','Pneus','Outros'];
const CAT_PECAS    = ['Freios','Motor','Filtros','Elétrico','Suspensão','Transmissão','Lubrificantes','Outros'];

const ItemModal = ({ item, tipo, cats, onSave, onClose }) => {
  const empty = { nome:'', cat:cats[0], preco:'', unid:tipo==='servico'?'por serviço':'peça', ativo:true, obs:'', ref:'' };
  const [form, setForm]     = useState(item || empty);
  const [errors, setErrors] = useState({});
  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:undefined})); };

  const validate = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório';
    if (!form.preco || isNaN(parseFloat(form.preco))) e.preco = 'Preço inválido';
    return e;
  };
  const handleSave = () => {
    const e = validate(); if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ ...form, id:form.id||uid(), preco:parseFloat(form.preco) });
  };

  const UNIDS = tipo==='servico'
    ? ['por serviço','por hora','por eixo','4 rodas','kit','outro']
    : ['peça','jogo','kit','litro','frasco','metro','outro'];

  return (
    <Modal title={item?`Editar ${tipo==='servico'?'Serviço':'Peça'}`:`Novo ${tipo==='servico'?'Serviço':'Peça'}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Field label="Nome" required value={form.nome} onChange={e=>set('nome',e.target.value)}
          placeholder={tipo==='servico'?'Ex: Troca de óleo e filtro':'Ex: Pastilha de freio dianteira'} error={errors.nome}/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <SelectField label="Categoria" value={form.cat} onChange={e=>set('cat',e.target.value)} options={cats.map(c=>({value:c,label:c}))}/>
          <Field label="Preço de referência" type="number" value={form.preco} onChange={e=>set('preco',e.target.value)} placeholder="0,00" required error={errors.preco} hint="Uso operacional interno — não fiscal"/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <SelectField label="Unidade" value={form.unid} onChange={e=>set('unid',e.target.value)} options={UNIDS.map(u=>({value:u,label:u}))}/>
          {tipo==='peca' && <Field label="Código / Referência" value={form.ref||''} onChange={e=>set('ref',e.target.value)} placeholder="Ex: FTE-1234"/>}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <label style={{ fontSize:13, fontWeight:600, color:C.fg }}>Observações</label>
          <textarea value={form.obs||''} onChange={e=>set('obs',e.target.value)} placeholder="Compatibilidade, restrições, notas..."
            style={{ height:70, padding:'10px 14px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, fontFamily:'Inter', resize:'none', outline:'none' }}
            onFocus={e=>e.target.style.borderColor=C.amber} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:C.bg, borderRadius:8 }}>
          <Toggle value={form.ativo} onChange={v=>set('ativo',v)}/>
          <span style={{ fontSize:14, fontWeight:500, color:C.fg }}>Item <strong>{form.ativo?'ativo':'inativo'}</strong> no catálogo</span>
        </div>
        <div style={{ display:'flex', gap:8, paddingTop:4 }}>
          <Btn variant="ghost" full onClick={onClose}>Cancelar</Btn>
          <Btn variant="accent" full onClick={handleSave}>{item?'Salvar alterações':'Adicionar ao catálogo'}</Btn>
        </div>
      </div>
    </Modal>
  );
};

const Catalogo = ({ showToast }) => {
  const [tab,        setTab]        = useState('servicos');
  const [servicos,   setServicos]   = useState(CATALOGO_SERVICOS_INIT);
  const [pecas,      setPecas]      = useState(CATALOGO_PECAS_INIT);
  const [search,     setSearch]     = useState('');
  const [catFiltro,  setCatFiltro]  = useState('todas');
  const [statusFilt, setStatusFilt] = useState('todos');
  const [modal,      setModal]      = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const isServ = tab==='servicos';
  const lista  = isServ ? servicos : pecas;
  const cats   = isServ ? CAT_SERVICOS : CAT_PECAS;
  const setLista = isServ ? setServicos : setPecas;

  const filtered = lista.filter(i=>{
    const q = search.toLowerCase();
    const mQ = !q || i.nome.toLowerCase().includes(q) || (i.ref||'').toLowerCase().includes(q);
    const mC = catFiltro==='todas' || i.cat===catFiltro;
    const mS = statusFilt==='todos' || (statusFilt==='ativo'&&i.ativo) || (statusFilt==='inativo'&&!i.ativo);
    return mQ && mC && mS;
  });

  const handleSave = item => {
    setLista(l => item.id&&l.find(x=>x.id===item.id) ? l.map(x=>x.id===item.id?item:x) : [...l,item]);
    setModal(null); showToast(modal.item ? 'Item atualizado!' : 'Item adicionado ao catálogo!');
  };
  const handleToggle = id => { setLista(l=>l.map(x=>x.id===id?{...x,ativo:!x.ativo}:x)); showToast('Status atualizado!'); };
  const handleDelete = id => { setLista(l=>l.filter(x=>x.id!==id)); setConfirmDel(null); showToast('Item excluído.','warning'); };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:16 }}>
      {/* Scope notice */}
      <div style={{ background:C.info.bg, border:`1px solid ${C.info.border}`, borderRadius:8, padding:'10px 16px',
        display:'flex', alignItems:'center', gap:8, fontSize:13, color:C.info.text }}>
        <IcInfo size={15} color={C.info.text}/>
        <span>Catálogo para <strong>uso operacional interno</strong>. Controle fiscal e tributário estão fora do escopo do Torque Gestão.</span>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, background:'#fff', borderRadius:10, padding:4, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', alignSelf:'flex-start' }}>
        {[['servicos','Serviços',servicos.length],['pecas','Peças e Materiais',pecas.length]].map(([v,l,cnt])=>(
          <button key={v} onClick={()=>{setTab(v);setCatFiltro('todas');setSearch('');}}
            style={{ height:40, padding:'0 20px', borderRadius:8, border:'none', cursor:'pointer',
              fontSize:14, fontWeight:tab===v?700:500, background:tab===v?C.p800:'transparent',
              color:tab===v?'#fff':C.fgMuted, transition:'all 150ms' }}>
            {l} <span style={{fontSize:12,opacity:0.65}}>({cnt})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><IcSearch size={15} color={C.fgSubtle}/></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Buscar ${isServ?'serviço':'peça ou código'}...`}
            style={{ width:'100%', height:46, paddingLeft:42, paddingRight:14, border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, fontFamily:'Inter', outline:'none', background:'#fff' }}
            onFocus={e=>{e.target.style.borderColor=C.amber;}} onBlur={e=>{e.target.style.borderColor=C.border;}}/>
        </div>
        <select value={catFiltro} onChange={e=>setCatFiltro(e.target.value)}
          style={{ height:46, padding:'0 14px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, fontFamily:'Inter', background:'#fff', outline:'none', minWidth:160 }}>
          <option value="todas">Todas as categorias</option>
          {cats.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display:'flex', gap:4 }}>
          {[['todos','Todos'],['ativo','Ativos'],['inativo','Inativos']].map(([v,l])=>(
            <button key={v} onClick={()=>setStatusFilt(v)}
              style={{ height:46, padding:'0 14px', borderRadius:8, border:`1.5px solid ${statusFilt===v?C.p800:C.border}`,
                background:statusFilt===v?C.p800:'#fff', color:statusFilt===v?'#fff':C.fgMuted,
                fontFamily:'Inter', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 140ms' }}>{l}</button>
          ))}
        </div>
        <Btn variant="accent" icon={<IcPlus size={15}/>} onClick={()=>setModal({item:null,tipo:isServ?'servico':'peca'})}>
          Novo {isServ?'serviço':'peça'}
        </Btn>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden', flex:1 }}>
        {filtered.length===0 ? (
          <EmptyState icon={<IcBox size={34}/>} title="Nenhum item encontrado" desc="Adicione serviços e peças ao catálogo para agilizar a composição de orçamentos."
            action={{label:'+ Adicionar item',variant:'accent'}} onAction={()=>setModal({item:null,tipo:isServ?'servico':'peca'})}/>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:680 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['Nome','Categoria','Preço ref.','Unidade','Status',''].map((h,i)=>(
                  <th key={i} style={{ textAlign:'left', fontSize:10, fontWeight:700, color:C.fgSubtle, letterSpacing:'0.07em', textTransform:'uppercase', padding:'10px 16px', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item,i)=>(
                <tr key={item.id} style={{ borderBottom:i<filtered.length-1?`1px solid ${C.borderLight}`:'none', opacity:item.ativo?1:0.6, transition:'background 120ms' }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{item.nome}</div>
                    {item.obs && <div style={{ fontSize:11, color:C.fgSubtle, marginTop:2 }}>{item.obs.slice(0,60)}{item.obs.length>60?'…':''}</div>}
                    {!isServ && item.ref && <div style={{ fontSize:11, color:C.fgSubtle, fontFamily:'monospace', marginTop:2 }}>{item.ref}</div>}
                  </td>
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', fontSize:11, fontWeight:600, color:C.p600, background:C.p50, borderRadius:6, padding:'3px 9px' }}>{item.cat}</span>
                  </td>
                  <td style={{ padding:'13px 16px', fontWeight:700, fontSize:14, color:C.p800 }}>{fmt(item.preco)}</td>
                  <td style={{ padding:'13px 16px', fontSize:13, color:C.fgMuted }}>{item.unid}</td>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Toggle value={item.ativo} onChange={()=>handleToggle(item.id)}/>
                      <span style={{ fontSize:12, fontWeight:600, color:item.ativo?C.success.text:C.fgSubtle }}>{item.ativo?'Ativo':'Inativo'}</span>
                    </div>
                  </td>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <Btn variant="ghost" size="sm" onClick={()=>setModal({item,tipo:isServ?'servico':'peca'})}>Editar</Btn>
                      <Btn variant="ghost" size="sm" style={{color:C.error.dot,borderColor:C.error.border}} onClick={()=>setConfirmDel(item)}>Excluir</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <ItemModal item={modal.item} tipo={modal.tipo} cats={cats} onSave={handleSave} onClose={()=>setModal(null)}/>}
      {confirmDel && <ConfirmModal title="Excluir item" msg={`Deseja excluir permanentemente "${confirmDel.nome}"?`} danger onConfirm={()=>handleDelete(confirmDel.id)} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
};

// ── Gestão de Usuários ───────────────────────────────────────────
const UserModal = ({ user, onSave, onClose }) => {
  const empty = { nome:'', email:'', tel:'', perfil:'mech', status:true, senha:'' };
  const [form, setForm]     = useState(user || empty);
  const [errors, setErrors] = useState({});
  const isNew = !user;
  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:undefined})); };

  const validate = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório';
    if (!form.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido';
    if (isNew && !form.senha) e.senha = 'Senha obrigatória para novo usuário';
    return e;
  };
  const handleSave = () => {
    const e = validate(); if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ ...form, id:form.id||uid(), cadastro:form.cadastro||new Date().toLocaleDateString('pt-BR'), ultimo:'—' });
  };

  return (
    <Modal title={isNew?'Novo Usuário':'Editar Usuário'} subtitle={isNew?'Atribua um perfil de acesso':user?.nome} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ fontSize:13, fontWeight:600, color:C.fg, display:'block', marginBottom:8 }}>Perfil de acesso <span style={{color:C.error.dot}}>*</span></label>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {Object.entries(PERFIL_CFG).map(([val,cfg])=>(
              <button key={val} onClick={()=>set('perfil',val)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:10,
                  border:`2px solid ${form.perfil===val?C.p800:C.border}`,
                  background:form.perfil===val?C.p50:'#fff', cursor:'pointer', textAlign:'left', transition:'all 150ms' }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:cfg.bg, border:cfg.border||'none',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:cfg.fg, flexShrink:0 }}>
                  {val==='admin'?'A':val==='mech'?'M':'C'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.p800 }}>{cfg.label}</div>
                  <div style={{ fontSize:12, color:C.fgSubtle, marginTop:1 }}>{cfg.desc}</div>
                </div>
                {form.perfil===val && <IcCheck size={18} color={C.success.dot}/>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height:1, background:C.borderLight }}/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <Field label="Nome completo" required value={form.nome} onChange={e=>set('nome',e.target.value)} error={errors.nome}/>
          </div>
          <Field label="E-mail" type="email" required value={form.email} onChange={e=>set('email',e.target.value)} error={errors.email}/>
          <Field label="Telefone" value={form.tel||''} onChange={e=>set('tel',e.target.value)} placeholder="(47) 99999-0000"/>
          {isNew && (
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="Senha inicial" type="password" required value={form.senha||''} onChange={e=>set('senha',e.target.value)} error={errors.senha} hint="O usuário pode alterar no primeiro acesso"/>
            </div>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:C.bg, borderRadius:8 }}>
          <Toggle value={form.status} onChange={v=>set('status',v)}/>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:C.fg }}>Usuário <strong>{form.status?'ativo':'inativo'}</strong></div>
            <div style={{ fontSize:12, color:C.fgSubtle }}>{form.status?'Acesso liberado ao sistema':'Acesso bloqueado — credenciais preservadas'}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, paddingTop:4 }}>
          <Btn variant="ghost" full onClick={onClose}>Cancelar</Btn>
          <Btn variant="accent" full onClick={handleSave}>{isNew?'Criar usuário':'Salvar alterações'}</Btn>
        </div>
      </div>
    </Modal>
  );
};

const GestaoUsuarios = ({ showToast }) => {
  const [usuarios,   setUsuarios]   = useState(USUARIOS_INIT);
  const [search,     setSearch]     = useState('');
  const [perfilFilt, setPerfilFilt] = useState('todos');
  const [modal,      setModal]      = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const filtered = usuarios.filter(u => {
    const q = search.toLowerCase();
    const mQ = !q || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const mP = perfilFilt==='todos' || u.perfil===perfilFilt;
    return mQ && mP;
  });

  const handleSave = user => {
    setUsuarios(l => user.id&&l.find(x=>x.id===user.id) ? l.map(x=>x.id===user.id?user:x) : [...l,user]);
    setModal(null); showToast('Usuário salvo com sucesso!');
  };
  const handleToggle = id => { setUsuarios(l=>l.map(u=>u.id===id?{...u,status:!u.status}:u)); showToast('Status atualizado!'); };
  const handleDelete = id => { setUsuarios(l=>l.filter(u=>u.id!==id)); setConfirmDel(null); showToast('Usuário removido.','warning'); };

  const ativos = usuarios.filter(u=>u.status).length;
  const counts = { admin:usuarios.filter(u=>u.perfil==='admin').length, mech:usuarios.filter(u=>u.perfil==='mech').length, client:usuarios.filter(u=>u.perfil==='client').length };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:16 }}>
      {/* Stats */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {[['Administradores',counts.admin,C.p800],['Mecânicos',counts.mech,C.p600],['Clientes',counts.client,C.p400],['Ativos',ativos,C.success.dot],['Inativos',usuarios.length-ativos,C.fgSubtle]].map(([l,v,col])=>(
          <div key={l} style={{ background:'#fff', borderRadius:10, padding:'12px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', gap:2, minWidth:110 }}>
            <span style={{ fontSize:10, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em' }}>{l}</span>
            <span style={{ fontSize:24, fontWeight:800, color:col }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><IcSearch size={15} color={C.fgSubtle}/></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome ou e-mail..."
            style={{ width:'100%', height:46, paddingLeft:42, paddingRight:14, border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, fontFamily:'Inter', outline:'none', background:'#fff' }}
            onFocus={e=>{e.target.style.borderColor=C.amber;}} onBlur={e=>{e.target.style.borderColor=C.border;}}/>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {[['todos','Todos'],['admin','Admins'],['mech','Mecânicos'],['client','Clientes']].map(([v,l])=>(
            <button key={v} onClick={()=>setPerfilFilt(v)}
              style={{ height:46, padding:'0 14px', borderRadius:8, border:`1.5px solid ${perfilFilt===v?C.p800:C.border}`,
                background:perfilFilt===v?C.p800:'#fff', color:perfilFilt===v?'#fff':C.fgMuted,
                fontFamily:'Inter', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 140ms' }}>{l}</button>
          ))}
        </div>
        <Btn variant="accent" icon={<IcPlus size={15}/>} onClick={()=>setModal({})}>Novo usuário</Btn>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden', flex:1 }}>
        {filtered.length===0 ? (
          <EmptyState icon={<IcUser size={34}/>} title="Nenhum usuário encontrado" desc="Ajuste os filtros ou crie um novo usuário." action={{label:'+ Novo usuário',variant:'accent'}} onAction={()=>setModal({})}/>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['Usuário','E-mail / Telefone','Perfil','Status','Cadastro','Último acesso',''].map((h,i)=>(
                  <th key={i} style={{ textAlign:'left', fontSize:10, fontWeight:700, color:C.fgSubtle, letterSpacing:'0.07em', textTransform:'uppercase', padding:'10px 16px', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u,i)=>{
                const cfg = PERFIL_CFG[u.perfil] || PERFIL_CFG.client;
                return (
                  <tr key={u.id} style={{ borderBottom:i<filtered.length-1?`1px solid ${C.borderLight}`:'none', opacity:u.status?1:0.65, transition:'background 120ms' }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:38, height:38, borderRadius:'50%', background:cfg.bg, border:cfg.border||'none',
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:cfg.fg, flexShrink:0 }}>
                          {u.nome.split(' ').map(n=>n[0]).slice(0,2).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:14 }}>{u.nome}</div>
                          {!u.status && <span style={{ fontSize:10, fontWeight:600, color:C.error.text, background:C.error.bg, borderRadius:4, padding:'1px 6px' }}>BLOQUEADO</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ fontSize:13 }}>{u.email}</div>
                      <div style={{ fontSize:12, color:C.fgSubtle }}>{u.tel}</div>
                    </td>
                    <td style={{ padding:'13px 16px' }}><RoleBadge role={u.perfil}/></td>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Toggle value={u.status} onChange={()=>handleToggle(u.id)}/>
                        <span style={{ fontSize:12, fontWeight:600, color:u.status?C.success.text:C.fgSubtle }}>{u.status?'Ativo':'Inativo'}</span>
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px', fontSize:12, color:C.fgSubtle }}>{u.cadastro}</td>
                    <td style={{ padding:'13px 16px', fontSize:12, color:C.fgSubtle }}>{u.ultimo}</td>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <Btn variant="ghost" size="sm" onClick={()=>setModal(u)}>Editar</Btn>
                        {u.perfil!=='admin' && <Btn variant="ghost" size="sm" style={{color:C.error.dot,borderColor:C.error.border}} onClick={()=>setConfirmDel(u)}>Remover</Btn>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal!==null && <UserModal user={modal.id?modal:null} onSave={handleSave} onClose={()=>setModal(null)}/>}
      {confirmDel && <ConfirmModal title="Remover usuário" msg={`Deseja remover "${confirmDel.nome}"? O histórico de OS será preservado.`} danger onConfirm={()=>handleDelete(confirmDel.id)} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
};

// ── Configurações ────────────────────────────────────────────────
const Configuracoes = ({ showToast }) => {
  const [cfg,       setCfg]       = useState(CONFIG_INIT);
  const [tab,       setTab]       = useState('oficina');
  const [saving,    setSaving]    = useState(false);
  const set = (section, key, val) => setCfg(c=>({...c,[section]:{...c[section],[key]:val}}));

  const handleSave = () => {
    setSaving(true);
    setTimeout(()=>{ setSaving(false); showToast('Configurações salvas com sucesso!'); }, 900);
  };

  const NotifRow = ({ label, desc, value, onChange, children }) => (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, padding:'12px 0', borderBottom:`1px solid ${C.borderLight}` }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:600, color:C.fg }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:C.fgSubtle, marginTop:2, lineHeight:1.5 }}>{desc}</div>}
        {children && <div style={{ marginTop:8 }}>{children}</div>}
      </div>
      <Toggle value={value} onChange={onChange}/>
    </div>
  );

  const Section = ({ title, icon, children }) => (
    <div style={{ background:'#fff', borderRadius:12, padding:22, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, paddingBottom:12, borderBottom:`1px solid ${C.borderLight}` }}>
        <div style={{ width:34, height:34, background:C.p50, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
        <span style={{ fontSize:15, fontWeight:700, color:C.p800 }}>{title}</span>
      </div>
      {children}
    </div>
  );

  const UFs = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24 }}>
      <div style={{ maxWidth:840, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, background:'#fff', borderRadius:10, padding:4, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', alignSelf:'flex-start' }}>
          {[['oficina','Dados da Oficina'],['notif','Notificações'],['sistema','Sistema']].map(([v,l])=>(
            <button key={v} onClick={()=>setTab(v)}
              style={{ height:40, padding:'0 18px', borderRadius:8, border:'none', cursor:'pointer',
                fontSize:14, fontWeight:tab===v?700:500, background:tab===v?C.p800:'transparent',
                color:tab===v?'#fff':C.fgMuted, transition:'all 150ms' }}>{l}</button>
          ))}
        </div>

        {tab==='oficina' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeIn 0.2s ease' }}>
            <Section title="Identificação" icon={<IcBuilding size={18}/>}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div style={{ gridColumn:'1/-1' }}><Field label="Nome da oficina" required value={cfg.oficina.nome} onChange={e=>set('oficina','nome',e.target.value)}/></div>
                <Field label="CNPJ" value={cfg.oficina.cnpj} onChange={e=>set('oficina','cnpj',e.target.value)}/>
                <Field label="Responsável" value={cfg.oficina.responsavel} onChange={e=>set('oficina','responsavel',e.target.value)}/>
                <Field label="Telefone fixo" value={cfg.oficina.tel} onChange={e=>set('oficina','tel',e.target.value)}/>
                <Field label="Celular / WhatsApp" value={cfg.oficina.cel} onChange={e=>set('oficina','cel',e.target.value)}/>
                <div style={{ gridColumn:'1/-1' }}><Field label="E-mail de contato" type="email" value={cfg.oficina.email} onChange={e=>set('oficina','email',e.target.value)}/></div>
              </div>
            </Section>
            <Section title="Endereço" icon={<IcMapPin size={18}/>}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                <Field label="CEP" value={cfg.oficina.cep} onChange={e=>set('oficina','cep',e.target.value)}/>
                <div style={{ gridColumn:'2/-1' }}><Field label="Endereço" value={cfg.oficina.endereco} onChange={e=>set('oficina','endereco',e.target.value)}/></div>
                <Field label="Bairro" value={cfg.oficina.bairro} onChange={e=>set('oficina','bairro',e.target.value)}/>
                <div style={{ gridColumn:'1/3' }}><Field label="Cidade" value={cfg.oficina.cidade} onChange={e=>set('oficina','cidade',e.target.value)}/></div>
                <SelectField label="Estado" value={cfg.oficina.estado} onChange={e=>set('oficina','estado',e.target.value)} options={UFs.map(u=>({value:u,label:u}))}/>
              </div>
            </Section>
          </div>
        )}

        {tab==='notif' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeIn 0.2s ease' }}>
            <Section title="Alertas de OS" icon={<IcClipboard size={18}/>}>
              <NotifRow label="OS parada sem movimentação" desc="Alerta quando uma OS ficar sem atualização de status." value={cfg.notif.osParada} onChange={v=>set('notif','osParada',v)}>
                {cfg.notif.osParada && (
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:13, color:C.fgMuted }}>Alertar após</span>
                    <input type="number" value={cfg.notif.osParadaHoras} onChange={e=>set('notif','osParadaHoras',parseInt(e.target.value)||1)} min={1} max={168}
                      style={{ width:70, height:36, padding:'0 10px', border:`1.5px solid ${C.border}`, borderRadius:6, fontSize:14, fontFamily:'Inter', textAlign:'center', outline:'none' }}/>
                    <span style={{ fontSize:13, color:C.fgMuted }}>horas de inatividade</span>
                  </div>
                )}
              </NotifRow>
              <NotifRow label="Orçamento aguardando aprovação" desc="Notificar quando um orçamento não for aprovado dentro do prazo." value={cfg.notif.orcamentoPendente} onChange={v=>set('notif','orcamentoPendente',v)}>
                {cfg.notif.orcamentoPendente && (
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:13, color:C.fgMuted }}>Após</span>
                    <input type="number" value={cfg.notif.orcamentoPendenteHoras} onChange={e=>set('notif','orcamentoPendenteHoras',parseInt(e.target.value)||1)} min={1}
                      style={{ width:70, height:36, padding:'0 10px', border:`1.5px solid ${C.border}`, borderRadius:6, fontSize:14, fontFamily:'Inter', textAlign:'center', outline:'none' }}/>
                    <span style={{ fontSize:13, color:C.fgMuted }}>horas sem resposta</span>
                  </div>
                )}
              </NotifRow>
              <NotifRow label="Notificar avanços de status ao cliente" desc="Enviar notificação a cada mudança de status da OS." value={cfg.notif.statusAvancos} onChange={v=>set('notif','statusAvancos',v)}/>
            </Section>
            <Section title="Manutenção Preventiva" icon={<IcWrench size={18}/>}>
              <NotifRow label="Alerta por quilometragem" desc="Notificar o cliente próximo ao intervalo de manutenção." value={cfg.notif.manPreventiva} onChange={v=>set('notif','manPreventiva',v)}>
                {cfg.notif.manPreventiva && (
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:13, color:C.fgMuted }}>Alertar</span>
                    <input type="number" value={cfg.notif.manPreventivaKm} onChange={e=>set('notif','manPreventivaKm',parseInt(e.target.value)||500)} min={100} step={100}
                      style={{ width:90, height:36, padding:'0 10px', border:`1.5px solid ${C.border}`, borderRadius:6, fontSize:14, fontFamily:'Inter', textAlign:'center', outline:'none' }}/>
                    <span style={{ fontSize:13, color:C.fgMuted }}>km antes do próximo intervalo</span>
                  </div>
                )}
              </NotifRow>
            </Section>
            <Section title="Canais" icon={<IcPhone size={18}/>}>
              <NotifRow label="Notificações por e-mail" desc="Avisos de OS e manutenção preventiva ao e-mail do cliente." value={cfg.notif.emailCliente} onChange={v=>set('notif','emailCliente',v)}/>
              <NotifRow label="Notificações por WhatsApp" desc="Requer chave de API do WhatsApp Business." value={cfg.notif.whatsapp} onChange={v=>set('notif','whatsapp',v)}>
                {cfg.notif.whatsapp && <div style={{ background:C.warning.bg, border:`1px solid ${C.warning.border}`, borderRadius:6, padding:'8px 12px', fontSize:12, color:C.warning.text, display:'flex', alignItems:'center', gap:6 }}><IcAlert size={12}/> Configure a API em Integrações.</div>}
              </NotifRow>
            </Section>
          </div>
        )}

        {tab==='sistema' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeIn 0.2s ease' }}>
            <Section title="Backup e Segurança" icon={<IcLock size={18}/>}>
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid ${C.borderLight}` }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.fg }}>Backup automático</div>
                    <div style={{ fontSize:12, color:C.fgSubtle, marginTop:2 }}>Backup periódico dos dados do sistema</div>
                    {cfg.sistema.autoBackup && (
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                        <span style={{ fontSize:13, color:C.fgMuted }}>A cada</span>
                        <select value={cfg.sistema.backupHoras} onChange={e=>set('sistema','backupHoras',parseInt(e.target.value))}
                          style={{ height:34, padding:'0 10px', border:`1.5px solid ${C.border}`, borderRadius:6, fontSize:14, fontFamily:'Inter', background:'#fff', outline:'none' }}>
                          {[6,12,24,48].map(h=><option key={h} value={h}>{h} horas</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <Toggle value={cfg.sistema.autoBackup} onChange={v=>set('sistema','autoBackup',v)}/>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[['JWT + Sessões','Tokens seguros com renovação automática',C.success],['HTTPS / TLS','Tráfego criptografado end-to-end',C.success],['RBAC','Controle de acesso por perfil de usuário',C.success],['LGPD','Consentimento e coleta mínima de dados',C.success]].map(([l,d,col])=>(
                  <div key={l} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', background:col.bg, borderRadius:8, border:`1px solid ${col.border}` }}>
                    <IcCheck size={14} color={col.dot}/>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:col.text }}>{l}</div>
                      <div style={{ fontSize:11, color:C.fgSubtle, marginTop:1 }}>{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Sobre o sistema" icon={<IcInfo size={18}/>}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[['Versão','1.0.0-beta'],['Backend','Python · FastAPI · PostgreSQL'],['Frontend','React · TypeScript'],['Hospedagem','Render + Vercel']].map(([k,v])=>(
                  <div key={k} style={{ padding:'10px 14px', background:C.bg, borderRadius:8 }}>
                    <div style={{ fontSize:10, fontWeight:600, color:C.fgSubtle, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:2 }}>{k}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:C.fg }}>{v}</div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        <div style={{ display:'flex', justifyContent:'flex-end', paddingBottom:8 }}>
          <Btn variant="accent" size="lg" disabled={saving} onClick={handleSave}>{saving?'Salvando...':'Salvar configurações'}</Btn>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Catalogo, GestaoUsuarios, Configuracoes });
