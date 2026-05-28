const ROWS = [
  ['I.', 'Dependency audit', 'lockfile parsing → CVE matching with confidence weighting', 'npm · pnpm · yarn', 'A06'],
  ['II.', 'Semgrep web rules', 'OWASP-oriented static patterns; bring-your-own rules merge', 'semgrep', 'A01·A03·A10'],
  ['III.', 'ZAP baseline', 'dynamic crawl of headers, CSRF, mixed-content, CSP', 'OWASP ZAP', 'A05·A07'],
  ['IV.', 'Route crawl', 'SPA route discovery with recorded auth flows', 'playwright', '—'],
  ['V.', 'Secrets & config', 'hardcoded keys, weak crypto, debug flags, leaked .env', 'gitleaks · custom', 'A02·A07'],
  ['VI.', 'OWASP map', 'every finding tagged A01–A10 for category-aware reports', 'in-house', 'A01–A10'],
] as const

export function ScannersIndex() {
  return (
    <section className="block" id="index">
      <div className="container">
        <div className="section-head">
          <h2>Six independent passes. One normalized schema.</h2>
          <p className="lede">
            Each pass owns its problem space. Their outputs converge in a single schema so reports, IDE views, and CI gates all read the same shape.
          </p>
        </div>

        <table className="index-table">
          <tbody>
            {ROWS.map(([n, name, desc, tool, owasp]) => (
              <tr key={n}>
                <td className="roman">{n}</td>
                <td className="name">{name}</td>
                <td>{desc}</td>
                <td className="leaders">{tool}</td>
                <td className="owasp">{owasp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
