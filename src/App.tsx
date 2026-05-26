import React, { useEffect, useRef, useState } from 'react'

import { FestivalLegalPage, FestivalMemoriesDesktopPage, FestivalMemoriesPage } from './festivalMemories'

const posterFile = '/plakatspjellerup.png'

type AppLocationState = {
  pathname: string
}

type FestivalGameRoute = 'dashboard' | 'quiz' | 'type' | 'bingo'

type FestivalQuizOption = {
  id: string
  text: string
  isCorrect: boolean
}

type FestivalQuizQuestion = {
  id: string
  question: string
  options: FestivalQuizOption[]
}

type FestivalTypeKey = 'Musikmesteren' | 'Bodbossen' | 'Stemningsskaberen' | 'Scenelegenden'

type FestivalTypeQuestion = {
  question: string
  options: Array<{
    text: string
    type: FestivalTypeKey
  }>
}

const festivalQuizSource = [
  {
    id: 'purpose',
    question: 'Hvad er typisk formålet med en musikfestival?',
    correct: 'At samle mennesker om musik og oplevelser',
    wrong: ['At holde eksamen', 'At sælge skolebøger'],
  },
  {
    id: 'program',
    question: 'Hvad betyder det, at en festival har et program?',
    correct: 'En liste over optrædener og aktiviteter',
    wrong: ['En computerkode', 'En madopskrift'],
  },
  {
    id: 'soundcheck',
    question: 'Hvorfor er lydprøver vigtige før en koncert?',
    correct: 'Så lyden passer til stedet og musikerne',
    wrong: ['Så publikum kan gå tidligere hjem', 'Så scenen kan blive mørkere'],
  },
  {
    id: 'volunteer',
    question: 'Hvad er en frivillig på en festival?',
    correct: 'En person der hjælper uden nødvendigvis at få løn',
    wrong: ['En person der altid spiller guitar', 'En person der bestemmer vejret'],
  },
  {
    id: 'lineup',
    question: 'Hvad betyder “line-up” på en festival?',
    correct: 'Listen over kunstnere eller optrædende',
    wrong: ['Køen til toilettet', 'En slags scenelys'],
  },
  {
    id: 'access',
    question: 'Hvorfor bruger festivaler ofte armbånd eller billetter?',
    correct: 'For at vise hvem der har adgang',
    wrong: ['For at måle hvor højt folk synger', 'For at vælge musikgenre'],
  },
  {
    id: 'guest',
    question: 'Hvad er en god festivalgæst?',
    correct: 'En der viser hensyn, passer på stedet og bidrager til god stemning',
    wrong: ['En der råber under alle sange', 'En der efterlader affald overalt'],
  },
  {
    id: 'food',
    question: 'Hvorfor har festivaler ofte madboder?',
    correct: 'Fordi gæsterne er der i længere tid og skal kunne købe mad og drikke',
    wrong: ['Fordi musikere ikke kan spille uden pizza', 'Fordi scenen ellers bliver for tom'],
  },
  {
    id: 'sustainable',
    question: 'Hvad kan gøre en festival mere bæredygtig?',
    correct: 'Affaldssortering, genbrug og mindre madspild',
    wrong: ['Flere engangskrus overalt', 'At slukke al musik'],
  },
  {
    id: 'community',
    question: 'Hvad betyder fællesskab på en festival?',
    correct: 'At man oplever noget sammen og tager hensyn til hinanden',
    wrong: ['At alle skal høre præcis samme sang alene', 'At kun én person må være med'],
  },
] as const

const festivalTypeOrder: FestivalTypeKey[] = [
  'Musikmesteren',
  'Bodbossen',
  'Stemningsskaberen',
  'Scenelegenden',
]

