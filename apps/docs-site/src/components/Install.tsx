import { useRef, useState } from 'react'

const OUTPUTS = [
  ['I.', 'HTML report', '.html'],
  ['II.', 'Markdown', '.md'],
  ['III.', 'PR comment', '↗ bot'],
  ['IV.', 'JSON', '.json'],
  ['V.', 'SARIF', '.sarif'],
  ['VI.', 'Terminal', 'tty'],
] as const

const INSTALL_SNIPPET = `# global install — recommended
› npm i -g @aspidasec/cli

# scan a local project
› aspidasec scan ./my-project

# or a deployed site
› aspidasec scan https://example.com

# bahasa indonesia remediation
› aspidasec scan . --language id

# in CI
› aspidasec scan . --format sarif --fail-on high
`

export function Install() {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_SNIPPET)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="block" id="install">
      <div className="container">
        <div className="section-head">
          <h2>Thirty seconds to your first scan.</h2>
          <p className="lede">
            One CLI, six output shapes, identical schema underneath. Same command on a laptop or in CI.
          </p>
        </div>

        <div className="install2">
          <div>
            <h3 className="eyebrow" style={{ marginBottom: 12 }}>
              Install &amp; first scan
            </h3>
            <pre className="install-code2" ref={preRef}>
              <button type="button" className={`install-copy ${copied ? 'copied' : ''}`} onClick={onCopy} aria-label="Copy install snippet">
                {copied ? 'copied' : 'copy'}
              </button>
              <span className="c"># global install — recommended</span>
              {'\n'}
              <span className="glyph">›</span> <span className="k">npm</span> i -g @aspidasec/cli
              {'\n\n'}
              <span className="c"># scan a local project</span>
              {'\n'}
              <span className="glyph">›</span> aspidasec scan ./my-project
              {'\n\n'}
              <span className="c"># or a deployed site</span>
              {'\n'}
              <span className="glyph">›</span> aspidasec scan https://example.com
              {'\n\n'}
              <span className="c"># bahasa indonesia remediation</span>
              {'\n'}
              <span className="glyph">›</span> aspidasec scan . --language id
              {'\n\n'}
              <span className="c"># in CI</span>
              {'\n'}
              <span className="glyph">›</span> aspidasec scan . --format sarif --fail-on high
            </pre>
          </div>
          <div>
            <h3 className="eyebrow" style={{ marginBottom: 12 }}>
              Six output shapes · one schema
            </h3>
            <div className="outputs2" role="list">
              {OUTPUTS.map(([no, name, ext]) => (
                <div className="row" key={no} role="listitem">
                  <span className="roman">{no}</span>
                  <span className="name">{name}</span>
                  <span className="ext">{ext}</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 22, borderTop: '1px solid var(--rule)', paddingTop: 18 }}>
              <h3 className="eyebrow" style={{ marginBottom: 10 }}>
                Trust model
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)', maxWidth: '40ch' }}>
                Scanners detect. AI explains. AspidaSec will never invent a finding, fabricate a CVE, or guess at evidence — every issue traces back to a scanner, the repo, or evidence you provided.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
