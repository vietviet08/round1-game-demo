import { useState, useCallback, useRef, useEffect } from 'react'

interface Point {
  id: number
  x: number
  y: number
  size: number
}

type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

function App() {
  const [points, setPoints] = useState(10)
  const [circles, setCircles] = useState<Point[]>([])
  const [currentNumber, setCurrentNumber] = useState(1)
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle')
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [clickedCircles, setClickedCircles] = useState<Set<number>>(new Set())
  const [isAutoPlay, setIsAutoPlay] = useState(false)

  const gameBoardRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)
  const autoPlayRef = useRef<number | null>(null)

  useEffect(() => {
    if (gameStatus === 'playing' && startTime) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000)
      }, 100)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameStatus, startTime])

  useEffect(() => {
    if (isAutoPlay && gameStatus === 'playing') {
      autoPlayRef.current = window.setInterval(() => {
        setCurrentNumber(prev => {
          if (prev <= points) {
            setClickedCircles(prevClicked => {
              const newClicked = new Set(prevClicked)
              newClicked.add(prev)
              return newClicked
            })
            
            if (prev === points) {
              setGameStatus('won')
              setIsAutoPlay(false)
              if (timerRef.current) clearInterval(timerRef.current)
              if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current)
                autoPlayRef.current = null
              }
              return prev
            }
            
            return prev + 1
          }
          return prev
        })
      }, 1000)
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
        autoPlayRef.current = null
      }
    }
  }, [isAutoPlay, gameStatus, points])

  const generateCircles = useCallback((count: number) => {
    if (!gameBoardRef.current) return []

    const board = gameBoardRef.current.getBoundingClientRect()
    const newCircles: Point[] = []
    const padding = 40
    const size = 50
    const maxAttempts = 100

    for (let i = 1; i <= count; i++) {
      let placed = false
      let attempts = 0

      while (!placed && attempts < maxAttempts) {
        const x = Math.random() * (board.width - size - padding * 2) + padding
        const y = Math.random() * (board.height - size - padding * 2) + padding

        const overlaps = newCircles.some(circle => {
          const dx = x - circle.x
          const dy = y - circle.y
          return Math.hypot(dx, dy) < size + 10
        })

        if (!overlaps) {
          newCircles.push({ id: i, x, y, size })
          placed = true
        }
        attempts++
      }

      if (!placed) {
        const x = Math.random() * (board.width - size - padding * 2) + padding
        const y = Math.random() * (board.height - size - padding * 2) + padding
        newCircles.push({ id: i, x, y, size })
      }
    }

    return newCircles
  }, [])

  const handlePlay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
      autoPlayRef.current = null
    }
    setIsAutoPlay(false)

    const newCircles = generateCircles(points)
    setCircles(newCircles)
    setCurrentNumber(1)
    setGameStatus('playing')
    setStartTime(Date.now())
    setElapsedTime(0)
    setClickedCircles(new Set())
  }

  const handleCircleClick = useCallback((id: number) => {
    if (gameStatus !== 'playing') return

    if (id === currentNumber) {
      const newClicked = new Set(clickedCircles)
      newClicked.add(id)
      setClickedCircles(newClicked)

      if (currentNumber === points) {
        setGameStatus('won')
        setIsAutoPlay(false)
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current)
          autoPlayRef.current = null
        }
      } else {
        setCurrentNumber(prev => prev + 1)
      }
    } else {
      setGameStatus('lost')
      setIsAutoPlay(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
        autoPlayRef.current = null
      }
    }
  }, [gameStatus, currentNumber, points, clickedCircles])

  const handleToggleAutoPlay = () => {
    if (isAutoPlay) {
      setIsAutoPlay(false)
    } else {
      setIsAutoPlay(true)
    }
  }

  const getTitle = () => {
    switch (gameStatus) {
      case 'won': return 'ALL CLEARED'
      case 'lost': return 'GAME OVER'
      default: return "LET'S PLAY"
    }
  }

  const isPlaying = gameStatus === 'playing'

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen bg-gray-100">
      <div className="flex flex-col gap-3 p-4 bg-white rounded-lg shadow-md self-start">
        <h1 className="text-2xl font-bold text-center text-black">{getTitle()}</h1>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Points:</span>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            disabled={isPlaying}
            min={1}
            max={100}
            className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded disabled:bg-gray-200"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Time:</span>
          <span className="text-sm font-semibold tabular-nums min-w-12">{elapsedTime.toFixed(1)}s</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePlay}
            className="px-5 py-2 text-sm font-medium text-white bg-black rounded hover:bg-gray-800"
          >
            {isPlaying ? 'Restart' : 'Play'}
          </button>
          
          {isPlaying && (
            <button
              onClick={handleToggleAutoPlay}
              className={`px-5 py-2 text-sm font-medium rounded ${
                isAutoPlay
                  ? 'text-white bg-red-500 hover:bg-red-600'
                  : 'text-black bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {isAutoPlay ? 'Stop Auto' : 'Auto Play'}
            </button>
          )}
        </div>
      </div>

      <div ref={gameBoardRef} className="w-[500px] h-[350px] bg-white rounded-lg shadow-md relative overflow-hidden">
        {circles.map(circle => {
          const isClicked = clickedCircles.has(circle.id)
          return (
            <div
              key={circle.id}
              onClick={() => handleCircleClick(circle.id)}
              className={`absolute flex items-center justify-center rounded-full text-white font-semibold cursor-pointer transition-all duration-150 ${
                isClicked
                  ? 'bg-green-500 cursor-default opacity-50 scale-90'
                  : 'bg-black hover:bg-gray-700 hover:scale-110'
              }`}
              style={{
                left: circle.x,
                top: circle.y,
                width: circle.size,
                height: circle.size,
                fontSize: 16,
              }}
            >
              {circle.id}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default App
