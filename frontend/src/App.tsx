import "./App.css"
import { BrowserOpenURL, EventsOn } from "../wailsjs/runtime"
import { Start, Stop } from "../wailsjs/go/main/App"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

import { main } from "../wailsjs/go/models"
import ForceGraph3D, {
  ForceGraphMethods,
  GraphData,
  NodeObject,
} from "react-force-graph-3d"

interface User extends main.User {
  url?: string
}

interface Node extends main.Friend {
  user: User
}

// @ts-ignore
const d3promise = import("d3-force-3d")

const physics = {
  enabled: true,
  charge: -700,
  collision: true,
  collisionStrength: 20,
  centering: true,
  centeringStrength: 0.2,
  linkStrength: 0.3,
  linkIts: 1,
  alphaDecay: 0.05,
  alphaTarget: 0,
  alphaMin: 0,
  velocityDecay: 0.25,
  gravity: 0.3,
  gravityOn: true,
  gravityLocal: false,
}

type Status = "waiting" | "loading" | "finished"

function App() {
  const [error, setError] = useState<Error>()
  const [token, setToken] = useState<string>("")
  const [status, setStatus] = useState<Status>("waiting")
  const [me, setMe] = useState<main.User>()
  const [graphData, setGraphData] = useState<GraphData<Node>>({
    nodes: [],
    links: [],
  })
  const [progress, setProgress] = useState<{ total: number; index: number }>({
    index: 0,
    total: 0,
  })
  const graphRef = useRef<ForceGraphMethods<NodeObject<Node>> | undefined>()
  const [nodeLinks, setNodeLinks] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const cleanup = EventsOn(
      "relationshipFetched",
      (data: {
        id: string
        relationships: string[]
        index: number
        total: number
      }) => {
        setGraphData((graphData) => ({
          ...graphData,
          links: [
            ...graphData.links,
            ...data.relationships.map((relationship) => ({
              source: data.id,
              target: relationship,
            })),
          ],
        }))
        setNodeLinks((nodeVal) => ({
          ...nodeVal,
          [data.id]: data.relationships,
        }))
        setProgress({
          index: data.index,
          total: data.total,
        })
        if (data.index >= data.total) {
          setStatus("finished")
          graphRef.current?.resumeAnimation()
        }
      },
    )
    return () => cleanup()
  }, [me?.id])

  const onStopClick = async () => {
    await Stop()
    setStatus("waiting")
  }

  const onStartClick = async () => {
    if (!token) return
    const response = await Start(token).catch((error) => setError(error))
    if (!response) return
    setMe(response)
    setGraphData((graphData) => ({
      links: [],
      nodes:
        response.friends?.map((friend) => {
          const id = BigInt(friend.user.id)
          const avatar = friend.user.avatar
          const index = (id >> BigInt(22)) % BigInt(6)

          return {
            ...friend,
            user: {
              ...friend.user,
              url: avatar
                ? `https://cdn.discordapp.com/avatars/${friend.user.id}/${friend.user.avatar}.png`
                : `https://cdn.discordapp.com/embed/avatars/${index}.png`,
            },
          }
        }) ?? [],
    }))
    graphRef.current?.pauseAnimation()
    setStatus("loading")
  }

  const onQuestionClick = () => {
    BrowserOpenURL(
      "https://www.androidauthority.com/get-discord-token-3149920/",
    )
  }

  const [highlightLinks, setHighlightLinks] = useState(new Set())
  const [hoverNode, setHoverNode] = useState<string | null>()

  const updateHighlight = () => {
    setHighlightLinks(highlightLinks)
  }

  useEffect(() => {
    ;(async () => {
      const fg = graphRef.current
      if (!fg) return
      const d3 = await d3promise
      fg.d3Force("x", d3.forceX().strength(physics.gravity))
      fg.d3Force("y", d3.forceY().strength(physics.gravity))
      fg.d3Force("z", d3.forceZ().strength(physics.gravity))
      fg.d3Force("center", d3.forceCenter().strength(physics.centeringStrength))
      fg.d3Force("link")?.strength(physics.linkStrength)
      fg.d3Force("link")?.iterations(physics.linkIts)
      fg.d3Force("charge")?.strength(physics.charge)
      fg.d3Force(
        "collide",
        physics.collision
          ? d3.forceCollide().radius(physics.collisionStrength)
          : null,
      )
    })()
  }, [physics])

  return (
    <div className="fixed flex min-h-screen flex-col place-items-center justify-items-center dark:bg-neutral-800">
      <div className="fixed top-5 z-10 flex flex-1 flex-col">
        <h1 className="content-center text-2xl font-bold text-gray-900 dark:text-white">
          Friends Visualiser
        </h1>
        {error && <h1 className="text-xl text-red-500">{`${error}`}</h1>}
        {status === "loading" && (
          <div className="self-center">
            <h1 className="m-0 content-center text-center text-2xl text-white">
              Loading...
            </h1>
            <p className="w-full text-center text-sm text-white">
              {progress.index}/{progress.total}
            </p>
          </div>
        )}
      </div>
      <ForceGraph3D
        ref={graphRef}
        warmupTicks={20}
        d3AlphaDecay={0.25}
        d3AlphaMin={0}
        d3VelocityDecay={0.25}
        linkOpacity={0.8}
        enableNodeDrag={false}
        backgroundColor="#262626"
        showNavInfo
        nodeResolution={3}
        nodeLabel={(node) => node.user.username}
        nodeRelSize={25}
        nodeVal={(node) => nodeLinks[node.id]?.length}
        graphData={graphData}
        nodeVisibility={(node) => node.type === 1}
        onNodeClick={(node) => {
          highlightLinks.clear()

          if (node?.id === hoverNode) {
            setHoverNode(null)
            return
          }

          if (node) {
            nodeLinks[node.id]?.forEach((link) => highlightLinks.add(link))
            setHoverNode(node?.id || null)
            updateHighlight()
          }
        }}
        onBackgroundClick={() => {
          highlightLinks.clear()
          setHoverNode(null)
        }}
        linkWidth={(link) => {
          const target = link.target as Node
          return hoverNode === target.id ? 0.5 : 0.01
        }}
        linkCurvature={0.2}
        nodeThreeObject={(node) => {
          const imgTexture = new THREE.TextureLoader().load(node.user.url ?? "")
          imgTexture.colorSpace = THREE.SRGBColorSpace
          const isLinkedToCurrent = highlightLinks.has(node.id)

          const imgMaterial = new THREE.SpriteMaterial({ map: imgTexture })
          const imgSprite = new THREE.Sprite(imgMaterial)
          const isHovered = node.id === hoverNode

          imgMaterial.opacity =
            highlightLinks.size > 0
              ? isLinkedToCurrent || isHovered
                ? 1
                : 0.1
              : 1

          const imgSize =
            10 + nodeLinks[node.id]?.length * 1.5 + (isHovered ? 12 : 0)
          imgSprite.scale.set(imgSize, imgSize, 1)
          imgSprite.position.set(0, 0, 0)
          imgSprite.visible = true
          return imgSprite
        }}
      />
      <div className="fixed bottom-5 flex flex-col gap-2">
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
          {status === "waiting" && (
            <button
              onClick={onStartClick}
              className="mb-2 me-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:border-gray-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:focus:ring-gray-700"
            >
              Start
            </button>
          )}
          {status === "loading" && (
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
