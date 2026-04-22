'use client';
import React, { useState, useRef, useEffect } from "react";
import AuthForm from '../components/AuthForm';
import { supabase } from '../utils/supabaseClient';
import UserMenu from '@/components/UserMenu';

const INITIAL_TRANSACTIONS = [
  { id: 1, game: "Wingspan", type: "SELL", amount: 65, image: "/images/wingspan.jpg", date: "2023-01-15" },
  { id: 2, game: "Pandemic Legacy S1", type: "SELL", amount: 40, image: "/images/pandemic.jpg", date: "2023-02-10" },
  { id: 3, game: "Gloomhaven", type: "BUY", amount: 120, image: "/images/gloomhaven.jpg", date: "2023-03-05" },
  { id: 4, game: "Ticket to Ride", type: "SELL", amount: 30, image: "/images/ttr.jpg", date: "2023-04-20" },
  { id: 5, game: "Arkham Horror 3e", type: "BUY", amount: 55, image: "/images/arkham.jpg", date: "2023-05-12" },
  { id: 6, game: "Catan", type: "SELL", amount: 25, image: "/images/catan.jpg", date: "2023-06-08" },
  { id: 7, game: "Spirit Island", type: "SELL", amount: 80, image: "https://cf.geekdo-images.com/gn1YR96qXoUhVSbo4SKwvQ__itemrep@2x/img/IkEKg0ZMZ7akkTbjNn6_-JD4rDU=/fit-in/492x600/filters:strip_icc()/pic2003559.jpg", date: "2023-07-14" },
  { id: 8, game: "Puerto Rico", type: "BUY", amount: 80, image: "/images/fpo.webp", date: "2023-08-22" },
];

const BUY_COLOR = "#c0392b";
const SELL_COLOR = "#27ae60";
const ZERO_COLOR = "#3d9970";

