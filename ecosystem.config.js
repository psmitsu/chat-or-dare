const path = require('node:path');

const project_name = 'chat-or-dare';

module.exports = {
  apps: [
    {
      name: "client",
      cwd: path.resolve(__dirname, 'packages', 'client'),
      script: 'if [ $NODE_ENV == "production" ]; then npm run start; else npm run dev; fi',
    },
    {
      name: "server",
      cwd: path.resolve(__dirname, 'packages', 'server'),
      script: 'if [ $NODE_ENV == "production" ]; then npm run start; else npm run dev; fi',
    }
  ],
  deploy: {
    production: {
      user: process.env.PM2_USER,
      host: [process.env.PM2_HOST],
      repo: process.env.PM2_REPO,
      ref: process.env.PM2_REF,
      path: process.env.PM2_PATH,
      "pre-deploy-local": `scp .env.production ${process.env.PM2_USER}@${process.env.PM2_HOST}:${process.env.PM2_PATH}/current/.env`,
      "post-deploy": "pm2 delete all || npm install && npm run build-all && npm run pm2 start ecosystem.config.js"
    }
  }
}
