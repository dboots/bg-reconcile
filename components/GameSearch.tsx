import React, { useState, useRef } from "react";
import { searchGames } from "../utils/bgg";

export interface GameInfo {
  id: string;
  name: string;
}

interface GameSearchProps {
  onSelect: (game: GameInfo) => void;
}

const GameSearch: React.FC<GameSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameInfo[]>([]);
  const [showResults, setShowResults] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (q: string) => {
    setQuery(q);
    setShowResults(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      try {
        const list = await searchGames(q);
        setResults(list.slice(0, 5));
      } catch (e) {
        console.error("Search error:", e);
      }
    }, 300);
  };

  const pick = (game: GameInfo) => {
    setQuery(game.name);
    setShowResults(false);
    setResults([]);
    onSelect(game);
  };

  return (
    <div style={{ flex: "2 1 160px", position: "relative" }}>
      <input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setShowResults(true)}
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
      {showResults && results.length > 0 && (
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
          {results.map((game) => (
            <div
              key={game.id}
              onClick={() => pick(game)}
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
  );
};

export default GameSearch;
