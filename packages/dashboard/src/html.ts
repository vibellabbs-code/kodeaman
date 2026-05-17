export function generateDashboardHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KodeAman Security Trends</title>
  <style>
    :root { color-scheme: light; --bg:#f7f8fb; --card:#fff; --text:#111827; --muted:#6b7280; --border:#e5e7eb; --accent:#2563eb; --good:#16a34a; --bad:#dc2626; --critical:#7f1d1d; --high:#dc2626; --medium:#f59e0b; --low:#2563eb; --info:#64748b; }
    [data-theme="dark"] { color-scheme: dark; --bg:#0f172a; --card:#111827; --text:#f8fafc; --muted:#94a3b8; --border:#334155; --accent:#60a5fa; --good:#22c55e; --bad:#f87171; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:var(--bg); color:var(--text); }
    header { padding:28px; border-bottom:1px solid var(--border); background:var(--card); display:flex; justify-content:space-between; gap:16px; align-items:center; }
    h1 { margin:0 0 8px; font-size:28px; }
    h2 { margin:0 0 16px; font-size:18px; }
    .muted { color:var(--muted); }
    .stats { display:flex; gap:12px; flex-wrap:wrap; }
    .stat { padding:12px 16px; background:var(--bg); border:1px solid var(--border); border-radius:14px; min-width:120px; }
    .stat strong { display:block; font-size:24px; }
    button, select { border:1px solid var(--border); border-radius:10px; background:var(--card); color:var(--text); padding:9px 12px; cursor:pointer; }
    main { padding:24px; display:grid; grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr); gap:20px; }
    .card { background:var(--card); border:1px solid var(--border); border-radius:18px; padding:20px; box-shadow:0 8px 24px rgba(15,23,42,.05); }
    .full { grid-column:1 / -1; }
    svg { width:100%; height:260px; overflow:visible; }
    .coverage { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; }
    .owasp { border:1px solid var(--border); border-radius:12px; padding:12px; display:flex; justify-content:space-between; align-items:center; }
    .covered { border-color:color-mix(in srgb, var(--good) 60%, var(--border)); }
    .missing { border-color:color-mix(in srgb, var(--bad) 60%, var(--border)); }
    .dot { width:10px; height:10px; border-radius:999px; display:inline-block; }
    .covered .dot { background:var(--good); } .missing .dot { background:var(--bad); }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:12px; text-align:left; border-bottom:1px solid var(--border); vertical-align:top; }
    tr { cursor:pointer; }
    tr:hover { background:color-mix(in srgb, var(--accent) 8%, transparent); }
    .badge { border-radius:999px; color:white; display:inline-block; font-size:12px; font-weight:700; margin:2px; padding:3px 8px; }
    .critical { background:var(--critical); } .high { background:var(--high); } .medium { background:var(--medium); } .low { background:var(--low); } .info { background:var(--info); }
    .findings { max-height:420px; overflow:auto; }
    .finding { border-top:1px solid var(--border); padding:12px 0; }
    .finding:first-child { border-top:0; }
    @media (max-width: 900px) { main { grid-template-columns:1fr; } header { align-items:flex-start; flex-direction:column; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>KodeAman Security Trends</h1>
      <div class="muted">Track scan history, finding severity, and OWASP Top 10 coverage.</div>
    </div>
    <div class="stats">
      <div class="stat"><span class="muted">Total scans</span><strong id="total-scans">0</strong></div>
      <div class="stat"><span class="muted">Total findings</span><strong id="total-findings">0</strong></div>
      <button id="theme-toggle" type="button">Toggle theme</button>
    </div>
  </header>
  <main>
    <section class="card">
      <div style="display:flex; justify-content:space-between; gap:12px; align-items:center;">
        <h2>Findings over time</h2>
        <select id="period"><option value="1">Daily</option><option value="7">Weekly</option></select>
      </div>
      <svg id="trend-chart" role="img" aria-label="Trend line chart"></svg>
    </section>
    <section class="card">
      <h2>OWASP Top 10 coverage</h2>
      <div id="coverage" class="coverage"></div>
    </section>
    <section class="card full">
      <h2>Recent scans</h2>
      <table>
        <thead><tr><th>Date</th><th>Scanner</th><th>Findings</th><th>Severity</th></tr></thead>
        <tbody id="scan-table"><tr><td colspan="4" class="muted">Loading scans...</td></tr></tbody>
      </table>
    </section>
    <section class="card full">
      <h2>Finding details</h2>
      <div id="findings" class="findings muted">Select a scan to inspect its findings.</div>
    </section>
  </main>
  <script>
    const OWASP = ['A01:2021','A02:2021','A03:2021','A04:2021','A05:2021','A06:2021','A07:2021','A08:2021','A09:2021','A10:2021'];
    const sev = ['critical','high','medium','low','info'];
    const $ = (id) => document.getElementById(id);

    $('theme-toggle').addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('kodeaman-dashboard-theme', next);
    });
    document.documentElement.dataset.theme = localStorage.getItem('kodeaman-dashboard-theme') || 'light';
    $('period').addEventListener('change', loadTrends);

    async function load() {
      const scansResponse = await fetch('/api/scans?limit=25');
      const data = await scansResponse.json();
      $('total-scans').textContent = data.totalScans || 0;
      $('total-findings').textContent = data.totalFindings || 0;
      renderScans(data.scans || []);
      renderCoverage((data.scans && data.scans[0] && data.scans[0].owaspCoverage) || {});
      await loadTrends();
    }

    async function loadTrends() {
      const response = await fetch('/api/trends?periodDays=' + encodeURIComponent($('period').value));
      const data = await response.json();
      renderChart(data.trends || []);
    }

    function renderScans(scans) {
      $('scan-table').innerHTML = scans.length ? scans.map(scan =>
        '<tr data-scan-id="' + escapeAttr(scan.scanId) + '">' +
        '<td>' + new Date(scan.generatedAt).toLocaleString() + '</td>' +
        '<td>' + escapeHtml(scan.scannerNames.join(', ') || 'unknown') + '</td>' +
        '<td>' + scan.totalFindings + '</td>' +
        '<td>' + sev.map(s => scan.bySeverity[s] ? '<span class="badge ' + s + '">' + s + ': ' + scan.bySeverity[s] + '</span>' : '').join('') + '</td>' +
        '</tr>').join('') : '<tr><td colspan="4" class="muted">No telemetry JSONL scans found.</td></tr>';
      for (const row of $('scan-table').querySelectorAll('tr[data-scan-id]')) {
        row.addEventListener('click', () => loadFindings(row.dataset.scanId));
      }
    }

    function renderCoverage(coverage) {
      $('coverage').innerHTML = OWASP.map(category => {
        const covered = Boolean(coverage[category]);
        return '<div class="owasp ' + (covered ? 'covered' : 'missing') + '"><span>' + category + '</span><span><i class="dot"></i> ' + (covered ? 'Covered' : 'No findings') + '</span></div>';
      }).join('');
    }

    async function loadFindings(scanId) {
      const response = await fetch('/api/findings/' + encodeURIComponent(scanId));
      const data = await response.json();
      const findings = data.findings || [];
      $('findings').classList.toggle('muted', findings.length === 0);
      $('findings').innerHTML = findings.length ? findings.map(f =>
        '<div class="finding">' +
        '<span class="badge ' + escapeAttr(f.severity) + '">' + escapeHtml(f.severity) + '</span> ' +
        '<strong>' + escapeHtml(f.title) + '</strong>' +
        '<div class="muted">' + escapeHtml(f.source) + ' · ' + escapeHtml(f.category) + ' · ' + escapeHtml(f.location?.filePath || 'no location') + '</div>' +
        '<p>' + escapeHtml(f.description || '') + '</p>' +
        '</div>').join('') : 'This scan has no findings.';
    }

    function renderChart(points) {
      const svg = $('trend-chart');
      const width = svg.clientWidth || 720;
      const height = 260;
      const pad = 36;
      const max = Math.max(1, ...points.map(p => p.totalFindings));
      const coords = points.map((p, i) => {
        const x = pad + (points.length === 1 ? 0 : i * (width - pad * 2) / (points.length - 1));
        const y = height - pad - (p.totalFindings / max) * (height - pad * 2);
        return { x, y, p };
      });
      const polyline = coords.map(c => c.x + ',' + c.y).join(' ');
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
      svg.innerHTML =
        '<line x1="' + pad + '" y1="' + (height-pad) + '" x2="' + (width-pad) + '" y2="' + (height-pad) + '" stroke="var(--border)" />' +
        '<line x1="' + pad + '" y1="' + pad + '" x2="' + pad + '" y2="' + (height-pad) + '" stroke="var(--border)" />' +
        '<polyline fill="none" stroke="var(--accent)" stroke-width="3" points="' + polyline + '" />' +
        coords.map(c => '<circle cx="' + c.x + '" cy="' + c.y + '" r="5" fill="var(--accent)"><title>' + escapeHtml(c.p.period) + ': ' + c.p.totalFindings + '</title></circle>').join('') +
        coords.map(c => '<text x="' + c.x + '" y="' + (height-10) + '" text-anchor="middle" font-size="11" fill="var(--muted)">' + escapeHtml(c.p.period.slice(5)) + '</text>').join('');
      if (!points.length) svg.innerHTML = '<text x="20" y="40" fill="var(--muted)">No trend data yet.</text>';
    }

    function escapeHtml(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
    function escapeAttr(value) { return escapeHtml(value); }
    load().catch(error => { $('scan-table').innerHTML = '<tr><td colspan="4">Failed to load dashboard data: ' + escapeHtml(error.message) + '</td></tr>'; });
  </script>
</body>
</html>`;
}
