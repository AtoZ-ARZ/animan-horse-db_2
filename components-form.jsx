// === 投稿/編集モーダル ===
const { useState: useStateM, useEffect: useEffectM, useRef: useRefM } = React;

const RACE_NUMBERS = [1,2,3,4,5,6,7,8,9,10,11,12];

function ClubSelect({ value, onChange, id }) {
  return (
    <select id={id} className="form-select" value={value} onChange={e => onChange(e.target.value)} required>
      <option value="">選択してください</option>
      <optgroup label="社台グループ系">
        <option value="サンデーR">サンデーレーシング</option>
        <option value="社台RH">社台レースホース</option>
        <option value="G1レーシング">G1レーシング</option>
        <option value="キャロット">キャロットクラブ</option>
        <option value="シルク">シルクホースクラブ</option>
      </optgroup>
      <optgroup label="その他主要クラブ">
        <option value="DMMバヌーシー">DMMバヌーシー</option>
        <option value="東サラ">東京サラブレッドクラブ</option>
        <option value="ノルマンディー">ノルマンディーOC</option>
        <option value="ウイン">ウインレーシングクラブ</option>
        <option value="ラフィアン">ラフィアンターフマンクラブ</option>
        <option value="ロード">ロードホースクラブ</option>
        <option value="広尾">広尾サラブレッド倶楽部</option>
        <option value="YGG">YGGオーナーズクラブ</option>
        <option value="ライオン">サラブレッドクラブライオン</option>
        <option value="グリーン">グリーンファーム愛馬会</option>
        <option value="友駿">友駿ホースクラブ</option>
        <option value="ユニオン">ユニオンオーナーズクラブ</option>
        <option value="ターファイト">ターファイトクラブ</option>
        <option value="ローレル">ローレルクラブ</option>
        <option value="大樹">大樹レーシングクラブ</option>
        <option value="ワラウカド">ワラウカド</option>
        <option value="インゼル">インゼルサラブレッドクラブ</option>
        <option value="京サラ">京都サラブレッドクラブ</option>
        <option value="バゴバゴ">その他・個人等</option>
      </optgroup>
    </select>
  );
}

function CourseSelect({ value, onChange, id }) {
  return (
    <select id={id} className="form-select" value={value} onChange={e => onChange(e.target.value)} required>
      <option value="">選択してください</option>
      <optgroup label="JRA (中央)">
        {window.RACECOURSES_JRA.map(c => <option key={c} value={c}>{c}</option>)}
      </optgroup>
      <optgroup label="地方競馬">
        {window.RACECOURSES_NAR.map(c => <option key={c} value={c}>{c}</option>)}
      </optgroup>
      <option value="海外">海外</option>
    </select>
  );
}

