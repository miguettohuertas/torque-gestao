const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  timeout: 60000, testDir: './tests', testMatch: '**/*.spec.cjs', workers: 1,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: [
    { command: `${process.env.TORQUE_PYTHON || 'python3'} tests/e2e_server.py`, cwd: '../api', gracefulShutdown: { signal: 'SIGINT', timeout: 5000 }, url: `http://127.0.0.1:${process.env.TORQUE_E2E_API_PORT || 18000}/health`, timeout: 60000 },
    { command: `${process.env.TORQUE_PYTHON || 'python3'} -m http.server 4173 --bind 127.0.0.1`, url: 'http://127.0.0.1:4173', timeout: 30000 },
  ],
});
