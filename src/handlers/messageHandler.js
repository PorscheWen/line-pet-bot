const {
  getOrCreateUser, getUserState, setUserState, clearUserState,
  getPetsByOwner, createPet, getPetById, getPetPhotos,
} = require('../services/petService');
const { getRecentTasks, getPendingTasksForUser, completeLatestTask, taskTypeMap } = require('../services/taskService');
const { getUserGroups, joinGroupByCode, createGroup } = require('../services/groupService');
const { getRemindersByUser, reminderTypeMap } = require('../services/notificationService');
const { getVirtualPetsByUser, styleLabels } = require('../services/aiService');
const {
  textMessage, quickReply, welcomeMessage,
  petListMessage, petDetailMessage, taskListMessage, aiStyleSelector, helpMessage,
} = require('../utils/messages');

async function handleMessage(client, event) {
  if (event.message.type !== 'text') return;

  const lineUserId = event.source.userId;
  const text = event.message.text.trim();

  let profile = {};
  try { profile = await client.getProfile(lineUserId); } catch {}

  const user = getOrCreateUser(lineUserId, {
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
  });

  const { state, context } = getUserState(lineUserId);

  // 取消指令優先
  if (text === '取消' || text === '取消操作') {
    clearUserState(lineUserId);
    await reply(client, event, [quickReply('已取消操作', [
      { label: '🐾 我的寵物', text: '我的寵物' },
      { label: '📋 共養任務', text: '共養任務' },
    ])]);
    return;
  }

  // 多步驟流程狀態處理
  if (state !== 'IDLE') {
    await handleStateFlow(client, event, lineUserId, text, state, context);
    return;
  }

  // 主要指令
  const cmd = text.toLowerCase();

  if (['我的寵物', '寵物列表', '寵物'].includes(text)) {
    const pets = getPetsByOwner(lineUserId);
    await reply(client, event, [petListMessage(pets)]);
    return;
  }

  if (['新增寵物', '添加寵物', '加入寵物'].includes(text)) {
    setUserState(lineUserId, 'ADDING_PET_NAME', {});
    await reply(client, event, [textMessage('請輸入寵物的名字：')]);
    return;
  }

  if (['共養任務', '任務列表', '我的任務'].includes(text)) {
    const tasks = getRecentTasks(lineUserId, 10);
    await reply(client, event, [taskListMessage(tasks, '共養任務')]);
    return;
  }

  if (['最近共養任務', '顯示最近共養任務', '最近任務'].includes(text)) {
    const tasks = getRecentTasks(lineUserId, 3);
    if (!tasks.length) {
      await reply(client, event, [textMessage('目前沒有任務記錄 🎉')]);
      return;
    }
    const { formatTaskList } = require('../services/taskService');
    await reply(client, event, [
      textMessage(`📋 最近 3 筆任務：\n\n${formatTaskList(tasks)}`),
      taskListMessage(tasks, '最近任務'),
    ]);
    return;
  }

  if (['完成任務', '任務完成', '已完成'].includes(text)) {
    const result = completeLatestTask(lineUserId);
    if (!result) {
      await reply(client, event, [textMessage('目前沒有待完成的任務 🎉')]);
      return;
    }
    if (result.alreadyDone) {
      await reply(client, event, [textMessage('最新任務已經完成了 ✅')]);
      return;
    }
    const task = result.task;
    await reply(client, event, [
      textMessage(`✅ 任務完成！\n${taskTypeMap[task.task_type] || task.task_type}\n完成時間：${task.completed_at.slice(0, 16)}`),
    ]);
    return;
  }

  if (['生成虛擬寵物', 'AI寵物', 'ai虛擬寵物', '虛擬寵物'].includes(text.toLowerCase())) {
    await reply(client, event, [aiStyleSelector()]);
    return;
  }

  if (['我的虛擬寵物', '虛擬寵物庫'].includes(text)) {
    const virtualPets = getVirtualPetsByUser(lineUserId);
    if (!virtualPets.length) {
      await reply(client, event, [quickReply('您還沒有虛擬寵物 🤖\n傳送寵物照片來生成！', [
        { label: '🤖 立即生成', text: '生成虛擬寵物' },
      ])]);
      return;
    }
    const list = virtualPets.slice(0, 5).map((vp, i) =>
      `${i + 1}. ${vp.style}風格 - ${vp.pet_name || '未綁定'} (${vp.created_at.slice(0, 10)})`
    ).join('\n');
    await reply(client, event, [textMessage(`🤖 我的虛擬寵物庫：\n\n${list}`)]);
    return;
  }

  if (['共養群組', '群組'].includes(text)) {
    const groups = getUserGroups(lineUserId);
    if (!groups.length) {
      await reply(client, event, [quickReply('您還沒有共養群組', [
        { label: '➕ 建立群組', text: '建立共養群組' },
        { label: '🔗 加入群組', text: '加入群組' },
      ])]);
      return;
    }
    const list = groups.map(g => `• ${g.name}（${g.member_count}人，邀請碼：${g.invite_code}）`).join('\n');
    await reply(client, event, [
      textMessage(`👥 我的共養群組：\n\n${list}`),
      quickReply('', [
        { label: '➕ 建立群組', text: '建立共養群組' },
        { label: '🔗 加入群組', text: '加入群組' },
      ]),
    ]);
    return;
  }

  if (['建立共養群組', '新建群組'].includes(text)) {
    setUserState(lineUserId, 'CREATING_GROUP_NAME', {});
    await reply(client, event, [textMessage('請輸入共養群組名稱：')]);
    return;
  }

  if (['加入群組', '加入共養群組'].includes(text)) {
    setUserState(lineUserId, 'JOINING_GROUP', {});
    await reply(client, event, [textMessage('請輸入群組邀請碼（8位英數字）：')]);
    return;
  }

  if (['提醒設定', '我的提醒', '提醒'].includes(text)) {
    const reminders = getRemindersByUser(lineUserId);
    if (!reminders.length) {
      await reply(client, event, [quickReply('您還沒有設定提醒', [
        { label: '🔔 新增提醒', text: '新增提醒' },
      ])]);
      return;
    }
    const list = reminders.map(r => `• ${reminderTypeMap[r.reminder_type] || r.reminder_type} - ${r.pet_name} @ ${r.reminder_time}`).join('\n');
    await reply(client, event, [textMessage(`🔔 我的提醒：\n\n${list}`)]);
    return;
  }

  if (['說明', 'help', '功能', '指令'].includes(text.toLowerCase())) {
    await reply(client, event, [helpMessage()]);
    return;
  }

  // 最近疫苗
  if (['最近疫苗', '疫苗記錄', '疫苗'].includes(text)) {
    const { db } = require('../db');
    const dbUser = require('../services/petService').getUserByLineId(lineUserId);
    if (dbUser) {
      const tasks = db.prepare(`
        SELECT ct.*, p.name as pet_name FROM care_tasks ct
        JOIN pets p ON ct.pet_id = p.id
        WHERE p.owner_id = ? AND ct.task_type = 'vet'
        ORDER BY ct.created_at DESC LIMIT 5
      `).all(dbUser.id);

      if (!tasks.length) {
        await reply(client, event, [textMessage('尚無疫苗/看診記錄')]);
        return;
      }
      const list = tasks.map(t =>
        `• ${t.pet_name} - ${t.status === 'completed' ? '✅已完成' : '⏳待完成'} (${t.created_at.slice(0, 10)})`
      ).join('\n');
      await reply(client, event, [textMessage(`💉 最近疫苗/看診記錄：\n\n${list}`)]);
    }
    return;
  }

  // 預設回覆
  await reply(client, event, [
    quickReply('不確定您的意思，請選擇：', [
      { label: '🐾 我的寵物', text: '我的寵物' },
      { label: '📋 共養任務', text: '共養任務' },
      { label: '🤖 AI虛擬寵物', text: '生成虛擬寵物' },
      { label: '❓ 說明', text: '說明' },
    ]),
  ]);
}

