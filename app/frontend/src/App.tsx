import "./App.css"
import { BrowserOpenURL, EventsOn } from "../wailsjs/runtime"
import { Start, Stop } from "../wailsjs/go/main/App"
import { useEffect, useRef, useState } from "react"
import { main } from "../wailsjs/go/models"

function App() {
  const [token, setToken] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [me, setMe] = useState<main.User>()
  useEffect(() => {
    const cleanup = EventsOn("relationshipFetched", (data) => {
      console.log(data)
    })
    return () => cleanup()
  }, [])
  const onStopClick = async () => {
    await Stop()
  }
  const onStartClick = async () => {
    if (!token) return
    const response = await Start(token)
    setMe(response)
    setIsLoading(true)
  }

  const onQuestionClick = () => {
    BrowserOpenURL(
      "https://www.androidauthority.com/get-discord-token-3149920/",
    )
  }

  return (
    <div className="mx-auto flex min-h-screen flex-col place-items-center justify-items-center bg-neutral-800 py-8">
      <div className="flex-1 text-2xl font-bold text-neutral-50">
        <h1 className="content-center">Friends Visualiser</h1>
        <pre>{JSON.stringify(me)}</pre>
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="small-input"
          className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white"
        >
          Discord Token
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-circle-help cursor-pointer"
            onClick={onQuestionClick}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-xs text-neutral-900 focus:border-neutral-500 focus:ring-neutral-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400 dark:focus:border-neutral-500 dark:focus:ring-neutral-500"
        />
        <div className="self-center">
          <button
            disabled={isLoading}
            onClick={onStartClick}
            className="mb-2 me-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:border-gray-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:focus:ring-gray-700"
          >
            Start
          </button>
          {isLoading && (
            <button
              onClick={onStopClick}
              className="mb-2 me-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:border-gray-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:focus:ring-gray-700"
            >
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
