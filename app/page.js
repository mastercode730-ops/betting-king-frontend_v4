'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { WHATSAPP_URL, WHATSAPP_NUMBER } from '../lib/constants';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const REFRESH_MS = 15_000;

export default function HomePage() {
  const [games, setGames]           = useState([]);
  const [announcement, setAnnouncement] = useState(null);
  const [todayDate, setTodayDate]   = useState('');
  const [yesterdayDate, setYDate]   = useState('');
  const [searchQ, setSearchQ]       = useState('');
  const [syncing, setSyncing]       = useState(false);
  const [chartMonth, setChartMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [chartYear, setChartYear]   = useState(() => String(new Date().getFullYear()));
  const [chartData, setChartData]   = useState(null);

  // Fetch today results from backend API
  const loadAnnouncement = useCallback(async () => {
    try {
      const res = await fetch('/api/announcement');
      const json = await res.json();
      if (json && json.success) setAnnouncement(json);
    } catch (e) {}
  }, []);

  const loadResults = useCallback(async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/results/today');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setGames(json.data);
        if (json.today_date) setTodayDate(json.today_date);
        if (json.yesterday_date) setYDate(json.yesterday_date);
      }
    } catch (e) {
      console.warn('[SK] API failed:', e.message);
    } finally {
      setTimeout(() => setSyncing(false), 800);
    }
  }, []);

  useEffect(() => {
    loadResults();
    loadAnnouncement();
    const id = setInterval(() => {
      loadResults();
      loadAnnouncement();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadResults, loadAnnouncement]);

  // Load chart from backend API
  const loadChart = useCallback(async (month, year) => {
    try {
      const res = await fetch(`/api/chart/monthly?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.success && json.rows) {
        setChartData(json);
      }
    } catch (e) {
      console.warn('[SK] Chart API failed:', e.message);
    }
  }, []);

  useEffect(() => {
    loadChart(chartMonth, chartYear);
  }, [loadChart, chartMonth, chartYear]);

  const filtered = searchQ
    ? games.filter(g => g.name.toLowerCase().includes(searchQ.toLowerCase()) || g.code.toLowerCase().includes(searchQ.toLowerCase()))
    : games;

  const heroGame = games.find(g => g.is_highlight && g.is_main) || games[0];

  const goToMonth = (month, year) => {
    setChartMonth(month);
    setChartYear(year);
  };

  const mIdx = parseInt(chartMonth, 10) - 1;
  const prevMIdx = mIdx === 0 ? 11 : mIdx - 1;
  const prevYear = mIdx === 0 ? parseInt(chartYear) - 1 : parseInt(chartYear);
  const nextMIdx = mIdx === 11 ? 0 : mIdx + 1;
  const nextYear = mIdx === 11 ? parseInt(chartYear) + 1 : parseInt(chartYear);
  const todayDay = todayDate ? todayDate.split('-')[2] : '';

  const fmtFullDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const SpinnerIcon = () => (
    <span className="wait-spinner" title="लाइव रिजल्ट का इंतज़ार">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9.5" />
        <line className="clock-hand" x1="12" y1="12" x2="12" y2="6.5" />
      </svg>
    </span>
  );

  return (
    <div id="wrapper">
      {/* ── BREAKING FLASH BAR ── */}
      {heroGame && (
        <div className="lrs">
          <span className="lrs-tag"><i className="lrs-dot" />अभी आया रिजल्ट</span>
          <span className="lrs-game">{heroGame.name}</span>
          <span className="lrs-time">({heroGame.draw_time})</span>
          <span className="lrs-arrow">&#10148;</span>
          <span className="lrs-num">{!heroGame.today_number || heroGame.today_number === 'XX' || heroGame.today_number === '--' ? '??' : heroGame.today_number}</span>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-wa-wave" style={{ padding: '2px 10px', fontSize: '11px', marginLeft: 8 }}>
            💬 WhatsApp
          </a>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <header className="topbar">
        <div className="logo">
          <span className="logo-dot" />
          <span>SATTA KING GOLD</span>
        </div>
        <nav>
          <Link href="/" className="active">होम</Link>
          <a href="#results">रिजल्ट</a>
          <a href="#monthly-chart">रिकॉर्ड चार्ट</a>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)', fontWeight: 700 }}>
            💬 WhatsApp
          </a>
        </nav>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-live-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="lrs-dot" style={{ background: syncing ? '#ffb020' : '#ffffff' }} />
          {syncing ? 'सिंक...' : 'लाइव 🔴'}
        </a>
      </header>

      {/* ── LIVE ANNOUNCEMENT / ADVERTISEMENT BANNER ── */}
      {announcement && announcement.active && announcement.text && (
        <div className="adv-banner" role="alert">
          <div className="adv-banner-inner">
            <span className="adv-badge">📢 SPECIAL NOTICE</span>
            <span className="adv-text" dangerouslySetInnerHTML={{
              __html: announcement.text.replace(
                /(https?:\/\/[^\s]+)/g,
                '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
              )
            }} />
          </div>
        </div>
      )}

      {/* ── SUNSET WAVE HERO SECTION ── */}
      {heroGame && (
        <section className="hero">
          <div className="hero-inner">
            <span className="hero-chip">&#9210; सुपरफास्ट लाइव रिजल्ट</span>
            <p className="hero-date">{fmtFullDate(todayDate || new Date())}</p>
            <p className="hero-hindi">हाँ भाई, सबसे पहले खबर यहीं आती है</p>

            <h1 className="hero-game">{heroGame.name}</h1>
            <div className="hero-number">
              {!heroGame.today_number || heroGame.today_number === 'XX' || heroGame.today_number === '--' ? <SpinnerIcon /> : heroGame.today_number}
            </div>

            <div className="hero-cta-group">
              <a className="hero-cta" href="#results">
                सारे रिजल्ट देखें ↓
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-wa-wave">
                💬 WhatsApp पर गेम बुक करें
              </a>
            </div>
          </div>

          <svg className="hero-wave" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true">
            <path fill="#ffffff" d="M0,40 C240,80 480,0 720,25 C960,50 1200,80 1440,45 L1440,70 L0,70 Z" />
          </svg>
        </section>
      )}

      <div className="wrap">
        {/* ── WHATSAPP CALLOUT BANNER ── */}
        <div className="wa-wave-banner">
          <div>
            <div className="wa-wave-title">👑 सीधा खाईवाल से संपर्क करें &bull; ईमानदार सट्टा सर्विस</div>
            <div className="wa-wave-sub">लीक सिंगल जोड़ी और हरूफ प्राप्त करने के लिए WhatsApp करें: {WHATSAPP_NUMBER}</div>
          </div>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-wa-wave">
            📲 WhatsApp चैट शुरू करें
          </a>
        </div>

        {/* ── SEARCH BAR ── */}
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 गेम सर्च करें (Gali, Desawar, Ghaziabad...)"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            aria-label="गेम सर्च करें"
          />
        </div>

        {/* ── TODAY'S RESULT TABLE CARD ── */}
        <section id="results">
          <h2 className="section-heading">आज का रिजल्ट (TODAY RESULTS)</h2>
          <p className="section-sub">सबसे तेज़ और सटीक परिणाम तालिका</p>

          <div className="scroll-hint">👈 बाएँ-दाएँ स्क्रॉल करें 👉</div>
          <div className="result-card">
            <table className="result-table" aria-label="Today Results">
              <thead>
                <tr>
                  <th>सट्टा का नाम (GAME)</th>
                  <th>चार्ट</th>
                  <th>समय (TIME)</th>
                  <th>कल का (YEST)</th>
                  <th>आज का (TODAY)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => {
                  const isPending = !g.today_number || g.today_number === 'XX' || g.today_number === '--';
                  const chartHref = `/${g.slug || g.code.toLowerCase()}/satta-result-chart/${g.code.toLowerCase()}/`;

                  return (
                    <tr key={g.code}>
                      <td>
                        <span className="g-name">{g.name}</span>
                      </td>
                      <td>
                        <Link href={chartHref} className="g-chart">
                          चार्ट देखें
                        </Link>
                      </td>
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
        </section>

        {/* ── MONTHLY ARCHIVE TABLE ── */}
        <section id="monthly-chart">
          <h2 className="section-heading">
            मासिक रिकॉर्ड चार्ट &mdash; {chartData ? `${MONTH_NAMES[parseInt(chartData.month, 10) - 1]?.toUpperCase()} ${chartData.year}` : 'ARCHIVE'}
          </h2>
          <p className="section-sub">सभी 4 मुख्य गेम का संयुक्त मासिक चार्ट</p>

          <div className="scroll-hint">👈 बाएँ-दाएँ स्क्रॉल करें 👉</div>
          <div className="chart-card-clean">
            <table className="wave-table sticky-col" aria-label="Monthly Archive Chart">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>तारीख</th>
                  <th>DESAWAR</th>
                  <th>FARIDABAD</th>
                  <th>GAZIYABAD</th>
                  <th>GALI</th>
                </tr>
              </thead>
              <tbody>
                {chartData?.rows?.map((r) => {
                  const isToday = r.day === todayDay;
                  const hasNum = (val) => val && val !== 'XX' && val !== '--';
                  return (
                    <tr key={r.day} className={isToday ? 'today-row' : ''}>
                      <td><b>{r.day}</b></td>
                      <td className={hasNum(r.DS) ? 'has-num' : ''}>{r.DS === 'XX' && isToday ? <SpinnerIcon /> : (r.DS || '—')}</td>
                      <td className={hasNum(r.FB) ? 'has-num' : ''}>{r.FB === 'XX' && isToday ? <SpinnerIcon /> : (r.FB || '—')}</td>
                      <td className={hasNum(r.GB) ? 'has-num' : ''}>{r.GB === 'XX' && isToday ? <SpinnerIcon /> : (r.GB || '—')}</td>
                      <td className={hasNum(r.GL) ? 'has-num' : ''}>{r.GL === 'XX' && isToday ? <SpinnerIcon /> : (r.GL || '—')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="wave-nav-btns">
              <button
                className="wave-btn"
                onClick={() => goToMonth(String(prevMIdx + 1).padStart(2, '0'), String(prevYear))}
              >
                ← {MONTH_NAMES[prevMIdx]?.substring(0, 3)} {prevYear}
              </button>
              <button
                className="wave-btn"
                onClick={() => goToMonth(String(nextMIdx + 1).padStart(2, '0'), String(nextYear))}
              >
                {MONTH_NAMES[nextMIdx]?.substring(0, 3)} {nextYear} →
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="wave-footer">
          <p style={{ color: 'var(--muted)', marginBottom: 12 }}>SATTA KING GOLD &bull; ALL RIGHTS RESERVED 2026</p>
          <div style={{ marginBottom: 16 }}>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-wa-wave">
              💬 24x7 WhatsApp सेवा: {WHATSAPP_NUMBER}
            </a>
          </div>
          <div className="wave-footer-selects">
            <select
              value={chartMonth}
              onChange={e => setChartMonth(e.target.value)}
              aria-label="Select month"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
              ))}
            </select>
            <select
              value={chartYear}
              onChange={e => setChartYear(e.target.value)}
              aria-label="Select year"
            >
              {[2026, 2025, 2024, 2023, 2022].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </footer>
      </div>

      {/* FLOATING WHATSAPP BUTTON */}
      <div className="floating-wa">
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="wave-fab-wa">
          💬 WhatsApp
        </a>
      </div>

      {/* FAB */}
      <div className="floating-bar">
        <button className="wave-fab" onClick={() => window.location.reload()}>
          ↺ ताज़ा करें
        </button>
      </div>
    </div>
  );
}
