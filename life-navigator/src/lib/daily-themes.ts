// 365日日替わりテーマ - yumenavi から統合

export interface DailyTheme {
  day: number; // 1-366 (day of year)
  title: string;
  prompt: string;
  letterType: string;
  emoji: string;
}

// --- 1月: 新しい始まり ---
const JAN: DailyTheme[] = [
  { day: 1, title: "新年の誓い", prompt: "新しい年の始まりです。今年こそ叶えたい夢への決意を込めて。", letterType: "morning", emoji: "🎍" },
  { day: 2, title: "初夢", prompt: "初夢のように美しい夢を描こう。眠っている間も夢は育っている。", letterType: "future_self", emoji: "🌙" },
  { day: 3, title: "三日坊主にならない秘訣", prompt: "完璧じゃなくていい、続けることが大事。", letterType: "wisdom", emoji: "📝" },
  { day: 4, title: "仕事始めの勇気", prompt: "新年最初の一歩を踏み出す背中を押して。", letterType: "cheer", emoji: "💪" },
  { day: 5, title: "小さな幸せ探し", prompt: "温かいコーヒー、澄んだ冬の空気。些細な喜びの大切さ。", letterType: "gratitude", emoji: "☕" },
  { day: 6, title: "冬の静けさ", prompt: "内省と休息の季節、自分と向き合う時間の価値。", letterType: "self_care", emoji: "❄️" },
  { day: 7, title: "七草粥の日", prompt: "体も心も整える大切さ。穏やかに新年を過ごす美しさ。", letterType: "self_care", emoji: "🌿" },
  { day: 8, title: "成人の日の頃", prompt: "年齢に関係なく、いつでも新しい自分になれる。", letterType: "challenge", emoji: "🎓" },
  { day: 9, title: "冬空の星", prompt: "遠くにあっても確かに光る夢。", letterType: "poem", emoji: "⭐" },
  { day: 10, title: "10日目の自分へ", prompt: "たった10日でも、続けていることは素晴らしい。", letterType: "celebration", emoji: "🎊" },
  { day: 11, title: "パートナーと初笑い", prompt: "笑顔は二人の一番の宝物。", letterType: "partner_love", emoji: "😊" },
  { day: 12, title: "冬の窓辺から", prompt: "季節の移り変わりと夢の成長を重ねて。", letterType: "season", emoji: "🪟" },
  { day: 13, title: "失敗は友達", prompt: "失敗は最高の先生であり、成功への近道。", letterType: "wisdom", emoji: "🔑" },
  { day: 14, title: "自分への約束", prompt: "自分との約束を後回しにしていないか。", letterType: "challenge", emoji: "🤝" },
  { day: 15, title: "冬の物語", prompt: "困難の中でも前に進む勇気を伝える物語。", letterType: "story", emoji: "🌲" },
  { day: 16, title: "温かいスープのような言葉", prompt: "あなたの存在自体が温かい。", letterType: "self_care", emoji: "🍲" },
  { day: 17, title: "夢の地図", prompt: "旅の途中を楽しむ大切さ。", letterType: "future_self", emoji: "🗺️" },
  { day: 18, title: "感謝のリレー", prompt: "今日、一人に「ありがとう」を。", letterType: "gratitude", emoji: "💝" },
  { day: 19, title: "パートナーの温もり", prompt: "一緒にいると温かいという気持ち。", letterType: "partner_thanks", emoji: "🧣" },
  { day: 20, title: "大寒の強さ", prompt: "厳しさの中でも芽吹く準備をしている。あなたも着実に成長している。", letterType: "cheer", emoji: "🌱" },
  { day: 21, title: "月曜日のあなたへ", prompt: "今週も無理せず、でも一歩ずつ。", letterType: "morning", emoji: "🌤️" },
  { day: 22, title: "読書のすすめ", prompt: "一冊の本との出会いが人生を変えることもある。", letterType: "wisdom", emoji: "📚" },
  { day: 23, title: "ありのままのあなた", prompt: "完璧じゃなくていい。ありのままの美しさ。", letterType: "self_care", emoji: "🌸" },
  { day: 24, title: "冬の詩", prompt: "雪、氷、冬の光をモチーフに。", letterType: "poem", emoji: "🎵" },
  { day: 25, title: "4分の1の区切り", prompt: "小さくても前に進んだことを認めて。", letterType: "milestone", emoji: "📊" },
  { day: 26, title: "二人の冬ごもり", prompt: "温かい部屋で二人で夢を語り合う時間。", letterType: "together", emoji: "🏠" },
  { day: 27, title: "勇気の種", prompt: "勇気は小さな行動から育てるもの。", letterType: "challenge", emoji: "🌰" },
  { day: 28, title: "笑顔の力", prompt: "笑顔は自分も周りも幸せにする最強の武器。", letterType: "cheer", emoji: "😄" },
  { day: 29, title: "冬の夕焼け", prompt: "一日の終わりを穏やかに迎える幸せ。", letterType: "season", emoji: "🌇" },
  { day: 30, title: "未来日記", prompt: "「あの日から全ては始まった」という物語。", letterType: "story", emoji: "📔" },
  { day: 31, title: "1月の総まとめ", prompt: "おめでとう、1月を完走しました！", letterType: "celebration", emoji: "🏅" },
];

