const { db } = require('../db');
const { getUserByLineId } = require('./petService');
const { v4: uuidv4 } = require('uuid');

function createGroup(lineUserId, groupName, petIds = []) {
  const user = getUserByLineId(lineUserId);
  if (!user) throw new Error('用戶不存在');

  const inviteCode = uuidv4().slice(0, 8).toUpperCase();
  const result = db.prepare(
    'INSERT INTO care_groups (name, owner_id, invite_code) VALUES (?, ?, ?)'
  ).run(groupName, user.id, inviteCode);

  const groupId = result.lastInsertRowid;
  db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(groupId, user.id, 'owner');

  for (const petId of petIds) {
    db.prepare('INSERT OR IGNORE INTO group_pets (group_id, pet_id) VALUES (?, ?)').run(groupId, petId);
  }

  return db.prepare('SELECT * FROM care_groups WHERE id = ?').get(groupId);
}

function joinGroupByCode(lineUserId, inviteCode) {
  const user = getUserByLineId(lineUserId);
  if (!user) throw new Error('用戶不存在');

  const group = db.prepare('SELECT * FROM care_groups WHERE invite_code = ?').get(inviteCode.toUpperCase());
  if (!group) return { success: false, message: '找不到該群組，請確認邀請碼' };

  const existing = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(group.id, user.id);
  if (existing) return { success: false, message: '您已是此群組成員' };

  db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(group.id, user.id, 'member');
  return { success: true, group };
}

function getUserGroups(lineUserId) {
  const user = getUserByLineId(lineUserId);
  if (!user) return [];
  return db.prepare(`
    SELECT cg.*, gm.role,
      (SELECT COUNT(*) FROM group_members WHERE group_id = cg.id) as member_count
    FROM care_groups cg
    JOIN group_members gm ON cg.id = gm.group_id
    WHERE gm.user_id = ?
    ORDER BY cg.created_at DESC
  `).all(user.id);
}

function getGroupMembers(groupId) {
  return db.prepare(`
    SELECT u.display_name, u.line_user_id, gm.role, gm.joined_at
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = ?
  `).all(groupId);
}

function getGroupPets(groupId) {
  return db.prepare(`
    SELECT p.* FROM pets p
    JOIN group_pets gp ON p.id = gp.pet_id
    WHERE gp.group_id = ?
  `).all(groupId);
}

function getGroupById(groupId) {
  return db.prepare('SELECT * FROM care_groups WHERE id = ?').get(groupId);
}

function addPetToGroup(groupId, petId) {
  db.prepare('INSERT OR IGNORE INTO group_pets (group_id, pet_id) VALUES (?, ?)').run(groupId, petId);
}

module.exports = {
  createGroup,
  joinGroupByCode,
  getUserGroups,
  getGroupMembers,
  getGroupPets,
  getGroupById,
  addPetToGroup,
};
