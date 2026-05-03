// 勝負服風スウォッチ：CSSグラデーションで簡易表現
const CLUB_SWATCHES = {
  "サンデーR":   "linear-gradient(135deg, #000 0%, #000 50%, #ffd700 50%, #ffd700 100%)",
  "社台RH":      "linear-gradient(90deg, #ffd700 0%, #000 33%, #ffd700 33%, #ffd700 66%, #000 66%, #ffd700 100%)",
  "G1レーシング": "linear-gradient(45deg, #000 45%, #e53935 45%, #e53935 55%, #000 55%)",
  "キャロット":   "linear-gradient(135deg, #1a5e20, #4c8c4a)",
  "シルク":       "radial-gradient(circle, #e53935 25%, #87ceeb 25%)",
  "DMMバヌーシー": "linear-gradient(135deg, #000 60%, #1a5e20 60%)",
  "東サラ":      "radial-gradient(circle, #fff 18%, #e53935 18%)",
  "ノルマンディー": "linear-gradient(180deg, #000 50%, #1e40af 50%)",
  "ウイン":      "linear-gradient(90deg, #e53935 0%, #000 33%, #e53935 33%, #e53935 66%, #000 66%, #e53935 100%)",
  "ラフィアン":   "linear-gradient(135deg, #e53935 50%, #1a5e20 50%)",
  "ロード":      "linear-gradient(180deg, #fff 50%, #1e40af 50%)",
  "広尾":        "linear-gradient(180deg, #1a5e20 50%, #fff 50%)",
  "YGG":         "linear-gradient(45deg, #000 45%, #ffd700 45%, #ffd700 55%, #8b4513 55%)",
  "ライオン":    "linear-gradient(180deg, #ffd700 60%, #000 60%)",
  "グリーン":    "linear-gradient(180deg, #4c8c4a 33%, #000 33%, #000 50%, #4c8c4a 50%)",
  "友駿":        "linear-gradient(180deg, #1a5e20 33%, #000 33%, #000 50%, #1a5e20 50%)",
  "ユニオン":    "linear-gradient(135deg, #1a5e20 50%, #e53935 50%)",
  "ターファイト": "radial-gradient(circle, #000 18%, #40e0d0 18%)",
  "ローレル":    "linear-gradient(180deg, #ffc0cb 60%, #ffd700 60%)",
  "大樹":        "linear-gradient(180deg, #1e40af 50%, #fff 50%)",
  "ワラウカド":  "linear-gradient(45deg, #000 40%, #e53935 40%, #e53935 50%, #fff 50%, #fff 60%, #000 60%)",
  "インゼル":    "linear-gradient(180deg, #fff 50%, #808080 50%)",
  "京サラ":      "linear-gradient(45deg, #ffd700 45%, #1e40af 45%, #1e40af 55%, #ffd700 55%)",
  "バゴバゴ":    "repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 4px, #f1f5f9 4px, #f1f5f9 8px)"
};

window.CLUB_SWATCHES = CLUB_SWATCHES;

// 日付ユーティリティ
function formatDateHeader(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dStart = new Date(d); dStart.setHours(0,0,0,0);
  const diff = Math.round((dStart - today) / 86400000);

  const dayLabels = ["日","月","火","水","木","金","土"];
  const main = `${d.getMonth()+1}月${d.getDate()}日`;
  const day = dayLabels[d.getDay()];
  let pill = null;
  if (diff === 0) pill = { type: "today", label: "本日" };
  else if (diff === 1) pill = { type: "tomorrow", label: "明日" };
  else if (d.getDay() === 0 || d.getDay() === 6) pill = { type: "weekend", label: d.getDay() === 6 ? "土曜" : "日曜" };
  return { main, day, pill, diff };
}

function relativeTime(timestampStr) {
  if (!timestampStr) return "";
  const t = new Date(timestampStr.replace(" ", "T"));
  const diff = (Date.now() - t.getTime()) / 1000;
  if (diff < 60) return "たった今";
  if (diff < 3600) return `${Math.floor(diff/60)}分前`;
  if (diff < 86400) return `${Math.floor(diff/3600)}時間前`;
  if (diff < 2592000) return `${Math.floor(diff/86400)}日前`;
  return t.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

function parseConditions(cond) {
  if (!cond) return { surface: "芝", distance: "" };
  if (cond.startsWith("ダート")) return { surface: "ダート", distance: cond.substring(3) };
  if (cond.startsWith("障害"))   return { surface: "障害", distance: cond.substring(2) };
  if (cond.startsWith("芝"))     return { surface: "芝", distance: cond.substring(1) };
  return { surface: "芝", distance: cond };
}

function condClass(surface) {
  if (surface === "ダート") return "dirt";
  if (surface === "障害") return "jump";
  return "turf";
}

window.formatDateHeader = formatDateHeader;
window.relativeTime = relativeTime;
window.parseConditions = parseConditions;
window.condClass = condClass;
