const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApi } = require('../src/api.js');
function setup(responses) {
  const values = new Map(); const calls = []; let expired = false;
  const api = createApi({ baseUrl: 'http://api/', storage: { getItem: k => values.get(k), setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) },
    onUnauthorized: () => { expired = true; }, fetchImpl: async (url, options) => { calls.push({ url, ...options }); const next = responses.shift(); if (next instanceof Error) throw next; return new Response(JSON.stringify(next.body), { status: next.status || 200 }); } });
  return { api, calls, values, expired: () => expired };
}
test('login OAuth2, perfil do servidor e Bearer nas requisições', async () => {
  const s = setup([{ body: { access_token: 'jwt-real' } }, { body: { role: 'cliente' } }, { body: [] }]);
  assert.equal((await s.api.login('a+b@example.com', 'senha&123')).role, 'cliente');
  assert.equal(new URLSearchParams(s.calls[0].body).get('password'), 'senha&123');
  assert.equal(s.calls[0].headers['Content-Type'], 'application/x-www-form-urlencoded');
  await s.api.request('/ordens-servico');
  assert.equal(s.calls[2].url, 'http://api/ordens-servico');
  assert.equal(s.calls[2].headers.Authorization, 'Bearer jwt-real');
  s.api.clear(); assert.equal(s.api.hasSession(), false);
});
test('401 invalida sessão e informa expiração', async () => {
  const s = setup([{ status: 401, body: { detail: 'Sessão expirada' } }]);
  s.values.set('torque_access_token', 'expired');
  await assert.rejects(s.api.request('/clientes'), /Sessão expirada/);
  assert.equal(s.api.hasSession(), false); assert.equal(s.expired(), true);
});
test('login rejeitado não cria sessão nem troca perfil', async () => {
  const s = setup([{ status: 401, body: { detail: 'E-mail ou senha inválidos.' } }]);
  await assert.rejects(s.api.login('a@b.com', 'errada'), /inválidos/);
  assert.equal(s.api.hasSession(), false); assert.equal(s.expired(), false);
});
test('falha em auth/me apaga token recém emitido', async () => {
  const s = setup([{ body: { access_token: 'jwt' } }, { status: 500, body: {} }]);
  await assert.rejects(s.api.login('a@b.com', 'senha'));
  assert.equal(s.api.hasSession(), false);
});
test('erros de validação e conflito são exibidos sem sucesso simulado', async () => {
  const s = setup([{ status: 422, body: { detail: [{ loc: ['body', 'cpf'], msg: 'CPF inválido' }] } }, { status: 409, body: { detail: 'Transição inválida' } }]);
  await assert.rejects(s.api.request('/clientes', { method: 'POST', body: { cpf: 'x' } }), /cpf: CPF inválido/);
  await assert.rejects(s.api.request('/ordens-servico/1/status', { method: 'PATCH', body: { status: 'entregue' } }), /Transição inválida/);
});
test('falha de rede retorna erro e não usa mocks', async () => {
  const s = setup([new TypeError('Failed to fetch')]);
  await assert.rejects(s.api.request('/clientes'), /conectar à API/);
});
test('cancelamento preservado para desmontagem das telas', async () => {
  const error = new Error('cancelado'); error.name = 'AbortError';
  const s = setup([error]); const signal = new AbortController().signal;
  await assert.rejects(s.api.request('/clientes', { signal }), { name: 'AbortError' });
  assert.equal(s.calls[0].signal, signal);
});
