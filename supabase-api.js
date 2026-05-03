// === Supabase接続レイヤー ===
// 設定はビルド時に書き換える、または HTML 内で window.SUPABASE_CONFIG を定義する。
// 既存のNeonデータを移行する場合は migrate-from-neon.sql を参照。

const SUPABASE_URL = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) || "";
const SUPABASE_ANON_KEY = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.anonKey) || "";

const REST = SUPABASE_URL ? `${SUPABASE_URL}/rest/v1` : "";

const headers = () => ({
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
});

async function api(path, opts = {}) {
  if (!SUPABASE_URL) throw new Error("Supabase未設定");
  const res = await fetch(`${REST}${path}`, { ...opts, headers: { ...headers(), ...(opts.headers || {}) } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// bcrypt: bcryptjs は window.dcodeIO.bcrypt または window.bcrypt として公開される
function getBcrypt() {
  if (window.dcodeIO && window.dcodeIO.bcrypt) return window.dcodeIO.bcrypt;
  if (window.bcrypt) return window.bcrypt;
  throw new Error("bcryptjs が読み込まれていません");
}
async function hashPassword(plain) {
  const b = getBcrypt();
  const salt = b.genSaltSync(10);
  return b.hashSync(plain, salt);
}
async function verifyPassword(plain, hashed) {
  return getBcrypt().compareSync(plain, hashed);
}
window.getBcrypt = getBcrypt;

// 投稿一覧取得（過去レースは取得時に除外）
async function fetchPosts() {
  const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const yesterday = new Date(Date.now() + JST_OFFSET_MS - 86400000).toISOString().slice(0, 10);
  // race_date >= yesterday の投稿、日付昇順
  const params = new URLSearchParams({
    "select": "id,horse_name,club,race_date,racecourse,race_number,race_name,conditions,confidence,poster_name,comment,likes,is_tentative,tentative_month,created_at",
    "or": `(race_date.gte.${yesterday},is_tentative.eq.true)`,
    "order": "is_tentative.asc,race_date.asc,racecourse.asc,race_number.asc"
  });
  return api(`/posts?${params}`);
}

// 投稿作成
async function createPost(data) {
  const password_hash = await hashPassword(data.password);
  const payload = {
    horse_name: data.horse_name,
    club: data.club,
    race_date: data.race_date,
    racecourse: data.racecourse || "",
    race_number: data.race_number || 0,
    race_name: data.race_name || "",
    conditions: data.conditions || "",
    confidence: data.confidence,
    poster_name: data.poster_name || "",
    comment: data.comment || "",
    is_tentative: !!data.is_tentative,
    tentative_month: data.tentative_month || null,
    likes: 0,
    password_hash
  };
  const result = await api("/posts", { method: "POST", body: JSON.stringify(payload) });
  return Array.isArray(result) ? result[0] : result;
}

// 投稿更新（パスワード照合はクライアント側で）
async function updatePost(id, data, plainPassword) {
  // パスワードハッシュを取得して照合
  const rows = await api(`/posts?id=eq.${id}&select=password_hash`);
  if (!rows || rows.length === 0) throw new Error("投稿が見つかりません");
  const ok = await verifyPassword(plainPassword, rows[0].password_hash);
  if (!ok) throw new Error("パスワードが違います");

  const payload = {
    horse_name: data.horse_name,
    club: data.club,
    race_date: data.race_date,
    racecourse: data.racecourse || "",
    race_number: data.race_number || 0,
    race_name: data.race_name || "",
    conditions: data.conditions || "",
    confidence: data.confidence,
    poster_name: data.poster_name || "",
    comment: data.comment || "",
    is_tentative: !!data.is_tentative,
    tentative_month: data.tentative_month || null
  };
  const result = await api(`/posts?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  return Array.isArray(result) ? result[0] : result;
}

// 投稿削除
async function deletePost(id, plainPassword) {
  const rows = await api(`/posts?id=eq.${id}&select=password_hash`);
  if (!rows || rows.length === 0) throw new Error("投稿が見つかりません");
  const ok = await verifyPassword(plainPassword, rows[0].password_hash);
  if (!ok) throw new Error("パスワードが違います");
  await api(`/posts?id=eq.${id}`, { method: "DELETE", headers: { "Prefer": "return=minimal" } });
}

// いいねトグル（RPC関数を使うのが理想だが、楽観更新でカウント±1）
async function incrementLike(id, delta = 1) {
  // RPC: increment_like(post_id int, delta int)
  return api(`/rpc/increment_like`, {
    method: "POST",
    body: JSON.stringify({ post_id: id, delta })
  });
}

window.supabaseAPI = {
  fetchPosts, createPost, updatePost, deletePost, incrementLike,
  isConfigured: () => !!SUPABASE_URL
};
