function textMessage(text) {
  return { type: 'text', text };
}

function quickReply(text, items) {
  return {
    type: 'text',
    text,
    quickReply: {
      items: items.map(item => ({
        type: 'action',
        action: { type: 'message', label: item.label, text: item.text || item.label },
      })),
    },
  };
}

function memoryGameMessage() {
  return {
    type: 'flex',
    altText: '🧠 記憶訓練遊戲',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#5B6EE8',
        paddingAll: 'lg',
        contents: [
          { type: 'text', text: '🧠', size: '5xl', align: 'center' },
          { type: 'text', text: '記憶訓練遊戲', weight: 'bold', size: 'xl', color: '#FFFFFF', align: 'center', margin: 'sm' },
          { type: 'text', text: '翻牌配對，訓練大腦記憶力', size: 'xs', color: '#C0C8FF', align: 'center', margin: 'xs' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          { type: 'text', text: '✨ 難度選擇', weight: 'bold', size: 'sm', color: '#333333' },
          { type: 'separator', margin: 'sm' },
          ...[
            ['🌱', '初級', '12 張牌，輕鬆入門'],
            ['🌿', '中級', '16 張牌，提升挑戰'],
            ['🌳', '高級', '24 張牌，極限挑戰'],
          ].map(([icon, level, desc]) => ({
            type: 'box',
            layout: 'horizontal',
            spacing: 'md',
            margin: 'sm',
            contents: [
              { type: 'text', text: icon, size: 'sm', flex: 0 },
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                contents: [
                  { type: 'text', text: level, size: 'sm', weight: 'bold', color: '#333333' },
                  { type: 'text', text: desc, size: 'xs', color: '#888888' },
                ],
              },
            ],
          })),
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: { type: 'uri', label: '🎮 開始遊戲', uri: 'https://liff.line.me/2009935174-Tz9GGWOs' },
            style: 'primary',
            color: '#5B6EE8',
          },
        ],
      },
    },
  };
}

function welcomeMessage(displayName) {
  return {
    type: 'flex',
    altText: `歡迎，${displayName}！`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#5B6EE8',
        paddingAll: 'lg',
        contents: [
          { type: 'text', text: '🧠', size: '5xl', align: 'center' },
          { type: 'text', text: `歡迎，${displayName}！`, weight: 'bold', size: 'xl', color: '#FFFFFF', align: 'center', margin: 'sm' },
          { type: 'text', text: '一起來訓練記憶力吧！', size: 'xs', color: '#C0C8FF', align: 'center', margin: 'xs' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          { type: 'text', text: '🎮 翻牌配對記憶遊戲', weight: 'bold', size: 'md', color: '#333333' },
          { type: 'separator', margin: 'sm' },
          { type: 'text', text: '• 三種難度：初級 / 中級 / 高級', size: 'sm', color: '#555555', margin: 'sm' },
          { type: 'text', text: '• 四種主題：水果 / 動物 / 自然 / 混合', size: 'sm', color: '#555555' },
          { type: 'text', text: '• 記錄最佳成績，挑戰自我！', size: 'sm', color: '#555555' },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: { type: 'uri', label: '🎮 立即開始遊戲', uri: 'https://liff.line.me/2009935174-Tz9GGWOs' },
            style: 'primary',
            color: '#5B6EE8',
          },
        ],
      },
    },
  };
}

module.exports = { textMessage, quickReply, memoryGameMessage, welcomeMessage };
