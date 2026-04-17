const { db } = require('../db');
const { getUserByLineId, getUserById } = require('./petService');

const taskTypeMap = {
  feeding: '🍽️ 餵食',
  walking: '🚶 散步',
  bathing: '🛁 洗澡',
  vet: '🏥 看診',
  medication: '💊 用藥',
  grooming: '✂️ 美容',
  other: '📋 其他',
};

const statusMap = {
  pending: '⏳ 待完成',
  completed: '✅ 已完成',
};

function getTaskById(taskId) {
  return db.prepare('SELECT * FROM care_tasks WHERE id = ?').get(taskId);
}

function getTasksByUser(lineUserId, status = null, limit = 10) {
  const user = getUserByLineId(lineUserId);
  if (!user) return [];
  let query = `
    SELECT ct.*, p.name as pet_name, u.display_name as assigned_name
    FROM care_tasks ct
    JOIN pets p ON ct.pet_id = p.id
    LEFT JOIN users u ON ct.assigned_user_id = u.id
    WHERE (ct.assigned_user_id = ? OR p.owner_id = ?)
  `;
  const params = [user.id, user.id];
  if (status) {
    query += ' AND ct.status = ?';
    params.push(status);
  }
  query += ' ORDER BY ct.created_at DESC LIMIT ?';
  params.push(limit);
  return db.prepare(query).all(...params);
}

function getRecentTasks(lineUserId, limit = 3) {
  return getTasksByUser(lineUserId, null, limit);
}

function getPendingTasksForUser(lineUserId) {
  return getTasksByUser(lineUserId, 'pending', 5);
}

function createTask(lineUserId, petId, taskType, options = {}) {
  const user = getUserByLineId(lineUserId);
  if (!user) throw new Error('用戶不存在');
  const result = db.prepare(`
    INSERT INTO care_tasks (pet_id, task_type, description, assigned_user_id, due_date, group_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    petId,
    taskType,
    options.description || null,
    options.assignedUserId || user.id,
    options.dueDate || null,
    options.groupId || null
  );
  return db.prepare('SELECT * FROM care_tasks WHERE id = ?').get(result.lastInsertRowid);
}

function completeTask(taskId, lineUserId) {
  const user = getUserByLineId(lineUserId);
  if (!user) throw new Error('用戶不存在');
  const task = getTaskById(taskId);
  if (!task) throw new Error('任務不存在');
  if (task.status === 'completed') return { alreadyDone: true, task };

  db.prepare(`
    UPDATE care_tasks
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP, completed_by = ?
    WHERE id = ?
  `).run(user.id, taskId);

  return { alreadyDone: false, task: getTaskById(taskId) };
}

function completeLatestTask(lineUserId) {
  const tasks = getPendingTasksForUser(lineUserId);
  if (!tasks.length) return null;
  return completeTask(tasks[0].id, lineUserId);
}

function deleteTask(taskId) {
  db.prepare('DELETE FROM care_tasks WHERE id = ?').run(taskId);
}

function formatTask(task) {
  const lines = [
    `${taskTypeMap[task.task_type] || task.task_type}`,
    `寵物：${task.pet_name || '未知'}`,
    task.description ? `說明：${task.description}` : null,
    task.assigned_name ? `負責人：${task.assigned_name}` : null,
    task.due_date ? `截止：${task.due_date}` : null,
    `狀態：${statusMap[task.status] || task.status}`,
    task.completed_at ? `完成時間：${task.completed_at.slice(0, 16)}` : null,
  ];
  return lines.filter(Boolean).join('\n');
}

function formatTaskList(tasks) {
  if (!tasks.length) return '目前沒有任務 🎉';
  return tasks.map((t, i) => `${i + 1}. ${taskTypeMap[t.task_type] || t.task_type} - ${t.pet_name} (${statusMap[t.status] || t.status})`).join('\n');
}

module.exports = {
  taskTypeMap,
  statusMap,
  getTaskById,
  getTasksByUser,
  getRecentTasks,
  getPendingTasksForUser,
  createTask,
  completeTask,
  completeLatestTask,
  deleteTask,
  formatTask,
  formatTaskList,
};
