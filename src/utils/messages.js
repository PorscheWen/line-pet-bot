const { healthTagMap, genderMap, calcAge } = require('../services/petService');
const { taskTypeMap, statusMap } = require('../services/taskService');
const { styleLabels } = require('../services/aiService');

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
        action: item.postback
          ? { type: 'postback', label: item.label, data: item.postback, displayText: item.label }
          : { type: 'message', label: item.label, text: item.text || item.label },
      })),
    },
  };
}

function welcomeMessage(displayName) {
  return {
    type: 'flex',
    altText: '歡迎使用寵物管理Bot！',
    contents: {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '🐾', size: '5xl', align: 'center', margin: 'md' },
        ],
        paddingAll: 'md',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: `歡迎，${displayName}！`, weight: 'bold', size: 'xl', align: 'center' },
          { type: 'text', text: '我是您的寵物管理助手', color: '#888888', align: 'center', margin: 'sm' },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              { type: 'text', text: '🐾 我的寵物 - 管理寵物資料', size: 'sm', color: '#555555' },
              { type: 'text', text: '📋 共養任務 - 查看與完成任務', size: 'sm', color: '#555555' },
              { type: 'text', text: '🤖 AI虛擬寵物 - 生成AI畫像', size: 'sm', color: '#555555' },
              { type: 'text', text: '🔔 提醒設定 - 用藥/疫苗提醒', size: 'sm', color: '#555555' },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            action: { type: 'message', label: '🐾 我的寵物', text: '我的寵物' },
            style: 'primary',
            color: '#FF6B6B',
            flex: 1,
          },
          {
            type: 'button',
            action: { type: 'message', label: '📋 任務', text: '共養任務' },
            style: 'secondary',
            flex: 1,
          },
        ],
      },
    },
  };
}

function petListMessage(pets) {
  if (!pets.length) {
    return quickReply('您還沒有寵物資料 🐾\n輸入「新增寵物」開始添加！', [
      { label: '➕ 新增寵物', text: '新增寵物' },
    ]);
  }

  const bubbles = pets.map(pet => ({
    type: 'bubble',
    size: 'micro',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: pet.name, weight: 'bold', size: 'md', align: 'center' },
        { type: 'text', text: pet.breed || '品種未知', size: 'xs', color: '#888888', align: 'center' },
        {
          type: 'text',
          text: healthTagMap[pet.health_tag] || pet.health_tag,
          size: 'xs',
          align: 'center',
          color: pet.health_tag === 'healthy' ? '#27AE60' : pet.health_tag === 'sick' ? '#E74C3C' : '#F39C12',
          margin: 'sm',
        },
        { type: 'text', text: `年齡：${calcAge(pet.birth_date)}`, size: 'xs', color: '#888888', margin: 'xs', align: 'center' },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: { type: 'postback', label: '查看詳情', data: `action=view_pet&pet_id=${pet.id}` },
          style: 'primary',
          color: '#FF6B6B',
          height: 'sm',
        },
      ],
    },
  }));

  bubbles.push({
    type: 'bubble',
    size: 'micro',
    body: {
      type: 'box',
      layout: 'vertical',
      justifyContent: 'center',
      contents: [
        { type: 'text', text: '➕', size: '4xl', align: 'center' },
        { type: 'text', text: '新增寵物', size: 'sm', align: 'center', color: '#888888', margin: 'sm' },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: { type: 'message', label: '新增', text: '新增寵物' },
          style: 'secondary',
          height: 'sm',
        },
      ],
    },
  });

  return {
    type: 'flex',
    altText: `您有 ${pets.length} 隻寵物`,
    contents: { type: 'carousel', contents: bubbles },
  };
}

function petDetailMessage(pet, photos = []) {
  const primaryPhoto = photos.find(p => p.is_primary) || photos[0];
  const bubble = {
    type: 'bubble',
    ...(primaryPhoto ? {
      hero: {
        type: 'image',
        url: primaryPhoto.photo_url,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      },
    } : {}),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: `🐾 ${pet.name}`, weight: 'bold', size: 'xl' },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          spacing: 'xs',
          contents: [
            pet.breed ? { type: 'text', text: `品種：${pet.breed}`, size: 'sm', color: '#555555' } : null,
            { type: 'text', text: `年齡：${calcAge(pet.birth_date)}`, size: 'sm', color: '#555555' },
            pet.gender ? { type: 'text', text: `性別：${genderMap[pet.gender] || pet.gender}`, size: 'sm', color: '#555555' } : null,
            {
              type: 'text',
              text: `健康：${healthTagMap[pet.health_tag] || pet.health_tag}`,
              size: 'sm',
              color: pet.health_tag === 'healthy' ? '#27AE60' : pet.health_tag === 'sick' ? '#E74C3C' : '#F39C12',
            },
            pet.chip_number ? { type: 'text', text: `晶片：${pet.chip_number}`, size: 'sm', color: '#555555' } : null,
            pet.notes ? { type: 'text', text: `備註：${pet.notes}`, size: 'sm', color: '#555555', wrap: true } : null,
          ].filter(Boolean),
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          action: { type: 'postback', label: '📝 新增任務', data: `action=create_task&pet_id=${pet.id}` },
          style: 'primary',
          color: '#FF6B6B',
          flex: 1,
          height: 'sm',
        },
        {
          type: 'button',
          action: { type: 'postback', label: '🗑️ 刪除', data: `action=delete_pet_confirm&pet_id=${pet.id}` },
          style: 'secondary',
          flex: 1,
          height: 'sm',
        },
      ],
    },
  };

  return { type: 'flex', altText: `${pet.name} 的詳細資料`, contents: bubble };
}

