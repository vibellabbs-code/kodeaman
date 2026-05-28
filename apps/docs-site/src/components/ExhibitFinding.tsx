export function ExhibitFinding() {
  return (
    <section className="block" id="exhibit">
      <div className="container">
        <div className="section-head">
          <h2>One finding, exactly as you'd defend it.</h2>
          <p className="lede">
            Every issue ships with the evidence trail, the OWASP / CWE mapping, the suggested diff, and a plain-English explanation of why it matters.
          </p>
        </div>

        <article className="exhibit">
          <div className="exhibit-head">
            <span className="exhibit-call">Exhibit A · 2026·05·27</span>
            <h3 className="exhibit-title">SQL injection in the orders query</h3>
            <div className="exhibit-tags">
              <span className="exhibit-tag sev">CRIT</span>
              <span className="exhibit-tag">A03</span>
              <span className="exhibit-tag">CWE-89</span>
            </div>
          </div>
          <div className="exhibit-meta">
            <span>
              <span className="key">scanner</span>
              <b>semgrep · js.lang.security.sql-injection</b>
            </span>
            <span>
              <span className="key">file</span>
              <b>packages/api/src/orders/query.ts</b>
            </span>
            <span>
              <span className="key">line</span>
              <b>42</b>
            </span>
            <span>
              <span className="key">confidence</span>
              <b>high</b>
            </span>
            <span>
              <span className="key">first seen</span>
              <b>2026·05·21</b>
            </span>
          </div>
          <div className="exhibit-body">
            <div className="exhibit-col">
              <h3>Evidence · proposed diff</h3>
              <pre className="exhibit-diff">
                <span className="com">{'// packages/api/src/orders/query.ts — line 42'}</span>
                {'\n'}
                <span className="del">{'db.query(`SELECT * FROM orders WHERE id = ${id}`)'}</span>
                <span className="add">{"db.query('SELECT * FROM orders WHERE id = $1', [id])"}</span>
              </pre>
            </div>
            <div className="exhibit-col exhibit-explain">
              <h3>Why this matters · how to fix</h3>
              <p>
                The <b>id</b> parameter flows straight from the request into a template-literal SQL string. An attacker can append clauses to read or modify rows they don't own.
              </p>
              <p>
                Use a <b>parameterized query</b>. Most drivers expose placeholders <code className="inline-kbd mono">$1</code>, <code className="inline-kbd mono" style={{ margin: '0 4px' }}>?</code>, <code className="inline-kbd mono">:name</code>. Never interpolate untrusted input into SQL.
              </p>
              <div className="exhibit-refs">
                <a href="https://owasp.org/Top10/A03_2021-Injection/" target="_blank" rel="noreferrer">
                  OWASP A03:2021 — Injection
                </a>
                <a href="https://cwe.mitre.org/data/definitions/89.html" target="_blank" rel="noreferrer">
                  CWE-89 — SQL Injection
                </a>
                <a href="https://semgrep.dev/r/js.lang.security.sql-injection" target="_blank" rel="noreferrer">
                  semgrep js.lang.security.sql-injection
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
