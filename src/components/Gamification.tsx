import React, { useEffect, useState, useRef } from 'react';

// ── CSS-Only Confetti Burst ─────────────────────────────────
interface ConfettiProps {
  active: boolean;
  colors?: string[];
  duration?: number;
  onDone?: () => void;
}

export function ConfettiBurst({ active, colors, duration = 2400, onDone }: ConfettiProps) {
  const [particles, setParticles] = useState<{
    id: number; x: number; y: number; size: number; color: string;
    dx: number; dy: number; rot: number; shape: 'circle' | 'rect' | 'star';
  }[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) { setParticles([]); return; }
    const palette = colors || ['#fbbf24', '#60a5fa', '#f472b6', '#34d399', '#a78bfa', '#fb923c', '#22d3ee'];
    const shapes: ('circle' | 'rect' | 'star')[] = ['circle', 'rect', 'star'];
    const pts = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: 40 + Math.random() * 20,          // % from left (centered)
      y: 30 + Math.random() * 10,           // % from top
      size: 4 + Math.random() * 8,
      color: palette[Math.floor(Math.random() * palette.length)],
      dx: (Math.random() - 0.5) * 160,      // pixels spread X
      dy: -(80 + Math.random() * 200),       // pixels spread Y (upward)
      rot: Math.random() * 720,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));
    setParticles(pts);
    timerRef.current = setTimeout(() => {
      setParticles([]);
      onDone?.();
    }, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      pointerEvents: 'none', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--dx), calc(var(--dy) + 60vh)) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.shape === 'rect' ? p.size * 0.6 : p.size,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'star' ? '2px' : '1px',
            background: p.color,
            boxShadow: `0 0 6px ${p.color}88`,
            ['--dx' as any]: `${p.dx}px`,
            ['--dy' as any]: `${p.dy}px`,
            ['--rot' as any]: `${p.rot}deg`,
            animation: `confetti-fall ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ── Weekly Objectives ───────────────────────────────────────
interface WeeklyObjective {
  id: string;
  emoji: string;
  label: string;
  target: number;
  current: number;
  rewardPts: number;
  color: string;
}

export function WeeklyObjectives({ tripCount, reportCount, co2Kg }: {
  tripCount: number;
  reportCount: number;
  co2Kg: number;
}) {
  const objectives: WeeklyObjective[] = [
    {
      id: 'trips_5',
      emoji: '🚌',
      label: '5 trajets cette semaine',
      target: 5,
      current: Math.min(5, tripCount),
      rewardPts: 25,
      color: '#2563eb',
    },
    {
      id: 'eco_2kg',
      emoji: '🌿',
      label: '2 kg de CO₂ économisés',
      target: 2,
      current: Math.min(2, co2Kg),
      rewardPts: 30,
      color: '#059669',
    },
    {
      id: 'report_1',
      emoji: '🛡️',
      label: 'Signaler 1 incident',
      target: 1,
      current: Math.min(1, reportCount),
      rewardPts: 15,
      color: '#f59e0b',
    },
    {
      id: 'trips_10',
      emoji: '🏆',
      label: '10 trajets (défi pro)',
      target: 10,
      current: Math.min(10, tripCount),
      rewardPts: 60,
      color: '#7c3aed',
    },
  ];

  // Simulated week expiry
  const now = new Date();
  const daysLeft = 7 - now.getDay();
  const endDate = new Date(now.getTime() + daysLeft * 86_400_000);
  const endStr = endDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div style={{
      borderRadius: 20,
      overflow: 'hidden',
      background: 'var(--c-surface)',
      border: '1px solid var(--c-border)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--c-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎯</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: 'white' }}>Objectifs Hebdomadaires</span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: '3px 8px', borderRadius: 8,
          background: 'rgba(251,191,36,0.12)',
          color: '#fbbf24',
        }}>
          Fin {endStr}
        </span>
      </div>

      {/* Objectives */}
      <div style={{ padding: '12px 16px' }}>
        {objectives.map(obj => {
          const pct = Math.min(100, (obj.current / obj.target) * 100);
          const complete = pct >= 100;
          return (
            <div key={obj.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              opacity: complete ? 0.7 : 1,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: complete ? 'rgba(34,197,94,0.15)' : `${obj.color}18`,
                border: `1px solid ${complete ? 'rgba(34,197,94,0.3)' : obj.color + '30'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>
                {complete ? '✅' : obj.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: complete ? '#4ade80' : 'white',
                  textDecoration: complete ? 'line-through' : 'none',
                }}>
                  {obj.label}
                </div>
                <div style={{
                  marginTop: 5, height: 5, borderRadius: 4,
                  background: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: complete ? '#22c55e' : obj.color,
                    width: `${pct}%`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ fontSize: 10, marginTop: 3, color: '#475569' }}>
                  {obj.current}/{obj.target} · +{obj.rewardPts} pts
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Anonymous Leaderboard ───────────────────────────────────
const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Mouss★★★',     pts: 620, level: '💎', badge: 'platinum' },
  { rank: 2, name: 'AstouDKR',      pts: 485, level: '🥇', badge: 'gold'     },
  { rank: 3, name: 'IbouTER',       pts: 410, level: '🥇', badge: 'gold'     },
  { rank: 4, name: 'FatouBRT',      pts: 320, level: '🥇', badge: 'gold'     },
  { rank: 5, name: 'PapaWave',      pts: 275, level: '🥈', badge: 'gold'     },
  { rank: 6, name: 'DioufBus',      pts: 210, level: '🥈', badge: 'silver'   },
  { rank: 7, name: 'NdeyeNi',       pts: 180, level: '🥈', badge: 'silver'   },
  { rank: 8, name: 'AlioExplr',     pts: 130, level: '🥈', badge: 'silver'   },
  { rank: 9, name: 'MarièmeDDD',    pts: 95,  level: '🥈', badge: 'silver'   },
  { rank: 10,name: 'OussExp',       pts: 82,  level: '🥈', badge: 'silver'   },
];

