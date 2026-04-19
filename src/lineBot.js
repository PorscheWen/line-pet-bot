const { handleMessage } = require('./handlers/messageHandler');
const { handlePostback } = require('./handlers/postbackHandler');
const { handleFollow, handleUnfollow } = require('./handlers/followHandler');
const { handleImage } = require('./handlers/imageHandler');

async function handleEvent(event, client, addLog = console.log) {
  addLog('info', `[事件] type=${event.type} userId=${event.source?.userId} replyToken=${event.replyToken?.slice(0, 8)}...`);
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
        if (event.message.type === 'image') return handleImage(client, event);
        break;
      case 'postback':
        addLog('info', `[Postback] data="${event.postback?.data}"`);
        return handlePostback(client, event);
    }
  } catch (err) {
    addLog('error', `[錯誤] ${err.message} | stack: ${err.stack?.split('\n')[1]?.trim()}`);
    if (event.replyToken) {
      try {
        await client.replyMessage(event.replyToken, [{ type: 'text', text: `發生錯誤：${err.message}` }]);
      } catch (replyErr) {
        addLog('error', `[Reply失敗] ${replyErr.message}`);
      }
    }
  }
}

module.exports = { handleEvent };
