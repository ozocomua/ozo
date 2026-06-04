module.exports = {
  apps: [
    {
      name: "brosco",
      script: "npm",
      args: "run start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
      // после git pull пересобрать:
      // pm2 restart brosco --update-env
    },
  ],
}
