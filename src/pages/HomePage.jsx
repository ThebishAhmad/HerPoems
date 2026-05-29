import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import Hero from '../components/Hero'
import PoemCard from '../components/PoemCard'
import EmptyState from '../components/EmptyState'
import FloatingTagBar from '../components/FloatingTagBar'



export default function HomePage({ poems, loading, getFiltered, allTags, search, setSearch, sort, setSort, activeTag, setActiveTag, onAddPoem, bookmarks }) {
    const filtered = getFiltered()
    const tags = allTags()

    const handleTagClick = useCallback(tag => {
        setActiveTag(tag)
    }, [setActiveTag])

    return (
        <motion.div
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <Hero />

            <div className="controls-bar">
                <div className="search-wrap">
                    <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search poems..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoComplete="off"
                    />
                    {search && (
                        <button className="search-clear visible" onClick={() => setSearch('')}>&times;</button>
                    )}
                </div>
                <div className="sort-wrap">
                    <label htmlFor="sort-select" className="sr-only">Sort poems</label>
                    <select
                        id="sort-select"
                        className="sort-select"
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="most-liked">Most Loved</option>
                    </select>
                </div>
            </div>



            <FloatingTagBar tags={tags} activeTag={activeTag} onTagClick={handleTagClick} />

            {activeTag && (
                <motion.div
                    className="active-tag-bar"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <span className="active-tag-label">Filtering:</span>
                    <span className="active-tag-name">#{activeTag}</span>
                    <button className="btn-clear-tag" onClick={() => setActiveTag(null)}>&times;</button>
                </motion.div>
            )}

            {loading ? (
                <div className="poems-grid">
                    <div className="no-matches">
                        <h3>Loading poems...</h3>
                    </div>
                </div>
            ) : poems.length === 0 ? (
                <EmptyState onAdd={onAddPoem} />
            ) : filtered.length === 0 ? (
                <div className="poems-grid">
                    <div className="no-matches">
                        <h3>No matches found</h3>
                        <p>Try a different search term or clear your filters.</p>
                    </div>
                </div>
            ) : (
                <div className="poems-grid">
                    {filtered.map((poem, i) => (
                        <PoemCard
                            key={poem.id}
                            poem={poem}
                            index={i}
                            onTagClick={handleTagClick}
                            isBookmarked={bookmarks.isBookmarked(poem.id)}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    )
}
