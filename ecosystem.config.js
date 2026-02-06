module.exports = {
  apps: [
    {
      // Frontend - używamy oryginalnej nazwy
      name: 'stojan-shop-frontend',
      cwd: '/home/ec2-user/stojan-shop/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0',
      instances: 1,  // lub 'max' dla wszystkich rdzeni
      exec_mode: 'fork',
      autorestart: true,
      kill_timeout: 5000,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/home/ec2-user/.pm2/logs/stojan-shop-frontend-error.log',
      out_file: '/home/ec2-user/.pm2/logs/stojan-shop-frontend-out.log',
      merge_logs: true,
      time: true
    },
    {
      // Backend - używamy oryginalnej nazwy
      name: 'stojan-shop-backend',
      cwd: '/home/ec2-user/stojan-shop/backend',
      script: 'dist/index.js',
      instances: 1,  // lub 'max' dla wszystkich rdzeni
      exec_mode: 'fork',
      autorestart: true,
      kill_timeout: 5000,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: '/home/ec2-user/.pm2/logs/stojan-shop-backend-error.log',
      out_file: '/home/ec2-user/.pm2/logs/stojan-shop-backend-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
