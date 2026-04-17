const { handleMessage } = require('./handlers/messageHandler');
const { handlePostback } = require('./handlers/postbackHandler');
const { handleFollow, handleUnfollow } = require('./handlers/followHandler');
const { handleImage } = require('./handlers/imageHandler');

async function handleEvent(event, client) {
  try {
    switch (event.type) {
      case 'follow':
        return handleFollow(client, event);
      case 'unfollow':
        return handleUnfollow(event);
      case 'message':
        if (event.message.type === 'text') return handleMessage(client, event);
        if (event.message.type === 'image') return handleImage(client, event);
        break;
      case 'postback':
        return handlePostback(client, event);
    }
  } catch (err) {
    console.error('事件處理錯誤:', err);
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
