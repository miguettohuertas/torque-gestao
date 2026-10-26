// Validações exibidas na interface: o erro do servidor aparece para o
// usuário e nada é salvo nem simulado como sucesso.
const { test, expect } = require('@playwright/test');
const { abrirApp, entrar, apiComo } = require('./helpers.cjs');

async function entrarComoAdmin(page) {
  await abrirApp(page);
  await entrar(page, 'admin');
  await expect(page.getByRole('heading', { name: 'Painel do administrador', exact: true })).toBeVisible();
}

test('CPF inválido mostra erro e não cria o cliente', async ({ page, request }) => {
  await entrarComoAdmin(page);
  await page.getByRole('button', { name: 'Clientes', exact: true }).click();
  await page.getByRole('button', { name: 'Novo cliente' }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Documento Errado');
  await page.getByLabel('E-mail', { exact: true }).fill('documento.errado@example.com');
  await page.getByLabel('CPF / CNPJ').fill('123.456.789-00');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();

  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByText('Cadastro salvo com sucesso.')).toHaveCount(0);
  const admin = await apiComo(request, 'admin');
  expect((await admin.get('/clientes')).body.map(c => c.email)).not.toContain('documento.errado@example.com');
});

test('placa já cadastrada mostra conflito e não duplica o veículo', async ({ page, request }) => {
  const admin = await apiComo(request, 'admin');
  const dono = await admin.post('/clientes', { name: 'Dono Placa', email: 'dono.placa@example.com', cpf: '15350946056' });
  await admin.post('/veiculos', { cliente_id: dono.id, plate: 'DUP1C23', make: 'Fiat', model: 'Palio' });

  await entrarComoAdmin(page); // depois dos dados prontos, para a tela já carregá-los
  await page.getByRole('button', { name: 'Veículos', exact: true }).click();
  await page.getByRole('button', { name: 'Novo veículo' }).click();
  await page.getByLabel('Cliente', { exact: true }).selectOption({ label: 'Dono Placa' });
  await page.getByLabel('Placa').fill('dup-1c23');
  await page.getByLabel('Marca').fill('Fiat');
  await page.getByLabel('Modelo').fill('Palio');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();

  await expect(page.getByRole('alert')).toBeVisible();
  const placas = (await admin.get('/veiculos')).body.map(v => v.plate);
  expect(placas.filter(p => p === 'DUP1C23')).toHaveLength(1);
});
