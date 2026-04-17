const { db } = require('../db');

function getOrCreateUser(lineUserId, profile = {}) {
  const existing = db.prepare('SELECT * FROM users WHERE line_user_id = ?').get(lineUserId);
  if (existing) {
    if (profile.displayName) {
      db.prepare('UPDATE users SET display_name = ?, picture_url = ? WHERE line_user_id = ?')
        .run(profile.displayName, profile.pictureUrl, lineUserId);
    }
    return db.prepare('SELECT * FROM users WHERE line_user_id = ?').get(lineUserId);
  }
  const result = db.prepare(
    'INSERT INTO users (line_user_id, display_name, picture_url) VALUES (?, ?, ?)'
  ).run(lineUserId, profile.displayName || '新用戶', profile.pictureUrl || null);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
}

function getUserByLineId(lineUserId) {
  return db.prepare('SELECT * FROM users WHERE line_user_id = ?').get(lineUserId);
}

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function getUserState(lineUserId) {
  const user = db.prepare('SELECT state, state_context FROM users WHERE line_user_id = ?').get(lineUserId);
  if (!user) return { state: 'IDLE', context: {} };
  return { state: user.state, context: JSON.parse(user.state_context || '{}') };
}

function setUserState(lineUserId, state, context = {}) {
  db.prepare('UPDATE users SET state = ?, state_context = ? WHERE line_user_id = ?')
    .run(state, JSON.stringify(context), lineUserId);
}

function clearUserState(lineUserId) {
  db.prepare("UPDATE users SET state = 'IDLE', state_context = '{}' WHERE line_user_id = ?")
    .run(lineUserId);
}

function getPetsByOwner(lineUserId) {
  const user = getUserByLineId(lineUserId);
  if (!user) return [];
  return db.prepare('SELECT * FROM pets WHERE owner_id = ? ORDER BY created_at DESC').all(user.id);
}

function getPetById(petId) {
  return db.prepare('SELECT * FROM pets WHERE id = ?').get(petId);
}

function createPet(lineUserId, petData) {
  const user = getUserByLineId(lineUserId);
  if (!user) throw new Error('用戶不存在');
  const result = db.prepare(`
    INSERT INTO pets (owner_id, name, breed, birth_date, gender, chip_number, notes, health_tag)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    petData.name,
    petData.breed || null,
    petData.birthDate || null,
    petData.gender || null,
    petData.chipNumber || null,
    petData.notes || null,
    petData.healthTag || 'healthy'
  );
  return db.prepare('SELECT * FROM pets WHERE id = ?').get(result.lastInsertRowid);
}

function updatePet(petId, updates) {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(updates)) {
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    fields.push(`${col} = ?`);
    values.push(value);
  }
  values.push(petId);
  db.prepare(`UPDATE pets SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getPetById(petId);
}

function deletePet(petId) {
  db.prepare('DELETE FROM pet_photos WHERE pet_id = ?').run(petId);
  db.prepare('DELETE FROM care_tasks WHERE pet_id = ?').run(petId);
  db.prepare('DELETE FROM group_pets WHERE pet_id = ?').run(petId);
  db.prepare('DELETE FROM reminders WHERE pet_id = ?').run(petId);
  db.prepare('DELETE FROM pets WHERE id = ?').run(petId);
}

function addPetPhoto(petId, photoUrl) {
  const isPrimary = !db.prepare('SELECT id FROM pet_photos WHERE pet_id = ?').get(petId) ? 1 : 0;
  const result = db.prepare('INSERT INTO pet_photos (pet_id, photo_url, is_primary) VALUES (?, ?, ?)')
    .run(petId, photoUrl, isPrimary);
  return result.lastInsertRowid;
}

function getPetPhotos(petId) {
  return db.prepare('SELECT * FROM pet_photos WHERE pet_id = ? ORDER BY is_primary DESC, created_at DESC').all(petId);
}

function getPrimaryPhoto(petId) {
  return db.prepare('SELECT * FROM pet_photos WHERE pet_id = ? AND is_primary = 1').get(petId)
    || db.prepare('SELECT * FROM pet_photos WHERE pet_id = ? LIMIT 1').get(petId);
}

function setHealthTag(petId, tag) {
  const validTags = ['healthy', 'sick', 'recovering'];
  if (!validTags.includes(tag)) throw new Error('無效的健康標籤');
  db.prepare('UPDATE pets SET health_tag = ? WHERE id = ?').run(tag, petId);
}

const healthTagMap = { healthy: '健康', sick: '生病中', recovering: '康復中' };
const genderMap = { male: '男', female: '女', unknown: '不明' };

function formatPetInfo(pet) {
  const age = pet.birth_date ? calcAge(pet.birth_date) : '未知';
  return [
    `🐾 ${pet.name}`,
    pet.breed ? `品種：${pet.breed}` : null,
    `年齡：${age}`,
    pet.gender ? `性別：${genderMap[pet.gender] || pet.gender}` : null,
    `健康：${healthTagMap[pet.health_tag] || pet.health_tag}`,
    pet.chip_number ? `晶片：${pet.chip_number}` : null,
    pet.notes ? `備註：${pet.notes}` : null,
  ].filter(Boolean).join('\n');
}

function calcAge(birthDate) {
  if (!birthDate) return '未知';
  const birth = new Date(birthDate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${totalMonths} 個月`;
  return `${Math.floor(totalMonths / 12)} 歲`;
}

module.exports = {
  getOrCreateUser,
  getUserByLineId,
  getUserById,
  getUserState,
  setUserState,
  clearUserState,
  getPetsByOwner,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  addPetPhoto,
  getPetPhotos,
  getPrimaryPhoto,
  setHealthTag,
  formatPetInfo,
  calcAge,
  healthTagMap,
  genderMap,
};
