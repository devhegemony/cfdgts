import { useEffect, useRef } from 'react'

interface CanvasViewerProps {
  code: string
  onError: (error: string) => void
  onRenderTime: (time: number) => void
}

// Declare global ContextFree interface
declare global {
  interface Window {
    ContextFree: any
  }
}

export default function CanvasViewer({ code, onError, onRenderTime }: CanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextFreeRef = useRef<any>(null)

  useEffect(() => {
    if (!canvasRef.current || typeof window.ContextFree === 'undefined') {
      return
    }

    // Stop any existing render
    if (contextFreeRef.current) {
      try {
        contextFreeRef.current.stop()
      } catch (e) {
        // Ignore stop errors
      }
    }

    // Clear canvas
    const ctx = canvasRef.current.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }

    // Clear error
    onError('')

    try {
      const start = Date.now()
      contextFreeRef.current = new window.ContextFree(code, canvasRef.current)
      contextFreeRef.current.render(() => {
        const elapsed = Date.now() - start
        onRenderTime(elapsed)
      })
    } catch (e: any) {
      const errorMsg = e.toString()
      onError(errorMsg)
      console.error('Render error:', e)
    }
  }, [code, onError, onRenderTime])

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h2 className="text-xl font-semibold mb-4 text-blue-400">Canvas</h2>
      <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="border border-gray-700 rounded"
        />
      </div>
      <div className="mt-3 text-xs text-gray-500">
        <p>Canvas size: 500x500 pixels</p>
      </div>
    </div>
  )
}
