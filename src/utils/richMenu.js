require('dotenv').config();
const { Client } = require('@line/bot-sdk');

// canvas 只在本地執行 setup 時使用，Render 伺服器不需要
let createCanvas;
try { createCanvas = require('canvas').createCanvas; } catch {
  createCanvas = null;
}

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

const W = 2500;
const H = 1686;
const ROW_H = 843;
const COL_WIDTHS = [833, 833, 834];
const GAP = 8;

const CELLS = [
  { emoji: '🐾', label: '我的寵物',  bg: '#FF6B6B', text: '我的寵物' },
  { emoji: '📋', label: '照護任務',  bg: '#4CAF50', text: '共養任務' },
  { emoji: '🤖', label: 'AI虛擬寵物', bg: '#9C27B0', text: '生成虛擬寵物' },
  { emoji: '👥', label: '共養群組',  bg: '#2196F3', text: '共養群組' },
  { emoji: '🔔', label: '提醒設定',  bg: '#FF9800', text: '提醒設定' },
  { emoji: '❓', label: '操作說明',  bg: '#607D8B', text: '操作說明' },
];

function generateRichMenuImage() {
  if (!createCanvas) throw new Error('請先執行 npm install canvas 再執行此腳本');
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // 黑色底色
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(0, 0, W, H);

  for (let row = 0; row < 2; row++) {
    let xOffset = 0;
    for (let col = 0; col < 3; col++) {
      const idx = row * 3 + col;
      const cw = COL_WIDTHS[col];
      const x = xOffset + GAP;
      const y = row * ROW_H + GAP;
      const w = cw - GAP * 2;
      const h = ROW_H - GAP * 2;
      const cx = x + w / 2;
      const cy = y + h / 2;

      // 圓角格子背景
      ctx.fillStyle = CELLS[idx].bg;
      roundRect(ctx, x, y, w, h, 24);
      ctx.fill();

      // 半透明遮罩讓顏色更有層次
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(ctx, x, y, w, h / 2.5, 24);
      ctx.fill();

      // Emoji（大字）
      ctx.font = '220px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(CELLS[idx].emoji, cx, cy - 90);

      // 中文標籤
      ctx.font = 'bold 100px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(CELLS[idx].label, cx, cy + 130);

      xOffset += cw;
    }
  }

  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function setupRichMenu() {
  // 清除舊選單
  try {
    const existing = await client.getDefaultRichMenuId();
    if (existing) {
      await client.deleteRichMenu(existing);
      console.log('已刪除舊選單:', existing);
    }
  } catch {}

  console.log('建立新 Rich Menu...');
  const richMenuId = await client.createRichMenu({
    size: { width: W, height: H },
    selected: true,
    name: '寵物管理主選單 v2',
    chatBarText: '🐾 功能選單',
    areas: [
      // 第一排（不加 label 欄位，避免 LINE API 相容問題）
      { bounds: { x: 0,    y: 0,   width: 833, height: 843 }, action: { type: 'message', text: '我的寵物' } },
      { bounds: { x: 833,  y: 0,   width: 833, height: 843 }, action: { type: 'message', text: '共養任務' } },
      { bounds: { x: 1666, y: 0,   width: 834, height: 843 }, action: { type: 'message', text: '生成虛擬寵物' } },
      // 第二排
      { bounds: { x: 0,    y: 843, width: 833, height: 843 }, action: { type: 'message', text: '共養群組' } },
      { bounds: { x: 833,  y: 843, width: 833, height: 843 }, action: { type: 'message', text: '提醒設定' } },
      { bounds: { x: 1666, y: 843, width: 834, height: 843 }, action: { type: 'message', text: '操作說明' } },
    ],
  });
  console.log('Rich Menu 已建立:', richMenuId);

  console.log('生成並上傳選單圖片...');
  const imageBuffer = generateRichMenuImage();
  await client.setRichMenuImage(richMenuId, imageBuffer, 'image/png');
  console.log('圖片上傳完成');

  await client.setDefaultRichMenu(richMenuId);
  console.log('✅ Rich Menu 設定完成！ID:', richMenuId);
  return richMenuId;
}

if (require.main === module) {
  setupRichMenu().catch(console.error);
}

module.exports = { setupRichMenu };
