const ROWS = [
  ['I.', 'accept', 'a local project, a GitHub checkout, or a deployed URL', 'INPUT', 'logged'],
  ['II.', 'run', 'six scanner passes — dependency, semgrep, zap, crawl, secrets', 'EVIDENCE', 'logged'],
  ['III.', 'normalize', 'collapse 142 raw signals into one shared schema', 'DEDUPLICATION', 'logged'],
  ['IV.', 'prioritize', 'severity × confidence × exploitability × exposure', 'RANKING', 'logged'],
  ['V.', 'explain', 'remediation in EN / ID, with refs and a safe code example', 'GUIDANCE', 'logged'],
  ['VI.', 'export', 'HTML, Markdown, JSON, SARIF, PR comment — all from one schema', 'OUTPUT', 'logged'],
] as const

export function EvidenceLedger() {
  return (
    <section className="block" id="evidence">
      <div className="container">
        <div className="section-head">
          <h2>Six entries, in order, on every scan.</h2>
          <p className="lede">
            Every scan writes a ledger of what AspidaSec saw and what it did. No invented findings, no fabricated CVEs — each row traces back to a scanner or to the repo itself.
          </p>
        </div>

        <div className="ledger">
          {ROWS.map(([no, act, desc, arte, stamp]) => (
            <div key={no} className="ledger-row">
              <span className="no">{no}</span>
              <span className="act">{act}</span>
              <span className="desc">{desc}</span>
              <span className="arte">{arte}</span>
              <span className="stamp">{stamp}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
