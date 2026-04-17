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
  return textMessage(
    '🐾 寵物管理Bot 指令說明\n\n' +
    '【寵物管理】\n' +
    '• 我的寵物 - 查看所有寵物\n' +
    '• 新增寵物 - 新增寵物資料\n\n' +
    '【共養任務】\n' +
    '• 共養任務 - 查看任務列表\n' +
    '• 完成任務 - 完成最新待辦任務\n' +
    '• 最近共養任務 - 顯示最近3筆任務\n\n' +
    '【AI 虛擬寵物】\n' +
    '• 生成虛擬寵物 - 上傳照片生成AI圖像\n' +
    '• 我的虛擬寵物 - 查看虛擬寵物庫\n\n' +
    '【提醒功能】\n' +
    '• 提醒設定 - 查看提醒\n\n' +
    '【共養群組】\n' +
    '• 共養群組 - 查看群組\n' +
    '• 加入群組 - 輸入邀請碼加入\n\n' +
    '• 取消 - 取消目前操作'
  );
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
};
