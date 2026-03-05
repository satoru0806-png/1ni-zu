const express = require('express');
const db = require('../db/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/needs - 一覧取得（検索・フィルタ対応）
router.get('/', optionalAuth, (req, res) => {
    const { q, category, sort } = req.query;
    const userId = req.user ? req.user.id : null;

    let sql = `
        SELECT n.*,
            (SELECT COUNT(*) FROM votes v WHERE v.need_id = n.id) as votes,
            ${userId ? `(SELECT COUNT(*) FROM votes v WHERE v.need_id = n.id AND v.user_id = ?) as voted,` : '0 as voted,'}
            (SELECT GROUP_CONCAT(t.name, ',') FROM need_tags nt JOIN tags t ON nt.tag_id = t.id WHERE nt.need_id = n.id) as tags,
            u.username
        FROM needs n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE 1=1
    `;
    const params = userId ? [userId] : [];

    if (category && category !== 'all') {
        sql += ' AND n.category = ?';
        params.push(category);
    }

    if (q) {
        sql += ' AND (n.title LIKE ? OR n.description LIKE ? OR EXISTS (SELECT 1 FROM need_tags nt JOIN tags t ON nt.tag_id = t.id WHERE nt.need_id = n.id AND t.name LIKE ?))';
        const like = `%${q}%`;
        params.push(like, like, like);
    }

    switch (sort) {
        case 'newest':
            sql += ' ORDER BY n.created_at DESC';
            break;
        case 'urgency':
            sql += ' ORDER BY n.urgency DESC, votes DESC';
            break;
        default:
            sql += ' ORDER BY votes DESC, n.created_at DESC';
    }

    const rows = db.prepare(sql).all(...params);
    const results = rows.map(row => ({
        ...row,
        tags: row.tags ? row.tags.split(',') : [],
        voted: row.voted > 0
    }));

    res.json(results);
});

// GET /api/needs/trending - トレンドタグ取得
router.get('/trending', (req, res) => {
    const tags = db.prepare(`
        SELECT t.name, COUNT(*) as count
        FROM need_tags nt
        JOIN tags t ON nt.tag_id = t.id
        GROUP BY t.name
        ORDER BY count DESC
        LIMIT 12
    `).all();

    res.json(tags);
});

// GET /api/needs/stats - 統計情報
router.get('/stats', (req, res) => {
    const totalNeeds = db.prepare('SELECT COUNT(*) as c FROM needs').get().c;
    const totalVotes = db.prepare('SELECT COUNT(*) as c FROM votes').get().c;
    const categories = db.prepare('SELECT COUNT(DISTINCT category) as c FROM needs').get().c;

    res.json({ totalNeeds, totalVotes, categories });
});

// GET /api/needs/:id - 単一取得
router.get('/:id', optionalAuth, (req, res) => {
    const userId = req.user ? req.user.id : null;

    let sql = `
        SELECT n.*,
            (SELECT COUNT(*) FROM votes v WHERE v.need_id = n.id) as votes,
            ${userId ? `(SELECT COUNT(*) FROM votes v WHERE v.need_id = n.id AND v.user_id = ?) as voted,` : '0 as voted,'}
            (SELECT GROUP_CONCAT(t.name, ',') FROM need_tags nt JOIN tags t ON nt.tag_id = t.id WHERE nt.need_id = n.id) as tags,
            u.username
        FROM needs n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE n.id = ?
    `;
    const params = userId ? [userId, req.params.id] : [req.params.id];

    const row = db.prepare(sql).get(...params);
    if (!row) return res.status(404).json({ error: '見つかりません' });

    row.tags = row.tags ? row.tags.split(',') : [];
    row.voted = row.voted > 0;
    res.json(row);
});

// POST /api/needs - 新規作成
router.post('/', authenticateToken, (req, res) => {
    const { title, description, category, urgency, tags } = req.body;

    if (!title || !description || !category) {
        return res.status(400).json({ error: 'タイトル、説明、カテゴリは必須です' });
    }

    const validCategories = ['health', 'work', 'money', 'relationship', 'lifestyle', 'education', 'tech'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ error: '無効なカテゴリです' });
    }

    const urg = Math.min(5, Math.max(1, parseInt(urgency) || 3));

    const insertNeed = db.prepare('INSERT INTO needs (title, description, category, urgency, user_id) VALUES (?, ?, ?, ?, ?)');
    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
    const getTag = db.prepare('SELECT id FROM tags WHERE name = ?');
    const insertNeedTag = db.prepare('INSERT OR IGNORE INTO need_tags (need_id, tag_id) VALUES (?, ?)');

    const result = db.transaction(() => {
        const r = insertNeed.run(title, description, category, urg, req.user.id);
        const needId = r.lastInsertRowid;

        if (tags && Array.isArray(tags)) {
            for (const tag of tags.slice(0, 5)) {
                const trimmed = String(tag).trim();
                if (!trimmed) continue;
                insertTag.run(trimmed);
                const tagRow = getTag.get(trimmed);
                insertNeedTag.run(needId, tagRow.id);
            }
        }

        return needId;
    })();

    res.status(201).json({ id: result, message: '登録しました' });
});

// POST /api/needs/:id/vote - 共感トグル
router.post('/:id/vote', authenticateToken, (req, res) => {
    const needId = parseInt(req.params.id);
    const userId = req.user.id;

    const need = db.prepare('SELECT id FROM needs WHERE id = ?').get(needId);
    if (!need) return res.status(404).json({ error: '見つかりません' });

    const existing = db.prepare('SELECT 1 FROM votes WHERE user_id = ? AND need_id = ?').get(userId, needId);

    if (existing) {
        db.prepare('DELETE FROM votes WHERE user_id = ? AND need_id = ?').run(userId, needId);
        res.json({ voted: false, message: '共感を取り消しました' });
    } else {
        db.prepare('INSERT INTO votes (user_id, need_id) VALUES (?, ?)').run(userId, needId);
        res.json({ voted: true, message: '共感しました' });
    }
});

// DELETE /api/needs/:id - 削除（投稿者のみ）
router.delete('/:id', authenticateToken, (req, res) => {
    const need = db.prepare('SELECT user_id FROM needs WHERE id = ?').get(req.params.id);
    if (!need) return res.status(404).json({ error: '見つかりません' });
    if (need.user_id !== req.user.id) return res.status(403).json({ error: '削除権限がありません' });

    db.prepare('DELETE FROM needs WHERE id = ?').run(req.params.id);
    res.json({ message: '削除しました' });
});

module.exports = router;
