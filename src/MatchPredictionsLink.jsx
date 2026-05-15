import { Users } from 'lucide-react'

/** @param {{ onClick: () => void }} props */
export default function MatchPredictionsLink({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-300/95 hover:text-cyan-100 underline decoration-cyan-400/40 underline-offset-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 rounded"
      title="Ver el pronóstico de cada participante en este partido"
    >
      <Users size={11} aria-hidden />
      Pronósticos
    </button>
  )
}