async function handleStateFlow(client, event, lineUserId, text, state, context) {
  switch (state) {
    case 'ADDING_PET_NAME': {
      setUserState(lineUserId, 'ADDING_PET_BREED', { name: text });
      await reply(client, event, [
        quickReply(`寵物名字：${text}\n請輸入品種（或點選跳過）：`, [
          { label: '跳過', text: '跳過' },
        ]),
      ]);
      break;
    }

    case 'ADDING_PET_BREED': {
      const breed = text === '跳過' ? null : text;
      setUserState(lineUserId, 'ADDING_PET_GENDER', { ...context, breed });
      await reply(client, event, [
        quickReply('請選擇性別：', [
          { label: '♂ 男生', text: 'male' },
          { label: '♀ 女生', text: 'female' },
          { label: '不確定', text: 'unknown' },
        ]),
      ]);
      break;
    }

    case 'ADDING_PET_GENDER': {
      const genderMap = { male: 'male', female: 'female', 'male': 'male', 'female': 'female', 'unknown': 'unknown', '不確定': 'unknown' };
      const gender = genderMap[text] || 'unknown';
      setUserState(lineUserId, 'ADDING_PET_BIRTHDATE', { ...context, gender });
      await reply(client, event, [
        quickReply('請輸入生日（格式：2020-01-15）或跳過：', [
          { label: '跳過', text: '跳過' },
        ]),
      ]);
      break;
    }

    case 'ADDING_PET_BIRTHDATE': {
      const birthDate = text === '跳過' ? null : text;
      const pet = createPet(lineUserId, {
        name: context.name,
        breed: context.breed,
        gender: context.gender,
        birthDate,
      });
      clearUserState(lineUserId);
      await reply(client, event, [
        textMessage(`✅ 寵物「${pet.name}」已新增成功！`),
        quickReply('接下來要做什麼？', [
          { label: '📷 上傳照片', postback: `action=upload_photo&pet_id=${pet.id}` },
          { label: '📋 新增任務', postback: `action=create_task&pet_id=${pet.id}` },
          { label: '🐾 我的寵物', text: '我的寵物' },
        ]),
      ]);
      break;
    }

    case 'CREATING_GROUP_NAME': {
      const { getPetsByOwner } = require('../services/petService');
      const pets = getPetsByOwner(lineUserId);
      const group = createGroup(lineUserId, text, pets.map(p => p.id));
      clearUserState(lineUserId);
      await reply(client, event, [
        textMessage(`✅ 共養群組「${text}」已建立！\n邀請碼：${group.invite_code}\n\n請分享邀請碼給家人或朋友加入`),
        quickReply('', [
          { label: '👥 查看群組', text: '共養群組' },
          { label: '📋 共養任務', text: '共養任務' },
        ]),
      ]);
      break;
    }

    case 'JOINING_GROUP': {
      const result = joinGroupByCode(lineUserId, text);
      clearUserState(lineUserId);
      if (result.success) {
        await reply(client, event, [
          textMessage(`✅ 成功加入「${result.group.name}」！`),
          quickReply('', [{ label: '👥 查看群組', text: '共養群組' }]),
        ]);
      } else {
        await reply(client, event, [
          quickReply(result.message, [
            { label: '🔄 重試', text: '加入群組' },
            { label: '取消', text: '取消' },
          ]),
        ]);
      }
      break;
    }

    default:
      clearUserState(lineUserId);
      await reply(client, event, [textMessage('已重設操作狀態，請重新開始')]);
  }
}

async function reply(client, event, messages) {
  await client.replyMessage({ replyToken: event.replyToken, messages });
}

module.exports = { handleMessage };
