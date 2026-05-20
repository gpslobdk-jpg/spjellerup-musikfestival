import React, { useEffect, useRef, useState } from 'react'

const posterFile = '/spjellerup-musikfestival-2026.png'

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    // Prevent scrolling when modal or intro is visible
    if (isOpen || showIntro) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isOpen, showIntro])

  // Decide whether to show intro video: only on desktop and when user does not prefer reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const isDesktop = window.matchMedia && window.matchMedia('(min-width: 900px)').matches
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (isDesktop && !prefersReduced) {
        setShowIntro(true)
      }
    } catch (err) {
      // ignore
    }
  }, [])

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [soundOn, setSoundOn] = useState(false)

  const toggleSound = async () => {
    const v = videoRef.current
    const a = audioRef.current
    if (!v || !a) return

    if (!soundOn) {
      // Enable sound: unmute video quietly and play voiceover
      try {
        v.muted = false
        v.volume = 0.15
        a.volume = 1.0
        const p = a.play()
        if (p && typeof p.then === 'function') p.catch(() => {})
        setSoundOn(true)
      } catch (err) {
        console.warn('Could not start audio', err)
      }
    } else {
      // Disable sound
      try {
        a.pause()
      } catch (err) {}
      v.muted = true
      setSoundOn(false)
    }
  }

  const enterSite = () => {
    // Hide intro first, then scroll to hero to ensure smooth navigation
    setShowIntro(false)
    // stop/pause audio and mute video
    try { audioRef.current?.pause() } catch (e) {}
    try { if (videoRef.current) { videoRef.current.muted = true } } catch (e) {}
    setSoundOn(false)
    setTimeout(() => {
      const el = document.getElementById('hero')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 60)
  }

  const goToProgram = () => {
    setShowIntro(false)
    // stop/pause audio and mute video
    try { audioRef.current?.pause() } catch (e) {}
    try { if (videoRef.current) { videoRef.current.muted = true } } catch (e) {}
    setSoundOn(false)
    setTimeout(() => {
      const el = document.getElementById('program')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 60)
  }

  return (
    <div className="app">
      {/* Intro video (desktop only) */}
      {showIntro && (
        <section className="intro-video" aria-hidden={false}>
          <video
            ref={videoRef}
            className="intro-video__video"
            src="/festival-intro.mp4"
            autoPlay
            muted
            playsInline
            loop
            preload="metadata"
            aria-hidden="true"
          />
          {/* Audio element - do not autoplay; will be played on user interaction */}
          <audio ref={audioRef} src="/festival-voiceover.mp3" preload="none" />

          <div className="intro-overlay">
            <div className="intro-content">
              <div className="badge intro-badge">Gratis fællesskabsdag</div>
              <h1 className="intro-title">Spjellerup Musikfestival 2026</h1>
              <p className="intro-sub">Musik · fællesskab · show · humor</p>
              <div className="intro-meta">Torsdag d. 04. juni 2026 • Start kl. 11.00</div>

              <div className="intro-ctas">
                <button className="btn primary large" onClick={enterSite}>Gå ind på siden</button>
                <button className="btn outline large" onClick={goToProgram}>Se program</button>
              </div>
            </div>

            <button
              className="btn sound-toggle"
              onClick={toggleSound}
              aria-pressed={soundOn}
              aria-label={soundOn ? 'Slå lyd fra' : 'Slå lyd til'}
            >
              {soundOn ? 'Slå lyd fra' : 'Slå lyd til'}
            </button>
          </div>
        </section>
      )}

      <header id="hero" className="hero">
        <div className="hero-decorations" aria-hidden>
          <svg className="note note--1" viewBox="0 0 24 24" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 17V5l11-2v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="17" r="3" fill="currentColor"/>
          </svg>
          <svg className="note note--2" viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 13V3l8-1v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="18" cy="15" r="2.2" fill="currentColor"/>
          </svg>
          <svg className="dot dot--1" viewBox="0 0 10 10" width="8" height="8" xmlns="http://www.w3.org/2000/svg">
            <circle cx="5" cy="5" r="5" fill="currentColor"/>
          </svg>
          <svg className="dot dot--2" viewBox="0 0 10 10" width="6" height="6" xmlns="http://www.w3.org/2000/svg">
            <circle cx="5" cy="5" r="5" fill="currentColor"/>
          </svg>
        </div>

        <div className="hero-inner">
          <div className="hero-left" role="region" aria-labelledby="main-title">
            <div className="badge">Gratis fællesskabsdag</div>
            <h1 id="main-title" className="title">Spjellerup Musikfestival 2026</h1>
            <p className="subtitle">Musik · fællesskab · show · humor</p>

            <div className="meta">
              <div className="date">Torsdag d. 04. juni 2026</div>
              <div className="time">Start kl. 11.00 · Spjellerupvej 33, 4640 Faxe</div>
            </div>

            <p className="intro">
              Kom og vær med til en fantastisk dag, når skolegården forvandles til et festligt festivalområde med musik,
              sjove boder, lækker mad og den bedste stemning.
            </p>

            <div className="cta-row">
              <a className="btn primary" href="#program">Se program</a>
              <button className="btn outline" onClick={() => setIsOpen(true)}>Se plakat</button>
              <a className="btn download" href={posterFile} download="spjellerup-musikfestival-2026.png">Download plakat</a>
            </div>
          </div>

          <div className="hero-right">
            <div
              className="poster-card"
              role="button"
              tabIndex={0}
              onClick={() => setIsOpen(true)}
              onKeyDown={(e) => { if ((e as React.KeyboardEvent).key === 'Enter') setIsOpen(true) }}
              aria-label="Åbn plakat i stor visning"
            >
              <img src={posterFile} alt="Spjellerup Musikfestival plakat 2026" />
              <div className="poster-label">Klik for stor visning</div>
            </div>
          </div>
        </div>

        <div className="hero-bg" aria-hidden></div>
      </header>

      <main className="container">
        <section id="velkommen" className="section welcome">
          <h2>Velkommen</h2>
          <p>
            Kom og vær med til en fantastisk dag, når skolegården forvandles til et festligt festivalområde med musik,
            sjove boder, lækker mad og den bedste stemning.
          </p>
        </section>

        <section id="program" className="section program">
          <h2>Program</h2>
          <div className="program-card">
            <ul className="schedule">
              <li><span className="time">11.00</span> — Festivalen åbner</li>
              <li><span className="time">11.15</span> — Musik og fællessang</li>
              <li><span className="time">12.00</span> — Boder, mad og aktiviteter</li>
              <li><span className="time">13.00</span> — Show, optrædener og overraskelser</li>
              <li><span className="time">14.00</span> — Tak for i dag</li>
            </ul>
          </div>
        </section>

        <section id="praktisk" className="section practical">
          <h2>Praktisk info</h2>
          <ul>
            <li>Dato: Torsdag d. 04. juni 2026</li>
            <li>Tid: Start kl. 11.00</li>
            <li>Sted: Spjellerupvej 33, 4640 Faxe</li>
            <li>Husk godt humør — mere program følger</li>
          </ul>
        </section>

        <section id="kontakt" className="section contact">
          <h2>Kontakt / mere info</h2>
          <p>
            For spørgsmål: <a href="mailto:kontakt@spjellerupmusikfestival.dk">kontakt@spjellerupmusikfestival.dk</a>
          </p>
        </section>
      </main>

      <footer className="footer">
        <p>Spjellerup Musikfestival — Musik, fællesskab og humor</p>
      </footer>

      {isOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-label="Plakat stor visning">
            <button className="modal-close" onClick={() => setIsOpen(false)} aria-label="Luk">✕</button>
            <img src={posterFile} alt="Spjellerup Musikfestival plakat 2026" />
            <a className="btn download" href={posterFile} download="spjellerup-musikfestival-2026.png">Download</a>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
