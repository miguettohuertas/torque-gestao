// Aplicação integrada. As telas antigas permanecem como referência visual no repositório.
const STATUS = {
  aguardando_diagnostico: 'Aguardando Diagnóstico', em_execucao: 'Em Execução',
  aguardando_pecas: 'Aguardando Peças', finalizada: 'Finalizada', entregue: 'Entregue',
};
const FLOW = Object.keys(STATUS);
const money = value => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const day = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : 'Não informada';
const api = createTorqueApi({ baseUrl: window.TORQUE_API_URL, storage: sessionStorage,
  fetchImpl: window.fetch.bind(window), onUnauthorized: () => window.dispatchEvent(new Event('torque:expired')) });
const FormField = ({ label, children }) => {
  const id = React.useId();
  return <div className="field"><label htmlFor={id}>{label}</label>{React.cloneElement(children, { id })}</div>;
};
const Empty = ({ children }) => <p className="empty">{children}</p>;

function SaveForm({ onSave, children, label = 'Salvar' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  return <form onSubmit={async event => {
    event.preventDefault(); if (lock.current) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    lock.current = true; setBusy(true); setError('');
    try { await onSave(values); } catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); }
  }}><fieldset disabled={busy}>{children}
    {error && <p role="alert" className="error">{error}</p>}
    <button className="primary" type="submit">{busy ? 'Salvando…' : label}</button>
  </fieldset></form>;
}