const festivalTypeDescriptions: Record<FestivalTypeKey, string> = {
  Musikmesteren: 'Du lever for stærke hooks, gode rytmer og det øjeblik, hvor hele pladsen synger med.',
  Bodbossen: 'Du ved, at festivalhygge også handler om snacks, små pauser og de bedste spots mellem oplevelserne.',
  Stemningsskaberen: 'Du gør dagen sjovere for alle omkring dig og løfter stemningen, uden at det føles anstrengt.',
  Scenelegenden: 'Du elsker show, store indgange og alt det, der får scenen til at føles som noget særligt.',
}

const festivalTypeQuestions: FestivalTypeQuestion[] = [
  {
    question: 'Hvad glæder du dig mest til?',
    options: [
      { text: 'Musikken', type: 'Musikmesteren' },
      { text: 'Mad og boder', type: 'Bodbossen' },
      { text: 'At være sammen med andre', type: 'Stemningsskaberen' },
      { text: 'Shows og optrædener', type: 'Scenelegenden' },
    ],
  },
  {
    question: 'Hvis du skulle hjælpe til på festivalen, hvad ville du vælge?',
    options: [
      { text: 'Styre musikken', type: 'Musikmesteren' },
      { text: 'Passe en bod', type: 'Bodbossen' },
      { text: 'Tage imod gæster', type: 'Stemningsskaberen' },
      { text: 'Præsentere på scenen', type: 'Scenelegenden' },
    ],
  },
  {
    question: 'Hvad lægger du mest mærke til?',
    options: [
      { text: 'Lyden', type: 'Musikmesteren' },
      { text: 'Duften af mad', type: 'Bodbossen' },
      { text: 'Stemningen', type: 'Stemningsskaberen' },
      { text: 'Scenen og lyset', type: 'Scenelegenden' },
    ],
  },
  {
    question: 'Hvad ville du tage med til en festival?',
    options: [
      { text: 'En playliste', type: 'Musikmesteren' },
      { text: 'Snacks', type: 'Bodbossen' },
      { text: 'Venner', type: 'Stemningsskaberen' },
      { text: 'En mikrofon', type: 'Scenelegenden' },
    ],
  },
  {
    question: 'Hvad er vigtigst for en god festival?',
    options: [
      { text: 'God musik', type: 'Musikmesteren' },
      { text: 'Gode boder', type: 'Bodbossen' },
      { text: 'God stemning', type: 'Stemningsskaberen' },
      { text: 'Gode optrædener', type: 'Scenelegenden' },
    ],
  },
]

const festivalBingoItems = [
  'Find en der synger',
  'Se nogen danse',
  'Find en bod',
  'Hør musik',
  'Giv en highfive',
  'Se noget gult',
  'Find festivalplakaten',
  'Smil til en ven',
  'Sig “god festival”',
]

const getCurrentLocationState = (): AppLocationState => {
  if (typeof window === 'undefined') {
    return { pathname: '/' }
  }

  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'

  return {
    pathname: normalizedPath === '' ? '/' : normalizedPath,
  }
}

const getFestivalGameRoute = (pathname: string): FestivalGameRoute | null => {
  if (pathname === '/spil') return 'dashboard'
  if (pathname === '/spil/quiz') return 'quiz'
  if (pathname === '/spil/type') return 'type'
  if (pathname === '/spil/bingo') return 'bingo'
  if (pathname.startsWith('/spil/')) return 'dashboard'
  return null
}

const getIsDesktopViewport = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(min-width: 900px)').matches
}

const getPrefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const shuffleArray = <T,>(items: readonly T[]): T[] => {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]]
  }

  return copy
}

const buildFestivalQuizQuestions = (): FestivalQuizQuestion[] => (
  festivalQuizSource.map((item) => ({
    id: item.id,
    question: item.question,
    options: shuffleArray([
      { id: `${item.id}-correct`, text: item.correct, isCorrect: true },
      { id: `${item.id}-wrong-1`, text: item.wrong[0], isCorrect: false },
      { id: `${item.id}-wrong-2`, text: item.wrong[1], isCorrect: false },
    ]),
  }))
)

