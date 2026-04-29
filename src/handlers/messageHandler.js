'use strict';

const { textMessage, quickReply, memoryGameMessage } = require('../utils/messages');

const GAME_KEYWORDS = ['記憶訓練', '腦力訓練', '記憶遊戲', '翻牌遊戲', '遊戲', '開始遊戲', 'game', 'play'];
const HELP_KEYWORDS = ['說明', 'help', '功能', '指令', '操作說明', '使用說明'];

async function handleMessage(client, event) {
  if (event.message.type !== 'text') return;

  const text = event.message.text.trim();

  if (GAME_KEYWORDS.includes(text.toLowerCase()) || GAME_KEYWORDS.includes(text)) {
    await reply(client, event, [memoryGameMessage()]);
    return;
  }

  if (HELP_KEYWORDS.includes(text.toLowerCase())) {
    await reply(client, event, [
      textMessage('🧠 記憶訓練遊戲\n\n輸入「遊戲」或「記憶訓練」即可開始。\n\n支援三種難度：\n🌱 初級 - 12 張牌\n🌿 中級 - 16 張牌\n🌳 高級 - 24 張牌'),
    ]);
    return;
  }

  await reply(client, event, [
    quickReply('請選擇操作：', [
      { label: '🎮 開始遊戲', text: '遊戲' },
      { label: '❓ 說明', text: '說明' },
    ]),
  ]);
}

async function reply(client, event, messages) {
  await client.replyMessage(event.replyToken, messages);
}

module.exports = { handleMessage };
