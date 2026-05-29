import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

export default function Auth() {
    const { signUp, signIn } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            if (isLogin) {
                await signIn(email, password)
            } else {
                await signUp(email, password)
                setError('Check your email for the login link or log in now if auto-confirm is enabled.')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="animated-gradient-bg" />
            <div className="app-wrapper" style={{ position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="poem-card"
                    style={{ 
                        width: '100%', 
                        maxWidth: '420px', 
                        padding: 'var(--space-3xl) var(--space-2xl)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center'
                    }}
                >
                    <div className="logo" style={{ marginBottom: 'var(--space-xl)', fontSize: 'var(--font-size-2xl)' }}>
                        <span className="logo-icon">✦</span>
                        <span className="logo-text">The Inking</span>
                    </div>

                    <h2 className="hero-title" style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-sm)' }}>
                        {isLogin ? 'Welcome Back' : 'Begin Your Journey'}
                    </h2>
                    <p className="hero-sub" style={{ marginTop: 0, marginBottom: 'var(--space-2xl)', fontSize: 'var(--font-size-sm)' }}>
                        {isLogin ? 'Enter the quiet place for your poetry.' : 'A safe sanctuary for your words.'}
                    </p>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ color: 'var(--danger)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)' }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div style={{ position: 'relative' }}>
                            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            <input
                                type="email"
                                className="search-input"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </div>
                        
                        <div style={{ position: 'relative' }}>
                            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                type="password"
                                className="search-input"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn-primary"
                            disabled={loading}
                            style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-sm)' }}
                        >
                            {loading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                                />
                            ) : (
                                <span>{isLogin ? 'Enter Sanctuary' : 'Create Account'}</span>
                            )}
                        </button>
                    </form>

                    <div style={{ marginTop: 'var(--space-xl)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-md)', width: '100%' }}>
                        <button 
                            type="button" 
                            className="btn-ghost-sm"
                            onClick={() => {
                                setIsLogin(!isLogin)
                                setError(null)
                            }}
                            style={{ width: '100%' }}
                        >
                            {isLogin ? "New here? Create an account" : "Already have an account? Log in"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </>
    )
}
