'use strict';

const { handleMessage } = require('./handlers/messageHandler');
const { handleFollow, handleUnfollow } = require('./handlers/followHandler');

async function handleEvent(event, client, addLog = console.log) {
  addLog('info', `[事件] type=${event.type} userId=${event.source?.userId}`);
  try {
    switch (event.type) {
      case 'follow':
        return handleFollow(client, event);
      case 'unfollow':
        return handleUnfollow(event);
      case 'message':
        if (event.message.type === 'text') {
          addLog('info', `[訊息] text="${event.message.text}"`);
          return await handleMessage(client, event);
        }
        break;
    }
  } catch (err) {
    addLog('error', `[錯誤] ${err.message}`);
    if (event.replyToken) {
      await client.replyMessage(event.replyToken, [{ type: 'text', text: '發生錯誤，請稍後再試' }]).catch(() => {});
    }
  }
}

module.exports = { handleEvent };
