'use strict';

const { welcomeMessage } = require('../utils/messages');

async function handleFollow(client, event) {
  let profile = {};
  try {
    profile = await client.getProfile(event.source.userId);
  } catch {}

  await client.replyMessage(event.replyToken, [welcomeMessage(profile.displayName || '朋友')]);
}

async function handleUnfollow(event) {
  console.log('用戶取消追蹤:', event.source.userId);
}

module.exports = { handleFollow, handleUnfollow };
