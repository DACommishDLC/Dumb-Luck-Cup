import { useState, useRef } from "react";

const COMM = { username: "commissioner", password: "dlcadmin2025", isAdmin: true };

const TEAMS = {
  "chiefs": { shell:"#E31837", stripe:"#FFB81C" },
  "ravens": { shell:"#241773", stripe:"#9E7C0C" },
  "bills": { shell:"#00338D", stripe:"#C60C30" },
  "49ers": { shell:"#AA0000", stripe:"#B3995D" },
  "cowboys": { shell:"#BFBFBF", stripe:"#003594" },
  "packers": { shell:"#203731", stripe:"#FFB612" },
  "lions": { shell:"#0076B6", stripe:"#B0B7BC" },
  "seahawks": { shell:"#002244", stripe:"#69BE28" },
  "dolphins": { shell:"#008E97", stripe:"#FC4C02" },
  "bears": { shell:"#0B162A", stripe:"#C83803" },
  "ohio state": { shell:"#BB0000", stripe:"#666666" },
  "buckeyes": { shell:"#BB0000", stripe:"#666666" },
  "michigan": { shell:"#00274C", stripe:"#FFCB05" },
  "wolverines": { shell:"#00274C", stripe:"#FFCB05" },
  "alabama": { shell:"#9E1B32", stripe:"#828A8F" },
  "georgia": { shell:"#BA0C2F", stripe:"#000000" },
};

function getTeamColors(name) {
  const lower = name.toLowerCase();
  for (const [key, colors] of Object.entries(TEAMS)) {
    if (lower.includes(key)) return colors;
  }
  return { shell:"#1a3a1a", stripe:"#f5c518" };
}

function TeamBadge({ name, size = 52 }) {
  const { shell, stripe } = getTeamColors(name);
  const r = parseInt(shell.slice(1,3),16);
  const g = parseInt(shell.slice(3,5),16);
  const b = parseInt(shell.slice(5,7),16);
  const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
  const textColor = lum > 0.6 ? "#000000" : "#ffffff";

  return (
    <div style={{
      width: size, height: size, borderRadius: "8px",
      background: `linear-gradient(135deg, ${shell} 0%, ${shell}ee 100%)`,
      border: `3px solid ${stripe}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", flexShrink: 0,
      boxShadow: "0 3px 8px rgba(0,0,0,0.4)",
    }}>
      <div style={{
        position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
        background: `linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 80%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "relative",
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: size === 52 ? 17 : 13,
        fontWeight: "bold", color: textColor,
        letterSpacing: "0.5px",
        textShadow: lum > 0.6 ? "0 1px 2px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.6)",
        lineHeight: 1, zIndex: 2,
      }}>
        {name.substring(0, 3).toUpperCase()}
      </div>
    </div>
  );
}

async function fetchYahooSchedule() {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [{
          role: "user",
          content: `Search for ALL games from NFL Week 12 of the 2024 season (November 21-25, 2024) AND all major NCAA FBS games from that same weekend (November 22-23, 2024).

For each game find: team names (full names), betting spread, which team favored, game time.

Return ONLY a JSON array (no markdown):
[{"league":"NFL","home":"Kansas City Chiefs","away":"Baltimore Ravens","spread":3.5,"spreadFavor":"home","gameTime":"2024-11-24T13:00:00Z"}]

Include ALL NFL Week 12 games and major NCAA FBS games from that weekend.`
        }],
        tools: [{ type: "web_search_20250305", name: "web_search" }]
      })
    });
    
    const data = await response.json();
    const text = data.content.map(c => c.type === "text" ? c.text : "").join("\n");
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return [];
  } catch (err) {
    console.error("Fetch failed:", err);
    return [];
  }
}

