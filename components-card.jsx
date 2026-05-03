// === カードコンポーネント ===
const { useState, useEffect, useRef, useMemo } = React;

function Stars({ value }) {
  return (
    <span className="confidence-stars" title={`自信度 ${value}/5`}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= value ? "star-filled" : "star-empty"}>★</span>
      ))}
    </span>
  );
}

function ClubTag({ club }) {
  const swatch = window.CLUB_SWATCHES[club] || "linear-gradient(135deg, #94a3b8, #64748b)";
  const display = window.CLUB_OPTIONS[club] || club;
  return (
    <span className="club-tag" title={display}>
      <span className="club-swatch" style={{ background: swatch }}></span>
      <span>{display}</span>
    </span>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function RaceCard({ post, isLiked, isFav, onLike, onEdit, onToggleFav }) {
  const { surface, distance } = window.parseConditions(post.conditions);
  const [popping, setPopping] = useState(false);
  const isTentative = !!post.is_tentative;
  const handleLike = () => {
    if (!isLiked) { setPopping(true); setTimeout(() => setPopping(false), 320); }
    onLike(post.id);
  };

  const initial = (post.poster_name || "名").charAt(0);

  // 仮予定の表示用：年月（例: "2026-03" → "2026年3月"）
  const tentativeLabel = isTentative && post.tentative_month
    ? `${post.tentative_month.slice(0,4)}年${parseInt(post.tentative_month.slice(5,7))}月 ごろ`
    : "";

  return (
    <article className={`race-card ${isFav ? "is-fav" : ""} ${isTentative ? "is-tentative" : ""}`} data-confidence={post.confidence}>
      <div className="card-top">
        <div className="card-race-meta">
          {isTentative ? (
            <>
              <span className="card-race-course" style={{background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 4, fontSize: 11}}>🔖 仮予定</span>
              <span className="card-race-name" style={{color: "#92400e"}}>{tentativeLabel}</span>
              {post.racecourse && <span className="card-race-num">{post.racecourse}</span>}
            </>
          ) : (
            <>
              <span className="card-race-course">{post.racecourse}</span>
              <span className="card-race-num">{post.race_number}R</span>
              {post.race_name && <span className="card-race-name">{post.race_name}</span>}
            </>
          )}
        </div>
        <div className="card-actions">
          {isFav && (
            <span style={{fontSize: 9, fontWeight: 800, letterSpacing: 0.5, color: "var(--accent)", background: "var(--bg-card)", padding: "2px 6px", borderRadius: 4, border: "1px solid var(--accent)", display: "inline-flex", alignItems: "center"}}>★ MY</span>
          )}
          <button className={`icon-btn fav-btn ${isFav ? "is-fav" : ""}`} title={isFav ? "マイリストから外す" : "マイリストに追加"} onClick={onToggleFav}>
            <span style={{fontSize: 16, lineHeight: 1, color: isFav ? "var(--accent)" : "inherit"}}>{isFav ? "★" : "☆"}</span>
          </button>
          <button className="icon-btn" title="編集/削除" onClick={() => onEdit(post.id)}>
            <EditIcon />
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="card-horse">{post.horse_name}</div>
        <div className="card-tags">
          <ClubTag club={post.club} />
          {!isTentative && distance && <span className={`cond-tag ${window.condClass(surface)}`}>{surface}{distance}</span>}
          <Stars value={post.confidence} />
        </div>
      </div>
      {post.comment && <div className="card-comment">{post.comment}</div>}
      <div className="card-foot">
        <div className="poster-info">
          <div className="poster-avatar">{initial}</div>
          <span className="poster-name">{post.poster_name || "名無しさん"}</span>
          <span className="poster-time">· {window.relativeTime(post.created_at)}</span>
        </div>
        <button className={`like-btn ${isLiked ? "liked" : ""}`} onClick={handleLike}>
          <span className={popping ? "like-pop" : ""}><HeartIcon filled={isLiked} /></span>
          <span>{post.likes || 0}</span>
        </button>
      </div>
    </article>
  );
}

window.RaceCard = RaceCard;
window.PlusIcon = PlusIcon;
