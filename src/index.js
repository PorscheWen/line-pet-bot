require('dotenv').config();
const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
const { handleEvent } = require('./lineBot');
const { initDb } = require('./db');
const { startScheduler } = require('./scheduler');

const lineConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

const client = new Client(lineConfig);
const app = express();

// 記憶體日誌（最近 50 筆）
const recentLogs = [];
function addLog(level, msg) {
  const entry = { time: new Date().toISOString(), level, msg };
  recentLogs.push(entry);
  if (recentLogs.length > 50) recentLogs.shift();
  console[level === 'error' ? 'error' : 'log'](entry.time, msg);
}

app.get('/', (req, res) => res.send('🐾 Line Pet Bot is running!'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/logs', (req, res) => res.json(recentLogs));

app.post('/webhook', middleware(lineConfig), async (req, res) => {
  res.sendStatus(200);
  const events = req.body.events;
  addLog('info', `[Webhook] 收到 ${events.length} 個事件`);
  await Promise.all(events.map(event => handleEvent(event, client, addLog))).catch(err =>
    addLog('error', `[Webhook] 處理失敗: ${err.message}`)
  );
});

const PORT = process.env.PORT || 3000;

initDb();
startScheduler(client);

app.listen(PORT, () => {
  addLog('info', `🐾 Line Pet Bot 啟動，port: ${PORT}`);
});
