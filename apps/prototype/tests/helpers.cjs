// Utilitários compartilhados pelos testes E2E (Playwright).
// Os usuários abaixo são criados por apps/api/tests/e2e_server.py.
const { expect } = require('@playwright/test');

const API_URL = `http://127.0.0.1:${process.env.TORQUE_E2E_API_PORT || 18000}`;
const USUARIOS = {
  admin: { email: 'admin@torquegestao.com.br', senha: 'torque123' },
  mecanico: { email: 'mecanico@example.com', senha: 'mecanico123' },
  cliente: { email: 'portal@example.com', senha: 'portal123' },
};

async function abrirApp(page) {
  const erros = [];
  page.on('pageerror', e => erros.push(e.message));
  await page.addInitScript(url => { window.TORQUE_API_URL = url; }, API_URL);
  await page.goto('/');
  return erros;
}

async function entrar(page, perfil) {
  const { email, senha } = USUARIOS[perfil];
  await page.getByPlaceholder('seu@email.com').fill(email);
  await page.getByPlaceholder('Sua senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
}

// Prepara dados direto na API (mais rápido e estável que clicar pela UI
// quando o cadastro não é o que está sendo testado).
async function apiComo(request, perfil) {
  const { email, senha } = USUARIOS[perfil];
  const login = await request.post(`${API_URL}/auth/login`, { form: { username: email, password: senha } });
  expect(login.ok()).toBeTruthy();
  const headers = { Authorization: `Bearer ${(await login.json()).access_token}` };
  const chamar = async (metodo, rota, data) => {
    const r = await request[metodo](`${API_URL}${rota}`, { headers, data });
    return { status: r.status(), body: r.status() === 204 ? null : await r.json() };
  };
  return {
    get: rota => chamar('get', rota),
    post: async (rota, data) => {
      const r = await chamar('post', rota, data);
      expect(r.status, `${rota}: ${JSON.stringify(r.body)}`).toBe(201);
      return r.body;
    },
  };
}

module.exports = { API_URL, USUARIOS, abrirApp, entrar, apiComo };
