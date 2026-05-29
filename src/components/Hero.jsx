import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: i => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    }),
}

function AnimatedText({ text, delay = 0 }) {
    return (
        <>
            {text.split('').map((char, i) => (
                <motion.span
                    key={i}
                    custom={i + delay}
                    variants={letterVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
                >
                    {char}
                </motion.span>
            ))}
        </>
    )
}

export default function Hero() {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end start'],
    })

    const y = useTransform(scrollYProgress, [0, 1], [0, 150])
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

    return (
        <motion.div className="hero" ref={ref}>
            <motion.div style={{ y, opacity }}>
                <h1 className="hero-title">
                    <span className="hero-line">
                        <AnimatedText text="Your verses," />
                    </span>
                    <span className="hero-line">
                        <AnimatedText text="your " delay={12} />
                        <em>
                            <AnimatedText text="sanctuary." delay={17} />
                        </em>
                    </span>
                </h1>
                <motion.p
                    className="hero-sub"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    A quiet place to write, read, and keep your poetry alive.
                </motion.p>
            </motion.div>
        </motion.div>
    )
}
