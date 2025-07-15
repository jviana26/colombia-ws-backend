// config.js
const ENV = process.env.NODE_ENV || 'production';

const config = {
  local: {
    BASE_URL: 'http://localhost:3001',
    WS_URL: 'ws://localhost:3002'
  },
  production: {
    BASE_URL: 'https://cheker.golpedeestadochek.xyz/api',
    WS_URL: 'wss://cheker.golpedeestadochek.xyz'
  }
};

module.exports = config[ENV];
