const { handleMessage } = require('./handlers/messageHandler');
const { handlePostback } = require('./handlers/postbackHandler');
const { handleFollow, handleUnfollow } = require('./handlers/followHandler');
const { handleImage } = require('./handlers/imageHandler');

async function handleEvent(event, client) {
  console.log(`[事件] type=${event.type} userId=${event.source?.userId} replyToken=${event.replyToken?.slice(0,8)}...`);
  try {
    switch (event.type) {
      case 'follow':
        return handleFollow(client, event);
      case 'unfollow':
        return handleUnfollow(event);
      case 'message':
        if (event.message.type === 'text') {
          console.log(`[訊息] text="${event.message.text}"`);
          return handleMessage(client, event);
        }
        if (event.message.type === 'image') return handleImage(client, event);
        break;
      case 'postback':
        console.log(`[Postback] data="${event.postback?.data}"`);
        return handlePostback(client, event);
    }
  } catch (err) {
    console.error('[錯誤] 事件處理失敗:', err.message, err.stack?.split('\n')[1]);
    if (event.replyToken) {
      try {
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: '發生錯誤，請稍後再試 😿' }],
        });
      } catch {}
    }
  }
}

module.exports = { handleEvent };
