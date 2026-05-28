import { Terminal } from './Terminal'

export function TranscriptSection() {
  return (
    <section className="block" id="transcript">
      <div className="container">
        <div className="section-head">
          <h2>What a scan actually looks like.</h2>
          <p className="lede">
            A real transcript: six scanner passes, raw counts, prioritized findings, and report files in under three minutes.
          </p>
        </div>
        <Terminal />
      </div>
    </section>
  )
}
