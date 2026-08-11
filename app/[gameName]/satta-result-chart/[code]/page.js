'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { WHATSAPP_URL, WHATSAPP_NUMBER } from '../../../../lib/constants';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function GameChartPage() {
  const params = useParams();
  const gameCode = params.code?.toUpperCase() || 'FB';

  const currentYear = new Date().getFullYear();
  const [year, setYear]           = useState(String(currentYear));
  const [gameData, setGameData]   = useState(null);
  const [monthlyData, setMonthly] = useState({});
  const [todayResults, setToday]  = useState([]);
  const [todayDate, setTDate]     = useState('');
  const [yesterdayDate, setYDate] = useState('');
  const [loading, setLoading]     = useState(true);

  const loadGameChart = useCallback(async (yr) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/chart/game/${gameCode}?year=${yr}`);
      const json = await res.json();
      if (json.success && json.monthly_data) {
        setGameData(json.game || { name: gameCode, code: gameCode });
        setMonthly(json.monthly_data);
      }
    } catch (e) {
      console.warn('[SK] Failed to fetch game chart:', e.message);
    } finally {
      setLoading(false);
    }
  }, [gameCode]);

  const loadToday = useCallback(async () => {
    try {
      const res = await fetch('/api/results/today');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setToday(json.data);
        if (json.today_date) setTDate(json.today_date);
        if (json.yesterday_date) setYDate(json.yesterday_date);
      }
    } catch (e) {
      console.warn('[SK] Failed to fetch today results:', e.message);
    }
  }, []);

  useEffect(() => { loadGameChart(year); }, [loadGameChart, year]);
  useEffect(() => { loadToday(); const id = setInterval(loadToday, 15000); return () => clearInterval(id); }, [loadToday]);

  const years = [2026, 2025, 2024, 2023, 2022];
  const thisGame = todayResults.find(g => g.code === gameCode) || gameData;

  const SpinnerIcon = () => (
    <span className="wait-spinner" title="लाइव रिजल्ट का इंतज़ार">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9.5" />
        <line className="clock-hand" x1="12" y1="12" x2="12" y2="6.5" />
      </svg>
    </span>
  );

  return (
    <div id="wrapper">
      <header className="topbar">
        <Link href="/" className="logo" style={{ textDecoration: 'none' }}>
          <span className="logo-dot" />
          <span>SATTA KING GOLD</span>
        </Link>
        <nav>
          <Link href="/" className="active">← होम पेज पर जाएँ</Link>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)', fontWeight: 700 }}>
            💬 WhatsApp
          </a>
        </nav>
      </header>

      <div className="wrap" style={{ marginTop: 24 }}>
        {/* WHATSAPP CALLOUT */}
        <div className="wa-wave-banner">
          <div>
            <div className="wa-wave-title">👑 {gameData?.name || gameCode} लीक नंबर सीधे WhatsApp पर प्राप्त करें</div>
            <div className="wa-wave-sub">सुपरफास्ट रिजल्ट &bull; WhatsApp हेल्पलाइन: {WHATSAPP_NUMBER}</div>
          </div>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-wa-wave">
            📲 WhatsApp चैट
          </a>
        </div>

        {/* HEADER */}
        <div style={{ marginTop: 20 }}>
          <h1 className="section-heading">
            {gameData?.name || gameCode} सट्टा रिकॉर्ड चार्ट {year}
          </h1>
          <p className="section-sub">
            समय: {gameData?.draw_time || '—'} &nbsp;|&nbsp; कोड: {gameCode} &nbsp;|&nbsp; वार्षिक परिणाम तालिका
          </p>
        </div>

        {/* TODAY FEATURED RESULT */}
        {thisGame && (
          <div className="result-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{thisGame.name} &mdash; आज का परिणाम</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>समय: {thisGame.draw_time}</div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>कल का</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700 }}>{thisGame.yesterday_number || '—'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>आज का</div>
                <span className="today-num">
                  {!thisGame.today_number || thisGame.today_number === 'XX' || thisGame.today_number === '--' ? <SpinnerIcon /> : thisGame.today_number}
                </span>
              </div>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-wa-wave" style={{ padding: '6px 14px', fontSize: '12px' }}>
                💬 बुकिंग
              </a>
            </div>
          </div>
        )}

        {/* YEAR NAV */}
        <div className="wave-nav-btns" style={{ margin: '20px 0' }}>
          {years.map(y => (
            <button
              key={y}
              className={`wave-btn ${year === String(y) ? 'active' : ''}`}
              onClick={() => setYear(String(y))}
            >
              {y} चार्ट
            </button>
          ))}
        </div>

        {/* ANNUAL CHART TABLE */}
        <div className="chart-card-clean">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              <SpinnerIcon /> [ चार्ट लोड हो रहा है... ]
            </div>
          ) : (
            <table className="wave-table" aria-label="Annual Game Chart">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>तारीख</th>
                  {MONTH_SHORT.map(m => <th key={m}>{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 31 }, (_, i) => {
                  const dPad = String(i + 1).padStart(2, '0');
                  return (
                    <tr key={dPad}>
                      <td><b>{dPad}</b></td>
                      {Array.from({ length: 12 }, (_, m) => {
                        const mPad = String(m + 1).padStart(2, '0');
                        const num = monthlyData?.[mPad]?.[dPad];
                        const hasNum = num && num !== 'XX' && num !== '--';
                        return (
                          <td key={mPad} className={hasNum ? 'has-num' : ''}>
                            {num === 'XX' ? <SpinnerIcon /> : (num || '—')}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ALL OTHER GAMES */}
        <h2 className="section-heading" style={{ marginTop: 36 }}>अन्य गेम का आज का परिणाम</h2>
        <div className="result-card">
          <table className="result-table">
            <thead>
              <tr>
                <th>सट्टा का नाम</th>
                <th>चार्ट</th>
                <th>समय</th>
                <th>कल का</th>
                <th>आज का</th>
              </tr>
            </thead>
            <tbody>
              {todayResults.map((g) => {
                const isPending = !g.today_number || g.today_number === 'XX' || g.today_number === '--';
                const chartHref = `/${g.slug || g.code.toLowerCase()}/satta-result-chart/${g.code.toLowerCase()}/`;

                return (
                  <tr key={g.code}>
                    <td><span className="g-name">{g.name}</span></td>
                    <td><Link href={chartHref} className="g-chart">चार्ट</Link></td>
                    <td className="g-time">{g.draw_time}</td>
                    <td className="cell-prev">{g.yesterday_number || '—'}</td>
                    <td className="cell-today">
                      <span className={`today-num ${isPending ? 'wait' : ''}`}>
                        {isPending ? <SpinnerIcon /> : g.today_number}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLOATING WHATSAPP BUTTON */}
      <div className="floating-wa">
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="wave-fab-wa">
          💬 WhatsApp
        </a>
      </div>

      <div className="floating-bar">
        <button className="wave-fab" onClick={() => window.location.reload()}>
          ↺ ताज़ा करें
        </button>
      </div>
    </div>
  );
}
