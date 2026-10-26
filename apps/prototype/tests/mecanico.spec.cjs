// Perfil Mecânico: entra direto nas OS, emite e avança status, sem acesso
// às telas exclusivas do Admin (RF06 — RBAC refletido na interface).
const { test, expect } = require('@playwright/test');
const { abrirApp, entrar, apiComo } = require('./helpers.cjs');

test('mecânico emite OS e avança status sem ver o painel do administrador', async ({ page, request }) => {
  const admin = await apiComo(request, 'admin');
  const cliente = await admin.post('/clientes', { name: 'Cliente da Oficina', email: 'oficina.mec@example.com', cpf: '52998224725' });
  await admin.post('/veiculos', { cliente_id: cliente.id, plate: 'MEC1A23', make: 'VW', model: 'Gol' });

  const erros = await abrirApp(page);
  await entrar(page, 'mecanico');

  await expect(page.getByRole('heading', { name: 'Ordens de serviço', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Painel do administrador' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Nova OS', exact: true }).click();
  await page.getByLabel('Cliente', { exact: true }).selectOption({ label: 'Cliente da Oficina' });
  await page.getByLabel('Veículo', { exact: true }).selectOption({ label: 'MEC1A23 · VW Gol' });
  const item = page.getByLabel('Item do catálogo');
  await item.selectOption(await item.locator('option').filter({ hasText: 'Revisão de freios' }).getAttribute('value'));
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
  await page.getByRole('button', { name: 'Emitir ordem de serviço' }).click();

  await expect(page.locator('.total')).toContainText('180,00');
  await page.getByRole('button', { name: 'Avançar para Em Execução' }).click();
  await expect(page.locator('.card > p .badge')).toHaveText('Em Execução');
  await expect(page.locator('.timeline li')).toHaveCount(2);
  expect(erros).toEqual([]);
});

test('API recusa ao mecânico as rotas exclusivas do Admin', async ({ request }) => {
  const mecanico = await apiComo(request, 'mecanico');

  expect((await mecanico.get('/auth/usuarios')).status).toBe(403);
});
