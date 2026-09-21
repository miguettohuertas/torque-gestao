/* Cliente HTTP único: nenhum fallback para dados simulados. */
(function (root) {
  const createApi = ({ baseUrl, storage, fetchImpl, onUnauthorized = () => {} }) => {
    const key = 'torque_access_token';
    const clear = () => storage.removeItem(key);
    async function request(path, { method = 'GET', body, signal } = {}) {
      const token = storage.getItem(key);
      const headers = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (body !== undefined) headers['Content-Type'] = body instanceof URLSearchParams
        ? 'application/x-www-form-urlencoded' : 'application/json';
      let response;
      try {
        response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}${path}`, {
          method, headers, signal,
          body: body === undefined ? undefined : body instanceof URLSearchParams ? body.toString() : JSON.stringify(body),
        });
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new Error('Não foi possível conectar à API. Verifique sua conexão e tente novamente.');
      }
      if (response.status === 401 && path !== '/auth/login') {
        clear(); onUnauthorized();
      }
      const data = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) {
        const detail = data?.detail;
        const message = Array.isArray(detail) ? detail.map(e => `${e.loc.slice(1).join('.')}: ${e.msg}`).join('\n')
          : typeof detail === 'string' ? detail : `Falha na requisição (${response.status}).`;
        const error = new Error(message); error.status = response.status; throw error;
      }
      return data;
    }
    return {
      request, clear, hasSession: () => Boolean(storage.getItem(key)),
      async login(email, password) {
        clear();
        const result = await request('/auth/login', { method: 'POST', body: new URLSearchParams({ username: email, password }) });
        storage.setItem(key, result.access_token);
        try { return await request('/auth/me'); } catch (error) { clear(); throw error; }
      },
    };
  };
  root.createTorqueApi = createApi;
  if (typeof module !== 'undefined') module.exports = { createApi };
})(globalThis);