// --- 2月: 愛と勇気 ---
const FEB: DailyTheme[] = [
  { day: 32, title: "如月の始まり", prompt: "衣を重ねるように、夢への想いも重ねていく月。", letterType: "morning", emoji: "🌺" },
  { day: 33, title: "節分の鬼退治", prompt: "鬼は外、福は内。不安を手放し幸せを招く。", letterType: "challenge", emoji: "👹" },
  { day: 34, title: "立春の息吹", prompt: "まだ寒いけれど、確実に春は近づいている。", letterType: "season", emoji: "🌷" },
  { day: 35, title: "チョコレートの甘さ", prompt: "自分にご褒美をあげることの大切さ。", letterType: "self_care", emoji: "🍫" },
  { day: 36, title: "手紙を書く日", prompt: "デジタル時代だからこそ、手書きの温もりの価値。", letterType: "wisdom", emoji: "✉️" },
  { day: 37, title: "雪の結晶", prompt: "あなたも世界に一人だけの特別な存在。", letterType: "poem", emoji: "❄️" },
  { day: 38, title: "小さなサプライズ", prompt: "パートナーにメモを残す、花を買う。", letterType: "partner_love", emoji: "🎁" },
  { day: 39, title: "北風と太陽", prompt: "温かさで人の心を動かすことの大切さ。", letterType: "story", emoji: "☀️" },
  { day: 40, title: "40日目のあなたへ", prompt: "もう十分に新しい自分になっている。", letterType: "milestone", emoji: "🎯" },
  { day: 41, title: "梅の花", prompt: "寒さの中で最初に咲く強さと美しさ。", letterType: "cheer", emoji: "🌺" },
  { day: 42, title: "感謝の習慣", prompt: "毎日3つの感謝を書き出す。感謝は幸せの最短ルート。", letterType: "gratitude", emoji: "📋" },
  { day: 43, title: "バレンタイン前夜", prompt: "明日は「好き」を伝えてみませんか。", letterType: "partner_love", emoji: "💗" },
  { day: 44, title: "バレンタインデー", prompt: "愛する人がいる幸せ、愛される幸せ。", letterType: "partner_love", emoji: "💕" },
  { day: 45, title: "自分へのバレンタイン", prompt: "自分にも「愛してるよ」と伝えてほしい。", letterType: "self_care", emoji: "💖" },
  { day: 46, title: "二人三脚", prompt: "お互いの歩幅を合わせ、転んでも一緒に立ち上がる。", letterType: "together", emoji: "👫" },
  { day: 47, title: "冬から春への架け橋", prompt: "変わることへの期待を大きく持つ。", letterType: "season", emoji: "🌉" },
  { day: 48, title: "一期一会", prompt: "今日という日は二度と来ない。今日を大切に。", letterType: "wisdom", emoji: "🍵" },
  { day: 49, title: "心の筋トレ", prompt: "小さな挑戦を繰り返すことで心が強くなる。", letterType: "challenge", emoji: "🏋️" },
  { day: 50, title: "50日目のお祝い", prompt: "50日分の成長を一緒に喜ぼう。乾杯！", letterType: "celebration", emoji: "🥂" },
  { day: 51, title: "雨の日の贈り物", prompt: "雨があるから虹が生まれる。", letterType: "poem", emoji: "🌈" },
  { day: 52, title: "ありがとうの連鎖", prompt: "感謝の好循環を作ろう。", letterType: "partner_thanks", emoji: "🔄" },
  { day: 53, title: "好奇心を忘れずに", prompt: "新しいことへの興味が夢を広げる。", letterType: "wisdom", emoji: "🔍" },
  { day: 54, title: "深呼吸", prompt: "3回の深呼吸で心をリセット。", letterType: "self_care", emoji: "🫁" },
  { day: 55, title: "応援団長", prompt: "あなたならできる！全力応援。", letterType: "cheer", emoji: "📣" },
  { day: 56, title: "猫の日", prompt: "猫のようにマイペースに、自分のリズムで。", letterType: "self_care", emoji: "🐱" },
  { day: 57, title: "二人の記念の木", prompt: "関係も夢も育てていく。共に成長する喜び。", letterType: "together", emoji: "🌳" },
  { day: 58, title: "光と影", prompt: "影があるのは光がある証拠。", letterType: "poem", emoji: "🌓" },
  { day: 59, title: "2月の振り返り", prompt: "愛と勇気の月を振り返り、成長を認める。", letterType: "milestone", emoji: "📅" },
];