const BggDeviation = () => {
  const [transactions, setTransactions] = useState<any[]>(INITIAL_TRANSACTIONS);
  const [form, setForm] = useState({ bggId: "", type: "BUY", amount: "", date: new Date().toISOString().split('T')[0] });
  const [nextId, setNextId] = useState(9);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string }>>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedGame, setSelectedGame] = useState<{ id: string; name: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // load persisted transactions from backend when component mounts
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data?.session?.access_token;
        const headers: Record<string,string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resp = await fetch('/api/reconcile', { headers });
        if (resp.ok) {
          const data = await resp.json();
          setTransactions(
            data.map((r: any, idx: number) => ({
              id: r.id || idx,
              game: r.game,
              type: r.action,
              amount: r.amount,
              image: r.image,
              date: r.date || r.created_at,
            }))
          );
          setNextId(data.length + 1);
        }
      } catch (e) {
        console.error('failed to load transactions', e);
      }
    })();
  }, [user]); // reload when user changes

  const deviation = (() => {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let running = 0;
    for (const t of sortedTransactions) {
      const value = t.type === "SELL" ? t.amount : -t.amount;
      running += value;
    }
    return running;
  })();
  const deviationColor = deviation === 0 ? ZERO_COLOR : deviation > 0 ? SELL_COLOR : BUY_COLOR;
  const totalBought = transactions.filter((t) => t.type === "BUY").reduce((s, t) => s + t.amount, 0);
  const totalSold = transactions.filter((t) => t.type === "SELL").reduce((s, t) => s + t.amount, 0);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setForm({ ...form, bggId: query });
    setShowResults(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BGG_AUTH_TOKEN}`
          }
        });
        if (!response.ok) throw new Error('Failed to search games');
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const items = xmlDoc.querySelectorAll('item');
        const results = Array.from(items).slice(0, 5).map((item) => ({
          id: item.getAttribute('id') || '',
          name: item.querySelector('name')?.getAttribute('value') || '',
        }));
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300);
  };

  const handleSelectGame = (game: { id: string; name: string }) => {
    setSelectedGame(game);
    setSearchQuery(game.name);
    setForm({ ...form, bggId: game.id });
    setShowResults(false);
    setSearchResults([]);
  };

  const handleAdd = async () => {
    if (!selectedGame || !form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) return;
    try {
      // fetch image/name from BGG api
      const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${selectedGame.id}`, { headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BGG_AUTH_TOKEN}`
      }});
      if (!response.ok) throw new Error('Failed to fetch game data');
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      const item = xmlDoc.querySelector('item');
      if (!item) throw new Error('Game not found');
      const name = item.querySelector('name')?.getAttribute('value');
      const image = item.querySelector('image')?.textContent || "/images/placeholder.jpg";
      if (!name) throw new Error('Game name not found');

      // insert into our backend (which in turn writes to Supabase)
      const session = await supabase.auth.getSession();
      const token = session.data?.session?.access_token;
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiResp = await fetch('/api/reconcile', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          game: name,
          action: form.type,
          amount: Number(form.amount),
          image,
          date: form.date,
        }),
      });
      if (!apiResp.ok) throw new Error('Failed to save transaction');
      const created = await apiResp.json();

      setTransactions((prev) => [
        ...prev,
        {
          id: created.id || nextId,
          game: created.game,
          type: created.action,
          amount: created.amount,
          image: created.image,
          date: created.date || created.created_at || form.date,
        },
      ]);
      setNextId((n) => n + 1);
      setForm({ bggId: "", type: "BUY", amount: "", date: new Date().toISOString().split('T')[0] });
      setSearchQuery("");
      setSelectedGame(null);
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleRemove = async (id: number) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data?.session?.access_token;
      const headers: Record<string,string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch(`/api/reconcile?id=${id}`, { method: 'DELETE', headers });
      if (!resp.ok) throw new Error('Failed to delete transaction');
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('delete failed', err);
    }
  };

  const handleAuthSuccess = () => {
    // auth state will be updated via the listener
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0e0b06",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#f0e6d0",
          fontFamily: "'Crimson Text', Georgia, serif",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0e0b06",
          backgroundImage:
            "radial-gradient(ellipse at 20% 20%, #2a1a08 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, #1a0e0a 0%, transparent 60%)",
          fontFamily: "'Crimson Text', Georgia, serif",
          color: "#f0e6d0",
          padding: "32px 24px",
        }}
      >
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap"
          rel="stylesheet"
        />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              color: "#8b6b3a",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Board Game Collection
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(24px, 4vw, 38px)",
              fontWeight: 900,
              margin: 0,
              color: "#d4a843",
              letterSpacing: "0.05em",
              textShadow: "0 2px 20px rgba(212,168,67,0.3)",
            }}
          >
            Trade Ledger
          </h1>
          {user && <UserMenu user={user} onLogout={() => setUser(null)} />}
        </div>
          <div
            style={{
              width: 120,
              height: 2,
              background: "linear-gradient(90deg, transparent, #6b4c1e, #d4a843, #6b4c1e, transparent)",
              margin: "12px auto 0",
            }}
          />
        </div>

        <AuthForm onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0b06",
        backgroundImage:
          "radial-gradient(ellipse at 20% 20%, #2a1a08 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, #1a0e0a 0%, transparent 60%)",
        fontFamily: "'Crimson Text', Georgia, serif",
        color: "#f0e6d0",
        padding: "32px 24px",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            color: "#8b6b3a",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Board Game Collection
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(24px, 4vw, 38px)",
              fontWeight: 900,
              margin: 0,
              color: "#d4a843",
              letterSpacing: "0.05em",
              textShadow: "0 2px 20px rgba(212,168,67,0.3)",
            }}
          >
            Trade Ledger
          </h1>
          {user && <UserMenu user={user} onLogout={() => setUser(null)} />}
        </div>
        <div
          style={{
            width: 120,
            height: 2,
            background: "linear-gradient(90deg, transparent, #6b4c1e, #d4a843, #6b4c1e, transparent)",
            margin: "12px auto 0",
          }}
        />
      </div>
      {/* link to ledger view (placeholder username) */}
      {user && (
        <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
          <a
            href="/ledger/dboots"
            style={{ color: '#d4a843', textDecoration: 'underline' }}
          >
            View public ledger
          </a>
        </div>
      )}

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          maxWidth: 700,
          margin: "0 auto 32px",
        }}
      >
        {[
          { label: "Total Spent", value: `$${totalBought}`, color: BUY_COLOR },
          { label: "Total Earned", value: `$${totalSold}`, color: SELL_COLOR },
          {
            label: "Deviation",
            value: `${deviation >= 0 ? "+" : ""}$${deviation}`,
            color: deviationColor,
            big: true,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: s.big
                ? "linear-gradient(135deg, #1e1408, #2a1e0a)"
                : "rgba(255,255,255,0.03)",
              border: `1px solid ${s.big ? s.color + "55" : "#3a2d1a"}`,
              borderRadius: 8,
              padding: "14px 16px",
              textAlign: "center",
              boxShadow: s.big ? `0 0 20px ${s.color}22` : "none",
            }}
          >
            <div style={{ fontSize: 11, color: "#8b6b3a", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
              {s.label}
            </div>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: s.big ? 28 : 22,
                fontWeight: 700,
                color: s.color,
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            {s.big && (
              <div
                style={{
                  fontSize: 11,
                  marginTop: 6,
                  color: deviation === 0 ? ZERO_COLOR : "#8b6b3a",
                  fontStyle: "italic",
                }}
              >
                {deviation === 0
                  ? "✓ perfectly balanced"
                  : deviation > 0
                  ? "selling more than buying"
                  : "buying more than selling"}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Transaction */}
      {user && (
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto 28px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid #3a2d1a",
            borderRadius: 10,
            padding: 20,
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 14,
              color: "#d4a843",
              marginBottom: 14,
              letterSpacing: "0.05em",
            }}
          >
            Add Transaction
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", position: "relative" }}>
            <div style={{ flex: "2 1 160px", position: "relative" }}>
              <input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                placeholder="Search games..."
                style={{
                  width: "100%",
                  background: "#1a1208",
                  border: "1px solid #4a3820",
                  borderRadius: 6,
                  padding: "9px 12px",
                  color: "#f0e6d0",
                  fontFamily: "Crimson Text, Georgia, serif",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {showResults && searchResults.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#1a1208",
                    border: "1px solid #4a3820",
                    borderTop: "none",
                    borderRadius: "0 0 6 6",
                    zIndex: 10,
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {searchResults.map((game) => (
                    <div
                      key={game.id}
                      onClick={() => handleSelectGame(game)}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #2a2010",
                        color: "#f0e6d0",
                        fontSize: 13,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2010")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {game.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={{
                flex: "0 0 90px",
                background: "#1a1208",
                border: "1px solid #4a3820",
                borderRadius: 6,
                padding: "9px 10px",
                color: form.type === "BUY" ? BUY_COLOR : SELL_COLOR,
                fontFamily: "Crimson Text, Georgia, serif",
                fontSize: 14,
                outline: "none",
              }}
            >
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
            <input
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="$ amount"
              type="number"
              min="0"
              style={{
                flex: "1 1 90px",
                background: "#1a1208",
                border: "1px solid #4a3820",
                borderRadius: 6,
                padding: "9px 12px",
                color: "#f0e6d0",
                fontFamily: "Crimson Text, Georgia, serif",
                fontSize: 14,
                outline: "none",
              }}
            />
            <input
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              type="date"
              style={{
                flex: "1 1 120px",
                background: "#1a1208",
                border: "1px solid #4a3820",
                borderRadius: 6,
                padding: "9px 12px",
                color: "#f0e6d0",
                fontFamily: "Crimson Text, Georgia, serif",
                fontSize: 14,
                outline: "none",
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                flex: "0 0 auto",
                background: "linear-gradient(135deg, #6b4c1e, #4a3210)",
                border: "1px solid #8b6b3a",
                borderRadius: 6,
                padding: "9px 18px",
                color: "#d4a843",
                fontFamily: "'Cinzel', serif",
                fontSize: 13,
                cursor: "pointer",
                letterSpacing: "0.05em",
                transition: "all 0.15s",
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid #3a2d1a",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #3a2d1a",
            fontFamily: "'Cinzel', serif",
            fontSize: 14,
            color: "#d4a843",
            letterSpacing: "0.05em",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Transactions</span>
          <span style={{ fontFamily: "Crimson Text", fontSize: 13, color: "#8b6b3a", fontWeight: 400 }}>
            {transactions.length} entries
          </span>
        </div>
        <div style={{ maxHeight: 280, overflowY: "auto" }}>
          {transactions.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#5a4a30", fontStyle: "italic" }}>
              No transactions yet
            </div>
          ) : (
            transactions.map((t, i) => {
              const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              let running = 0;
              for (let j = 0; j <= sortedTransactions.findIndex(tx => tx.id === t.id); j++) {
                const tx = sortedTransactions[j];
                running += tx.type === "SELL" ? tx.amount : -tx.amount;
              }
              return (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 20px",
                    borderBottom: "1px solid #1e1810",
                    gap: 12,
                    transition: "background 0.1s",
                  }}
                >
                  {t.image && (
                    <img
                      src={t.image}
                      alt={t.game}
                      style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                    />
                  )}
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: t.type === "BUY" ? BUY_COLOR : SELL_COLOR,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, fontSize: 14 }}>{t.game}</div>
                  <div style={{ fontSize: 12, color: "#8b6b3a", width: 100 }}>
                    {new Date(t.date).toLocaleDateString()}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: t.type === "BUY" ? BUY_COLOR : SELL_COLOR,
                      fontWeight: 600,
                      width: 80,
                      textAlign: "right",
                    }}
                  >
                    {t.type === "BUY" ? "−" : "+"}${t.amount}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: running === 0 ? ZERO_COLOR : running > 0 ? SELL_COLOR : "#8b6b3a",
                      width: 64,
                      textAlign: "right",
                    }}
                  >
                    {running >= 0 ? "+" : ""}${running}
                  </div>
                  <button
                    onClick={() => handleRemove(t.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4a3820",
                      cursor: "pointer",
                      fontSize: 16,
                      padding: "0 4px",
                      lineHeight: 1,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => ((e.target as HTMLButtonElement).style.color = BUY_COLOR)}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => ((e.target as HTMLButtonElement).style.color = "#4a3820")}
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default BggDeviation;
