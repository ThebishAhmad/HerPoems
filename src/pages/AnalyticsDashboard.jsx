import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

function formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m < 60) return `${m}m ${s}s`
    const h = Math.floor(m / 60)
    return `${h}h ${m % 60}m`
}

function formatHour(h) {
    if (h === 0) return '12am'
    if (h < 12) return `${h}am`
    if (h === 12) return '12pm'
    return `${h - 12}pm`
}

export default function AnalyticsDashboard({ analytics, poems, streak }) {
    const navigate = useNavigate()
    const globalStats = analytics.getGlobalStats()
    const topPoems = analytics.getTopPoems(10)
    const poemsList = poems.filter(p => p.visibility !== 'private')

    const monthlyData = useMemo(() => {
        const months = {}
        poemsList.forEach(p => {
            const key = new Date(p.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
            months[key] = (months[key] || 0) + 1
        })
        return Object.entries(months).slice(-12)
    }, [poemsList])

    const moodDistribution = useMemo(() => {
        const moods = {}
        poemsList.forEach(p => {
            const m = p.mood || 'unset'
            moods[m] = (moods[m] || 0) + 1
        })
        return Object.entries(moods).sort((a, b) => b[1] - a[1])
    }, [poemsList])

    return (
        <motion.div
            className="analytics-page"
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.4 }}
        >
            <h1 className="page-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                Analytics
            </h1>

            {/* KPI Cards */}
            <div className="analytics-kpi-grid">
                <div className="kpi-card">
                    <span className="kpi-icon">👁️</span>
                    <span className="kpi-value">{globalStats.totalViews}</span>
                    <span className="kpi-label">Total Views</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-icon">⏱️</span>
                    <span className="kpi-value">{formatDuration(globalStats.totalReadTime)}</span>
                    <span className="kpi-label">Total Read Time</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-icon">📝</span>
                    <span className="kpi-value">{poemsList.length}</span>
                    <span className="kpi-label">Published Poems</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-icon">🔥</span>
                    <span className="kpi-value">{streak.currentStreak}</span>
                    <span className="kpi-label">Day Streak</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-icon">⏰</span>
                    <span className="kpi-value">{formatHour(globalStats.peakHour)}</span>
                    <span className="kpi-label">Peak Reading</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-icon">🏆</span>
                    <span className="kpi-value">{streak.longestStreak}</span>
                    <span className="kpi-label">Best Streak</span>
                </div>
            </div>

            {/* Hourly Heatmap */}
            <div className="analytics-section">
                <h2 className="section-title">Reading Heatmap</h2>
                <div className="hourly-heatmap">
                    {globalStats.hourlyViews.map((count, h) => {
                        const max = Math.max(...globalStats.hourlyViews, 1)
                        const intensity = count / max
                        return (
                            <div
                                key={h}
                                className="heatmap-cell"
                                style={{ '--intensity': intensity }}
                                title={`${formatHour(h)}: ${count} views`}
                            >
                                <span className="heatmap-hour">{formatHour(h)}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Top Poems */}
            <div className="analytics-section">
                <h2 className="section-title">Top Poems</h2>
                <div className="top-poems-list">
                    {topPoems.map((p, i) => {
                        const poem = poemsList.find(pp => pp.id === p.id)
                        if (!poem) return null
                        const poemAnalytics = analytics.getPoemAnalytics(p.id)
                        return (
                            <motion.div
                                key={p.id}
                                className="top-poem-item"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => navigate(`/poem/${p.id}`)}
                            >
                                <span className="top-poem-rank">#{i + 1}</span>
                                <div className="top-poem-info">
                                    <span className="top-poem-title">{poem.title}</span>
                                    <span className="top-poem-stats">
                                        {p.views} views · {formatDuration(poemAnalytics?.avgReadTime || 0)} avg read
                                    </span>
                                </div>
                                <div className="top-poem-bar">
                                    <div
                                        className="top-poem-bar-fill"
                                        style={{ width: `${topPoems[0] ? (p.views / topPoems[0].views) * 100 : 0}%` }}
                                    />
                                </div>
                            </motion.div>
                        )
                    })}
                    {topPoems.length === 0 && (
                        <p className="text-muted">Start reading poems to see analytics here.</p>
                    )}
                </div>
            </div>

            {/* Monthly Poems */}
            <div className="analytics-section">
                <h2 className="section-title">Poems by Month</h2>
                <div className="monthly-chart">
                    {monthlyData.map(([month, count]) => {
                        const max = Math.max(...monthlyData.map(d => d[1]), 1)
                        return (
                            <div key={month} className="monthly-bar-wrap">
                                <div className="monthly-bar" style={{ height: `${(count / max) * 100}%` }}>
                                    <span className="monthly-count">{count}</span>
                                </div>
                                <span className="monthly-label">{month}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Mood Distribution */}
            {moodDistribution.length > 0 && (
                <div className="analytics-section">
                    <h2 className="section-title">Mood Distribution</h2>
                    <div className="mood-chart">
                        {moodDistribution.map(([mood, count]) => {
                            const total = moodDistribution.reduce((s, d) => s + d[1], 0)
                            const pct = Math.round((count / total) * 100)
                            return (
                                <div key={mood} className="mood-chart-item">
                                    <span className="mood-chart-label">{mood === 'unset' ? 'No mood' : mood}</span>
                                    <div className="mood-chart-bar">
                                        <div className="mood-chart-fill" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="mood-chart-pct">{pct}%</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </motion.div>
    )
}