const RANK_COLORS: Record<string, string> = {
  platinum: '#a78bfa',
  gold: '#fbbf24',
  silver: '#94a3b8',
  bronze: '#cd7f32',
};

export function Leaderboard({ myPoints, myName }: { myPoints: number; myName: string }) {
  // Insert the current user into the mock leaderboard
  const allPlayers = [...MOCK_LEADERBOARD];
  const myRank = allPlayers.filter(p => p.pts > myPoints).length + 1;
  const myLevel = myPoints >= 500 ? '💎' : myPoints >= 200 ? '🥇' : myPoints >= 80 ? '🥈' : '🥉';
  const myBadge = myPoints >= 500 ? 'platinum' : myPoints >= 200 ? 'gold' : myPoints >= 80 ? 'silver' : 'bronze';

  return (
    <div style={{
      borderRadius: 20,
      overflow: 'hidden',
      background: 'var(--c-surface)',
      border: '1px solid var(--c-border)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--c-border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 18 }}>🏆</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: 'white' }}>Classement Hebdomadaire</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 700,
          padding: '3px 8px', borderRadius: 8,
          background: RANK_COLORS[myBadge] + '20',
          color: RANK_COLORS[myBadge],
        }}>
          #{myRank}
        </span>
      </div>

      {/* Top 3 podium */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        gap: 10, padding: '20px 16px 12px',
        background: 'linear-gradient(180deg, rgba(37,99,235,0.06), transparent)',
      }}>
        {[1, 0, 2].map(idx => {
          const p = allPlayers[idx];
          if (!p) return null;
          const isFirst = idx === 0;
          const heights = [72, 90, 60];
          const sizes = [44, 56, 40];
          const bgColors = ['#94a3b8', '#fbbf24', '#cd7f32'];
          return (
            <div key={p.rank} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, minWidth: 70,
            }}>
              <div style={{
                width: sizes[idx], height: sizes[idx], borderRadius: '50%',
                background: `${bgColors[idx]}25`,
                border: `2.5px solid ${bgColors[idx]}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isFirst ? 24 : 18,
                boxShadow: isFirst ? `0 0 20px ${bgColors[idx]}50` : 'none',
              }}>
                {p.level}
              </div>
              <span style={{ fontSize: 11, fontWeight: 900, color: 'white' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: bgColors[idx], fontWeight: 700 }}>{p.pts} pts</span>
              <div style={{
                width: '100%', height: heights[idx], borderRadius: '8px 8px 0 0',
                background: `linear-gradient(180deg, ${bgColors[idx]}40, ${bgColors[idx]}15)`,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                paddingTop: 8, fontSize: 16, fontWeight: 900, color: bgColors[idx],
              }}>
                {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest of leaderboard */}
      <div style={{ padding: '0 16px 12px' }}>
        {allPlayers.slice(3, 10).map(p => {
          const isMe = p.rank === myRank && myRank > 3 && myRank <= 10;
          return (
            <div key={p.rank} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: isMe ? 'rgba(37,99,235,0.08)' : 'transparent',
              borderRadius: isMe ? 8 : 0,
              paddingLeft: isMe ? 8 : 0,
              paddingRight: isMe ? 8 : 0,
            }}>
              <span style={{
                width: 24, fontSize: 12, fontWeight: 900,
                color: '#475569', textAlign: 'center',
              }}>
                {p.rank}
              </span>
              <span style={{ fontSize: 14 }}>{p.level}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: isMe ? '#60a5fa' : 'white' }}>
                {isMe ? `${myName || 'Vous'} (vous)` : p.name}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: RANK_COLORS[p.badge] || '#475569',
              }}>
                {isMe ? myPoints : p.pts} pts
              </span>
            </div>
          );
        })}

        {/* Current user if below top 10 */}
        {myRank > 10 && (
          <>
            <div style={{ textAlign: 'center', padding: '6px 0', color: '#334155', fontSize: 12 }}>⋮</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 8px', borderRadius: 10,
              background: 'rgba(37,99,235,0.1)',
              border: '1px solid rgba(37,99,235,0.2)',
            }}>
              <span style={{ width: 24, fontSize: 12, fontWeight: 900, color: '#60a5fa', textAlign: 'center' }}>
                {myRank}
              </span>
              <span style={{ fontSize: 14 }}>{myLevel}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#60a5fa' }}>
                {myName || 'Vous'} (vous)
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa' }}>
                {myPoints} pts
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
