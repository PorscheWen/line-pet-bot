const Anthropic = require('@anthropic-ai/sdk');
const { db } = require('../db');
const { getUserByLineId } = require('./petService');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const stylePrompts = {
  Q版: 'cute chibi Q-version cartoon style, big eyes, round body, kawaii Japanese anime style',
  懷舊: 'retro vintage illustration style, warm nostalgic colors, soft watercolor texture',
  '3D': 'realistic 3D rendered, studio quality, professional pet photography style',
  動漫: 'anime illustration style, vibrant colors, detailed Japanese manga art',
  寫實: 'photorealistic portrait, professional photography, natural lighting',
};

const styleLabels = Object.keys(stylePrompts);

async function analyzeAndDescribePet(imageBase64, mimeType = 'image/jpeg') {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: imageBase64 },
        },
        {
          type: 'text',
          text: '請用繁體中文描述這隻寵物的外觀特徵（品種、毛色、體型、特色等），並評估其健康狀態。請簡潔描述，50字以內。',
        },
      ],
    }],
  });
  return response.content[0].text;
}

async function generateVirtualPetDescription(imageBase64, style, mimeType = 'image/jpeg') {
  const styleDesc = stylePrompts[style] || stylePrompts['Q版'];
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: imageBase64 },
        },
        {
          type: 'text',
          text: `請詳細分析這隻寵物的外觀特徵，然後描述如果將其以「${style}」風格（${styleDesc}）繪製成虛擬寵物會是什麼樣子。請用繁體中文描述，包含：1) 寵物基本外觀 2) ${style}風格的呈現方式 3) 特色設計元素。約150字。`,
        },
      ],
    }],
  });
  return response.content[0].text;
}

async function saveVirtualPet(lineUserId, petId, photoUrl, style, description) {
  const user = getUserByLineId(lineUserId);
  if (!user) throw new Error('用戶不存在');

  const result = db.prepare(`
    INSERT INTO virtual_pets (owner_id, pet_id, original_photo_url, style, generated_description)
    VALUES (?, ?, ?, ?, ?)
  `).run(user.id, petId || null, photoUrl || null, style, description);

  return db.prepare('SELECT * FROM virtual_pets WHERE id = ?').get(result.lastInsertRowid);
}

function getVirtualPetsByUser(lineUserId, style = null) {
  const user = getUserByLineId(lineUserId);
  if (!user) return [];
  let query = 'SELECT vp.*, p.name as pet_name FROM virtual_pets vp LEFT JOIN pets p ON vp.pet_id = p.id WHERE vp.owner_id = ?';
  const params = [user.id];
  if (style) {
    query += ' AND vp.style = ?';
    params.push(style);
  }
  query += ' ORDER BY vp.created_at DESC';
  return db.prepare(query).all(...params);
}

module.exports = {
  styleLabels,
  stylePrompts,
  analyzeAndDescribePet,
  generateVirtualPetDescription,
  saveVirtualPet,
  getVirtualPetsByUser,
};
