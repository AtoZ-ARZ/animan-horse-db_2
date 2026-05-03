// === メインアプリ（Supabase版） ===
const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "density": "comfortable",
  "layout": "list",
  "showFilters": true
}/*EDITMODE-END*/;

const DATE_FILTERS = [
  { id: "all", label: "すべて" },
  { id: "today", label: "本日" },
  { id: "weekend", label: "今週末" },
  { id: "future", label: "今後" },
  { id: "tentative", label: "仮予定" }
];

const CONFIDENCE_FILTERS = [
  { id: "all", label: "全自信度" },
  { id: "high", label: "★4以上" },
  { id: "top", label: "★5のみ" }
];

function App() {
  const [tweaks, setTweaksState] = useStateA(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("animan_tweaks") || "{}");
      return { ...TWEAK_DEFAULTS, ...saved };
    } catch { return TWEAK_DEFAULTS; }
  });

  const setTweak = (key, value) => {
    let next;
    if (typeof key === "object") next = { ...tweaks, ...key };
    else next = { ...tweaks, [key]: value };
    setTweaksState(next);
    localStorage.setItem("animan_tweaks", JSON.stringify(next));
    try {
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits: next }, "*");
    } catch {}
  };

  // === Supabaseデータ ===
  const [posts, setPosts] = useStateA([]);
  const [loading, setLoading] = useStateA(true);
  const [loadError, setLoadError] = useStateA(null);
  const [busy, setBusy] = useStateA(false);

  const reload = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (!window.supabaseAPI.isConfigured()) {
        throw new Error("Supabaseが未設定です。HTMLヘッダーの window.SUPABASE_CONFIG を設定してください。");
      }
      // 期限切れ投稿の自動削除（出走日から7日経過したものを削除）
      try {
        const deleted = await window.supabaseAPI.purgeExpiredPosts();
        if (deleted > 0) console.log(`期限切れ投稿を ${deleted} 件削除しました`);
      } catch (e) { console.warn("自動削除エラー", e); }

      const data = await window.supabaseAPI.fetchPosts();
      setPosts(data || []);
    } catch (e) {
      setLoadError(e.message || String(e));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffectA(() => { reload(); }, []);

  // === ローカルのみで管理する状態 ===
  const [likes, setLikes] = useStateA(() => {
    try { return JSON.parse(localStorage.getItem("animan_likes") || "[]"); } catch { return []; }
  });
  const [cheers, setCheers] = useStateA(() => {
    try { return JSON.parse(localStorage.getItem("animan_cheers") || "[]"); } catch { return []; }
  });
  const [favHorses, setFavHorses] = useStateA(() => {
    try { return JSON.parse(localStorage.getItem("animan_fav_horses") || "[]"); } catch { return []; }
  });

  useEffectA(() => { localStorage.setItem("animan_likes", JSON.stringify(likes)); }, [likes]);
  useEffectA(() => { localStorage.setItem("animan_cheers", JSON.stringify(cheers)); }, [cheers]);
  useEffectA(() => { localStorage.setItem("animan_fav_horses", JSON.stringify(favHorses)); }, [favHorses]);

  const favKey = (name, club) => `${name}|${club}`;
  const favSet = useMemoA(() => new Set(favHorses.map(f => favKey(f.horse_name, f.club))), [favHorses]);
  const isFav = (name, club) => favSet.has(favKey(name, club));
  const toggleFav = (horse_name, club, memo = "") => {
    const k = favKey(horse_name, club);
    if (favSet.has(k)) {
      setFavHorses(favHorses.filter(f => favKey(f.horse_name, f.club) !== k));
    } else {
      setFavHorses([...favHorses, { horse_name, club, memo, added_at: new Date().toISOString() }]);
    }
  };
  const updateFavMemo = (name, club, memo) => {
    setFavHorses(favHorses.map(f => (f.horse_name === name && f.club === club) ? { ...f, memo } : f));
  };

  const [search, setSearch] = useStateA("");
  const [dateFilter, setDateFilter] = useStateA("all");
  const [confFilter, setConfFilter] = useStateA("all");
  const [favOnly, setFavOnly] = useStateA(false);
  const [postModalOpen, setPostModalOpen] = useStateA(false);
  const [postPrefill, setPostPrefill] = useStateA(null);
  const [editTarget, setEditTarget] = useStateA(null);
  const [editStep, setEditStep] = useStateA("auth");
  const [authError, setAuthError] = useStateA(null);
  const [favListOpen, setFavListOpen] = useStateA(false);

  // フィルタリング
  const filtered = useMemoA(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const sundayEnd = new Date(today);
    const dow = today.getDay();
    sundayEnd.setDate(today.getDate() + (7 - dow));
    sundayEnd.setHours(23,59,59,999);

    return posts.filter(p => {
      if (search) {
        const q = search.toLowerCase();
        const hay = `${p.horse_name} ${p.club} ${p.race_name||""} ${p.poster_name||""} ${p.comment||""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dateFilter === "tentative") {
        if (!p.is_tentative) return false;
      } else {
        const d = new Date((p.race_date || "1970-01-01") + "T00:00:00");
        // 過去日付の通常投稿は全フィルタで非表示
        if (!p.is_tentative && d < today) return false;
        if (dateFilter === "today") { if (p.is_tentative || d.getTime() !== today.getTime()) return false; }
        else if (dateFilter === "weekend") { if (p.is_tentative || d < today || d > sundayEnd || (d.getDay() !== 0 && d.getDay() !== 6)) return false; }
        else if (dateFilter === "future") { if (p.is_tentative || d <= today) return false; }
      }

      if (confFilter === "high" && p.confidence < 4) return false;
      if (confFilter === "top" && p.confidence < 5) return false;
      if (favOnly && !favSet.has(favKey(p.horse_name, p.club))) return false;
      return true;
    });
  }, [posts, search, dateFilter, confFilter, favOnly, favSet]);

  // 日付グルーピング
  const grouped = useMemoA(() => {
    const tentativeMap = {};
    const dateMap = {};
    filtered.forEach(p => {
      if (p.is_tentative) {
        const key = p.tentative_month || "未定";
        if (!tentativeMap[key]) tentativeMap[key] = [];
        tentativeMap[key].push(p);
      } else {
        if (!dateMap[p.race_date]) dateMap[p.race_date] = [];
        dateMap[p.race_date].push(p);
      }
    });
    Object.keys(dateMap).forEach(k => {
      dateMap[k].sort((a, b) => {
        if (a.racecourse !== b.racecourse) return a.racecourse.localeCompare(b.racecourse);
        return a.race_number - b.race_number;
      });
    });
    const dateGroups = Object.keys(dateMap).sort().map(date => ({ date, items: dateMap[date], tentative: false }));
    const tentativeGroups = Object.keys(tentativeMap).sort().map(month => ({ date: month, items: tentativeMap[month], tentative: true }));
    return [...dateGroups, ...tentativeGroups];
  }, [filtered]);

  // === アクション ===
  const toggleLike = async (id) => {
    const liked = likes.includes(id);
    const delta = liked ? -1 : 1;
    // 楽観更新
    setLikes(prev => liked ? prev.filter(x => x !== id) : [...prev, id]);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: Math.max(0, (p.likes || 0) + delta) } : p));
    try {
      await window.supabaseAPI.incrementLike(id, delta);
    } catch (e) {
      // 失敗時はロールバック
      setLikes(prev => liked ? [...prev, id] : prev.filter(x => x !== id));
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: Math.max(0, (p.likes || 0) - delta) } : p));
      alert("いいねの更新に失敗しました: " + e.message);
    }
  };

  const toggleCheer = async (id) => {
    const cheered = cheers.includes(id);
    const delta = cheered ? -1 : 1;
    setCheers(prev => cheered ? prev.filter(x => x !== id) : [...prev, id]);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, cheer_count: Math.max(0, (p.cheer_count || 0) + delta) } : p));
    try {
      await window.supabaseAPI.incrementCheer(id, delta);
    } catch (e) {
      setCheers(prev => cheered ? [...prev, id] : prev.filter(x => x !== id));
      setPosts(prev => prev.map(p => p.id === id ? { ...p, cheer_count: Math.max(0, (p.cheer_count || 0) - delta) } : p));
      alert("一口仲間の更新に失敗しました: " + e.message);
    }
  };

  const handleCreatePost = async (data) => {
    setBusy(true);
    try {
      const newPost = await window.supabaseAPI.createPost(data);
      setPosts(prev => [...prev, newPost]);
      setPostModalOpen(false);
    } catch (e) {
      alert("投稿に失敗しました: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (id) => {
    setEditTarget(id);
    setEditStep("auth");
    setAuthError(null);
  };

  const handleUnlock = async (pw) => {
    if (!pw) { setAuthError("パスワードを入力してください"); return; }
    setBusy(true);
    setAuthError(null);
    try {
      // パスワード照合のみ先に試す（fetch + verify）
      const post = posts.find(p => p.id === editTarget);
      if (!post) { setAuthError("投稿が見つかりません"); return; }
      // ハッシュをサーバーから取得して照合（簡易：updateを試みず照合専用）
      const headers = {
        "apikey": window.SUPABASE_CONFIG.anonKey,
        "Authorization": `Bearer ${window.SUPABASE_CONFIG.anonKey}`
      };
      const res = await fetch(`${window.SUPABASE_CONFIG.url}/rest/v1/posts?id=eq.${editTarget}&select=password_hash`, { headers });
      if (!res.ok) throw new Error("照合に失敗しました");
      const rows = await res.json();
      if (!rows || rows.length === 0) { setAuthError("投稿が見つかりません"); return; }
      const ok = window.getBcrypt().compareSync(pw, rows[0].password_hash);
      if (!ok) { setAuthError("パスワードが違います"); return; }
      window._editPassword = pw; // 一時保存
      setEditStep("edit");
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (pw) => {
    if (!pw) { setAuthError("パスワードを入力してください"); return; }
    setBusy(true);
    try {
      await window.supabaseAPI.deletePost(editTarget, pw);
      setPosts(posts.filter(p => p.id !== editTarget));
      setEditTarget(null);
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (data) => {
    setBusy(true);
    try {
      const updated = await window.supabaseAPI.updatePost(editTarget, data, window._editPassword);
      setPosts(posts.map(p => p.id === editTarget ? updated : p));
      setEditTarget(null);
      window._editPassword = null;
    } catch (e) {
      alert("更新に失敗しました: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const editingPost = editTarget ? posts.find(p => p.id === editTarget) : null;

  return (
    <div data-theme={tweaks.theme} data-density={tweaks.density} data-layout={tweaks.layout} style={{minHeight: "100vh", background: "var(--bg)"}}>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <div className="brand-mark">馬</div>
            <div className="brand-text">
              <div className="brand-title">あにまん一口馬主部 出走予定</div>
              <div className="brand-sub">愛馬の出走予定をシェアしよう</div>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setFavListOpen(true)} title="マイ出資馬リスト">
              <span style={{fontSize: 16, lineHeight: 1}}>★</span>
              <span className="btn-text">マイリスト{favHorses.length > 0 ? ` (${favHorses.length})` : ""}</span>
            </button>
            <button className="btn btn-primary" onClick={() => { setPostPrefill(null); setPostModalOpen(true); }} disabled={loading}>
              <window.PlusIcon /><span className="btn-text">新規投稿</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {tweaks.showFilters && (
          <div className="filter-bar">
            <div className="filter-group">
              {DATE_FILTERS.map(f => (
                <button key={f.id} className={`filter-chip ${dateFilter === f.id ? "active" : ""}`} onClick={() => setDateFilter(f.id)}>{f.label}</button>
              ))}
            </div>
            <div className="filter-group">
              {CONFIDENCE_FILTERS.map(f => (
                <button key={f.id} className={`filter-chip ${confFilter === f.id ? "active" : ""}`} onClick={() => setConfFilter(f.id)}>{f.label}</button>
              ))}
            </div>
            <button
              className={`filter-chip fav-toggle ${favOnly ? "active" : ""}`}
              onClick={() => setFavOnly(!favOnly)}
              title="お気に入り馬のみ表示"
              style={{border: "1px solid var(--border)", background: favOnly ? "var(--accent)" : "var(--bg-card)", color: favOnly ? "white" : "var(--text-muted)"}}
            >
              ★ マイ馬のみ
            </button>
            <input className="search-input" type="text" placeholder="馬名・クラブ・コメント等で検索" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-ghost btn-sm" onClick={reload} disabled={loading} title="再読込">↻</button>
          </div>
        )}

        {loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-title">読込中...</div>
            <div className="empty-state-sub">Supabaseから出走予定を取得しています</div>
          </div>
        ) : loadError ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-title">読込エラー</div>
            <div className="empty-state-sub" style={{whiteSpace: "pre-wrap", maxWidth: 600, margin: "0 auto"}}>{loadError}</div>
            <button className="btn btn-primary" style={{marginTop: 16}} onClick={reload}>再試行</button>
          </div>
        ) : grouped.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏇</div>
            <div className="empty-state-title">該当する出走予定がありません</div>
            <div className="empty-state-sub">フィルタを変えるか、新規投稿してみましょう</div>
          </div>
        ) : grouped.map(g => {
          const fmt = window.formatDateHeader(g.date);
          return (
            <section className="date-section" key={g.date}>
              <div className="date-header">
                <h2 className="date-header-main">{fmt.main}</h2>
                <span className="date-header-day">({fmt.day})</span>
                {fmt.pill && <span className={`date-header-pill ${fmt.pill.type}`}>{fmt.pill.label}</span>}
                <span className="date-header-count">{g.items.length}件</span>
              </div>
              <div className="timeline-grid">
                {g.items.map(p => (
                  <window.RaceCard
                    key={p.id}
                    post={p}
                    isLiked={likes.includes(p.id)}
                    isCheered={cheers.includes(p.id)}
                    isFav={isFav(p.horse_name, p.club)}
                    onLike={toggleLike}
                    onCheer={toggleCheer}
                    onEdit={startEdit}
                    onToggleFav={() => toggleFav(p.horse_name, p.club)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="app-footer">
        <p>あにまん一口馬主部の有志による非公式共有サイト。投稿パスワードはbcryptハッシュ化保存され、個人情報の収集は行っていません。</p>
        <p style={{marginTop: 6, fontSize: 11, opacity: 0.7}}>Supabase + Cloudflare Pages で運用中</p>
      </footer>

      {/* 新規投稿モーダル */}
      {postModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !busy) setPostModalOpen(false); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">新規出走予定を投稿</div>
              <button className="icon-btn" onClick={() => !busy && setPostModalOpen(false)}>✕</button>
            </div>
            {favHorses.length > 0 && !postPrefill && (
              <div style={{padding: "12px 22px 0", borderBottom: "1px solid var(--border)"}}>
                <div style={{fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, letterSpacing: 0.3}}>マイリストから選択</div>
                <div className="suggestions" style={{paddingBottom: 12}}>
                  {favHorses.map(f => (
                    <button key={favKey(f.horse_name, f.club)} type="button" className="suggestion-chip" onClick={() => setPostPrefill({ horse_name: f.horse_name, club: f.club })}>
                      ★ {f.horse_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <window.PostForm
              key={postPrefill ? postPrefill.horse_name : "new"}
              initial={postPrefill}
              onSubmit={handleCreatePost}
              onCancel={() => setPostModalOpen(false)}
              mode="create"
              busy={busy}
            />
          </div>
        </div>
      )}

      {/* マイ出資馬リストモーダル */}
      {favListOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setFavListOpen(false); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">★ マイ出資馬リスト</div>
              <button className="icon-btn" onClick={() => setFavListOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              {favHorses.length === 0 ? (
                <div className="empty-state" style={{padding: "30px 10px"}}>
                  <div className="empty-state-icon">★</div>
                  <div className="empty-state-title">まだ登録がありません</div>
                  <div className="empty-state-sub">タイムラインの☆ボタン、または下のフォームから追加できます。<br/>このリストはお使いのブラウザにのみ保存されます。</div>
                </div>
              ) : (
                <div style={{display: "flex", flexDirection: "column", gap: 8, marginBottom: 16}}>
                  {favHorses.map(f => {
                    const swatch = window.CLUB_SWATCHES[f.club] || "linear-gradient(135deg, #94a3b8, #64748b)";
                    return (
                      <div key={favKey(f.horse_name, f.club)} style={{display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg-subtle)", borderRadius: 8, border: "1px solid var(--border)"}}>
                        <div style={{width: 22, height: 22, borderRadius: 5, background: swatch, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0}}></div>
                        <div style={{flex: 1, minWidth: 0}}>
                          <div style={{fontWeight: 700, fontSize: 14}}>{f.horse_name}</div>
                          <div style={{fontSize: 11, color: "var(--text-muted)"}}>{window.CLUB_OPTIONS[f.club] || f.club}</div>
                          <input type="text" placeholder="メモ（任意）" value={f.memo || ""} onChange={e => updateFavMemo(f.horse_name, f.club, e.target.value)} style={{marginTop: 4, width: "100%", border: "none", background: "transparent", fontSize: 12, color: "var(--text)", padding: 2}} />
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleFav(f.horse_name, f.club)} title="削除">✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
              <FavAddForm onAdd={(name, club) => toggleFav(name, club)} existing={favSet} />
            </div>
            <div className="modal-footer">
              <span style={{fontSize: 11, color: "var(--text-faint)", marginRight: "auto"}}>※ ブラウザのキャッシュをクリアすると消えます</span>
              <button type="button" className="btn btn-primary" onClick={() => setFavListOpen(false)}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* 編集/削除モーダル */}
      {editTarget && editingPost && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !busy) setEditTarget(null); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editStep === "auth" ? "投稿を管理" : "投稿を編集"}</div>
              <button className="icon-btn" onClick={() => !busy && setEditTarget(null)}>✕</button>
            </div>
            {editStep === "auth" ? (
              <window.AuthGate post={editingPost} onUnlock={handleUnlock} onDelete={handleDelete} onCancel={() => setEditTarget(null)} error={authError} busy={busy} />
            ) : (
              <window.PostForm initial={editingPost} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} mode="edit" busy={busy} />
            )}
          </div>
        </div>
      )}

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="表示テーマ" />
        <window.TweakRadio label="theme" value={tweaks.theme} options={["light", "dark", "paper"]} onChange={v => setTweak("theme", v)} />
        <window.TweakSection label="密度・レイアウト" />
        <window.TweakRadio label="密度" value={tweaks.density} options={["compact", "comfortable", "spacious"]} onChange={v => setTweak("density", v)} />
        <window.TweakRadio label="レイアウト" value={tweaks.layout} options={["list", "grid"]} onChange={v => setTweak("layout", v)} />
        <window.TweakSection label="表示" />
        <window.TweakToggle label="フィルタバー" value={tweaks.showFilters} onChange={v => setTweak("showFilters", v)} />
        <window.TweakSection label="データ" />
        <window.TweakButton label="再読込" onClick={reload} />
      </window.TweaksPanel>
    </div>
  );
}

function FavAddForm({ onAdd, existing }) {
  const [name, setName] = useStateA("");
  const [club, setClub] = useStateA("");
  const handleAdd = () => {
    if (!name || !club) return;
    if (existing.has(`${name}|${club}`)) { alert("既に登録されています"); return; }
    onAdd(name, club);
    setName(""); setClub("");
  };
  return (
    <div style={{padding: 12, background: "var(--bg-subtle)", borderRadius: 8, border: "1px dashed var(--border-strong)"}}>
      <div style={{fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8}}>新しい出資馬を追加</div>
      <div style={{display: "flex", gap: 8, alignItems: "stretch"}}>
        <input className="form-input" placeholder="馬名" value={name} onChange={e => setName(e.target.value)} style={{flex: 1}} />
        <select className="form-select" value={club} onChange={e => setClub(e.target.value)} style={{flex: 1}}>
          <option value="">クラブ選択</option>
          {Object.entries(window.CLUB_OPTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button type="button" className="btn btn-primary btn-sm" onClick={handleAdd}>追加</button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