const getFestivalQuizTitle = (score: number): string => {
  if (score <= 3) return 'Festivalspire'
  if (score <= 6) return 'Stemningsskaber'
  if (score <= 8) return 'Scenehelt'
  return 'Festivalekspert'
}

const getFestivalTypeResult = (scores: Record<FestivalTypeKey, number>): FestivalTypeKey => (
  festivalTypeOrder.reduce((bestType, currentType) => (
    scores[currentType] > scores[bestType] ? currentType : bestType
  ), festivalTypeOrder[0])
)

const FestivalQuiz: React.FC = () => {
  const [questions, setQuestions] = useState<FestivalQuizQuestion[]>(() => buildFestivalQuizQuestions())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const currentQuestion = questions[currentIndex]

  if (!currentQuestion) return null

  const handleAnswer = (option: FestivalQuizOption) => {
    if (selectedOptionId) return

    setSelectedOptionId(option.id)

    if (option.isCorrect) {
      setScore((currentScore) => currentScore + 1)
    }
  }

  const handleNext = () => {
    if (!selectedOptionId) return

    if (currentIndex === questions.length - 1) {
      setIsComplete(true)
      return
    }

    setCurrentIndex((index) => index + 1)
    setSelectedOptionId(null)
  }

  const resetQuiz = () => {
    setQuestions(buildFestivalQuizQuestions())
    setCurrentIndex(0)
    setSelectedOptionId(null)
    setScore(0)
    setIsComplete(false)
  }

  if (isComplete) {
    return (
      <div className="quiz-wrap">
        <div className="quiz-header">{getFestivalQuizTitle(score)}</div>
        <p className="type-desc">Du fik {score} ud af {questions.length} rigtige.</p>
        <button className="btn primary" onClick={resetQuiz} type="button">Prøv igen</button>
      </div>
    )
  }

  return (
    <div className="quiz-wrap">
      <div className="quiz-header">Spørgsmål {currentIndex + 1} / {questions.length}</div>
      <p className="quiz-question">{currentQuestion.question}</p>

      <div className="quiz-choices">
        {currentQuestion.options.map((option) => {
          let stateClass = ''

          if (selectedOptionId) {
            if (option.isCorrect) {
              stateClass = ' correct'
            } else if (option.id === selectedOptionId) {
              stateClass = ' wrong'
            }
          }

          return (
            <button
              key={option.id}
              className={`quiz-choice${stateClass}`}
              onClick={() => handleAnswer(option)}
              disabled={Boolean(selectedOptionId)}
              type="button"
              aria-pressed={option.id === selectedOptionId}
            >
              {option.text}
            </button>
          )
        })}
      </div>

      <div className="quiz-actions">
        <button className="btn primary" onClick={handleNext} disabled={!selectedOptionId} type="button">
          {currentIndex === questions.length - 1 ? 'Se resultat' : 'Næste spørgsmål'}
        </button>
      </div>
    </div>
  )
}