export default function DumbLuckCup() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("picks");
  const [weeks, setWeeks] = useState([]);
  const [picks, setPicks] = useState({});
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(""), 3000);
  };

  const handleLogin = () => {
    if (!username.trim()) {
      showToast("Enter a username");
      return;
    }
    if (username === COMM.username && password === COMM.password) {
      setUser(COMM);
      showToast("Welcome, Commissioner!");
    } else {
      setUser({ username: username.trim(), isAdmin: false });
      showToast(`Welcome, ${username}!`);
    }
  };

  const addWeek = () => {
    const newWeek = {
      id: "week-" + Date.now(),
      label: `Week ${weeks.length + 1}`,
      status: "active",
      games: []
    };
    setWeeks([...weeks, newWeek]);
    showToast("Week added!");
  };

  const autoLoadGames = async () => {
    setLoading(true);
    showToast("Fetching games from Yahoo Sports...");
    const games = await fetchYahooSchedule();
    
    if (games.length > 0) {
      const currentWeek = weeks.find(w => w.status === "active") || weeks[weeks.length - 1];
      if (currentWeek) {
        setWeeks(weeks.map(w => w.id === currentWeek.id ? {
          ...w,
          games: games.map((g, i) => ({
            id: `g${Date.now()}_${i}`,
            home: g.home,
            away: g.away,
            league: g.league || "NFL",
            spread: g.spread,
            spreadFavor: g.spreadFavor,
            gameTime: g.gameTime,
            winner: null
          }))
        } : w));
        showToast(`✅ Loaded ${games.length} games!`);
      }
    } else {
      showToast("❌ No games found");
    }
    setLoading(false);
  };

  const makePick = (weekId, gameId, team) => {
    setPicks({
      ...picks,
      [user.username]: {
        ...(picks[user.username] || {}),
        [weekId]: {
          ...(picks[user.username]?.[weekId] || {}),
          [gameId]: team
        }
      }
    });
  };

  const setResult = (weekId, gameId, winner) => {
    setWeeks(weeks.map(w => w.id === weekId ? {
      ...w,
      games: w.games.map(g => g.id === gameId ? { ...g, winner } : g)
    } : w));
  };

  const calcScore = (week) => {
    if (week.status !== "completed") return null;
    const userPicks = picks[user?.username]?.[week.id];
    if (!userPicks) return 0;
    let score = 0;
    week.games.forEach(g => {
      const pick = userPicks[g.id];
      if (pick && g.winner && pick === g.winner) score++;
    });
    return score;
  };

  const leaderboard = Object.keys(picks).map(username => {
    let total = 0;
    weeks.filter(w => w.status === "completed").forEach(week => {
      const userPicks = picks[username]?.[week.id];
      if (userPicks) {
        week.games.forEach(g => {
          if (userPicks[g.id] === g.winner && g.winner) total++;
        });
      }
    });
    return { username, total };
  }).sort((a, b) => b.total - a.total);

  if (!user) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Barlow Condensed', sans-serif; 
            background: linear-gradient(135deg, #0a1e0a 0%, #1a3a1a 100%);
            color: #e8e8e8; min-height: 100vh;
          }
          .login-wrap { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }
          .login-logo { font-family: 'Bebas Neue', sans-serif; font-size: 48px; letter-spacing: 4px;
            background: linear-gradient(135deg, #f5c518 0%, #d4af37 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; text-align: center; }
          .login-tagline { font-size: 14px; color: rgba(245, 197, 24, 0.7); text-align: center; margin-bottom: 32px; }
          .login-card { background: rgba(15, 30, 15, 0.95); border: 2px solid rgba(245, 197, 24, 0.3);
            border-radius: 16px; padding: 40px 32px; width: 100%; max-width: 400px; }
          .login-input { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(245, 197, 24, 0.2);
            border-radius: 8px; padding: 14px 16px; font-size: 16px; font-family: 'Barlow Condensed', sans-serif;
            color: #e8e8e8; width: 100%; margin-bottom: 16px; }
          .login-input:focus { outline: none; border-color: #f5c518; }
          .login-btn { background: linear-gradient(135deg, #f5c518 0%, #d4af37 100%); border: none;
            border-radius: 8px; padding: 14px; font-size: 18px; font-weight: 600;
            font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; color: #0a1e0a; cursor: pointer; width: 100%; }
          .login-hint { text-align: center; font-size: 12px; color: rgba(232, 232, 232, 0.5); margin-top: 16px; line-height: 1.5; }
        `}</style>
        <div className="login-wrap">
          <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
          <div className="login-logo">DUMB LUCK CUP</div>
          <div className="login-tagline">Really, all you need is dumb luck</div>
          <div className="login-card">
            <input className="login-input" placeholder="Username" value={username}
              onChange={e => setUsername(e.target.value)} onKeyPress={e => e.key === "Enter" && handleLogin()} />
            <input className="login-input" type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} onKeyPress={e => e.key === "Enter" && handleLogin()} />
            <button className="login-btn" onClick={handleLogin}>ENTER POOL</button>
            <div className="login-hint">
              Commissioner: "commissioner" / "dlcadmin2025"
            </div>
          </div>
        </div>
      </>
    );
  }

  const currentWeek = weeks.find(w => w.status === "active") || weeks[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600&display=swap');
        :root { --bg: #0a1e0a; --gold: #f5c518; --text: #e8e8e8; --text-3: #888; --border: rgba(245, 197, 24, 0.2); }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Barlow Condensed', sans-serif; background: linear-gradient(135deg, var(--bg) 0%, #1a3a1a 100%); color: var(--text); }
        .app { max-width: 500px; margin: 0 auto; min-height: 100vh; padding-bottom: 80px; }
        .header { background: rgba(15, 30, 15, 0.95); border-bottom: 2px solid var(--border); padding: 20px; text-align: center; }
        .header-title { font-family: 'Bebas Neue', sans-serif; font-size: 32px; letter-spacing: 3px;
          background: linear-gradient(135deg, var(--gold) 0%, #d4af37 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .sec-head { background: rgba(15, 30, 15, 0.8); border-bottom: 1px solid var(--border); padding: 16px 20px; }
        .sec-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 2px; color: var(--gold); }
        .game-card { background: rgba(15, 30, 15, 0.6); border-bottom: 1px solid var(--border); padding: 16px 20px; }
        .matchup { display: flex; gap: 12px; }
        .team-option { flex: 1; background: rgba(255, 255, 255, 0.03); border: 2px solid var(--border);
          border-radius: 12px; padding: 12px; cursor: pointer; display: flex; flex-direction: column;
          align-items: center; gap: 8px; transition: all 0.2s; }
        .team-option:hover { background: rgba(255, 255, 255, 0.06); border-color: var(--gold); }
        .team-option.selected { background: rgba(245, 197, 24, 0.15); border-color: var(--gold); }
        .team-name { font-size: 13px; font-weight: 600; text-align: center; }
        .btn { background: var(--gold); border: none; color: var(--bg); padding: 12px 24px;
          border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; width: 100%; margin: 12px 0; }
        .nav { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(15, 30, 15, 0.98);
          border-top: 2px solid var(--border); display: flex; padding: 8px; z-index: 100; }
        .nb { flex: 1; background: none; border: none; color: var(--text-3); padding: 10px;
          cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px;
          font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600; }
        .nb.on { color: var(--gold); }
        .ni { font-size: 20px; }
        .toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
          background: rgba(15, 30, 15, 0.95); border: 1px solid var(--gold); border-radius: 8px;
          padding: 12px 20px; font-size: 14px; z-index: 2000; }
        .admin-section { padding: 20px; }
        .board-item { background: rgba(15, 30, 15, 0.6); border-bottom: 1px solid var(--border);
          padding: 16px 20px; display: flex; align-items: center; gap: 16px; }
        .board-rank { font-family: 'Bebas Neue', sans-serif; font-size: 28px; min-width: 40px; }
        .board-info { flex: 1; }
        .board-score { font-family: 'Bebas Neue', sans-serif; font-size: 32px; color: var(--gold); }
      `}</style>
      
      <div className="app">
        <div className="header">
          <div style={{ fontSize: 36, marginBottom: 4 }}>🏆</div>
          <div className="header-title">DUMB LUCK CUP</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Really, all you need is dumb luck</div>
        </div>

        {tab === "picks" && (
          <>
            <div className="sec-head">
              <div className="sec-title">{currentWeek?.label || "No Active Week"}</div>
            </div>
            {!currentWeek && <div style={{ padding: 40, textAlign: "center", color: '#888' }}>No games yet</div>}
            {currentWeek?.games.map(game => {
              const userPick = picks[user.username]?.[currentWeek.id]?.[game.id];
              return (
                <div key={game.id} className="game-card">
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 8 }}>
                    Yahoo Sports Spread: {game.spreadFavor === "home" ? game.home : game.away} -{game.spread}
                  </div>
                  <div className="matchup">
                    <div className={`team-option ${userPick === "home" ? "selected" : ""}`}
                      onClick={() => makePick(currentWeek.id, game.id, "home")}>
                      <TeamBadge name={game.home} />
                      <div className="team-name">{game.home}</div>
                    </div>
                    <div className={`team-option ${userPick === "away" ? "selected" : ""}`}
                      onClick={() => makePick(currentWeek.id, game.id, "away")}>
                      <TeamBadge name={game.away} />
                      <div className="team-name">{game.away}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {tab === "board" && (
          <>
            <div className="sec-head"><div className="sec-title">Leaderboard</div></div>
            {leaderboard.map((entry, idx) => (
              <div key={entry.username} className="board-item">
                <div className="board-rank">#{idx + 1}</div>
                <div className="board-info">{entry.username}</div>
                <div className="board-score">{entry.total}</div>
              </div>
            ))}
          </>
        )}

        {tab === "admin" && user.isAdmin && (
          <div className="admin-section">
            <button className="btn" onClick={addWeek}>+ Add Week</button>
            {currentWeek && (
              <button className="btn" onClick={autoLoadGames} disabled={loading}>
                {loading ? "Loading..." : "Auto-Load NFL Week 12 + NCAA Games"}
              </button>
            )}
            <div style={{ marginTop: 20, fontSize: 12, color: '#888' }}>
              Current weeks: {weeks.length}
            </div>
          </div>
        )}

        <nav className="nav">
          <button className={`nb ${tab === "picks" ? "on" : ""}`} onClick={() => setTab("picks")}>
            <span className="ni">🏈</span>Picks
          </button>
          <button className={`nb ${tab === "board" ? "on" : ""}`} onClick={() => setTab("board")}>
            <span className="ni">🏆</span>Board
          </button>
          {user.isAdmin && (
            <button className={`nb ${tab === "admin" ? "on" : ""}`} onClick={() => setTab("admin")}>
              <span className="ni">⚙️</span>Admin
            </button>
          )}
          <button className="nb" onClick={() => setUser(null)}>
            <span className="ni">🚪</span>Exit
          </button>
        </nav>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
