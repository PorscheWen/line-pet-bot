const cron = require('node-cron');
const https = require('https');
const {
  getActiveRemindersForTime,
  markReminderSent,
  buildReminderMessage,
  sendPushNotification,
} = require('./services/notificationService');
const { getPendingTasksForUser } = require('./services/taskService');
const { db } = require('./db');

function startScheduler(client) {
  // 每分鐘檢查提醒
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    const reminders = getActiveRemindersForTime(hour, minute);
    for (const reminder of reminders) {
      const message = buildReminderMessage(reminder);
      const sent = await sendPushNotification(client, reminder.line_user_id, message);
      if (sent) markReminderSent(reminder.id);
    }
  });

  // 每天早上 8:00 發送每日任務摘要
  cron.schedule('0 8 * * *', async () => {
    const users = db.prepare('SELECT * FROM users').all();
    for (const user of users) {
      const tasks = getPendingTasksForUser(user.line_user_id);
      if (tasks.length > 0) {
        const taskList = tasks.map((t, i) => {
          const { taskTypeMap } = require('./services/taskService');
          return `${i + 1}. ${taskTypeMap[t.task_type] || t.task_type} - ${t.pet_name}`;
        }).join('\n');
        await sendPushNotification(
          client,
          user.line_user_id,
          `🌅 早安！今日待完成任務：\n${taskList}\n\n回覆「完成任務」完成最新任務`
        );
      }
    }
  });

  // 每 10 分鐘 ping 自己，防止 Render 免費版休眠
  if (process.env.NODE_ENV === 'production') {
    cron.schedule('*/10 * * * *', () => {
      https.get('https://line-pet-bot.onrender.com/health', () => {}).on('error', () => {});
    });
  }

  console.log('排程器已啟動');
}

module.exports = { startScheduler };
