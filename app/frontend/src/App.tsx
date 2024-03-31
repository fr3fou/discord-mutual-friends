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

const NODE_R = 8

interface User extends main.User {
  url?: string
}

interface Node extends main.Friend {
  user: User
}

function App() {
  const [token, setToken] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [me, setMe] = useState<main.User>()
  const [graphData, setGraphData] = useState<GraphData<Node>>({
    nodes: [],
    links: [],
  })
  const graphRef = useRef<ForceGraphMethods<NodeObject<Node>> | undefined>()
  const [nodeLinks, setNodeLinks] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const cleanup = EventsOn(
      "relationshipFetched",
      (data: { id: string; relationships: string[]; index: number }) => {
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
      },
    )
    return () => cleanup()
  }, [me?.id])

  const onStopClick = async () => {
    await Stop()
    setIsLoading(false)
  }

  const onStartClick = async () => {
    if (!token) return
    const response = await Start(token)
    setMe(response)
    setGraphData((graphData) => ({
      ...graphData,
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
    setIsLoading(true)
  }

  const onQuestionClick = () => {
    BrowserOpenURL(
      "https://www.androidauthority.com/get-discord-token-3149920/",
    )
  }

  const [highlightNodes, setHighlightNodes] = useState(new Set())
  const [highlightLinks, setHighlightLinks] = useState(new Set())
  const [hoverNode, setHoverNode] = useState<string>()

  const updateHighlight = () => {
    setHighlightNodes(highlightNodes)
    setHighlightLinks(highlightLinks)
  }

  return (
    <div className="fixed flex min-h-screen flex-col place-items-center justify-items-center dark:bg-neutral-800">
      <div className="fixed top-5 z-10 flex-1 text-2xl font-bold text-gray-900 dark:text-white">
        <h1 className="content-center">Friends Visualiser</h1>
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
        showNavInfo={false}
        nodeResolution={3}
        nodeLabel={(node) => node.user.username}
        nodeVal={(node) => nodeLinks[node.id]?.length}
        graphData={graphData}
        nodeVisibility={(node) => {
          if (hoverNode) {
            const isLinkedToCurrent = highlightLinks.has(node.id)
            return node.id === hoverNode || isLinkedToCurrent
          }

          return node.type === 1 && nodeLinks[node.id]?.length > 0
        }}
        onNodeHover={(node) => {
          highlightLinks.clear()
          if (node) {
            nodeLinks[node.id]?.forEach((link) => highlightLinks.add(link))
          }

          setHoverNode(node?.id)
          updateHighlight()
        }}
        linkWidth={(link) => {
          const target = link.target as Node
          return hoverNode === target.id ? 1 : 0.01
        }}
        nodeThreeObject={(node) => {
          // Load the image texture
          const imgTexture = new THREE.TextureLoader().load(node.user.url ?? "")
          imgTexture.colorSpace = THREE.SRGBColorSpace
          const isLinkedToCurrent = highlightLinks.has(node.id)

          // Create image sprite
          const imgMaterial = new THREE.SpriteMaterial({ map: imgTexture })
          const imgSprite = new THREE.Sprite(imgMaterial)
          const isHovered = node.id === hoverNode
          imgMaterial.opacity =
            highlightLinks.size > 0
              ? isLinkedToCurrent || isHovered
                ? 1
                : 0
              : 1

          // Scale the image sprite to a fixed size
          const imgSize =
            10 + nodeLinks[node.id]?.length * 1.5 + (isHovered ? 12 : 0)
          imgSprite.scale.set(imgSize, imgSize, 1)

          imgSprite.position.set(0, 0, 0)
          return imgSprite
        }}
      />
      <div className="fixed bottom-2 flex flex-col gap-2">
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