// --- 3月: 春の目覚め ---
const MAR: DailyTheme[] = [
  { day: 60, title: "弥生の始まり", prompt: "草木が芽吹くように、あなたの夢も芽を出す時。", letterType: "morning", emoji: "🌸" },
  { day: 61, title: "ひな祭り", prompt: "美しいものを愛でる心の余裕。心にも花を飾りましょう。", letterType: "season", emoji: "🎎" },
  { day: 62, title: "春一番", prompt: "力強い風があなたの背中を押している。", letterType: "challenge", emoji: "🌪️" },
  { day: 63, title: "卒業と旅立ち", prompt: "何歳になっても卒業と旅立ちはある。", letterType: "future_self", emoji: "🎓" },
  { day: 64, title: "桜前線", prompt: "焦らなくていい、あなたの番は必ず来る。", letterType: "poem", emoji: "🌸" },
  { day: 65, title: "パートナーとの春散歩", prompt: "何気ない日常が最高の思い出になる。", letterType: "partner_love", emoji: "🚶" },
  { day: 66, title: "土筆の力", prompt: "どんな環境でも成長する力があなたにはある。", letterType: "cheer", emoji: "🌱" },
  { day: 67, title: "断捨離の春", prompt: "心の中の不要な不安も断捨離して、身軽に。", letterType: "self_care", emoji: "🧹" },
  { day: 68, title: "啓蟄", prompt: "あなたも殻を破って出てくる時。新しい世界が待っている。", letterType: "challenge", emoji: "🐛" },
  { day: 69, title: "感謝の棚卸し", prompt: "感謝を数えると幸せが増える。", letterType: "gratitude", emoji: "📦" },
  { day: 70, title: "70日目の軌跡", prompt: "あの日からどれだけ成長したか。", letterType: "milestone", emoji: "👣" },
  { day: 71, title: "春の音", prompt: "鳥のさえずり、小川のせせらぎ。夢の音も聞こえている。", letterType: "poem", emoji: "🎶" },
  { day: 72, title: "二人の春", prompt: "二人で花見を計画したり、春を分かち合う幸せ。", letterType: "together", emoji: "🌷" },
  { day: 73, title: "ホワイトデー", prompt: "本当のお返しは、毎日の「ありがとう」と「愛してる」。", letterType: "partner_love", emoji: "🤍" },
  { day: 74, title: "春分の日", prompt: "夢への努力と休息のバランスを整えよう。", letterType: "wisdom", emoji: "⚖️" },
  { day: 75, title: "種まきの季節", prompt: "今日の小さな行動が未来の大きな実りに。", letterType: "morning", emoji: "🌻" },
  { day: 76, title: "桜の物語", prompt: "花びらが舞う中、決意を新たにする。", letterType: "story", emoji: "🌸" },
  { day: 77, title: "パートナーの好きなところ", prompt: "具体的な場面を思い出しながら感謝を。", letterType: "partner_thanks", emoji: "💑" },
  { day: 78, title: "新学期の気持ち", prompt: "何歳になっても学びは新鮮。", letterType: "challenge", emoji: "🎒" },
  { day: 79, title: "お花見の誘い", prompt: "夢が叶った時のお祝いを今から想像して。", letterType: "future_self", emoji: "🍡" },
  { day: 80, title: "春雷", prompt: "変化を恐れず、雷の後の晴天を信じて。", letterType: "cheer", emoji: "⚡" },
  { day: 81, title: "たんぽぽの哲学", prompt: "たんぽぽは踏まれても咲く。あなたも。", letterType: "wisdom", emoji: "🌼" },
  { day: 82, title: "春の夕暮れ", prompt: "日が長くなるように、あなたの可能性も広がっている。", letterType: "season", emoji: "🌆" },
  { day: 83, title: "二人のバケットリスト", prompt: "パートナーと一緒に叶えたい夢のリスト。", letterType: "together", emoji: "📝" },
  { day: 84, title: "笑いの力", prompt: "笑顔があなたの夢を加速させる。", letterType: "self_care", emoji: "😂" },
  { day: 85, title: "春の風に乗って", prompt: "風のように自由に、柔軟に、夢に向かって。", letterType: "poem", emoji: "🍃" },
  { day: 86, title: "4分の1年の祝い", prompt: "3ヶ月走り抜けた！乾杯！", letterType: "celebration", emoji: "🏆" },
  { day: 87, title: "春の決意", prompt: "桜が散っても、木は強く立っている。", letterType: "challenge", emoji: "🌸" },
  { day: 88, title: "ありがとうの手紙", prompt: "支えてくれた全ての人への感謝。", letterType: "gratitude", emoji: "🙏" },
  { day: 89, title: "年度末の自分へ", prompt: "よく頑張った、次のステージが待っている。", letterType: "milestone", emoji: "🎊" },
  { day: 90, title: "3月のフィナーレ", prompt: "春の序章を終え、いよいよ本番の幕が開く。", letterType: "celebration", emoji: "🎭" },
];

