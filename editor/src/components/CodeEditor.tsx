interface CodeEditorProps {
  code: string
  onChange: (code: string) => void
  error: string
  renderTime: number | null
}

export default function CodeEditor({ code, onChange, error, renderTime }: CodeEditorProps) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-blue-400">Code Editor</h2>
        {renderTime !== null && (
          <span className="text-sm text-green-400">
            Rendered in {renderTime}ms
          </span>
        )}
      </div>
      
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="code-editor w-full h-[calc(100vh-20rem)] resize-none"
        spellCheck={false}
      />
      
      {error && (
        <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-sm text-red-400 font-mono">{error}</p>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        <p>Tip: Edit the code above and see the changes render automatically</p>
      </div>
    </div>
  )
}
