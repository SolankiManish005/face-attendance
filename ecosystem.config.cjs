/**
 * @type {import('pm2').Config}
 */
module.exports = {
  apps: [
    {
      name: "Attendance-backend",
      script: "bun",
      watch: false,
      args: "run start",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        NODE_NO_WARNINGS: "1",
      },
    },
  ],
};
