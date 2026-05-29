import { useMotionValueEvent } from 'framer-motion'
import { useState, useMemo } from 'react'
import { PHASES, FRAME_COUNTER, SEQUENCE_CONFIG } from '../../data/transformerData'

function lerp(a, b, t) { return a + (b - a) * t }
function clamp(v, min = 0, max = 1) { return Math.max(min, Math.min(max, v)) }

// Compute smooth opacity for a phase
function phaseOpacity(progress, start, end, fadeIn = 0.04, fadeOut = 0.04) {
    if (progress < start || progress > end) return 0
    const inP = clamp((progress - start) / fadeIn)
    const outP = clamp((end - progress) / fadeOut)
    return Math.min(inP, outP)
}

// Compute opacity for a fleeting element (brief appearance)
function fleetingOpacity(progress, at, duration = 0.07, fade = 0.025) {
    return phaseOpacity(progress, at - fade, at + duration, fade, fade)
}

export default function TransformerExperience({ scrollYProgress }) {
    const [p, setP] = useState(0) // scroll progress 0..1

    useMotionValueEvent(scrollYProgress, 'change', setP)

    const frameNum = Math.round(p * (SEQUENCE_CONFIG.totalFrames - 1)) + 1
    const frameStr = String(frameNum).padStart(3, '0')

    // ─── Phase opacities ───
    const presenceOp = phaseOpacity(p, 0, 0.28, 0.01, 0.06)
    const arrivalOp = phaseOpacity(p, 0.74, 1.0, 0.06, 0.01)
    const counterOp = phaseOpacity(p, FRAME_COUNTER.range[0], FRAME_COUNTER.range[1], 0.04, 0.04)

    // Hero title: slides up as it fades out
    const heroTranslateY = lerp(0, -30, clamp((p - 0.10) / 0.18))

    // Arrival: slides up as it fades in
    const arrivalTranslateY = lerp(40, 0, clamp((p - 0.74) / 0.10))

    // ─── Awakening fragments ───
    const awakeningFragments = useMemo(() => {
        return PHASES.awakening.fragments.map(frag => ({
            ...frag,
            opacity: fleetingOpacity(p, frag.at, 0.09, 0.03),
            translateY: lerp(20, 0, clamp((p - (frag.at - 0.03)) / 0.04)),
        }))
    }, [p])

    // ─── Transformation captions ───
    const activeCaption = useMemo(() => {
        for (const cap of PHASES.transformation.captions) {
            const op = fleetingOpacity(p, cap.at, 0.07, 0.02)
            if (op > 0) return { ...cap, opacity: op }
        }
        return null
    }, [p])

    // ─── Poetic ghost lines ───
    const poeticLines = useMemo(() => {
        return PHASES.transformation.poeticLines.map(line => ({
            ...line,
            opacity: fleetingOpacity(p, line.at, 0.08, 0.03),
            translateX: lerp(-20, 0, clamp((p - (line.at - 0.03)) / 0.05)),
        }))
    }, [p])

    // ─── Transformation progress bar ───
    const transRange = PHASES.transformation.range
    const transProgress = clamp((p - transRange[0]) / (transRange[1] - transRange[0]))
    const transBarOp = phaseOpacity(p, transRange[0], transRange[1], 0.04, 0.04)

    // ─── Vignette intensity ───
    const vignetteIntensity = p < 0.1 ? lerp(0.7, 0.3, p / 0.1)
        : p > 0.8 ? lerp(0.3, 0.6, (p - 0.8) / 0.2) : 0.3

    return (
        <div className="showcase-hud">
            {/* ─── CINEMATIC VIGNETTE ─── */}
            <div
                className="hud-vignette"
                style={{ '--vignette-intensity': vignetteIntensity }}
            />

            {/* ─── FILM GRAIN OVERLAY ─── */}
            <div className="hud-grain" />

            {/* ─── PRESENCE PHASE (0–28%) ─── */}
            <div
                className="hud-presence"
                style={{
                    opacity: presenceOp,
                    transform: `translateY(${heroTranslateY}px)`,
                }}
            >
                <div className="hud-presence-content">
                    <h1 className="hud-presence-title">
                        {PHASES.presence.title.map((line, i) => (
                            <span key={i} className="hud-presence-line">
                                {i === 0 && <span className="hud-presence-accent">{line}</span>}
                                {i > 0 && line}
                            </span>
                        ))}
                    </h1>
                    <p className="hud-presence-subtitle">{PHASES.presence.subtitle}</p>
                </div>

                {/* System tag — top-right */}
                <div className="hud-sys-tag">
                    <span className="hud-sys-dot" />
                    <span>{PHASES.presence.systemTag}</span>
                </div>

                {/* Scroll indicator */}
                <div className="hud-scroll-cue" style={{ opacity: p < 0.04 ? 1 : 0 }}>
                    <div className="hud-scroll-track">
                        <div className="hud-scroll-thumb" />
                    </div>
                    <span>SCROLL</span>
                </div>
            </div>

            {/* ─── AWAKENING FRAGMENTS (12–35%) ─── */}
            {awakeningFragments.map((frag, i) => (
                frag.opacity > 0 && (
                    <div
                        key={i}
                        className={`hud-fragment hud-fragment--${frag.position}`}
                        style={{
                            opacity: frag.opacity,
                            transform: `translateY(${frag.translateY}px)`,
                        }}
                    >
                        <span className="hud-fragment-text">{frag.text}</span>
                    </div>
                )
            ))}

            {/* ─── TRANSFORMATION PHASE (28–72%) ─── */}
            {/* Frame counter — bottom-left */}
            <div className="hud-counter" style={{ opacity: counterOp }}>
                <span className="hud-counter-label">FRAME</span>
                <span className="hud-counter-num">{frameStr}</span>
                <span className="hud-counter-sep">/</span>
                <span className="hud-counter-total">{SEQUENCE_CONFIG.totalFrames}</span>
            </div>

            {/* Technical caption — right side */}
            {activeCaption && (
                <div
                    className="hud-tech-caption"
                    style={{ opacity: activeCaption.opacity }}
                >
                    <span className="hud-tech-main">{activeCaption.text}</span>
                    <span className="hud-tech-sub">{activeCaption.sub}</span>
                </div>
            )}

            {/* Poetic ghost lines — float across screen */}
            {poeticLines.map((line, i) => (
                line.opacity > 0 && (
                    <div
                        key={i}
                        className="hud-poetic-line"
                        style={{
                            opacity: line.opacity,
                            top: line.y,
                            transform: `translateX(${line.translateX}px)`,
                        }}
                    >
                        {line.text}
                    </div>
                )
            ))}

            {/* Progress bar — bottom edge */}
            <div className="hud-progress-track" style={{ opacity: transBarOp }}>
                <div
                    className="hud-progress-fill"
                    style={{ transform: `scaleX(${transProgress})` }}
                />
            </div>

            {/* Vertical phase indicator — right edge */}
            <div className="hud-phase-rail" style={{ opacity: transBarOp }}>
                <span>SHIFTING</span>
                <span className="hud-phase-rail-bar">
                    <span
                        className="hud-phase-rail-fill"
                        style={{ height: `${transProgress * 100}%` }}
                    />
                </span>
                <span>CORE</span>
            </div>

            {/* ─── ARRIVAL PHASE (72–100%) ─── */}
            <div
                className="hud-arrival"
                style={{
                    opacity: arrivalOp,
                    transform: `translateY(${arrivalTranslateY}px)`,
                }}
            >
                <div className="hud-arrival-inner">
                    <p className="hud-arrival-poem">{PHASES.arrival.poemLine}</p>
                    <h2 className="hud-arrival-title">
                        {PHASES.arrival.statement.map((line, i) => (
                            <span key={i} className="hud-arrival-line">{line}</span>
                        ))}
                    </h2>
                    <p className="hud-arrival-credit">{PHASES.arrival.credit}</p>
                    <a
                        href={PHASES.arrival.cta.href}
                        className="hud-arrival-cta"
                        style={{ pointerEvents: arrivalOp > 0.5 ? 'auto' : 'none' }}
                    >
                        {PHASES.arrival.cta.label}
                    </a>
                </div>
            </div>

            {/* ─── CORNER BRACKETS (cinematic framing) ─── */}
            <div className="hud-brackets" style={{ opacity: counterOp }}>
                <span className="hud-bracket hud-bracket--tl" />
                <span className="hud-bracket hud-bracket--tr" />
                <span className="hud-bracket hud-bracket--bl" />
                <span className="hud-bracket hud-bracket--br" />
            </div>

            {/* ─── SR-ONLY ACCESSIBLE SUMMARY ─── */}
            <div className="sr-only" role="region" aria-label="Cinematic sequence description">
                <p>A cinematic transformation sequence: a book opens with petals flying.
                    The background environment evolves with the transformation.
                    Directed by Tabish Ahmad.</p>
            </div>
        </div>
    )
}