function PostForm({ initial, onSubmit, onCancel, mode = "create", busy = false }) {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  const init = initial || {};
  const parsed = window.parseConditions(init.conditions || "");

  const [isTentative, setIsTentative] = useStateM(!!init.is_tentative);
  const [tentativeMonth, setTentativeMonth] = useStateM(init.tentative_month || thisMonth);
  const [horseName, setHorseName] = useStateM(init.horse_name || "");
  const [club, setClub] = useStateM(init.club || "");
  const [raceDate, setRaceDate] = useStateM(init.race_date || today);
  const [racecourse, setRacecourse] = useStateM(init.racecourse || "");
  const [raceName, setRaceName] = useStateM(init.race_name || "");
  const [raceNumber, setRaceNumber] = useStateM(init.race_number || 11);
  const [surface, setSurface] = useStateM(parsed.surface || "芝");
  const [distance, setDistance] = useStateM(parsed.distance || "");
  const [confidence, setConfidence] = useStateM(init.confidence || 3);
  const [comment, setComment] = useStateM(init.comment || "");
  const [posterName, setPosterName] = useStateM(init.poster_name || "");
  const [password, setPassword] = useStateM("");

  // localStorage 入力補助
  const recentNames = JSON.parse(localStorage.getItem("recent_poster_names") || "[]");
  const recentHorses = JSON.parse(localStorage.getItem("recent_horse_names") || "[]");

  const submit = (e) => {
    e.preventDefault();
    if (!horseName || !club || !password) return;
    if (!isTentative && (!racecourse || !distance)) return;
    if (isTentative && !tentativeMonth) return;

    if (posterName) {
      const names = [posterName, ...recentNames.filter(n => n !== posterName)].slice(0, 5);
      localStorage.setItem("recent_poster_names", JSON.stringify(names));
    }
    if (horseName) {
      const horses = [horseName, ...recentHorses.filter(n => n !== horseName)].slice(0, 8);
      localStorage.setItem("recent_horse_names", JSON.stringify(horses));
    }

    if (isTentative) {
      // 仮予定：その月の1日を race_date として保存（並びを担保）
      const fakeDate = `${tentativeMonth}-01`;
      onSubmit({
        is_tentative: true,
        tentative_month: tentativeMonth,
        horse_name: horseName, club,
        race_date: fakeDate,
        racecourse: racecourse || "",
        race_name: raceName,
        race_number: raceNumber ? parseInt(raceNumber) : 0,
        conditions: distance ? surface + distance : "",
        confidence: parseInt(confidence),
        comment, poster_name: posterName, password
      });
    } else {
      onSubmit({
        is_tentative: false,
        tentative_month: null,
        horse_name: horseName, club, race_date: raceDate, racecourse,
        race_name: raceName, race_number: parseInt(raceNumber),
        conditions: surface + distance, confidence: parseInt(confidence),
        comment, poster_name: posterName, password
      });
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="modal-body">
        <div className="form-row single">
          <label style={{display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: isTentative ? "#fef3c7" : "var(--bg-subtle)", border: `1px solid ${isTentative ? "#f59e0b" : "var(--border)"}`, borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600}}>
            <input type="checkbox" checked={isTentative} onChange={e => setIsTentative(e.target.checked)} style={{width: 18, height: 18, cursor: "pointer"}} />
            <span>🔖 仮予定として登録（出走月のみ指定）</span>
          </label>
          <div className="form-help" style={{marginTop: 6}}>
            {isTentative
              ? "出走月のみ決まっている場合のチェック。後で日程確定時に編集して切り替えられます。"
              : "通常の出走予定（日付・競馬場・レース番号など全項目入力）"}
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label">馬名<span className="req">*</span></label>
            <input className="form-input" value={horseName} onChange={e => setHorseName(e.target.value)} placeholder="例: アーモンドアイ" required />
            {mode === "create" && recentHorses.length > 0 && (
              <div className="suggestions">
                {recentHorses.slice(0, 5).map(h => (
                  <button type="button" key={h} className="suggestion-chip" onClick={() => setHorseName(h)}>{h}</button>
                ))}
              </div>
            )}
          </div>
          <div className="form-field">
            <label className="form-label">所属クラブ<span className="req">*</span></label>
            <ClubSelect value={club} onChange={setClub} />
          </div>
        </div>

        {isTentative ? (
          <div className="form-row single">
            <div className="form-field">
              <label className="form-label">予定月<span className="req">*</span></label>
              <input type="month" className="form-input" value={tentativeMonth} onChange={e => setTentativeMonth(e.target.value)} required />
              <div className="form-help">「この辺の月に出走予定」というアバウトな指定でOK</div>
            </div>
          </div>
        ) : (
          <>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">出走日<span className="req">*</span></label>
                <input type="date" className="form-input" value={raceDate} onChange={e => setRaceDate(e.target.value)} required />
              </div>
              <div className="form-field">
                <label className="form-label">競馬場<span className="req">*</span></label>
                <CourseSelect value={racecourse} onChange={setRacecourse} />
              </div>
            </div>

            <div className="form-row single">
              <div className="form-field">
                <label className="form-label">レース名<span className="opt">(任意)</span></label>
                <input className="form-input" value={raceName} onChange={e => setRaceName(e.target.value)} placeholder="例: 日本ダービー、3歳未勝利 など" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">レース番号<span className="req">*</span></label>
                <select className="form-select" value={raceNumber} onChange={e => setRaceNumber(e.target.value)} required>
                  {RACE_NUMBERS.map(n => <option key={n} value={n}>{n}R</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">コース条件<span className="req">*</span></label>
                <div className="form-row surface-distance" style={{margin: 0}}>
                  <select className="form-select" value={surface} onChange={e => setSurface(e.target.value)}>
                    <option value="芝">芝</option>
                    <option value="ダート">ダート</option>
                    <option value="障害">障害</option>
                  </select>
                  <input className="form-input" value={distance} onChange={e => setDistance(e.target.value)} placeholder="例: 2400m" required />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="form-row single">
          <div className="form-field">
            <label className="form-label">自信度<span className="req">*</span></label>
            <div className="confidence-picker">
              {[1,2,3,4,5].map(n => (
                <label key={n}>
                  <input type="radio" name="confidence" value={n} checked={confidence == n} onChange={() => setConfidence(n)} />
                  <span>{"★".repeat(n)}</span>
                </label>
              ))}
            </div>
            <div className="form-help">
              {confidence == 5 && "大勝負！" }
              {confidence == 4 && "期待大" }
              {confidence == 3 && "チャンスあり" }
              {confidence == 2 && "入着目標" }
              {confidence == 1 && "無事これ名馬" }
            </div>
          </div>
        </div>

        <div className="form-row single">
          <div className="form-field">
            <label className="form-label">一言コメント<span className="opt">(任意)</span></label>
            <textarea className="form-textarea" value={comment} onChange={e => setComment(e.target.value)} rows="2" placeholder="意気込みなどをどうぞ！"></textarea>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label">投稿者名<span className="opt">(任意)</span></label>
            <input className="form-input" value={posterName} onChange={e => setPosterName(e.target.value)} placeholder="名無しさん" />
            {mode === "create" && recentNames.length > 0 && (
              <div className="suggestions">
                {recentNames.map(n => (
                  <button type="button" key={n} className="suggestion-chip" onClick={() => setPosterName(n)}>{n}</button>
                ))}
              </div>
            )}
          </div>
          <div className="form-field">
            <label className="form-label">編集・削除PW<span className="req">*</span></label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required placeholder={mode === "edit" ? "確認のため再入力" : "後で編集する際に必要"} />
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>キャンセル</button>
        <button type="submit" className="btn btn-primary">{mode === "edit" ? "更新する" : "投稿する"}</button>
      </div>
    </form>
  );
}

function AuthGate({ post, onUnlock, onDelete, onCancel, error, busy = false }) {
  const [pw, setPw] = useStateM("");
  const [confirming, setConfirming] = useStateM(false);

  return (
    <>
      <div className="modal-body">
        <div className="auth-block">
          <p>「<strong>{post.horse_name}</strong>」の投稿を編集・削除するには、投稿時のパスワードを入力してください。</p>
          <input
            type="password"
            className="form-input"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="パスワード"
            autoFocus
          />
          {error && <div className="auth-error">{error}</div>}
        </div>

        {confirming && (
          <div className="auth-block" style={{marginTop: 12, background: "#fff5f5", borderColor: "#fecaca"}}>
            <p style={{color: "#c53030"}}>本当にこの投稿を削除しますか？この操作は取り消せません。</p>
            <div style={{display: "flex", gap: 8, justifyContent: "center"}}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>戻る</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(pw)}>削除を実行</button>
            </div>
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>キャンセル</button>
        {!confirming && <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>削除する</button>}
        {!confirming && <button type="button" className="btn btn-primary" onClick={() => onUnlock(pw)}>編集する</button>}
      </div>
    </>
  );
}

window.PostForm = PostForm;
window.AuthGate = AuthGate;
