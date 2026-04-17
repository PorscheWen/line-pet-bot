const axios = require('axios');
const { getUserState, clearUserState, getUserByLineId } = require('../services/petService');
const { analyzeAndDescribePet, generateVirtualPetDescription, saveVirtualPet } = require('../services/aiService');
const { addPetPhoto } = require('../services/petService');
const { textMessage, quickReply } = require('../utils/messages');

async function handleImage(client, event) {
  const lineUserId = event.source.userId;
  const { state, context } = getUserState(lineUserId);
  const messageId = event.message.id;

  // 取得圖片 stream 並轉 base64
  let imageBase64 = null;
  try {
    const stream = await client.getMessageContent(messageId);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    imageBase64 = buffer.toString('base64');
  } catch (err) {
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [textMessage('圖片讀取失敗，請重試 😿')],
    });
    return;
  }

  if (state === 'ADDING_PET_PHOTO') {
    const petId = context.petId;
    // 儲存為 base64 data URL（實際部署應上傳至雲端儲存）
    const photoUrl = `data:image/jpeg;base64,${imageBase64.slice(0, 50)}...`;
    addPetPhoto(petId, photoUrl);
    clearUserState(lineUserId);

    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        textMessage('✅ 寵物照片已儲存！'),
        quickReply('接下來要做什麼？', [
          { label: '🐾 查看寵物', text: '我的寵物' },
          { label: '📋 共養任務', text: '共養任務' },
          { label: '🤖 AI虛擬寵物', text: '生成虛擬寵物' },
        ]),
      ],
    });
    return;
  }

  if (state === 'GENERATING_AI_PET') {
    const style = context.style || 'Q版';
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [textMessage(`🤖 正在以「${style}」風格分析您的寵物，請稍候...`)],
    });

    try {
      const description = await generateVirtualPetDescription(imageBase64, style);
      const user = getUserByLineId(lineUserId);
      const virtualPet = await saveVirtualPet(lineUserId, context.petId || null, null, style, description);

      clearUserState(lineUserId);

      await client.pushMessage({
        to: lineUserId,
        messages: [
          {
            type: 'text',
            text: `✨ 虛擬寵物生成完成！\n\n風格：${style}\n\n${description}`,
          },
          quickReply('您可以繼續操作：', [
            { label: '🔄 換個風格', text: '生成虛擬寵物' },
            { label: '📚 我的虛擬寵物', text: '我的虛擬寵物' },
            { label: '🐾 我的寵物', text: '我的寵物' },
          ]),
        ],
      });
    } catch (err) {
      clearUserState(lineUserId);
      await client.pushMessage({
        to: lineUserId,
        messages: [textMessage(`生成失敗：${err.message}\n請重試或聯繫管理員`)],
      });
    }
    return;
  }

  // 未知狀態下收到圖片 → 詢問用途
  await client.replyMessage({
    replyToken: event.replyToken,
    messages: [
      quickReply('收到您的圖片！想用來做什麼？', [
        { label: '🤖 生成虛擬寵物', text: '生成虛擬寵物' },
        { label: '🐾 設為寵物照片', text: '我的寵物' },
      ]),
    ],
  });
}

module.exports = { handleImage };
