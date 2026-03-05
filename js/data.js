const CATEGORY_LABELS = {
    health: '健康',
    work: '仕事・キャリア',
    money: 'お金',
    relationship: '人間関係',
    lifestyle: '生活',
    education: '学び',
    tech: 'テクノロジー'
};

const URGENCY_LABELS = ['', '低い', 'やや低い', '普通', 'やや高い', '高い'];

const DEFAULT_NEEDS = [
    {
        id: 1,
        title: '睡眠の質を改善したい',
        description: '仕事のストレスで睡眠の質が落ちている。深い眠りにつける方法やツールを探している。',
        category: 'health',
        urgency: 4,
        votes: 234,
        tags: ['睡眠', 'ストレス', '健康管理']
    },
    {
        id: 2,
        title: 'リモートワークの生産性を上げたい',
        description: '在宅勤務で集中力が続かない。効率的に働くための環境づくりや時間管理の方法を知りたい。',
        category: 'work',
        urgency: 3,
        votes: 189,
        tags: ['リモートワーク', '生産性', '集中力']
    },
    {
        id: 3,
        title: '副業で月5万円稼ぎたい',
        description: '本業以外に収入源を作りたい。スキルを活かせる副業や、初心者でも始められるものを探している。',
        category: 'money',
        urgency: 3,
        votes: 312,
        tags: ['副業', '収入', 'スキル']
    },
    {
        id: 4,
        title: '職場の人間関係のストレスを減らしたい',
        description: '上司や同僚とのコミュニケーションに悩んでいる。円滑な関係を築くコツやストレス対処法が知りたい。',
        category: 'relationship',
        urgency: 5,
        votes: 278,
        tags: ['職場', 'コミュニケーション', 'ストレス']
    },
    {
        id: 5,
        title: '家事の時短テクニックを知りたい',
        description: '共働きで時間が足りない。効率的な家事の方法や便利なサービス・家電を探している。',
        category: 'lifestyle',
        urgency: 3,
        votes: 156,
        tags: ['家事', '時短', '共働き']
    },
    {
        id: 6,
        title: 'プログラミングを独学で学びたい',
        description: '転職やスキルアップのためにプログラミングを学びたい。効果的な学習方法やロードマップが知りたい。',
        category: 'education',
        urgency: 2,
        votes: 423,
        tags: ['プログラミング', '独学', '転職']
    },
    {
        id: 7,
        title: 'AIツールを仕事に活用したい',
        description: 'ChatGPTなどのAIツールを業務に取り入れたい。具体的な活用事例や導入方法を知りたい。',
        category: 'tech',
        urgency: 4,
        votes: 567,
        tags: ['AI', 'ChatGPT', '業務効率化']
    },
    {
        id: 8,
        title: '老後の資金計画を立てたい',
        description: '将来の年金だけでは不安。iDeCoやNISAなど、今からできる資産形成の方法を知りたい。',
        category: 'money',
        urgency: 3,
        votes: 198,
        tags: ['老後', '資産形成', 'NISA', 'iDeCo']
    },
    {
        id: 9,
        title: '運動習慣を継続したい',
        description: 'ジムに通い始めてもすぐ辞めてしまう。無理なく続けられる運動方法やモチベーション維持のコツが知りたい。',
        category: 'health',
        urgency: 3,
        votes: 201,
        tags: ['運動', '習慣化', 'モチベーション']
    },
    {
        id: 10,
        title: '子どもの教育方針に悩んでいる',
        description: '子どもの将来を考えた教育選択が分からない。習い事や学校選びの判断基準を知りたい。',
        category: 'education',
        urgency: 4,
        votes: 145,
        tags: ['子育て', '教育', '習い事']
    },
    {
        id: 11,
        title: 'メンタルヘルスをケアしたい',
        description: '日常的に不安感がある。手軽にできるメンタルケアの方法やプロに相談する方法を知りたい。',
        category: 'health',
        urgency: 5,
        votes: 389,
        tags: ['メンタルヘルス', '不安', 'カウンセリング']
    },
    {
        id: 12,
        title: 'キャリアチェンジの方法を知りたい',
        description: '今の仕事に将来性を感じない。異業種への転職方法やスキルの棚卸しの仕方を知りたい。',
        category: 'work',
        urgency: 4,
        votes: 267,
        tags: ['転職', 'キャリア', 'スキル']
    },
    {
        id: 13,
        title: '一人暮らしの食費を節約したい',
        description: '外食が多く食費がかさむ。簡単で安い自炊レシピや食費管理のコツを知りたい。',
        category: 'lifestyle',
        urgency: 3,
        votes: 176,
        tags: ['節約', '自炊', '一人暮らし']
    },
    {
        id: 14,
        title: 'スマホのセキュリティを強化したい',
        description: 'パスワード管理や個人情報の漏洩が心配。安全にスマホを使うための対策を知りたい。',
        category: 'tech',
        urgency: 3,
        votes: 134,
        tags: ['セキュリティ', 'スマホ', 'パスワード']
    },
    {
        id: 15,
        title: '友人関係を広げたい',
        description: '社会人になってから新しい友人ができない。大人になってからの友人作りの方法を知りたい。',
        category: 'relationship',
        urgency: 2,
        votes: 198,
        tags: ['友人', '社会人', 'コミュニティ']
    },
    {
        id: 16,
        title: '英語を実践的に話せるようになりたい',
        description: '学校で学んだ英語が実際に使えない。スピーキング力を効率的に伸ばす方法を探している。',
        category: 'education',
        urgency: 3,
        votes: 356,
        tags: ['英語', 'スピーキング', '語学']
    },
    {
        id: 17,
        title: '投資を始めたいが怖い',
        description: '資産運用に興味はあるが損するのが怖い。初心者向けの低リスクな投資方法を知りたい。',
        category: 'money',
        urgency: 2,
        votes: 245,
        tags: ['投資', '初心者', '資産運用']
    },
    {
        id: 18,
        title: 'ワークライフバランスを整えたい',
        description: '残業が多く私生活が犠牲になっている。仕事と生活のバランスを取る方法を知りたい。',
        category: 'work',
        urgency: 4,
        votes: 312,
        tags: ['ワークライフバランス', '残業', '働き方']
    },
    {
        id: 19,
        title: '自宅のスマートホーム化をしたい',
        description: '家電やセキュリティをスマートに管理したい。コスパの良い導入方法を知りたい。',
        category: 'tech',
        urgency: 2,
        votes: 98,
        tags: ['スマートホーム', 'IoT', '家電']
    },
    {
        id: 20,
        title: 'ダイエットを成功させたい',
        description: 'リバウンドを繰り返している。無理なく健康的に痩せる方法を知りたい。',
        category: 'health',
        urgency: 3,
        votes: 445,
        tags: ['ダイエット', '健康', '食事管理']
    }
];