const FestivalTypeTest: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scores, setScores] = useState<Record<FestivalTypeKey, number>>({
    Musikmesteren: 0,
    Bodbossen: 0,
    Stemningsskaberen: 0,
    Scenelegenden: 0,
  })
  const [result, setResult] = useState<FestivalTypeKey | null>(null)

  const currentQuestion = festivalTypeQuestions[currentIndex]

  if (!currentQuestion && !result) return null

  const handleAnswer = (type: FestivalTypeKey) => {
    const nextScores = {
      ...scores,
      [type]: scores[type] + 1,
    }

    setScores(nextScores)

    if (currentIndex === festivalTypeQuestions.length - 1) {
      setResult(getFestivalTypeResult(nextScores))
      return
    }

    setCurrentIndex((index) => index + 1)
  }

  const resetTest = () => {
    setCurrentIndex(0)
    setScores({
      Musikmesteren: 0,
      Bodbossen: 0,
      Stemningsskaberen: 0,
      Scenelegenden: 0,
    })
    setResult(null)
  }

  if (result) {
    return (
      <div className="type-wrap">
        <div className="type-title">{result}</div>
        <p className="type-desc">{festivalTypeDescriptions[result]}</p>
        <button className="btn primary" onClick={resetTest} type="button">Prøv igen</button>
      </div>
    )
  }

  return (
    <div className="type-wrap">
      <div className="quiz-header">Spørgsmål {currentIndex + 1} / {festivalTypeQuestions.length}</div>
      <p className="type-question">{currentQuestion.question}</p>

      <div className="type-options">
        {currentQuestion.options.map((option) => (
          <button
            key={`${currentQuestion.question}-${option.text}`}
            className="quiz-choice"
            onClick={() => handleAnswer(option.type)}
            type="button"
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  )
}

const FestivalBingo: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState<string[]>([])

  const toggleItem = (item: string) => {
    setCheckedItems((currentItems) => (
      currentItems.includes(item)
        ? currentItems.filter((currentItem) => currentItem !== item)
        : [...currentItems, item]
    ))
  }

  const resetBingo = () => setCheckedItems([])
  const hasBingo = checkedItems.length === festivalBingoItems.length

  return (
    <div className="bingo-wrap">
      <div className="quiz-header">Sæt kryds, når du spotter noget med festivalstemning.</div>

      <div className="bingo-grid">
        {festivalBingoItems.map((item) => {
          const isChecked = checkedItems.includes(item)

          return (
            <button
              key={item}
              className={`bingo-cell${isChecked ? ' checked' : ''}`}
              onClick={() => toggleItem(item)}
              type="button"
              aria-pressed={isChecked}
            >
              {item}
            </button>
          )
        })}
      </div>

      {hasBingo && <div className="bingo-winner">BINGO! Du er klar til festivalstemning.</div>}

      <button className="btn primary" onClick={resetBingo} type="button">Nulstil</button>
    </div>
  )
}

const FestivalGamesDesktopNotice: React.FC<{
  onBackHome: () => void
}> = ({ onBackHome }) => (
  <main className="games-page">
    <div className="games-page__shell">
      <button className="btn outline games-page__back" onClick={onBackHome} type="button">
        Tilbage til forsiden
      </button>

      <section className="games-page__hero">
        <div className="badge">Mobiloplevelse</div>
        <h1 className="games-page__title">Festivalspil</h1>
        <p className="games-page__lead">Små aktiviteter til mobilen før eller under festivalen.</p>
      </section>

      <section className="games-page__panel games-page__panel--notice">
        <div className="games-page__status">Desktop</div>
        <h2>Festivalspillene er lavet til mobil.</h2>
        <p>Åbn siden på din telefon for den bedste oplevelse.</p>
      </section>
    </div>
  </main>
)

const FestivalGamesDashboardCard: React.FC<{
  label: string
  title: string
  text: string
  cta: string
  onOpen: () => void
}> = ({ label, title, text, cta, onOpen }) => (
  <article className="games-dashboard__card">
    <div className="games-dashboard__label">{label}</div>
    <h2 className="games-dashboard__title">{title}</h2>
    <p className="games-dashboard__text">{text}</p>
    <button className="btn primary games-dashboard__cta" onClick={onOpen} type="button">
      {cta}
    </button>
  </article>
)

const FestivalGamesDashboard: React.FC<{
  onBackHome: () => void
  onOpenQuiz: () => void
  onOpenType: () => void
  onOpenBingo: () => void
}> = ({ onBackHome, onOpenQuiz, onOpenType, onOpenBingo }) => (
  <main className="games-page">
    <div className="games-page__shell">
      <button className="btn outline games-page__back" onClick={onBackHome} type="button">
        Tilbage til forsiden
      </button>

      <section className="games-page__hero">
        <div className="badge">Mobiloplevelse</div>
        <h1 className="games-page__title">Festivalspil</h1>
        <p className="games-page__lead">Vælg en aktivitet</p>
      </section>

      <section className="games-page__panel games-page__panel--dashboard">
        {/* TODO: Tilføj tidsstyring for Festivalspil tættere på festivaldagen, fx 4. juni 2026 kl. 10.30–14.30. */}
        <div className="games-dashboard__grid">
          <FestivalGamesDashboardCard
            label="10 spørgsmål"
            title="Festivalquiz"
            text="Test din festivalviden med 10 spørgsmål."
            cta="Start quiz"
            onOpen={onOpenQuiz}
          />

          <FestivalGamesDashboardCard
            label="5 spørgsmål"
            title="Hvilken festivaltype er du?"
            text="Find ud af om du er Musikmesteren, Bodbossen, Stemningsskaberen eller Scenelegenden."
            cta="Find min type"
            onOpen={onOpenType}
          />

          <FestivalGamesDashboardCard
            label="3 x 3 plade"
            title="Festival-bingo"
            text="Kryds ting af, når du spotter festivalstemning."
            cta="Start bingo"
            onOpen={onOpenBingo}
          />
        </div>
      </section>
    </div>
  </main>
)

const FestivalGameScreen: React.FC<{
  title: string
  onBackToMenu: () => void
  children: React.ReactNode
}> = ({ title, onBackToMenu, children }) => (
  <main className="games-page">
    <div className="games-page__shell">
      <header className="games-topbar">
        <button className="btn outline games-topbar__back" onClick={onBackToMenu} type="button">
          Tilbage til spilmenu
        </button>
        <div className="games-topbar__meta">Festivalspil</div>
        <h1 className="games-topbar__title">{title}</h1>
      </header>

      <section className="games-page__panel games-page__panel--game">
        <div className="game-card game-card--screen">
          {children}
        </div>
      </section>
    </div>
  </main>
)

const FestivalQuizPage: React.FC<{
  onBackToMenu: () => void
}> = ({ onBackToMenu }) => {
  const [questions, setQuestions] = useState<FestivalQuizQuestion[]>(() => buildFestivalQuizQuestions())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const currentQuestion = questions[currentIndex]
  const progressPercent = ((currentIndex + 1) / questions.length) * 100

  if (!currentQuestion) return null

  const handleAnswer = (option: FestivalQuizOption) => {
    if (selectedOptionId) return

    setSelectedOptionId(option.id)

    if (option.isCorrect) {
      setScore((currentScore) => currentScore + 1)
    }
  }

  const handleNext = () => {
    if (!selectedOptionId) return

    if (currentIndex === questions.length - 1) {
      setIsComplete(true)
      return
    }

    setCurrentIndex((index) => index + 1)
    setSelectedOptionId(null)
  }

  const resetQuiz = () => {
    setQuestions(buildFestivalQuizQuestions())
    setCurrentIndex(0)
    setSelectedOptionId(null)
    setScore(0)
    setIsComplete(false)
  }

  return (
    <FestivalGameScreen title="Festivalquiz" onBackToMenu={onBackToMenu}>
      {isComplete ? (
        <div className="quiz-wrap">
          <div className="game-result-card">
            <div className="game-result-card__label">Dit resultat</div>
            <div className="game-result-card__title">{getFestivalQuizTitle(score)}</div>
            <p className="game-result-card__text">Du fik {score} ud af {questions.length} rigtige.</p>
          </div>

          <div className="game-actions">
            <button className="btn primary" onClick={resetQuiz} type="button">Prøv igen</button>
            <button className="btn game-secondary" onClick={onBackToMenu} type="button">Tilbage til spilmenu</button>
          </div>
        </div>
      ) : (
        <div className="quiz-wrap">
          <div className="game-progress">
            <div className="game-progress__row">
              <span>Spørgsmål {currentIndex + 1} / {questions.length}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="game-progress__bar" aria-hidden="true">
              <div className="game-progress__fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          <p className="quiz-question">{currentQuestion.question}</p>

          <div className="quiz-choices">
            {currentQuestion.options.map((option) => {
              let stateClass = ''

              if (selectedOptionId) {
                if (option.isCorrect) {
                  stateClass = ' correct'
                } else if (option.id === selectedOptionId) {
                  stateClass = ' wrong'
                }
              }

              return (
                <button
                  key={option.id}
                  className={`quiz-choice${stateClass}`}
                  onClick={() => handleAnswer(option)}
                  disabled={Boolean(selectedOptionId)}
                  type="button"
                  aria-pressed={option.id === selectedOptionId}
                >
                  {option.text}
                </button>
              )
            })}
          </div>

          <div className="quiz-actions">
            <button className="btn primary" onClick={handleNext} disabled={!selectedOptionId} type="button">
              {currentIndex === questions.length - 1 ? 'Se resultat' : 'Næste spørgsmål'}
            </button>
          </div>
        </div>
      )}
    </FestivalGameScreen>
  )
}

const FestivalTypePage: React.FC<{
  onBackToMenu: () => void
}> = ({ onBackToMenu }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scores, setScores] = useState<Record<FestivalTypeKey, number>>({
    Musikmesteren: 0,
    Bodbossen: 0,
    Stemningsskaberen: 0,
    Scenelegenden: 0,
  })
  const [result, setResult] = useState<FestivalTypeKey | null>(null)

  const currentQuestion = festivalTypeQuestions[currentIndex]
  const progressPercent = ((currentIndex + 1) / festivalTypeQuestions.length) * 100

  if (!currentQuestion && !result) return null

  const handleAnswer = (type: FestivalTypeKey) => {
    const nextScores = {
      ...scores,
      [type]: scores[type] + 1,
    }

    setScores(nextScores)

    if (currentIndex === festivalTypeQuestions.length - 1) {
      setResult(getFestivalTypeResult(nextScores))
      return
    }

    setCurrentIndex((index) => index + 1)
  }

  const resetTest = () => {
    setCurrentIndex(0)
    setScores({
      Musikmesteren: 0,
      Bodbossen: 0,
      Stemningsskaberen: 0,
      Scenelegenden: 0,
    })
    setResult(null)
  }

  return (
    <FestivalGameScreen title="Festivaltype" onBackToMenu={onBackToMenu}>
      {result ? (
        <div className="type-wrap">
          <div className="game-result-card">
            <div className="game-result-card__label">Din festivaltype</div>
            <div className="game-result-card__title">{result}</div>
            <p className="game-result-card__text">{festivalTypeDescriptions[result]}</p>
          </div>

          <div className="game-actions">
            <button className="btn primary" onClick={resetTest} type="button">Prøv igen</button>
            <button className="btn game-secondary" onClick={onBackToMenu} type="button">Tilbage til spilmenu</button>
          </div>
        </div>
      ) : (
        <div className="type-wrap">
          <div className="game-progress">
            <div className="game-progress__row">
              <span>Spørgsmål {currentIndex + 1} / {festivalTypeQuestions.length}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="game-progress__bar" aria-hidden="true">
              <div className="game-progress__fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          <p className="type-question">{currentQuestion.question}</p>

          <div className="type-options">
            {currentQuestion.options.map((option) => (
              <button
                key={`${currentQuestion.question}-${option.text}`}
                className="quiz-choice"
                onClick={() => handleAnswer(option.type)}
                type="button"
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </FestivalGameScreen>
  )
}

const FestivalBingoPage: React.FC<{
  onBackToMenu: () => void
}> = ({ onBackToMenu }) => {
  const [checkedItems, setCheckedItems] = useState<string[]>([])
  const hasBingo = checkedItems.length === festivalBingoItems.length

  const toggleItem = (item: string) => {
    setCheckedItems((currentItems) => (
      currentItems.includes(item)
        ? currentItems.filter((currentItem) => currentItem !== item)
        : [...currentItems, item]
    ))
  }

  const resetBingo = () => setCheckedItems([])

  return (
    <FestivalGameScreen title="Festival-bingo" onBackToMenu={onBackToMenu}>
      <div className="bingo-wrap">
        <p className="quiz-question">Kryds ting af, når du spotter festivalstemning.</p>

        <div className="bingo-grid">
          {festivalBingoItems.map((item) => {
            const isChecked = checkedItems.includes(item)

            return (
              <button
                key={item}
                className={`bingo-cell${isChecked ? ' checked' : ''}`}
                onClick={() => toggleItem(item)}
                type="button"
                aria-pressed={isChecked}
              >
                {item}
              </button>
            )
          })}
        </div>

        {hasBingo && <div className="bingo-winner">BINGO! Du er klar til festivalstemning.</div>}

        <div className="bingo-actions">
          <button className="btn primary" onClick={resetBingo} type="button">Nulstil</button>
          <button className="btn game-secondary" onClick={onBackToMenu} type="button">Tilbage til spilmenu</button>
        </div>
      </div>
    </FestivalGameScreen>
  )
}

const App: React.FC = () => {
  const [locationState, setLocationState] = useState<AppLocationState>(() => getCurrentLocationState())
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() => getIsDesktopViewport())
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => getPrefersReducedMotion())
  const [isOpen, setIsOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [soundOn, setSoundOn] = useState(false)

  const gameRoute = getFestivalGameRoute(locationState.pathname)
  const isGamesRoute = gameRoute !== null
  const isMemoriesRoute = locationState.pathname === '/minder'
  const isLegalRoute = locationState.pathname === '/jura'

  const stopIntroMedia = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    } catch (err) {
      // ignore
    }

    try {
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
        videoRef.current.muted = true
      }
    } catch (err) {
      // ignore
    }

    setSoundOn(false)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (isOpen || showIntro) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, showIntro])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncLocation = () => setLocationState(getCurrentLocationState())
    window.addEventListener('popstate', syncLocation)

    return () => window.removeEventListener('popstate', syncLocation)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const desktopQuery = window.matchMedia('(min-width: 900px)')
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMedia = () => {
      setIsDesktopViewport(desktopQuery.matches)
      setPrefersReducedMotion(reducedMotionQuery.matches)
    }

    syncMedia()

    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', syncMedia)
      reducedMotionQuery.addEventListener('change', syncMedia)

      return () => {
        desktopQuery.removeEventListener('change', syncMedia)
        reducedMotionQuery.removeEventListener('change', syncMedia)
      }
    }

    desktopQuery.addListener(syncMedia)
    reducedMotionQuery.addListener(syncMedia)

    return () => {
      desktopQuery.removeListener(syncMedia)
      reducedMotionQuery.removeListener(syncMedia)
    }
  }, [])

  useEffect(() => {
    if (isGamesRoute || isMemoriesRoute || isLegalRoute) {
      setShowIntro(false)
      setIsOpen(false)
      stopIntroMedia()
      return
    }

    if (isDesktopViewport && !prefersReducedMotion) {
      setShowIntro(true)
    } else {
      setShowIntro(false)
    }
  }, [isGamesRoute, isMemoriesRoute, isLegalRoute, isDesktopViewport, prefersReducedMotion])

  const navigateTo = (path: string) => {
    if (typeof window === 'undefined') return

    const currentLocation = getCurrentLocationState()

    if (currentLocation.pathname === path) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      return
    }

    stopIntroMedia()
    setShowIntro(false)
    setIsOpen(false)
    window.history.pushState({}, '', path)
    setLocationState(getCurrentLocationState())
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }

  const toggleSound = async () => {
    const video = videoRef.current
    const audio = audioRef.current

    if (!video || !audio) return

    if (!soundOn) {
      try {
        video.muted = false
        video.volume = 0.15
        audio.volume = 1.0
        const playPromise = audio.play()

        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.catch(() => {})
        }

        setSoundOn(true)
      } catch (err) {
        console.warn('Could not start audio', err)
      }
    } else {
      try {
        audio.pause()
      } catch (err) {
        // ignore
      }

      video.muted = true
      setSoundOn(false)
    }
  }

  const enterSite = () => {
    setShowIntro(false)
    stopIntroMedia()

    setTimeout(() => {
      const el = document.getElementById('hero')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 60)
  }

  const goToProgram = () => {
    setShowIntro(false)
    stopIntroMedia()

    setTimeout(() => {
      const el = document.getElementById('program')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 60)
  }

  if (gameRoute) {
    if (isDesktopViewport) {
      return <FestivalGamesDesktopNotice onBackHome={() => navigateTo('/')} />
    }

    if (gameRoute === 'dashboard') {
      return (
        <FestivalGamesDashboard
          onBackHome={() => navigateTo('/')}
          onOpenQuiz={() => navigateTo('/spil/quiz')}
          onOpenType={() => navigateTo('/spil/type')}
          onOpenBingo={() => navigateTo('/spil/bingo')}
        />
      )
    }

    if (gameRoute === 'quiz') {
      return <FestivalQuizPage onBackToMenu={() => navigateTo('/spil')} />
    }

    if (gameRoute === 'type') {
      return <FestivalTypePage onBackToMenu={() => navigateTo('/spil')} />
    }

    return <FestivalBingoPage onBackToMenu={() => navigateTo('/spil')} />
  }

  if (isMemoriesRoute) {
    if (isDesktopViewport) {
      return (
        <FestivalMemoriesDesktopPage
          onBackHome={() => navigateTo('/')}
          onOpenLegal={() => navigateTo('/jura')}
        />
      )
    }

    return (
      <FestivalMemoriesPage
        onBackHome={() => navigateTo('/')}
        onOpenLegal={() => navigateTo('/jura')}
      />
    )
  }

  if (isLegalRoute) {
    return <FestivalLegalPage onBackToMemories={() => navigateTo('/minder')} />
  }

  return (
    <div className="app">
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
          <audio ref={audioRef} src="/festival-voiceover.mp3" preload="none" />

          <div className="intro-overlay">
            <div className="intro-content">
              <div className="badge intro-badge">Gratis fællesskabsdag</div>
              <h1 className="intro-title">Spjellerup Musikfestival 2026</h1>
              <p className="intro-sub">Musik · fællesskab · show · humor</p>
              <div className="intro-meta">Torsdag d. 04. juni 2026 • Start kl. 11.00</div>

              <div className="intro-ctas">
                <button className="btn primary large" onClick={enterSite} type="button">Gå ind på siden</button>
                <button className="btn outline large" onClick={goToProgram} type="button">Se program</button>
                <button
                  className="btn outline large sound-toggle"
                  onClick={toggleSound}
                  aria-pressed={soundOn}
                  aria-label={soundOn ? 'Slå lyd fra' : 'Slå lyd til'}
                  type="button"
                >
                  {soundOn ? 'Slå lyd fra' : 'Slå lyd til'}
                </button>
              </div>
            </div>
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
              <button className="btn outline hero-memories-cta desktop-only" onClick={() => navigateTo('/minder')} type="button">
                Se billeder fra festivalen
              </button>
              <button className="btn outline desktop-only" onClick={() => setIsOpen(true)} type="button">Se plakat</button>
              <a className="btn download desktop-only" href={posterFile} download="spjellerup-musikfestival-2026.png">Download plakat</a>
              <button className="btn primary mobile-only" onClick={() => navigateTo('/spil')} type="button">Prøv festivalspil</button>
              <button className="btn outline mobile-only" onClick={() => navigateTo('/minder')} type="button">Festivalminder</button>
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
