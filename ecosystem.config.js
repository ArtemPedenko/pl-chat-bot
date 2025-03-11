module.exports = {
  apps: [
    {
      name: 'pl-chat-bot',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
    },
  ],
};
