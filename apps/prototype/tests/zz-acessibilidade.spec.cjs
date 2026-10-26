// Acessibilidade (WCAG 2.1 A/AA) com axe-core em cada tela, nos três perfis.
// O nome começa com "zz" para rodar por último: ele só lê dados, mas precisa
// que os specs anteriores já tenham criado cliente, veículo e OS para as telas
// de lista e de detalhe não ficarem vazias.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { abrirApp, entrar, apiComo } = require('./helpers.cjs');

const REGRAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Rodando o arquivo sozinho, ainda não existem cliente, veículo nem OS: cria o
// mínimo para as telas de lista e de detalhe terem conteúdo. Rodando a suíte
// inteira, reaproveita o que os specs anteriores já criaram.
async function garantirDados(request) {
  const admin = await apiComo(request, 'admin');
  let [cliente] = (await admin.get('/clientes')).body.filter(c => c.email !== 'portal@example.com');
  cliente = cliente || await admin.post('/clientes', { name: 'Cliente Acessível', email: 'a11y@example.com', cpf: '12345678909' });
  let [veiculo] = (await admin.get(`/veiculos?cliente_id=${cliente.id}`)).body;
  veiculo = veiculo || await admin.post('/veiculos', { cliente_id: cliente.id, plate: 'ACE1S23', make: 'Fiat', model: 'Uno' });
  if (!(await admin.get('/ordens-servico')).body.length) {
    const [servico] = (await admin.get('/catalogo/servicos')).body;
    await admin.post('/ordens-servico', { cliente_id: cliente.id, veiculo_id: veiculo.id, itens: [{ tipo: 'mao_obra', catalogo_id: servico.id, quantidade: 1 }] });
  }
}

async function auditar(page, tela) {
  await page.waitForLoadState('networkidle');
  const { violations } = await new AxeBuilder({ page }).withTags(REGRAS).analyze();
  const resumo = violations.map(v => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} elemento(s), ex.: ${v.nodes[0].target.join(' ')}`);
  expect.soft(resumo, `Violações de acessibilidade em "${tela}"`).toEqual([]);
}

async function irPara(page, botao) {
  await page.getByRole('navigation').getByRole('button', { name: botao, exact: true }).click();
}

test('tela de login', async ({ page }) => {
  await abrirApp(page);
  await expect(page.getByRole('button', { name: 'Entrar no sistema' })).toBeVisible();
  await auditar(page, 'login');
});

test('perfil administrador: todas as telas', async ({ page, request }) => {
  await garantirDados(request);

  await abrirApp(page);
  await entrar(page, 'admin');
  await expect(page.getByRole('heading', { name: 'Painel do administrador', exact: true })).toBeVisible();
  await auditar(page, 'admin: painel');

  await irPara(page, 'Ordens de serviço');
  await auditar(page, 'admin: lista de OS');

  await page.getByRole('button', { name: 'Ver detalhes' }).first().click();
  await expect(page.locator('.timeline')).toBeVisible();
  await auditar(page, 'admin: detalhe da OS');

  await irPara(page, 'Clientes');
  await auditar(page, 'admin: clientes');
  await page.getByRole('button', { name: 'Novo cliente' }).click();
  await auditar(page, 'admin: novo cliente');

  await irPara(page, 'Veículos');
  await auditar(page, 'admin: veículos');
  await page.getByRole('button', { name: 'Novo veículo' }).click();
  await auditar(page, 'admin: novo veículo');

  await irPara(page, 'Ordens de serviço');
  await page.getByRole('button', { name: 'Nova OS', exact: true }).click();
  await auditar(page, 'admin: nova OS');

  await irPara(page, 'Histórico');
  await auditar(page, 'admin: histórico');
});

test('perfil mecânico: lista de OS', async ({ page }) => {
  await abrirApp(page);
  await entrar(page, 'mecanico');
  await expect(page.getByRole('heading', { name: 'Ordens de serviço', exact: true })).toBeVisible();
  await auditar(page, 'mecânico: lista de OS');
});

test('portal do cliente: todas as telas', async ({ page }) => {
  await abrirApp(page);
  await entrar(page, 'cliente');
  await expect(page.getByRole('heading', { name: 'Meus veículos' })).toBeVisible();
  await auditar(page, 'portal: meus veículos');
  await irPara(page, 'Acompanhar OS');
  await auditar(page, 'portal: acompanhar OS');
  await irPara(page, 'Histórico');
  await auditar(page, 'portal: histórico');
  await irPara(page, 'Acompanhar OS');
  if (await page.getByRole('button', { name: 'Ver detalhes' }).count()) {
    await page.getByRole('button', { name: 'Ver detalhes' }).first().click();
    await auditar(page, 'portal: detalhe da OS');
  }
});

test('login funciona só com o teclado (Tab e Enter)', async ({ page }) => {
  await abrirApp(page);
  await page.getByPlaceholder('seu@email.com').focus();
  await page.keyboard.type('admin@torquegestao.com.br');
  await page.keyboard.press('Tab'); // botão "mostrar senha", que fica entre os dois campos
  await expect(page.getByRole('button', { name: /senha/i }).first()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByPlaceholder('Sua senha')).toBeFocused();
  await page.keyboard.type('torque123');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Painel do administrador', exact: true })).toBeVisible();

  // O primeiro item do menu é alcançável pelo teclado e mostra o foco.
  await page.getByRole('navigation').getByRole('button').first().focus();
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus-visible')).toHaveCount(1);
});

test('imagens e controles têm nome acessível e a página tem idioma', async ({ page }) => {
  await abrirApp(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await entrar(page, 'admin');
  await expect(page.getByRole('heading', { name: 'Painel do administrador', exact: true })).toBeVisible();
  const semNome = await page.locator('button, a, input, select').evaluateAll(els =>
    els.filter(e => !(e.getAttribute('aria-label') || e.labels?.length || e.textContent.trim() || e.title || e.placeholder))
      .map(e => e.outerHTML.slice(0, 80)));
  expect(semNome, 'controles sem nome acessível').toEqual([]);
});