function taskListMessage(tasks, title = '共養任務') {
  if (!tasks.length) {
    return quickReply(`${title}：目前沒有任務 🎉`, [
      { label: '➕ 建立任務', postback: 'action=select_pet_for_task' },
      { label: '🐾 我的寵物', text: '我的寵物' },
    ]);
  }

  const bubbles = tasks.map(task => ({
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: taskTypeMap[task.task_type] || task.task_type, weight: 'bold', size: 'lg' },
        { type: 'text', text: `寵物：${task.pet_name || '未知'}`, size: 'sm', color: '#555555', margin: 'sm' },
        task.description ? { type: 'text', text: task.description, size: 'sm', color: '#888888', wrap: true } : null,
        task.assigned_name ? { type: 'text', text: `負責：${task.assigned_name}`, size: 'sm', color: '#555555' } : null,
        task.due_date ? { type: 'text', text: `截止：${task.due_date}`, size: 'sm', color: '#E74C3C' } : null,
        {
          type: 'text',
          text: statusMap[task.status] || task.status,
          size: 'sm',
          color: task.status === 'completed' ? '#27AE60' : '#F39C12',
          margin: 'sm',
        },
      ].filter(Boolean),
    },
    footer: task.status === 'pending' ? {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: { type: 'postback', label: '✅ 完成任務', data: `action=complete_task&task_id=${task.id}` },
          style: 'primary',
          color: '#27AE60',
          height: 'sm',
        },
      ],
    } : undefined,
  }));

  return { type: 'flex', altText: title, contents: { type: 'carousel', contents: bubbles } };
}

function aiStyleSelector() {
  return {
    type: 'flex',
    altText: '選擇 AI 虛擬寵物風格',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '🤖 選擇生成風格', weight: 'bold', size: 'xl', align: 'center' },
          { type: 'text', text: '請選擇您想要的虛擬寵物風格', size: 'sm', color: '#888888', align: 'center', margin: 'sm' },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: styleLabels.map(style => ({
              type: 'button',
              action: { type: 'postback', label: style, data: `action=ai_style&style=${style}`, displayText: `選擇${style}風格` },
              style: 'secondary',
              height: 'sm',
            })),
          },
        ],
      },
    },
  };
}