// --- 4月〜12月: 生成関数で作成 ---
type ThemeTuple = [string, string, string, string];

function gen(startDay: number, count: number, themes: ThemeTuple[]): DailyTheme[] {
  return Array.from({ length: count }, (_, i) => {
    const t = themes[i % themes.length];
    return { day: startDay + i, title: t[0], prompt: t[1], letterType: t[2], emoji: t[3] };
  });
}

const APR = gen(91, 30, [
  ["新年度の始まり", "桜の中、新しいスタートを切るあなたへ。", "morning", "🌸"],
  ["出会いの季節", "今日出会う人が、あなたの人生を変えるかもしれない。", "wisdom", "🤝"],
  ["パートナーと桜", "満開の桜のように、二人の愛も満ちている。", "partner_love", "🌸"],
  ["新緑の力", "あなたの中にも新しい力が芽吹いている。", "cheer", "🌿"],
  ["春の雨", "時に涙を流してもいい、それは心の栄養になる。", "self_care", "🌧️"],
  ["夢の設計図", "具体的なイメージが夢を現実に近づける。", "future_self", "📐"],
  ["感謝の花束", "今月出会った幸せを数えよう。", "gratitude", "💐"],
  ["100日目！", "新年から100日！素晴らしいマイルストーン。", "celebration", "💯"],
  ["蝶の変身", "あなたも変身の途中。美しい蝶になる日は近い。", "story", "🦋"],
  ["二人の休日", "何もしない贅沢も、二人なら最高の時間。", "together", "☕"],
  ["新緑の詩", "若葉のような瑞々しい言葉で。", "poem", "🍃"],
  ["挑戦状", "今週、一つだけ新しいことに挑戦してみよう。", "challenge", "📨"],
  ["パートナーへの花", "「いつもありがとう」の花束を。", "partner_thanks", "🌹"],
  ["春風に吹かれて", "重荷を下ろして身軽に夢へ向かおう。", "self_care", "🎐"],
  ["日の出", "毎日新しい始まり。今日はゼロからスタート。", "morning", "🌅"],
  ["名言との出会い", "一つの名言が人生を変える。", "wisdom", "💡"],
  ["150日まであと少し", "着実に進んでいる。この歩みを止めないで。", "cheer", "🚶"],
  ["風薫る季節", "季節の移ろいと共にあなたも成長している。", "season", "🌬️"],
  ["週末の約束", "頑張った自分を認めて、休息をとろう。", "self_care", "🎁"],
  ["二人のGW", "パートナーとの特別な時間を計画しよう。", "partner_love", "✈️"],
  ["藤の花", "しなやかさこそ本当の強さ。", "poem", "💜"],
  ["食べることは生きること", "食は命の源、夢の燃料。", "gratitude", "🍽️"],
  ["月末の振り返り", "成長を認めて次へ。", "milestone", "📊"],
  ["パートナーと夕日", "言葉がなくても通じ合える幸せ。", "together", "🌅"],
  ["失敗談", "失敗の中にこそ宝がある。", "story", "💎"],
  ["未来の手紙", "未来の自分はきっと今の自分に感謝する。", "future_self", "📮"],
  ["感謝の種", "今日、3人に「ありがとう」を。", "gratitude", "🌱"],
  ["4月最後の応援", "新しい環境で頑張ったあなたへ、全力応援。", "cheer", "📣"],
  ["春の総決算", "たくさんの花が咲いたこの季節を胸に。", "celebration", "🌸"],
  ["GWの前夜", "休みを楽しむ準備と、夢への充電の時間。", "morning", "🌟"],
]);

