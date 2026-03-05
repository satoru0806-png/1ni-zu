const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'nizu.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS needs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        urgency INTEGER NOT NULL DEFAULT 3,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS need_tags (
        need_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (need_id, tag_id),
        FOREIGN KEY (need_id) REFERENCES needs(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id)
    );

    CREATE TABLE IF NOT EXISTS votes (
        user_id INTEGER NOT NULL,
        need_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, need_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (need_id) REFERENCES needs(id) ON DELETE CASCADE
    );
`);

// Seed default data if empty
const count = db.prepare('SELECT COUNT(*) as c FROM needs').get().c;
if (count === 0) {
    const seedData = [
        { title: '睡眠の質を改善したい', description: '仕事のストレスで睡眠の質が落ちている。深い眠りにつける方法やツールを探している。', category: 'health', urgency: 4, tags: ['睡眠', 'ストレス', '健康管理'] },
        { title: 'リモートワークの生産性を上げたい', description: '在宅勤務で集中力が続かない。効率的に働くための環境づくりや時間管理の方法を知りたい。', category: 'work', urgency: 3, tags: ['リモートワーク', '生産性', '集中力'] },
        { title: '副業で月5万円稼ぎたい', description: '本業以外に収入源を作りたい。スキルを活かせる副業や、初心者でも始められるものを探している。', category: 'money', urgency: 3, tags: ['副業', '収入', 'スキル'] },
        { title: '職場の人間関係のストレスを減らしたい', description: '上司や同僚とのコミュニケーションに悩んでいる。円滑な関係を築くコツやストレス対処法が知りたい。', category: 'relationship', urgency: 5, tags: ['職場', 'コミュニケーション', 'ストレス'] },
        { title: '家事の時短テクニックを知りたい', description: '共働きで時間が足りない。効率的な家事の方法や便利なサービス・家電を探している。', category: 'lifestyle', urgency: 3, tags: ['家事', '時短', '共働き'] },
        { title: 'プログラミングを独学で学びたい', description: '転職やスキルアップのためにプログラミングを学びたい。効果的な学習方法やロードマップが知りたい。', category: 'education', urgency: 2, tags: ['プログラミング', '独学', '転職'] },
        { title: 'AIツールを仕事に活用したい', description: 'ChatGPTなどのAIツールを業務に取り入れたい。具体的な活用事例や導入方法を知りたい。', category: 'tech', urgency: 4, tags: ['AI', 'ChatGPT', '業務効率化'] },
        { title: '老後の資金計画を立てたい', description: '将来の年金だけでは不安。iDeCoやNISAなど、今からできる資産形成の方法を知りたい。', category: 'money', urgency: 3, tags: ['老後', '資産形成', 'NISA', 'iDeCo'] },
        { title: '運動習慣を継続したい', description: 'ジムに通い始めてもすぐ辞めてしまう。無理なく続けられる運動方法やモチベーション維持のコツが知りたい。', category: 'health', urgency: 3, tags: ['運動', '習慣化', 'モチベーション'] },
        { title: '子どもの教育方針に悩んでいる', description: '子どもの将来を考えた教育選択が分からない。習い事や学校選びの判断基準を知りたい。', category: 'education', urgency: 4, tags: ['子育て', '教育', '習い事'] },
        { title: 'メンタルヘルスをケアしたい', description: '日常的に不安感がある。手軽にできるメンタルケアの方法やプロに相談する方法を知りたい。', category: 'health', urgency: 5, tags: ['メンタルヘルス', '不安', 'カウンセリング'] },
        { title: 'キャリアチェンジの方法を知りたい', description: '今の仕事に将来性を感じない。異業種への転職方法やスキルの棚卸しの仕方を知りたい。', category: 'work', urgency: 4, tags: ['転職', 'キャリア', 'スキル'] },
        { title: '一人暮らしの食費を節約したい', description: '外食が多く食費がかさむ。簡単で安い自炊レシピや食費管理のコツを知りたい。', category: 'lifestyle', urgency: 3, tags: ['節約', '自炊', '一人暮らし'] },
        { title: 'スマホのセキュリティを強化したい', description: 'パスワード管理や個人情報の漏洩が心配。安全にスマホを使うための対策を知りたい。', category: 'tech', urgency: 3, tags: ['セキュリティ', 'スマホ', 'パスワード'] },
        { title: '友人関係を広げたい', description: '社会人になってから新しい友人ができない。大人になってからの友人作りの方法を知りたい。', category: 'relationship', urgency: 2, tags: ['友人', '社会人', 'コミュニティ'] },
        { title: '英語を実践的に話せるようになりたい', description: '学校で学んだ英語が実際に使えない。スピーキング力を効率的に伸ばす方法を探している。', category: 'education', urgency: 3, tags: ['英語', 'スピーキング', '語学'] },
        { title: '投資を始めたいが怖い', description: '資産運用に興味はあるが損するのが怖い。初心者向けの低リスクな投資方法を知りたい。', category: 'money', urgency: 2, tags: ['投資', '初心者', '資産運用'] },
        { title: 'ワークライフバランスを整えたい', description: '残業が多く私生活が犠牲になっている。仕事と生活のバランスを取る方法を知りたい。', category: 'work', urgency: 4, tags: ['ワークライフバランス', '残業', '働き方'] },
        { title: '自宅のスマートホーム化をしたい', description: '家電やセキュリティをスマートに管理したい。コスパの良い導入方法を知りたい。', category: 'tech', urgency: 2, tags: ['スマートホーム', 'IoT', '家電'] },
        { title: 'ダイエットを成功させたい', description: 'リバウンドを繰り返している。無理なく健康的に痩せる方法を知りたい。', category: 'health', urgency: 3, tags: ['ダイエット', '健康', '食事管理'] },
    ];

    const insertNeed = db.prepare('INSERT INTO needs (title, description, category, urgency) VALUES (?, ?, ?, ?)');
    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
    const getTag = db.prepare('SELECT id FROM tags WHERE name = ?');
    const insertNeedTag = db.prepare('INSERT OR IGNORE INTO need_tags (need_id, tag_id) VALUES (?, ?)');

    const seedTransaction = db.transaction(() => {
        for (const item of seedData) {
            const result = insertNeed.run(item.title, item.description, item.category, item.urgency);
            const needId = result.lastInsertRowid;
            for (const tag of item.tags) {
                insertTag.run(tag);
                const tagRow = getTag.get(tag);
                insertNeedTag.run(needId, tagRow.id);
            }
        }
    });
    seedTransaction();
    console.log('Database seeded with default data');
}

module.exports = db;