function CustomerForm({ onSave }) {
  return <SaveForm onSave={onSave}><div className="fields">
    <FormField label="Nome"><input name="name" required maxLength="120" autoComplete="name"/></FormField>
    <FormField label="E-mail"><input name="email" type="email" required autoComplete="email"/></FormField>
    <FormField label="CPF / CNPJ"><input name="cpf" required/></FormField>
    <FormField label="Telefone"><input name="phone" type="tel" maxLength="20" autoComplete="tel"/></FormField>
  </div></SaveForm>;
}
function VehicleForm({ customers, onSave }) {
  return <SaveForm onSave={onSave}><div className="fields">
    <FormField label="Cliente"><select name="cliente_id" required defaultValue=""><option value="">Selecione</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FormField>
    <FormField label="Placa"><input name="plate" required placeholder="ABC1D23"/></FormField>
    <FormField label="Marca"><input name="make" required maxLength="60"/></FormField>
    <FormField label="Modelo"><input name="model" required maxLength="60"/></FormField>
    <FormField label="Ano"><input name="year" pattern="[0-9]{4}" maxLength="4" placeholder="2026"/></FormField>
  </div></SaveForm>;
}
function OrderForm({ data, onSave }) {
  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState([]);
  const [choice, setChoice] = useState('');
  const catalog = [...data.services.map(s => ({ ...s, tipo: 'mao_obra' })), ...data.parts.map(p => ({ ...p, tipo: 'peca' }))];
  const add = () => {
    const item = catalog.find(i => `${i.tipo}:${i.id}` === choice);
    if (!item) return;
    setItems(current => {
      const existing = current.find(i => i.catalogo_id === item.id && i.tipo === item.tipo);
      return existing ? current.map(i => i === existing ? { ...i, quantidade: i.quantidade + 1 } : i)
        : [...current, { catalogo_id: item.id, tipo: item.tipo, nome: item.nome, preco: item.preco, quantidade: 1 }];
    });
  };
  return <SaveForm label="Emitir ordem de serviço" onSave={values => {
    if (!items.length) throw new Error('Adicione pelo menos um serviço ou peça.');
    return onSave({ ...values, data_previsao: values.data_previsao || null, mecanico_id: values.mecanico_id || null,
      itens: items.map(({ catalogo_id, tipo, quantidade }) => ({ catalogo_id, tipo, quantidade })) });
  }}><div className="fields">
    <FormField label="Cliente"><select name="cliente_id" required value={customer} onChange={e => setCustomer(e.target.value)}><option value="">Selecione</option>{data.customers.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></FormField>
    <FormField label="Veículo"><select key={customer} name="veiculo_id" required defaultValue=""><option value="">Selecione</option>{data.vehicles.filter(v => v.cliente_id === customer).map(v => <option key={v.id} value={v.id}>{v.plate} · {v.make} {v.model}</option>)}</select></FormField>
    {data.users.length > 0 && <FormField label="Mecânico responsável"><select name="mecanico_id" defaultValue=""><option value="">Não atribuído</option>{data.users.filter(u => u.role === 'mecanico').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></FormField>}
    <FormField label="Previsão de entrega"><input name="data_previsao" type="date"/></FormField>
  </div><h3>Serviços e peças</h3>
    <div className="toolbar"><select aria-label="Item do catálogo" value={choice} onChange={e => setChoice(e.target.value)}><option value="">Selecione no catálogo</option>{catalog.map(i => <option key={`${i.tipo}:${i.id}`} value={`${i.tipo}:${i.id}`}>{i.tipo === 'peca' ? 'Peça' : 'Mão de obra'} · {i.nome} · {money(i.preco)}</option>)}</select><button type="button" onClick={add} disabled={!choice}>Adicionar</button></div>
    {!catalog.length && <Empty>O catálogo está vazio. Cadastre os itens pela API ou execute o seed inicial.</Empty>}
    {items.map((i, index) => <div className="item" key={`${i.tipo}:${i.catalogo_id}`}><span>{i.tipo === 'peca' ? 'Peça' : 'Mão de obra'} · {i.nome}</span>
      <input aria-label={`Quantidade de ${i.nome}`} type="number" min="1" step="1" required value={i.quantidade} onChange={e => setItems(items.map((x, n) => n === index ? { ...x, quantidade: e.target.value === '' ? '' : Number(e.target.value) } : x))}/>
      <strong>{money(Number(i.preco) * i.quantidade)}</strong><button type="button" onClick={() => setItems(items.filter((_, n) => n !== index))}>Remover</button></div>)}
    <p className="total">Prévia do orçamento: {money(items.reduce((sum, i) => sum + Math.round(Number(i.preco) * 100) * i.quantidade, 0) / 100)}</p>
    <p className="muted">O valor final é calculado pela oficina ao emitir a OS.</p>
  </SaveForm>;
}
function OrderDetail({ id, portal, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setDetail(null); setError('');
    Promise.all([api.request(`/ordens-servico/${id}`, { signal: controller.signal }), api.request(`/ordens-servico/${id}/historico`, { signal: controller.signal })])
      .then(([order, history]) => setDetail({ order, history }))
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [id, version]);
  if (error) return <div role="alert" className="error">{error} <button onClick={() => setVersion(v => v + 1)}>Tentar novamente</button></div>;
  if (!detail) return <p role="status">Carregando OS…</p>;
  const { order, history } = detail;
  const next = FLOW[FLOW.indexOf(order.status) + 1];
  return <><h2>OS <small>{order.id}</small></h2><p><span className="badge">{STATUS[order.status]}</span></p>
    <p>Abertura: {day(order.data_abertura)} · Previsão: {day(order.data_previsao)}</p>
    {['mao_obra', 'peca'].map(type => <section key={type}><h3>{type === 'peca' ? 'Peças' : 'Mão de obra'}</h3>{order.itens.filter(i => i.tipo === type).map(i => <div className="item" key={i.id}><span>{i.nome} · {i.quantidade} × {money(i.valor_unitario)}</span><strong>{money(i.subtotal)}</strong></div>)}</section>)}
    <p className="total">Orçamento: {money(order.orcamento_total)}</p>
    <h3>Histórico de status</h3><ol className="timeline">{history.map(h => <li key={h.id}><strong>{STATUS[h.status]}</strong> · {day(h.data)}</li>)}</ol>
    {!portal && next && <SaveForm key={order.status} label={`Avançar para ${STATUS[next]}`} onSave={async () => {
      const updated = await api.request(`/ordens-servico/${id}/status`, { method: 'PATCH', body: { status: next } });
      onChanged(updated); setVersion(v => v + 1);
    }}/>}<button onClick={() => setVersion(v => v + 1)}>Atualizar detalhes</button>
  </>;
}

function OperationalDashboard({ data, onOrders, onCreate, onCustomers, onVehicles, renderOrders }) {
  const active = data.orders.filter(order => !['finalizada', 'entregue'].includes(order.status));
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const dueToday = active.filter(order => order.data_previsao === localDate);
  return <section aria-label="Resumo operacional">
    <p>Atendimentos e cadastros da oficina. Use Atualizar para consultar os dados mais recentes.</p>
    <div className="summary-grid">
      <button className="summary-tile" onClick={() => onOrders('')}><span>Total de OS</span><strong>{data.orders.length}</strong></button>
      <div className="summary-tile"><span>Em atendimento</span><strong>{active.length}</strong></div>
      <button className="summary-tile" onClick={onCustomers}><span>Clientes cadastrados</span><strong>{data.customers.length}</strong></button>
      <button className="summary-tile" onClick={onVehicles}><span>Veículos cadastrados</span><strong>{data.vehicles.length}</strong></button>
    </div>
    <h3>Ordens por status</h3>
    <div className="status-summary">{FLOW.map(status => <button key={status} onClick={() => onOrders(status)}>
      <span>{STATUS[status]}</span><strong>{data.orders.filter(order => order.status === status).length}</strong>
    </button>)}</div>
    <div className="toolbar"><button className="primary" onClick={onCreate}>Nova OS</button><button onClick={() => onOrders('')}>Ver todas as ordens</button></div>
    <h3>Previsão para hoje ({dueToday.length})</h3>
    {renderOrders(dueToday)}
    <h3>Ordens em atendimento ({active.length})</h3>
    {renderOrders(active)}
  </section>;
}

const App = () => {
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [page, setPage] = useState('os');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState(null);
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const logout = () => { api.clear(); setUser(null); setData(null); setSelected(null); setPage('os'); setVehicleFilter(''); setStatusFilter(''); setSearch(''); setError(''); setNotice(''); };
  useEffect(() => {
    const expired = () => { logout(); setNotice('Sua sessão expirou. Entre novamente.'); };
    window.addEventListener('torque:expired', expired);
    if (api.hasSession()) api.request('/auth/me').then(current => { setUser(current); setPage(current.role === 'admin' ? 'dashboard' : current.role === 'cliente' ? 'painel' : 'os'); }).catch(e => setError(e.message)).finally(() => setRestoring(false));
    else setRestoring(false);
    return () => window.removeEventListener('torque:expired', expired);
  }, []);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController(); const options = { signal: controller.signal };
    setLoading(true); setError('');
    Promise.all(['/clientes', '/veiculos', '/ordens-servico', ...(user.role === 'cliente' ? [] : ['/catalogo/servicos', '/catalogo/pecas']), ...(user.role === 'admin' ? ['/auth/usuarios'] : [])].map(path => api.request(path, options)))
      .then(([customers, vehicles, orders, services = [], parts = [], users = []]) => setData({ customers, vehicles, orders, services, parts, users }))
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [user, version]);
  if (restoring) return <div className="session" role="status">Restaurando sessão…</div>;
  if (!user) return <>{(notice || error) && <div className="login-notice" role="status">{notice || error}</div>}<LoginScreen onLogin={async (email, password) => {
    const current = await api.login(email, password); setError(''); setNotice(''); setUser(current); setPage(current.role === 'admin' ? 'dashboard' : current.role === 'cliente' ? 'painel' : 'os');
  }}/></>;
  const portal = user.role === 'cliente';
  const navigate = next => { setPage(next); setSelected(null); setNotice(''); };
  const showOrder = id => { setSelected(id); setPage('detalhe'); };
  const create = async (path, values, collection, next) => {
    const saved = await api.request(path, { method: 'POST', body: values });
    setData(d => ({ ...d, [collection]: [...d[collection], saved] }));
    navigate(next); setNotice('Cadastro salvo com sucesso.'); return saved;
  };
  const vehicleName = id => { const v = data.vehicles.find(v => v.id === id); return v ? `${v.plate} · ${v.make} ${v.model}` : id; };
  const orderList = orders => orders.length ? <div className="table-wrap"><table><thead><tr><th>OS / Veículo</th>{!portal && <th>Cliente</th>}<th>Status</th><th>Previsão</th><th>Orçamento</th><th/></tr></thead><tbody>{orders.map(o => <tr key={o.id}><td><small title={o.id}>{o.id.slice(0, 8)}</small><br/>{vehicleName(o.veiculo_id)}</td>{!portal && <td>{data.customers.find(c => c.id === o.cliente_id)?.name || o.cliente_id}</td>}<td><span className="badge">{STATUS[o.status]}</span></td><td>{day(o.data_previsao)}</td><td>{money(o.orcamento_total)}</td><td><button onClick={() => showOrder(o.id)}>Ver detalhes</button></td></tr>)}</tbody></table></div> : <Empty>Nenhuma ordem de serviço encontrada.</Empty>;
  const titles = { dashboard: 'Painel do administrador', os: 'Ordens de serviço', clientes: 'Clientes', veiculos: 'Veículos', 'novo-cliente': 'Cadastrar cliente', 'novo-veiculo': 'Cadastrar veículo', 'nova-os': 'Nova ordem de serviço', detalhe: 'Detalhes da OS', painel: 'Meus veículos', historico: 'Histórico dos veículos' };
  const filtered = data?.orders.filter(o => (!vehicleFilter || o.veiculo_id === vehicleFilter) && (!statusFilter || o.status === statusFilter)) || [];
  return <div className="workspace"><aside><div className="brand"><b>T</b> Torque Gestão</div><p>{portal ? 'Portal do cliente' : 'Gestão da oficina'}</p><nav>
    {(portal ? [['painel', 'Meus veículos'], ['os', 'Acompanhar OS'], ['historico', 'Histórico']] : [...(user.role === 'admin' ? [['dashboard', 'Painel do administrador']] : []), ['os', 'Ordens de serviço'], ['clientes', 'Clientes'], ['veiculos', 'Veículos'], ['historico', 'Histórico']]).map(([id, label]) => <button key={id} aria-current={page === id ? 'page' : undefined} onClick={() => navigate(id)}>{label}</button>)}
    </nav><div className="account"><strong>{user.name}</strong><small>{user.email}</small><button onClick={logout}>Sair</button></div></aside>
    <main><header><div><p className="eyebrow">{portal ? 'SEU ATENDIMENTO' : 'OPERAÇÃO'}</p><h1>{titles[page]}</h1></div><button disabled={loading} onClick={() => setVersion(v => v + 1)}>Atualizar</button></header>
      {notice && <p role="status" className="success">{notice}</p>}
      {error && <p role="alert" className="error">{error} <button onClick={() => setVersion(v => v + 1)}>Tentar novamente</button></p>}
      {loading && <p role="status">Carregando dados…</p>}
      {data && <div className="card">
        {['novo-cliente', 'novo-veiculo', 'nova-os', 'detalhe'].includes(page) && <button onClick={() => navigate(page === 'novo-cliente' ? 'clientes' : page === 'novo-veiculo' ? 'veiculos' : 'os')}>Voltar</button>}
        {page === 'dashboard' && user.role === 'admin' && <OperationalDashboard data={data} onOrders={status => { setVehicleFilter(''); setStatusFilter(status); navigate('os'); }} onCreate={() => navigate('nova-os')} onCustomers={() => navigate('clientes')} onVehicles={() => navigate('veiculos')} renderOrders={orderList}/>}
        {page === 'os' && <><div className="toolbar"><FormField label="Status"><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">Todos</option>{FLOW.map(s => <option key={s} value={s}>{STATUS[s]}</option>)}</select></FormField>{!portal && <button className="primary" onClick={() => navigate('nova-os')}>Nova OS</button>}</div>{orderList(filtered)}</>}
        {page === 'nova-os' && !portal && <OrderForm data={data} onSave={async values => { const saved = await create('/ordens-servico', values, 'orders', 'os'); showOrder(saved.id); }}/>}
        {page === 'detalhe' && selected && <OrderDetail key={selected} id={selected} portal={portal} onChanged={order => setData(d => ({ ...d, orders: d.orders.map(o => o.id === order.id ? order : o) }))}/>}
        {page === 'clientes' && !portal && <><div className="toolbar"><input aria-label="Buscar cliente" placeholder="Buscar nome, e-mail ou documento" value={search} onChange={e => setSearch(e.target.value)}/><button className="primary" onClick={() => navigate('novo-cliente')}>Novo cliente</button></div>{data.customers.filter(c => `${c.name} ${c.email} ${c.cpf}`.toLowerCase().includes(search.toLowerCase())).map(c => <article className="record" key={c.id}><h3>{c.name}</h3><p>{c.email} · {c.phone || 'Sem telefone'} · {c.cpf}</p><small>ID: {c.id}</small><p>{data.vehicles.filter(v => v.cliente_id === c.id).map(v => v.plate).join(' · ') || 'Nenhum veículo cadastrado'}</p></article>)}{!data.customers.length && <Empty>Nenhum cliente cadastrado.</Empty>}</>}
        {page === 'novo-cliente' && !portal && <CustomerForm onSave={values => create('/clientes', { ...values, phone: values.phone || null }, 'customers', 'clientes')}/>}
        {page === 'novo-veiculo' && !portal && <VehicleForm customers={data.customers} onSave={values => create('/veiculos', { ...values, year: values.year || null }, 'vehicles', 'veiculos')}/>}
        {(page === 'veiculos' || page === 'painel') && <>{!portal && <button className="primary" onClick={() => navigate('novo-veiculo')}>Novo veículo</button>}<div className="vehicle-grid">{data.vehicles.map(v => <article className="record" key={v.id}><span className="plate">{v.plate}</span><h3>{v.make} {v.model}</h3><p>{v.year || 'Ano não informado'}</p><p>{data.orders.filter(o => o.veiculo_id === v.id && o.status !== 'entregue').length} OS em aberto</p><div className="toolbar"><button onClick={() => { setVehicleFilter(v.id); setStatusFilter(''); navigate('os'); }}>Acompanhar OS</button><button onClick={() => { setVehicleFilter(v.id); navigate('historico'); }}>Histórico</button></div></article>)}</div>{!data.vehicles.length && <Empty>Nenhum veículo vinculado ao seu cadastro.</Empty>}</>}
        {page === 'historico' && <><p>Todos os atendimentos registrados, incluindo ordens em andamento e entregues.</p><FormField label="Veículo"><select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)}><option value="">Todos os veículos</option>{data.vehicles.map(v => <option value={v.id} key={v.id}>{vehicleName(v.id)}</option>)}</select></FormField>{orderList(data.orders.filter(o => !vehicleFilter || o.veiculo_id === vehicleFilter))}</>}
        {page === 'os' && vehicleFilter && <button onClick={() => setVehicleFilter('')}>Mostrar todos os veículos</button>}
      </div>}
    </main></div>;
};
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
