require('dotenv').config();
const { Client } = require('@line/bot-sdk');

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

async function setupRichMenu() {
  const richMenuId = await client.createRichMenu({
    size: { width: 2500, height: 843 },
    selected: true,
    name: '寵物管理主選單',
    chatBarText: '🐾 開啟選單',
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: { type: 'message', text: '我的寵物' },
      },
      {
        bounds: { x: 833, y: 0, width: 833, height: 843 },
        action: { type: 'message', text: '共養任務' },
      },
      {
        bounds: { x: 1666, y: 0, width: 834, height: 843 },
        action: { type: 'message', text: '生成虛擬寵物' },
      },
    ],
  });

  await client.setDefaultRichMenu(richMenuId);
  console.log('Rich Menu 設定完成:', richMenuId);
  return richMenuId;
}

if (require.main === module) {
  setupRichMenu().catch(console.error);
}

module.exports = { setupRichMenu };
