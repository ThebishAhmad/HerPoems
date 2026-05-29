import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function ShowcaseNavbar() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <header
            className={`showcase-navbar${scrolled ? ' scrolled' : ''}`}
            role="banner"
        >
            <Link to="/" className="showcase-nav-mark" aria-label="Back to Inkwell">
                ✦ <span>INKWELL</span>
            </Link>

            <a
                href="#contact"
                className="showcase-nav-cta"
            >
                INQUIRE
            </a>
        </header>
    )
}
