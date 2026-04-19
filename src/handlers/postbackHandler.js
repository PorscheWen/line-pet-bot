const {
  getPetById, deletePet, setHealthTag, getUserByLineId,
  healthTagMap, clearUserState, setUserState,
} = require('../services/petService');
const { completeTask, createTask, getTaskById, taskTypeMap } = require('../services/taskService');
const { getGroupById, joinGroupByCode } = require('../services/groupService');
const {
  petDetailMessage, taskListMessage, textMessage, quickReply,
  aiStyleSelector,
} = require('../utils/messages');
const { getPetsByOwner, getPetPhotos } = require('../services/petService');
const { styleLabels } = require('../services/aiService');

function parsePostback(data) {
  const params = {};
  for (const pair of data.split('&')) {
    const [k, v] = pair.split('=');
    params[k] = decodeURIComponent(v || '');
  }
  return params;
}

async function handlePostback(client, event) {
  const lineUserId = event.source.userId;
  const params = parsePostback(event.postback.data);
  const { action } = params;

  switch (action) {
    case 'view_pet': {
      const pet = getPetById(parseInt(params.pet_id));
      if (!pet) {
        await reply(client, event, [textMessage('找不到該寵物 😿')]);
        return;
      }
      const photos = getPetPhotos(pet.id);
      await reply(client, event, [
        petDetailMessage(pet, photos),
        quickReply('更多操作：', [
          { label: '💊 設健康標籤', postback: `action=set_health_menu&pet_id=${pet.id}` },
          { label: '📷 上傳照片', postback: `action=upload_photo&pet_id=${pet.id}` },
          { label: '📋 新增任務', postback: `action=create_task&pet_id=${pet.id}` },
        ]),
      ]);
      break;
    }

    case 'delete_pet_confirm': {
      const pet = getPetById(parseInt(params.pet_id));
      if (!pet) {
        await reply(client, event, [textMessage('找不到該寵物')]);
        return;
      }
      await reply(client, event, [
        quickReply(`確定要刪除「${pet.name}」嗎？此操作無法復原！`, [
          { label: '✅ 確認刪除', postback: `action=delete_pet&pet_id=${pet.id}` },
          { label: '❌ 取消', text: '取消' },
        ]),
      ]);
      break;
    }

    case 'delete_pet': {
      const pet = getPetById(parseInt(params.pet_id));
      if (pet) {
        deletePet(pet.id);
        await reply(client, event, [
          textMessage(`✅ 已刪除「${pet.name}」的所有資料`),
          quickReply('', [{ label: '🐾 查看寵物', text: '我的寵物' }]),
        ]);
      }
      break;
    }

    case 'set_health_menu': {
      const petId = params.pet_id;
      await reply(client, event, [
        quickReply('請選擇健康狀態：', [
          { label: '✅ 健康', postback: `action=set_health&pet_id=${petId}&tag=healthy` },
          { label: '🤒 生病中', postback: `action=set_health&pet_id=${petId}&tag=sick` },
          { label: '💊 康復中', postback: `action=set_health&pet_id=${petId}&tag=recovering` },
        ]),
      ]);
      break;
    }

    case 'set_health': {
      const pet = getPetById(parseInt(params.pet_id));
      if (pet) {
        setHealthTag(pet.id, params.tag);
        await reply(client, event, [
          textMessage(`✅ ${pet.name} 的健康狀態已更新為「${healthTagMap[params.tag]}」`),
        ]);
      }
      break;
    }

    case 'upload_photo': {
      setUserState(lineUserId, 'ADDING_PET_PHOTO', { petId: parseInt(params.pet_id) });
      await reply(client, event, [textMessage('請傳送寵物照片 📷')]);
      break;
    }

    case 'complete_task': {
      const { completeTask } = require('../services/taskService');
      const result = completeTask(parseInt(params.task_id), lineUserId);
      if (result.alreadyDone) {
        await reply(client, event, [textMessage('這個任務已經完成了 ✅')]);
      } else {
        const task = result.task;
        await reply(client, event, [
          textMessage(`✅ 任務「${taskTypeMap[task.task_type] || task.task_type}」已完成！\n完成時間：${task.completed_at.slice(0, 16)}`),
          quickReply('', [
            { label: '📋 查看所有任務', text: '共養任務' },
            { label: '🐾 我的寵物', text: '我的寵物' },
          ]),
        ]);
      }
      break;
    }

    case 'create_task': {
      const pet = getPetById(parseInt(params.pet_id));
      if (!pet) {
        await reply(client, event, [textMessage('找不到寵物')]);
        return;
      }
      setUserState(lineUserId, 'CHOOSING_TASK_TYPE', { petId: pet.id, petName: pet.name });
      await reply(client, event, [
        quickReply(`為「${pet.name}」建立任務，選擇類型：`, Object.entries(taskTypeMap).map(([key, label]) => ({
          label,
          postback: `action=confirm_create_task&pet_id=${pet.id}&task_type=${key}`,
        }))),
      ]);
      break;
    }

    case 'confirm_create_task': {
      const pet = getPetById(parseInt(params.pet_id));
      if (pet) {
        const task = createTask(lineUserId, pet.id, params.task_type);
        clearUserState(lineUserId);
        await reply(client, event, [
          textMessage(`✅ 已為「${pet.name}」建立${taskTypeMap[params.task_type] || params.task_type}任務`),
          quickReply('', [
            { label: '📋 查看任務', text: '共養任務' },
            { label: '🐾 我的寵物', text: '我的寵物' },
          ]),
        ]);
      }
      break;
    }

    case 'select_pet_for_task': {
      const pets = getPetsByOwner(lineUserId);
      if (!pets.length) {
        await reply(client, event, [quickReply('您還沒有寵物，請先新增！', [{ label: '➕ 新增寵物', text: '新增寵物' }])]);
        return;
      }
      await reply(client, event, [
        quickReply('選擇要新增任務的寵物：', pets.map(p => ({
          label: `🐾 ${p.name}`,
          postback: `action=create_task&pet_id=${p.id}`,
        }))),
      ]);
      break;
    }

    case 'ai_style': {
      const style = params.style;
      setUserState(lineUserId, 'GENERATING_AI_PET', { style });
      await reply(client, event, [
        textMessage(`已選擇「${style}」風格 ✨\n請傳送您寵物的照片來生成AI虛擬寵物！`),
      ]);
      break;
    }

    default:
      await reply(client, event, [textMessage('未知操作，請重試')]);
  }
}

async function reply(client, event, messages) {
  await client.replyMessage(event.replyToken, messages);
}

module.exports = { handlePostback };