const MAY = gen(121, 31, [
  ["こどもの日", "子供の頃の純粋な気持ちを胸に。", "future_self", "🎏"],
  ["母の日の感謝", "応援してくれる全ての人への感謝。", "gratitude", "🌹"],
  ["新緑シャワー", "新鮮な気持ちで夢に向かおう。", "morning", "🌿"],
  ["二人の冒険", "パートナーと小さな冒険に出よう。", "together", "🗺️"],
  ["五月晴れ", "心を晴れやかに。曇りの日も必ず晴れる。", "cheer", "☀️"],
  ["150日目！", "半分まで来た道のりを振り返ろう。", "milestone", "📌"],
  ["パートナーの支え", "あなたの支えがあるから頑張れる。", "partner_thanks", "🫂"],
  ["薔薇の強さ", "弱さを持ちながらも美しく生きる。", "poem", "🌹"],
  ["深呼吸の日", "5月病に負けないで。自分のペースを。", "self_care", "🧘"],
  ["夢の階段", "振り返れば、もうこんなに高く登っていた。", "story", "🪜"],
  ["知恵の泉", "一つの言葉が人生の方向を変える。", "wisdom", "⛲"],
  ["パートナーとの乾杯", "二人で過ごせる今この瞬間を祝おう。", "celebration", "🍺"],
  ["風の便り", "あなたの想いは必ず届く。", "poem", "💌"],
  ["半袖の季節", "心の荷物も軽くして夢に走ろう。", "challenge", "👕"],
  ["五月の花", "一つだけじゃない、たくさんの夢を持っていい。", "morning", "🌺"],
  ["パートナーへのラブソング", "あなたと出会えた奇跡に感謝。", "partner_love", "🎵"],
  ["梅雨入り前", "雨の後には必ず虹が。", "season", "🌂"],
  ["感謝の日記", "書き出すと、幸せがもっと見えてくる。", "gratitude", "📓"],
  ["5月の星空", "あなたの夢も星のように輝いている。", "poem", "🌠"],
  ["二人の約束", "小さな約束が大きな信頼になる。", "together", "💍"],
  ["自分を褒める日", "あなたは十分頑張っている。", "self_care", "👏"],
  ["夏への準備", "新しいエネルギーで夢に向かう準備を。", "challenge", "🌻"],
  ["5月の風", "風と共に夢を追いかけて。", "season", "🎐"],
  ["パートナーの笑顔", "その笑顔のために、今日も頑張れる。", "partner_love", "😊"],
  ["夢のジグソーパズル", "毎日一ピースずつ埋めていけばいい。", "story", "🧩"],
  ["5月の応援歌", "あなたなら絶対にできる！夢は叶う！", "cheer", "📣"],
  ["5月の名言", "春の終わりは、夏の始まり。", "wisdom", "📜"],
  ["夢の木", "実がなるのはもう少し先、でも確実に育っている。", "future_self", "🌳"],
  ["月末の感謝", "来月も一緒に夢に向かおう。", "gratitude", "🙏"],
  ["5月のフィナーレ", "1年の約半分を元気に過ごせた！", "celebration", "🎉"],
  ["夏への扉", "暑い季節は情熱の季節。夢にも情熱を。", "morning", "🚪"],
]);

