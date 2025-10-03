export default function VoiceHint({ text = 'Try: "Add 2 more bananas"' }: { text?: string }) {
  return <div className="muted">🎤 {text}</div>
}
