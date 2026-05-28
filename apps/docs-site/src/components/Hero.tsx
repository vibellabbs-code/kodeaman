import { useState } from 'react'
import { KawungSeal } from './Mark'

const INSTALL_CMD = 'npm i -g @aspidasec/cli && aspidasec scan .'

export function Hero() {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="hero" id="top">
      <div className="container">
        <div className="hero-mark-wrap">
          <KawungSeal size={180} />
        </div>
        <h1>
          Website security
          <br />
          that ships <span className="gilt">with the fix</span>.
        </h1>
        <p className="lede">
          AspidaSec scans modern web apps for OWASP-related risks, surfaces the findings that actually matter, and hands you developer-ready remediation — in your terminal, your PR, your CI.
        </p>
        <div>
          <div className="hero-cmd">
            <span className="glyph">›</span>
            <span>
              npm i -g @aspidasec/cli &nbsp;&amp;&amp;&nbsp; aspidasec scan .
            </span>
            <button
              type="button"
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={onCopy}
              aria-label="Copy install command"
            >
              {copied ? 'copied' : 'copy'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