const JUN = gen(152, 30, [
  ["水無月の始まり", "梅雨の季節も夢の水やりの時。", "morning", "☔"],
  ["紫陽花の美", "環境に合わせて色を変える柔軟さ。", "poem", "💜"],
  ["梅雨の恵み", "困難も、あなたを成長させる恵みの雨。", "wisdom", "🌧️"],
  ["父の日", "誰かの支えになっていることへの気づき。", "gratitude", "👔"],
  ["パートナーと雨宿り", "雨の日も楽しめる二人は最強。", "partner_love", "🌂"],
  ["半年の折り返し", "折り返し地点での振り返りと後半への決意。", "milestone", "🔄"],
  ["蛍の光", "小さくても確かに光る。あなたの夢も。", "poem", "✨"],
  ["梅雨明けを待つ", "辛い時も必ず終わりが来る。待つ力も大切。", "self_care", "⛅"],
  ["夏至の力", "一年で最も日が長い日。夢の輪郭がはっきり見える。", "season", "☀️"],
  ["二人の雨の日", "パートナーとの時間に天気は関係ない。", "together", "🌈"],
  ["挑戦の夏", "暑さに負けない情熱で。", "challenge", "🔥"],
  ["パートナーへの虹", "希望と喜びを贈る。", "partner_thanks", "🌈"],
  ["夢のロードマップ", "ゴールまでの道筋が見えると安心する。", "future_self", "🗺️"],
  ["6月の応援", "梅雨のどんよりを吹き飛ばす熱い応援。", "cheer", "📣"],
  ["6月の物語", "困難の中でも希望を見つける力。", "story", "📖"],
  ["半年の感謝", "後半も一緒に走ろう。", "gratitude", "🙏"],
  ["6月の自分を労う", "偉いぞ、あなた。", "self_care", "🛁"],
  ["二人の夏計画", "楽しみがあると頑張れる。", "together", "🏖️"],
  ["6月の詩", "雨と花と夢を織り交ぜて。", "poem", "🎋"],
  ["6月のフィナーレ", "上半期お疲れ様！乾杯！", "celebration", "🥂"],
]);

const JUL = gen(182, 31, [
  ["文月の始まり", "手紙を書く月。特別な手紙をお届け。", "morning", "📝"],
  ["七夕の願い", "星に願いを、そして自分の力で叶えよう。", "poem", "🎋"],
  ["海の日", "可能性は海のように無限大。", "challenge", "🌊"],
  ["夏の太陽", "あなたも周りを照らす存在。", "cheer", "☀️"],
  ["パートナーと花火", "一瞬の美しさも、二人で見れば永遠の思い出に。", "partner_love", "🎆"],
  ["200日目！", "200日目のマイルストーン！", "milestone", "🎯"],
  ["スイカ割り", "見えなくても信じて進もう。", "story", "🍉"],
  ["夏休みの自分へ", "たまには何もしない贅沢を。", "self_care", "🏖️"],
  ["向日葵の生き方", "夢に向かってまっすぐに。", "wisdom", "🌻"],
  ["二人の夏の思い出", "今日が未来の大切な思い出になる。", "together", "📸"],
  ["7月の感謝", "全てがあなたを成長させている。", "gratitude", "🙏"],
  ["夏の応援", "あなたの夢は最高に輝いている！", "cheer", "📣"],
  ["パートナーへの涼", "あなたの存在が最高の涼。", "partner_thanks", "🧊"],
  ["7月の夕立", "困難の後に必ず美しいものが待っている。", "poem", "🌈"],
  ["7月のフィナーレ", "夏本番はこれから。後半戦も全力で！", "celebration", "🎊"],
]);

