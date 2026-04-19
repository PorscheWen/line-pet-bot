const { getOrCreateUser } = require('../services/petService');
const { welcomeMessage } = require('../utils/messages');

async function handleFollow(client, event) {
  const lineUserId = event.source.userId;
  let profile = {};
  try {
    profile = await client.getProfile(lineUserId);
  } catch {}

  getOrCreateUser(lineUserId, {
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
  });

  await client.replyMessage(event.replyToken, [welcomeMessage(profile.displayName || '朋友')]);
}

async function handleUnfollow(event) {
  // 保留用戶資料，僅記錄取消追蹤
  console.log('用戶取消追蹤:', event.source.userId);
}

module.exports = { handleFollow, handleUnfollow };
