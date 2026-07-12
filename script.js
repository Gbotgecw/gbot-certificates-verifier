/* =========================================================
   GBOT CERTIFICATE DATABASE
   ---------------------------------------------------------
   Add one object per certificate you issue. The QR code /
   verification link on each certificate should point to:
     https://YOUR-DOMAIN/?cert=THE-ID-BELOW

   Fields:
     id        - unique certificate ID printed on the certificate
     name      - participant's full name
     college   - participant's institution
     program   - the workshop / event / program name
     module    - specific week/module (leave "" if not applicable)
     type      - "Certificate of Participation" / "Certificate of Completion" / "Certificate of Merit"
     date      - date or date range shown on the certificate
     issuedBy  - organizing club/body
   ========================================================= */
const CERTIFICATES = [
  // SAMPLE RECORD — delete this once you add real participants.
  // Try the demo: search for GBOT-DEMO-0001 on the home page.
  // {
  //   id: "GBOT-DEMO-0H01",
  //   name: "MUHAMMED MASHHOOD K",
  //   college: "Government Engineering College Wayanad",
  //   program: "G-Bot Maker Series: Concept to Circuit",
  //   module: "Week 1 \u2014 CAD Fundamentals",
  //   type: "Certificate of Participation",
  //   date: "15 July 2026",
  //   issuedBy: "GBOT Robotics Club, GEC Wayanad"
  // },
  //  {
  //   id: "GBOT-CTC-2026-0y02",
  //   name: "Aparna Suresh",
  //   college: "Government Engineering College Wayanad",
  //   program: "G-Bot Maker Series: Concept to Circuit",
  //   module: "Week 2 \u2014 Electronics Basics",
  //   type: "Certificate of Participation",
  //   date: "22 July 2026",
  //   issuedBy: "GBOT Robotics Club, GEC Wayanad"
  // }
];

function normalize(s){ return (s || "").trim().toUpperCase(); }

function findCertificate(id){
  const target = normalize(id);
  return CERTIFICATES.find(c => normalize(c.id) === target) || null;
}

function traceSvg(){
  return `<svg class="trace" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="#33c2ff" stroke-width="2">
      <path d="M10 190 L60 190 L60 140 L110 140 L110 90 L160 90 L160 40"/>
      <circle cx="60" cy="190" r="4" fill="#33c2ff" stroke="none"/>
      <circle cx="110" cy="140" r="4" fill="#33c2ff" stroke="none"/>
      <circle cx="160" cy="90" r="4" fill="#33c2ff" stroke="none"/>
      <circle cx="160" cy="40" r="6"/>
    </g>
  </svg>`;
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function renderHome(opts){
  opts = opts || {};
  const notice = opts.notFoundId ? `
    <div class="not-found-box fade-in" role="alert">
      <span class="badge bad" style="margin-bottom:14px;">&#10007; NOT VERIFIED</span>
      <p style="margin-top:14px;">We couldn't find a certificate with ID <code>${escapeHtml(opts.notFoundId)}</code> in our records.
      Double-check the ID printed on the certificate and try again. If you believe this is an error, contact GBOT Robotics Club, GEC Wayanad.</p>
    </div>` : "";

  return `
    <div class="eyebrow fade-in">OFFICIAL CERTIFICATE VERIFICATION</div>
    <div class="bracket-frame fade-in">
      <h1 class="hero-title">Verify a GBOT <span class="accent">Certificate</span></h1>
    </div>
    <p class="hero-sub fade-in">Every certificate issued by GBOT Robotics Club, GEC Wayanad carries a unique
      ID and QR code. Enter the ID below to confirm it's authentic.</p>

    <form class="search-card fade-in" id="searchForm">
      <div class="search-row">
        <input id="certInput" type="text" autocomplete="off" spellcheck="false"
          placeholder="e.g. GBOT-CTC-2026-0001" value="${opts.notFoundId ? escapeHtml(opts.notFoundId) : ''}">
        <button class="btn btn-verify" type="submit">Verify Certificate</button>
      </div>
      <div class="search-hint">Scanned a QR code on your certificate? You'll land here with your result automatically.</div>
    </form>
    ${notice}

    <div class="stats-row fade-in">
      <div class="stat"><div class="num">${CERTIFICATES.length}</div><div class="lbl">Certificates on Record</div></div>
      <div class="stat"><div class="num">${new Set(CERTIFICATES.map(c=>c.program)).size}</div><div class="lbl">Programs</div></div>
      <div class="stat"><div class="num">Instant</div><div class="lbl">Verification</div></div>
    </div>
  `;
}

function renderResult(cert){
  return `
    <div class="result-wrap">
      <span class="badge ok fade-in">&#10003; VERIFIED CERTIFICATE</span>
      <div class="cert-replica fade-in">
        ${traceSvg()}
        <div class="cert-kicker">${escapeHtml(cert.type)}</div>
        <div class="cert-name">${escapeHtml(cert.name)}</div>
        <div class="cert-program">${escapeHtml(cert.program)}</div>
        <div class="details-grid">
          <div><div class="d-label">Institution</div><div class="d-value">${escapeHtml(cert.college)}</div></div>
          <div><div class="d-label">Module</div><div class="d-value">${cert.module ? escapeHtml(cert.module) : "\u2014"}</div></div>
          <div><div class="d-label">Date</div><div class="d-value">${escapeHtml(cert.date)}</div></div>
          <div><div class="d-label">Certificate ID</div><div class="d-value mono">${escapeHtml(cert.id)}</div></div>
          <div class="full"><div class="d-label">Issued By</div><div class="d-value">${escapeHtml(cert.issuedBy)}</div></div>
        </div>
        <div class="cert-foot">This certificate is authentic and was issued by ${escapeHtml(cert.issuedBy)}.</div>
      </div>
      <div class="action-row">
        <a class="btn-outline" href="/">Verify Another Certificate</a>
        <button class="btn-copy btn" id="copyLinkBtn" type="button">Copy Verification Link</button>
      </div>
    </div>
  `;
}

function attachHomeHandlers(){
  const form = document.getElementById("searchForm");
  if(!form) return;
  form.addEventListener("submit", function(e){
    e.preventDefault();
    const val = document.getElementById("certInput").value.trim();
    if(!val) return;
    window.location.search = "?cert=" + encodeURIComponent(val);
  });
}

function attachResultHandlers(){
  const btn = document.getElementById("copyLinkBtn");
  if(!btn) return;
  btn.addEventListener("click", function(){
    navigator.clipboard.writeText(window.location.href).then(function(){
      btn.textContent = "Link Copied!";
      setTimeout(function(){ btn.textContent = "Copy Verification Link"; }, 1800);
    });
  });
}

function init(){
  const app = document.getElementById("app");
  const params = new URLSearchParams(window.location.search);
  const certId = params.get("cert") || params.get("id");

  if(certId){
    const cert = findCertificate(certId);
    if(cert){
      app.innerHTML = renderResult(cert);
      attachResultHandlers();
      document.title = cert.name + " \u2014 GBOT Certificate Verification";
    } else {
      app.innerHTML = renderHome({ notFoundId: certId });
      attachHomeHandlers();
    }
  } else {
    app.innerHTML = renderHome();
    attachHomeHandlers();
  }
}

init();