const AUG = gen(213, 31, [
  ["葉月の始まり", "夢への情熱も最高潮に。燃えろ！", "morning", "🌞"],
  ["花火のように", "長く輝き続ける夢の炎を。", "poem", "🎇"],
  ["お盆の感謝", "今ここにいる奇跡に感謝。", "gratitude", "🏮"],
  ["パートナーと星空", "無数の星のように、二人の未来も輝いている。", "partner_love", "⭐"],
  ["夏の冒険", "新しい場所、新しい体験が夢を広げる。", "challenge", "🏔️"],
  ["終戦の日", "平和だからこそ夢を追いかけられる幸せ。", "wisdom", "🕊️"],
  ["二人の夏祭り", "二人の夏を楽しもう。", "together", "🎪"],
  ["夏の疲れ", "休むことも夢への近道。", "self_care", "🧊"],
  ["8月の物語", "情熱と希望に満ちた冒険を。", "story", "🌙"],
  ["残暑見舞い", "暑い日々を乗り越えるあなたを労う。", "self_care", "🍧"],
  ["秋への準備", "実りの秋への準備をしながら、今を楽しもう。", "season", "🍂"],
  ["250日目", "年の3分の2を超えた。すごい！", "milestone", "🏅"],
  ["パートナーへの夏の手紙", "暑い夏を一緒に乗り越えてくれた感謝。", "partner_thanks", "💌"],
  ["夏の応援", "夏バテに負けるな！", "cheer", "📣"],
  ["8月のフィナーレ", "夏を完走！秋へ。", "celebration", "🎉"],
]);

const SEP = gen(244, 30, [
  ["長月の始まり", "実りの季節に向けて、夢も実りつつある。", "morning", "🍁"],
  ["新学期の心", "成長に終わりはない。", "challenge", "📚"],
  ["十五夜", "自分の夢の美しさも愛でよう。", "poem", "🌕"],
  ["パートナーと秋散歩", "移ろう景色と変わらない愛。", "partner_love", "🍂"],
  ["敬老の日", "長い人生の知恵に学ぶ。", "gratitude", "👴"],
  ["秋分の日", "心身のバランスを整えて後半戦へ。", "wisdom", "⚖️"],
  ["実りの秋", "あなたの努力が形になる。", "future_self", "🌾"],
  ["二人の秋の計画", "紅葉狩り、温泉、美味しいもの。", "together", "🗓️"],
  ["コスモスの詩", "あなたらしさを大切に。", "poem", "🌸"],
  ["秋の夜長", "夢について深く考えてみよう。", "self_care", "🌙"],
  ["9月の応援", "ラストスパートへの応援。あなたならできる！", "cheer", "📣"],
  ["3分の4", "ここまでの道のりを誇りに思おう。", "milestone", "🏆"],
  ["秋の物語", "一枚一枚の葉が、あなたの努力の証。", "story", "🍁"],
  ["パートナーへの感謝状", "感謝の気持ちも深まる秋。", "partner_thanks", "📜"],
  ["9月のフィナーレ", "実りの多い月。10月への期待を。", "celebration", "🎊"],
]);

const OCT = gen(274, 31, [
  ["神無月の始まり", "あなたの夢にも神様のご加護を。", "morning", "⛩️"],
  ["秋の深まり", "夢への想いも深まっていく。", "season", "🍁"],
  ["ハロウィン準備", "新しい自分になることを恐れないで。", "challenge", "🎃"],
  ["パートナーと紅葉", "二人の愛も深まる。", "partner_love", "🍂"],
  ["読書の秋", "一冊の本が人生を変えることがある。", "wisdom", "📖"],
  ["スポーツの秋", "健康は夢を叶える土台。", "self_care", "🏃"],
  ["300日目！", "残り65日。クライマックスへ。", "milestone", "🎯"],
  ["秋の味覚", "五感を満たして夢に向かおう。", "gratitude", "🍠"],
  ["二人の秋", "一緒にいると季節がもっと美しい。", "together", "🧡"],
  ["ハロウィン", "夢に向かう勇気というお菓子をあげよう。", "story", "🎃"],
  ["秋の応援", "あなたの夢は必ず叶う！", "cheer", "📣"],
  ["秋の詩", "美しい季節の一瞬を切り取って。", "poem", "🎋"],
  ["パートナーへの秋の手紙", "温かく実のある感謝の手紙。", "partner_thanks", "🍎"],
  ["冬への準備", "温かい心があれば大丈夫。", "season", "🧥"],
  ["10月のフィナーレ", "残り2ヶ月、全力で！乾杯！", "celebration", "🥂"],
]);

