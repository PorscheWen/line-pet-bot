const { db } = require('../db');
const { getUserByLineId, getUserById } = require('./petService');

function createReminder(lineUserId, petId, reminderType, reminderTime, message) {
  const user = getUserByLineId(lineUserId);
  if (!user) throw new Error('用戶不存在');

  const result = db.prepare(`
    INSERT INTO reminders (user_id, pet_id, reminder_type, reminder_time, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(user.id, petId, reminderType, reminderTime, message || null);

  return db.prepare('SELECT * FROM reminders WHERE id = ?').get(result.lastInsertRowid);
}

function getActiveRemindersForTime(hour, minute) {
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return db.prepare(`
    SELECT r.*, u.line_user_id, p.name as pet_name
    FROM reminders r
    JOIN users u ON r.user_id = u.id
    JOIN pets p ON r.pet_id = p.id
    WHERE r.is_active = 1 AND r.reminder_time = ?
  `).all(timeStr);
}

function getAllActiveReminders() {
  return db.prepare(`
    SELECT r.*, u.line_user_id, p.name as pet_name
    FROM reminders r
    JOIN users u ON r.user_id = u.id
    JOIN pets p ON r.pet_id = p.id
    WHERE r.is_active = 1
    ORDER BY r.reminder_time
  `).all();
}

function getRemindersByUser(lineUserId) {
  const user = getUserByLineId(lineUserId);
  if (!user) return [];
  return db.prepare(`
    SELECT r.*, p.name as pet_name
    FROM reminders r
    JOIN pets p ON r.pet_id = p.id
    WHERE r.user_id = ? AND r.is_active = 1
    ORDER BY r.reminder_time
  `).all(user.id);
}

function deactivateReminder(reminderId) {
  db.prepare('UPDATE reminders SET is_active = 0 WHERE id = ?').run(reminderId);
}

function markReminderSent(reminderId) {
  db.prepare('UPDATE reminders SET last_sent_at = CURRENT_TIMESTAMP WHERE id = ?').run(reminderId);
}

const reminderTypeMap = {
  medication: '💊 用藥提醒',
  vaccine: '💉 疫苗提醒',
  vet: '🏥 看診提醒',
  grooming: '✂️ 美容提醒',
  feeding: '🍽️ 餵食提醒',
  other: '🔔 提醒',
};

function buildReminderMessage(reminder) {
  const typeLabel = reminderTypeMap[reminder.reminder_type] || '🔔 提醒';
  return `${typeLabel}\n寵物：${reminder.pet_name}\n${reminder.message || `別忘了${typeLabel}喔！`}`;
}

async function sendPushNotification(client, lineUserId, message) {
  try {
    await client.pushMessage(lineUserId, [{ type: 'text', text: message }]);
    return true;
  } catch (err) {
    console.error('推播失敗:', lineUserId, err.message);
    return false;
  }
}

module.exports = {
  createReminder,
  getActiveRemindersForTime,
  getAllActiveReminders,
  getRemindersByUser,
  deactivateReminder,
  markReminderSent,
  reminderTypeMap,
  buildReminderMessage,
  sendPushNotification,
};
