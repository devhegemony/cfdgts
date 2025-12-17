import { useState, useEffect, useRef } from 'react'
import { examples } from './examples/examples'
import ExampleSelector from './components/ExampleSelector'
import CodeEditor from './components/CodeEditor'
import CanvasViewer from './components/CanvasViewer'

function App() {
  const [selectedExample, setSelectedExample] = useState(0)
  const [code, setCode] = useState(examples[0].code)
  const [error, setError] = useState<string>('')
  const [renderTime, setRenderTime] = useState<number | null>(null)

  useEffect(() => {
    setCode(examples[selectedExample].code)
  }, [selectedExample])

  const handleExampleChange = (index: number) => {
    setSelectedExample(index)
  }

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-blue-400">Context Free Live Editor</h1>
          <p className="text-gray-400 mt-1">Create beautiful generative art with the Context Free Design Grammar</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Examples */}
          <div className="lg:col-span-1">
            <ExampleSelector
              examples={examples}
              selectedIndex={selectedExample}
              onSelect={handleExampleChange}
            />
          </div>

          {/* Middle Column - Code Editor */}
          <div className="lg:col-span-1">
            <CodeEditor
              code={code}
              onChange={handleCodeChange}
              error={error}
              renderTime={renderTime}
            />
          </div>

          {/* Right Column - Canvas */}
          <div className="lg:col-span-1">
            <CanvasViewer
              code={code}
              onError={setError}
              onRenderTime={setRenderTime}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-4 text-center text-gray-400 text-sm">
          <p>Built with React, TypeScript, and Tailwind CSS</p>
          <p className="mt-1">Context Free Art implementation by alpicola</p>
        </div>
      </footer>
    </div>
  )
}

export default App