const NOV = gen(305, 30, [
  ["霜月の始まり", "夢への熱い想いを。", "morning", "🍂"],
  ["文化の日", "芸術に触れてインスピレーションを。", "wisdom", "🎨"],
  ["七五三", "何歳でも成長できる。", "celebration", "🎊"],
  ["パートナーと鍋", "温かい食卓は二人の宝物。", "partner_love", "🍲"],
  ["感謝祭", "あなたの周りの愛に気づいて。", "gratitude", "🦃"],
  ["冬支度", "来年の夢への準備を始めよう。", "future_self", "🧤"],
  ["二人の記念日", "二人の物語はまだまだ続く。", "together", "💕"],
  ["紅葉の最後", "終わりは新しい始まり。", "poem", "🍁"],
  ["330日目", "あと35日で一年を走り切れる。", "milestone", "🏃"],
  ["冬の物語", "暖かい場所を求めて歩く旅人の物語。", "story", "🔥"],
  ["年末への応援", "最後まで全力で！", "cheer", "📣"],
  ["パートナーへの冬の手紙", "温かい言葉をパートナーへ。", "partner_thanks", "💗"],
  ["自分へのご褒美", "一年頑張った自分を労おう。", "self_care", "🎁"],
  ["秋の終わり", "冬の後には必ず春が来る。希望を持って。", "season", "❄️"],
  ["11月のフィナーレ", "あと1ヶ月。最高のフィナーレへ。", "celebration", "🎭"],
]);

const DEC = gen(335, 31, [
  ["師走の始まり", "忙しい中でも夢のことを忘れないで。", "morning", "🎄"],
  ["冬の星", "あなたの夢も澄んだ光で輝いている。", "poem", "⭐"],
  ["大掃除の心", "不要な不安や後悔を手放して新年へ。", "self_care", "🧹"],
  ["パートナーとクリスマス準備", "飾り付けをしながら、来年の夢を語ろう。", "partner_love", "🎅"],
  ["一年の感謝", "365日分の感謝を込めて。ありがとう。", "gratitude", "🙏"],
  ["冬至", "明日からは日が長くなる。希望の転換点。", "season", "🕯️"],
  ["クリスマスイブ", "大切な人への愛と夢への想いを込めて。", "partner_love", "🌟"],
  ["クリスマス", "あなたの夢という最高のプレゼントを大切に。", "celebration", "🎄"],
  ["二人の年末", "一年を振り返り、来年の夢を共に描く幸せ。", "together", "🥂"],
  ["360日目", "この一年を走り切ったあなたは本当にすごい。", "milestone", "🏆"],
  ["年末の応援", "来年はもっと素晴らしい年になる！", "cheer", "📣"],
  ["年越しの詩", "あなたの夢は年をまたいで輝き続ける。", "poem", "🎆"],
  ["大晦日イブ", "一年分の自分を褒めよう。本当によく頑張った。", "self_care", "🌙"],
  ["大晦日", "全てに感謝し、新しい年への希望を胸に。よいお年を！", "celebration", "🎊"],
  ["未来への扉", "来年こそ、あなたの夢が花開く年に。信じている。", "future_self", "🚪"],
]);

// --- 全テーマを結合 ---
export const ALL_DAILY_THEMES: DailyTheme[] = [
  ...JAN, ...FEB, ...MAR, ...APR, ...MAY, ...JUN,
  ...JUL, ...AUG, ...SEP, ...OCT, ...NOV, ...DEC,
];

// --- 今日のテーマを取得 ---
export function getTodayTheme(): DailyTheme {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const theme = ALL_DAILY_THEMES.find((t) => t.day === dayOfYear);
  if (theme) return theme;

  // Fallback: cycle through themes
  const index = dayOfYear % ALL_DAILY_THEMES.length;
  return ALL_DAILY_THEMES[index];
}

// --- 指定日のテーマを取得 ---
export function getThemeByDay(dayOfYear: number): DailyTheme {
  const theme = ALL_DAILY_THEMES.find((t) => t.day === dayOfYear);
  if (theme) return theme;
  const index = dayOfYear % ALL_DAILY_THEMES.length;
  return ALL_DAILY_THEMES[index];
}
