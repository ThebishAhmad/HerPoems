import { useRef } from 'react'
import { useScroll } from 'framer-motion'
import ShowcaseNavbar from '../components/showcase/ShowcaseNavbar'
import TransformerScrollCanvas from '../components/showcase/TransformerScrollCanvas'
import TransformerExperience from '../components/showcase/TransformerExperience'
import { SEQUENCE_CONFIG } from '../data/transformerData'

export default function ShowcasePage() {
    const containerRef = useRef(null)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    })

    return (
        <main className="showcase-root">
            <ShowcaseNavbar />

            {/* Scroll-locked sequence — 500vh tall */}
            <section
                ref={containerRef}
                className="showcase-scroll-container"
                style={{ position: 'relative' }}
            >
                <div className="showcase-sticky-viewport">
                    <TransformerScrollCanvas
                        scrollYProgress={scrollYProgress}
                        totalFrames={SEQUENCE_CONFIG.totalFrames}
                    />
                    <TransformerExperience
                        scrollYProgress={scrollYProgress}
                    />
                </div>
            </section>

            {/* Post-sequence content */}
            <div className="showcase-after">
                {/* Footer */}
                <footer className="showcase-footer" id="contact">
                    <p className="showcase-footer-credit">
                        Inkwell — A Poetry Experience
                    </p>
                    <p className="showcase-footer-sub">
                        Crafted by Tabish Ahmad · <a href="/">Enter the Inkwell →</a>
                    </p>
                </footer>
            </div>
        </main>
    )
}
