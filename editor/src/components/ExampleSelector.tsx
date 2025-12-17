import { Example } from '../examples/examples'

interface ExampleSelectorProps {
  examples: Example[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export default function ExampleSelector({ examples, selectedIndex, onSelect }: ExampleSelectorProps) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h2 className="text-xl font-semibold mb-4 text-blue-400">Examples</h2>
      <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
        {examples.map((example, index) => (
          <div
            key={index}
            onClick={() => onSelect(index)}
            className={`example-card ${selectedIndex === index ? 'active' : ''}`}
          >
            <h3 className="font-semibold text-gray-100 mb-1">{example.name}</h3>
            <p className="text-xs text-gray-400">{example.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
