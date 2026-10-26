// Portal do cliente: só mostra os próprios dados e não oferece ações de
// gestão. Cobre o risco "vazamento de dados de clientes" (LGPD).
const { test, expect } = require('@playwright/test');
const { abrirApp, entrar, apiComo } = require('./helpers.cjs');

test('cliente do portal não vê veículos nem OS de outro cliente', async ({ page, request }) => {
  const admin = await apiComo(request, 'admin');
  const outro = await admin.post('/clientes', { name: 'Outro Cliente', email: 'outro.portal@example.com', cpf: '39053344705' });
  const veiculo = await admin.post('/veiculos', { cliente_id: outro.id, plate: 'OUT9B87', make: 'Ford', model: 'Ka' });
  const [servico] = (await admin.get('/catalogo/servicos')).body;
  const os = await admin.post('/ordens-servico', {
    cliente_id: outro.id, veiculo_id: veiculo.id,
    itens: [{ tipo: 'mao_obra', catalogo_id: servico.id, quantidade: 1 }],
  });

  const erros = await abrirApp(page);
  await entrar(page, 'cliente');

  await expect(page.getByRole('heading', { name: 'Meus veículos' })).toBeVisible();
  await expect(page.getByText('OUT9B87')).toHaveCount(0);
  for (const gestao of ['Clientes', 'Veículos', 'Painel do administrador', 'Nova OS']) {
    await expect(page.getByRole('button', { name: gestao, exact: true })).toHaveCount(0);
  }
  await page.getByRole('navigation').getByRole('button', { name: 'Acompanhar OS', exact: true }).click();
  await expect(page.getByText(os.id.slice(0, 8))).toHaveCount(0);

  // Mesmo chamando a API "por fora" da interface, o servidor bloqueia.
  const cliente = await apiComo(request, 'cliente');
  expect([403, 404]).toContain((await cliente.get(`/veiculos/${veiculo.id}`)).status);
  expect([403, 404]).toContain((await cliente.get(`/ordens-servico/${os.id}`)).status);
  expect((await cliente.get('/clientes')).body.map(c => c.id)).not.toContain(outro.id);
  expect(erros).toEqual([]);
});
