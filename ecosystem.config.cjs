module.exports = {
  apps: [
    {
      name: 'plannerfin-server',
      script: 'server/apiServer.js',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
