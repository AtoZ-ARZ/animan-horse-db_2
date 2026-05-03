// モックデータ：実装時はSupabaseから取得する
const CLUB_OPTIONS = {
  "サンデーR": "サンデーレーシング",
  "社台RH": "社台レースホース",
  "G1レーシング": "G1レーシング",
  "キャロット": "キャロットクラブ",
  "シルク": "シルクホースクラブ",
  "DMMバヌーシー": "DMMバヌーシー",
  "東サラ": "東京サラブレッドクラブ",
  "ノルマンディー": "ノルマンディーOC",
  "ウイン": "ウインレーシングクラブ",
  "ラフィアン": "ラフィアンターフマンクラブ",
  "ロード": "ロードホースクラブ",
  "広尾": "広尾サラブレッド倶楽部",
  "YGG": "YGGオーナーズクラブ",
  "ライオン": "サラブレッドクラブライオン",
  "グリーン": "グリーンファーム愛馬会",
  "友駿": "友駿ホースクラブ",
  "ユニオン": "ユニオンオーナーズクラブ",
  "ターファイト": "ターファイトクラブ",
  "ローレル": "ローレルクラブ",
  "大樹": "大樹レーシングクラブ",
  "ワラウカド": "ワラウカド",
  "インゼル": "インゼルサラブレッドクラブ",
  "京サラ": "京都サラブレッドクラブ",
  "バゴバゴ": "その他・個人等"
};

const CLUB_CLASSES = {
  "サンデーR": "sunday", "社台RH": "shadai", "G1レーシング": "g1",
  "キャロット": "carrot", "シルク": "silk", "DMMバヌーシー": "dmm",
  "東サラ": "tokyo-tc", "ノルマンディー": "normandy", "ウイン": "win",
  "ラフィアン": "ruffian", "ロード": "lord", "広尾": "hiroo",
  "YGG": "ygg", "ライオン": "lion", "グリーン": "green",
  "友駿": "yushun", "ユニオン": "union", "ターファイト": "turfite",
  "ローレル": "laurel", "大樹": "taiki", "ワラウカド": "waraukado",
  "インゼル": "insel", "京サラ": "kyoto-tc", "バゴバゴ": "other"
};

const RACECOURSES_JRA = ["札幌","函館","福島","新潟","東京","中山","中京","京都","阪神","小倉"];
const RACECOURSES_NAR = ["門別","帯広","盛岡","水沢","浦和","船橋","大井","川崎","金沢","笠松","名古屋","園田","姫路","高知","佐賀"];

// 今日と未来の日付を動的生成
const today = new Date();
function dateOffset(days) {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const MOCK_POSTS = [
  {
    id: 1, horse_name: "ピースフルブリーズ", club: "サンデーR",
    race_date: dateOffset(0), racecourse: "東京", race_number: 11,
    race_name: "ヴィクトリアマイル", conditions: "芝1600m", confidence: 5,
    poster_name: "桜花賞愛好家", comment: "馬体絞れて状態抜群！前走の上がり最速で完全に脚を余した形。展開さえ向けば間違いなく勝ち負けできる。",
    likes: 12, created_at: "2026-04-28 10:23:00"
  },
  {
    id: 2, horse_name: "ゴールデンレイ", club: "キャロット",
    race_date: dateOffset(0), racecourse: "東京", race_number: 7,
    race_name: "", conditions: "芝1400m", confidence: 3,
    poster_name: "", comment: "初の左回り、適性が問われる一戦。",
    likes: 4, created_at: "2026-04-30 18:45:00"
  },
  {
    id: 3, horse_name: "ノーザンスカイ", club: "シルク",
    race_date: dateOffset(1), racecourse: "京都", race_number: 11,
    race_name: "天皇賞(春)", conditions: "芝3200m", confidence: 4,
    poster_name: "長距離党", comment: "スタミナお化け。",
    likes: 23, created_at: "2026-04-25 09:00:00"
  },
  {
    id: 4, horse_name: "ファイアーストーム", club: "G1レーシング",
    race_date: dateOffset(1), racecourse: "新潟", race_number: 9,
    race_name: "", conditions: "ダート1800m", confidence: 2,
    poster_name: "ダート専門", comment: "前走の4着から間隔取って仕上げてきた。",
    likes: 2, created_at: "2026-04-27 14:30:00"
  },
  {
    id: 5, horse_name: "ミッドナイトサン", club: "社台RH",
    race_date: dateOffset(2), racecourse: "中山", race_number: 11,
    race_name: "京成杯AH", conditions: "芝1600m", confidence: 4,
    poster_name: "", comment: "",
    likes: 8, created_at: "2026-04-26 21:00:00"
  },
  {
    id: 6, horse_name: "ホワイトクリスタル", club: "DMMバヌーシー",
    race_date: dateOffset(2), racecourse: "中山", race_number: 4,
    race_name: "3歳未勝利", conditions: "芝1800m", confidence: 3,
    poster_name: "新馬戦マニア", comment: "今度こそ勝ちたい！",
    likes: 5, created_at: "2026-04-28 12:15:00"
  },
  {
    id: 7, horse_name: "ブルーホライズン", club: "ウイン",
    race_date: dateOffset(3), racecourse: "阪神", race_number: 10,
    race_name: "難波S", conditions: "芝2000m", confidence: 3,
    poster_name: "関西勢", comment: "得意の阪神2000m。",
    likes: 6, created_at: "2026-04-29 08:30:00"
  },
  {
    id: 8, horse_name: "サンセットグロウ", club: "東サラ",
    race_date: dateOffset(3), racecourse: "阪神", race_number: 11,
    race_name: "ローズS", conditions: "芝1800m", confidence: 5,
    poster_name: "牝馬戦線追っかけ", comment: "ここを足がかりに秋華賞へ。状態は文句なし。",
    likes: 31, created_at: "2026-04-26 17:20:00"
  },
  {
    id: 9, horse_name: "ラピッドスター", club: "ノルマンディー",
    race_date: dateOffset(4), racecourse: "小倉", race_number: 12,
    race_name: "", conditions: "ダート1700m", confidence: 1,
    poster_name: "", comment: "無事是名馬。",
    likes: 1, created_at: "2026-05-01 11:00:00"
  },
  {
    id: 10, horse_name: "プラチナリーフ", club: "ロード",
    race_date: dateOffset(7), racecourse: "東京", race_number: 11,
    race_name: "オークス", conditions: "芝2400m", confidence: 5,
    poster_name: "クラシック組", comment: "桜花賞2着からの直行。距離延長も血統的に問題なし。",
    likes: 47, created_at: "2026-04-22 19:00:00"
  },
  {
    id: 11, horse_name: "シルバーアロー", club: "ラフィアン",
    race_date: dateOffset(8), racecourse: "京都", race_number: 9,
    race_name: "", conditions: "芝1200m", confidence: 2,
    poster_name: "短距離派", comment: "",
    likes: 3, created_at: "2026-04-30 22:00:00"
  },
  {
    id: 12, horse_name: "クリムゾンエッジ", club: "広尾",
    race_date: dateOffset(14), racecourse: "中京", race_number: 11,
    race_name: "金鯱賞", conditions: "芝2000m", confidence: 4,
    poster_name: "重賞ハンター", comment: "",
    likes: 11, created_at: "2026-04-20 13:00:00"
  }
];

window.CLUB_OPTIONS = CLUB_OPTIONS;
window.CLUB_CLASSES = CLUB_CLASSES;
window.RACECOURSES_JRA = RACECOURSES_JRA;
window.RACECOURSES_NAR = RACECOURSES_NAR;
window.MOCK_POSTS = MOCK_POSTS;