function helpMessage() {
  const makeBubble = (color, emoji, title, subtitle, steps, quickActions) => ({
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: color,
      paddingAll: 'md',
      contents: [
        { type: 'text', text: emoji, size: '3xl', align: 'center' },
        { type: 'text', text: title, weight: 'bold', size: 'lg', color: '#FFFFFF', align: 'center', margin: 'sm' },
        { type: 'text', text: subtitle, size: 'xs', color: '#FFFFFF', align: 'center', margin: 'xs', wrap: true, offsetTop: '2px' },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: 'lg',
      spacing: 'sm',
      contents: steps.map(([step, desc]) => ({
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            width: '24px',
            contents: [{ type: 'text', text: step, size: 'xs', color: color, weight: 'bold', align: 'center' }],
          },
          { type: 'text', text: desc, size: 'xs', color: '#555555', flex: 1, wrap: true },
        ],
      })),
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      paddingAll: 'md',
      contents: quickActions.map(([label, text]) => ({
        type: 'button',
        action: { type: 'message', label, text },
        style: 'primary',
        color,
        height: 'sm',
      })),
    },
  });

  return {
    type: 'flex',
    altText: '🐾 寵物管理Bot 操作說明（左右滑動查看各功能）',
    contents: {
      type: 'carousel',
      contents: [
        // 1. 總覽
        {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#FF6B6B',
            paddingAll: 'lg',
            contents: [
              { type: 'text', text: '🐾', size: '5xl', align: 'center' },
              { type: 'text', text: '寵物管理 Bot', weight: 'bold', size: 'xl', color: '#FFFFFF', align: 'center', margin: 'sm' },
              { type: 'text', text: '向左滑動查看各功能說明', size: 'xs', color: '#FFE0E0', align: 'center', margin: 'xs' },
            ],
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            paddingAll: 'lg',
            contents: [
              { type: 'text', text: '📋 六大功能', weight: 'bold', size: 'sm', color: '#333333' },
              { type: 'separator', margin: 'sm' },
              ...[
                ['🐾', '我的寵物', '管理寵物基本資料'],
                ['📋', '照護任務', '共養任務分工追蹤'],
                ['🤖', 'AI虛擬寵物', '生成風格化寵物畫像'],
                ['👥', '共養群組', '邀請家人一起照顧'],
                ['🔔', '提醒設定', '定時推播照護提醒'],
                ['❓', '操作說明', '隨時查看使用指引'],
              ].map(([icon, name, desc]) => ({
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
                      { type: 'text', text: name, size: 'sm', weight: 'bold', color: '#333333' },
                      { type: 'text', text: desc, size: 'xs', color: '#888888', wrap: true },
                    ],
                  },
                ],
              })),
              { type: 'separator', margin: 'md' },
              { type: 'text', text: '💡 任何時候輸入「取消」可中斷操作', size: 'xs', color: '#AAAAAA', wrap: true, margin: 'sm' },
            ],
          },
        },

        // 2. 寵物管理
        makeBubble('#FF6B6B', '🐾', '我的寵物', '管理您的毛小孩資料', [
          ['1️⃣', '輸入「我的寵物」查看所有寵物列表'],
          ['2️⃣', '輸入「新增寵物」依步驟輸入名字、品種、性別、生日'],
          ['3️⃣', '在寵物卡片點「查看詳情」進入詳細頁面'],
          ['4️⃣', '在詳情頁可上傳照片、設定健康狀態'],
          ['5️⃣', '輸入「疫苗記錄」查看最近看診/疫苗紀錄'],
        ], [
          ['🐾 查看我的寵物', '我的寵物'],
          ['➕ 新增寵物', '新增寵物'],
        ]),

        // 3. 照護任務
        makeBubble('#4CAF50', '📋', '照護任務', '分工合作，不遺漏每件大小事', [
          ['1️⃣', '輸入「共養任務」查看所有待辦與已完成任務'],
          ['2️⃣', '在寵物詳情頁點「新增任務」選擇類型（餵食/散步/洗澡/看診/用藥/美容）'],
          ['3️⃣', '輸入「完成任務」標記最新待辦任務為完成'],
          ['4️⃣', '輸入「最近共養任務」快速查看最近 3 筆記錄'],
          ['💡', '每日早上 8:00 自動推播待完成任務摘要'],
        ], [
          ['📋 查看共養任務', '共養任務'],
          ['✅ 完成最新任務', '完成任務'],
        ]),

        // 4. AI 虛擬寵物
        makeBubble('#9C27B0', '🤖', 'AI 虛擬寵物', '上傳照片，生成專屬風格畫像', [
          ['1️⃣', '輸入「生成虛擬寵物」或點選單按鈕'],
          ['2️⃣', '選擇風格：Q版可愛、懷舊水彩、3D渲染、動漫、寫實攝影'],
          ['3️⃣', '選好風格後，直接傳送寵物照片'],
          ['4️⃣', 'AI 會分析照片並生成對應風格的描述'],
          ['5️⃣', '輸入「我的虛擬寵物」查看最多 5 筆虛擬寵物庫'],
        ], [
          ['🤖 開始生成', '生成虛擬寵物'],
          ['🖼️ 查看虛擬寵物庫', '我的虛擬寵物'],
        ]),

        // 5. 共養群組
        makeBubble('#2196F3', '👥', '共養群組', '邀請家人一起參與照護', [
          ['1️⃣', '輸入「建立共養群組」設定群組名稱，系統自動產生 8 碼邀請碼'],
          ['2️⃣', '把邀請碼分享給家人或朋友'],
          ['3️⃣', '家人輸入「加入群組」後輸入邀請碼即可加入'],
          ['4️⃣', '群組成員可共同查看與完成照護任務'],
          ['5️⃣', '輸入「共養群組」查看目前群組資訊'],
        ], [
          ['👥 查看我的群組', '共養群組'],
          ['➕ 建立新群組', '建立共養群組'],
        ]),

        // 6. 提醒設定
        makeBubble('#FF9800', '🔔', '提醒設定', '定時推播，不錯過重要照護事項', [
          ['1️⃣', '輸入「提醒設定」查看所有已設定的提醒'],
          ['2️⃣', '輸入「新增提醒」開始設定（選擇寵物→類型→時間→說明）'],
          ['3️⃣', '支援類型：用藥、疫苗、看診、美容、餵食'],
          ['4️⃣', '到達設定時間時，Bot 會主動推播提醒訊息'],
          ['💡', '每日早上 8:00 另有待辦任務摘要自動推播'],
        ], [
          ['🔔 查看提醒設定', '提醒設定'],
          ['➕ 新增提醒', '新增提醒'],
        ]),
      ],
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

module.exports = {
  textMessage,
  quickReply,
  welcomeMessage,
  petListMessage,
  petDetailMessage,
  taskListMessage,
  aiStyleSelector,
  helpMessage,
  memoryGameMessage,
};
