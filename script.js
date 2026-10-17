/* =========================================================
   GBOT CERTIFICATE DATABASE & VERIFICATION ENGINE
   ---------------------------------------------------------
   Add one object per certificate you issue. The QR code /
   verification link on each certificate should point to:
     https://YOUR-DOMAIN/?cert=THE-ID-BELOW

   Fields:
     id          - unique certificate ID printed on the certificate
     name        - participant's full name
     department  - participant's department / branch
     college     - participant's institution
     program     - workshop / event / program name
     module      - specific week/module (leave "" if not applicable)
     type        - "Certificate of Participation" / "Certificate of Completion" / "Certificate of Merit"
     date        - date or date range shown on the certificate
     issuedBy    - organizing club/body
   ========================================================= */
const CERTIFICATES = [
 
];

const ADMIN_CREDS = {
  username: "Gbot",
  password: "Gbot@123"
};

const STORAGE_KEY_CERTS = "GBOT_CERTIFICATES_LOCAL_DB";
const STORAGE_KEY_AUTH = "GBOT_ADMIN_AUTH_TOKEN";

/* ---------- Database Management Helpers ---------- */
function normalize(s){
  return (s || "").trim().toUpperCase();
}

function getLocalCertificates(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CERTS);
    return raw ? JSON.parse(raw) : [];
  } catch(e) {
    console.error("Error reading localStorage:", e);
    return [];
  }
}

function saveLocalCertificates(certs){
  try {
    localStorage.setItem(STORAGE_KEY_CERTS, JSON.stringify(certs));
  } catch(e) {
    console.error("Error writing to localStorage:", e);
  }
}

function getAllCertificates(){
  const local = getLocalCertificates();
  const certMap = new Map();

  // 1. Load built-in records
  CERTIFICATES.forEach(c => {
    if(c && c.id){
      certMap.set(normalize(c.id), { ...c, _source: "builtin" });
    }
  });

  // 2. Merge local storage records (override/augment)
  local.forEach(c => {
    if(c && c.id){
      certMap.set(normalize(c.id), { ...c, _source: "local" });
    }
  });

  return Array.from(certMap.values());
}

function findCertificate(id){
  const target = normalize(id);
  const all = getAllCertificates();
  return all.find(c => normalize(c.id) === target) || null;
}

function escapeHtml(str){
  return String(str || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
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

/* ---------- Rendering Views ---------- */
function renderHome(opts){
  opts = opts || {};
  const allCerts = getAllCertificates();
  const uniquePrograms = new Set(allCerts.map(c => c.program).filter(Boolean)).size;

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
      ID and QR code. Enter the ID below to confirm its authenticity and participant details.</p>

    <form class="search-card fade-in" id="searchForm">
      <div class="search-row">
        <input id="certInput" type="text" autocomplete="off" spellcheck="false"
          placeholder="e.g. 26-GBOT-001" value="${opts.notFoundId ? escapeHtml(opts.notFoundId) : ''}">
        <button class="btn btn-verify" type="submit">Verify Certificate</button>
      </div>
      <div class="search-hint">Scanned a QR code on your certificate? You'll land here with your result automatically.</div>
    </form>
    ${notice}

    <div class="stats-row fade-in">
      <div class="stat"><div class="num">${allCerts.length}</div><div class="lbl">Certificates on Record</div></div>
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
        <div class="cert-kicker">${escapeHtml(cert.type || "Certificate of Participation")}</div>
        <div class="cert-name">${escapeHtml(cert.name)}</div>
        <div class="cert-program">${escapeHtml(cert.program || "G-Bot Workshop")}</div>
        <div class="details-grid">
          <div><div class="d-label">Department</div><div class="d-value highlight-dept">${escapeHtml(cert.department || "\u2014")}</div></div>
          <div><div class="d-label">Institution</div><div class="d-value">${escapeHtml(cert.college || "Government Engineering College Wayanad")}</div></div>
          <div><div class="d-label">Module</div><div class="d-value">${cert.module ? escapeHtml(cert.module) : "\u2014"}</div></div>
          <div><div class="d-label">Date</div><div class="d-value">${escapeHtml(cert.date || "\u2014")}</div></div>
          <div><div class="d-label">Certificate ID</div><div class="d-value mono">${escapeHtml(cert.id)}</div></div>
          <div class="full"><div class="d-label">Issued By</div><div class="d-value">${escapeHtml(cert.issuedBy || "GBOT Robotics Club, GEC Wayanad")}</div></div>
        </div>
        <div class="cert-foot">This certificate is authentic and registered in the GBOT verification registry.</div>
      </div>
      <div class="action-row">
        <a class="btn-outline" href="./">Verify Another Certificate</a>
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
    }).catch(function(){
      btn.textContent = "Copied!";
    });
  });
}

/* ---------- CSV Parser (RFC 4180 compliant) ---------- */
function parseCSV(text){
  const lines = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;

  while(i < text.length){
    const char = text[i];
    const nextChar = text[i + 1];

    if(char === '"'){
      if(inQuotes && nextChar === '"'){
        cell += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if(char === ',' && !inQuotes){
      row.push(cell.trim());
      cell = "";
      i++;
      continue;
    }

    if((char === '\r' || char === '\n') && !inQuotes){
      if(char === '\r' && nextChar === '\n'){
        i++;
      }
      row.push(cell.trim());
      cell = "";
      if(row.some(c => c.length > 0)){
        lines.push(row);
      }
      row = [];
      i++;
      continue;
    }

    cell += char;
    i++;
  }

  if(cell.length > 0 || row.length > 0){
    row.push(cell.trim());
    if(row.some(c => c.length > 0)){
      lines.push(row);
    }
  }

  return lines;
}

function findHeaderIndex(headers, candidates){
  const clean = headers.map(h => (h || "").toLowerCase().replace(/[\s_\-]+/g, " ").trim());
  for(let c of candidates){
    const idx = clean.indexOf(c.toLowerCase());
    if(idx !== -1) return idx;
  }
  return -1;
}

/* ---------- Admin Panel Logic ---------- */
let pendingParsedCerts = [];

function isAdminAuthenticated(){
  return sessionStorage.getItem(STORAGE_KEY_AUTH) === "true";
}

function setAdminAuthenticated(auth){
  if(auth){
    sessionStorage.setItem(STORAGE_KEY_AUTH, "true");
  } else {
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
  }
}

function openAdminModal(){
  const modal = document.getElementById("adminModal");
  if(!modal) return;
  modal.classList.add("open");
  updateAdminView();
}

function closeAdminModal(){
  const modal = document.getElementById("adminModal");
  if(!modal) return;
  modal.classList.remove("open");
  pendingParsedCerts = [];
  const previewCard = document.getElementById("csvPreviewCard");
  if(previewCard) previewCard.style.display = "none";
}

function updateAdminView(){
  const loginView = document.getElementById("adminLoginView");
  const dashView = document.getElementById("adminDashboardView");
  const modalTitle = document.getElementById("modalTitle");

  if(isAdminAuthenticated()){
    loginView.style.display = "none";
    dashView.style.display = "block";
    modalTitle.textContent = "Admin Control Panel";
    refreshDashboardStats();
    renderDatabaseTable();
  } else {
    loginView.style.display = "block";
    dashView.style.display = "none";
    modalTitle.textContent = "Admin Authentication";
    const errorEl = document.getElementById("loginError");
    if(errorEl) errorEl.style.display = "none";
  }
}

function refreshDashboardStats(){
  const all = getAllCertificates();
  const local = getLocalCertificates();
  const totalEl = document.getElementById("dbTotalCount");
  const localEl = document.getElementById("dbLocalCount");
  const builtinEl = document.getElementById("dbBuiltinCount");

  if(totalEl) totalEl.textContent = all.length;
  if(localEl) localEl.textContent = local.length;
  if(builtinEl) builtinEl.textContent = CERTIFICATES.length;
}

function showAdminAlert(message, type){
  const el = document.getElementById("adminAlert");
  if(!el) return;
  el.textContent = message;
  el.className = "admin-alert " + (type || "success");
  el.style.display = "flex";
  setTimeout(() => {
    el.style.display = "none";
  }, 4500);
}

function renderDatabaseTable(filterQuery){
  const tbody = document.getElementById("dbTableBody");
  if(!tbody) return;
  let all = getAllCertificates();

  if(filterQuery){
    const q = filterQuery.toLowerCase().trim();
    all = all.filter(c =>
      (c.id && c.id.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.department && c.department.toLowerCase().includes(q))
    );
  }

  if(all.length === 0){
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--muted); padding:20px;">No certificates found.</td></tr>`;
    return;
  }

  tbody.innerHTML = all.map(c => `
    <tr>
      <td><code style="font-family:'JetBrains Mono',monospace; color:var(--cyan);">${escapeHtml(c.id)}</code></td>
      <td><strong>${escapeHtml(c.name)}</strong></td>
      <td><span style="color:#67e8f9;">${escapeHtml(c.department || "—")}</span></td>
      <td>
        <span class="badge-source ${c._source === 'local' ? 'local' : 'builtin'}">
          ${c._source === 'local' ? 'Imported' : 'Built-in'}
        </span>
      </td>
    </tr>
  `).join("");
}

function handleCsvFile(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const content = e.target.result;
    processCsvContent(content);
  };
  reader.readAsText(file);
}

function processCsvContent(content){
  const rows = parseCSV(content);
  if(rows.length < 2){
    showAdminAlert("The CSV file must contain a header row and at least one data row.", "error");
    return;
  }

  const headers = rows[0];
  const idIdx = findHeaderIndex(headers, ["certificate id", "cert id", "certificate_id", "cert_id", "id"]);
  const nameIdx = findHeaderIndex(headers, ["name", "full name", "participant name", "student name"]);
  const deptIdx = findHeaderIndex(headers, ["department", "dept", "branch"]);

  if(idIdx === -1 || nameIdx === -1 || deptIdx === -1){
    showAdminAlert("Missing required headers! Please ensure columns 'Certificate ID', 'Name', and 'Department' are present.", "error");
    return;
  }

  const defProgram = (document.getElementById("defProgram")?.value || "").trim() || "G-Bot Maker Series: Concept to Circuit";
  const defCollege = (document.getElementById("defCollege")?.value || "").trim() || "Government Engineering College Wayanad";
  const defDate = (document.getElementById("defDate")?.value || "").trim() || "12 July 2026";
  const defType = (document.getElementById("defType")?.value || "").trim() || "Certificate of Participation";

  pendingParsedCerts = [];
  for(let i = 1; i < rows.length; i++){
    const row = rows[i];
    const certId = (row[idIdx] || "").trim();
    const name = (row[nameIdx] || "").trim();
    const dept = (row[deptIdx] || "").trim();

    if(!certId && !name) continue; // skip blank row

    pendingParsedCerts.push({
      id: certId,
      name: name,
      department: dept,
      college: defCollege,
      program: defProgram,
      module: "",
      type: defType,
      date: defDate,
      issuedBy: "GBOT Robotics Club, GEC Wayanad"
    });
  }

  if(pendingParsedCerts.length === 0){
    showAdminAlert("No valid data rows found in the CSV file.", "error");
    return;
  }

  // Display preview
  const countEl = document.getElementById("parsedRowCount");
  const previewCard = document.getElementById("csvPreviewCard");
  const tbody = document.getElementById("previewTableBody");

  if(countEl) countEl.textContent = pendingParsedCerts.length;
  if(tbody){
    tbody.innerHTML = pendingParsedCerts.slice(0, 50).map((c, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><code>${escapeHtml(c.id)}</code></td>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.department)}</td>
      </tr>
    `).join("");

    if(pendingParsedCerts.length > 50){
      tbody.innerHTML += `<tr><td colspan="4" style="text-align:center; color:var(--muted);">...and ${pendingParsedCerts.length - 50} more records</td></tr>`;
    }
  }

  if(previewCard) previewCard.style.display = "block";
}

function commitImport(){
  if(!pendingParsedCerts.length){
    showAdminAlert("No parsed records to import.", "error");
    return;
  }

  const existingLocal = getLocalCertificates();
  const localMap = new Map();

  existingLocal.forEach(c => {
    if(c && c.id) localMap.set(normalize(c.id), c);
  });

  let added = 0;
  let updated = 0;

  pendingParsedCerts.forEach(c => {
    const key = normalize(c.id);
    if(localMap.has(key)){
      localMap.set(key, { ...localMap.get(key), ...c });
      updated++;
    } else {
      localMap.set(key, c);
      added++;
    }
  });

  const merged = Array.from(localMap.values());
  saveLocalCertificates(merged);

  showAdminAlert(`Success! Added ${added} new and updated ${updated} existing certificate records.`, "success");
  
  pendingParsedCerts = [];
  const previewCard = document.getElementById("csvPreviewCard");
  if(previewCard) previewCard.style.display = "none";

  refreshDashboardStats();
  renderDatabaseTable();

  // If currently on home view, re-render to update stats
  const params = new URLSearchParams(window.location.search);
  if(!params.get("cert") && !params.get("id")){
    const app = document.getElementById("app");
    if(app){
      app.innerHTML = renderHome();
      attachHomeHandlers();
    }
  }
}

function generateScriptContent(){
  const all = getAllCertificates();
  const jsLines = [
    "/* =========================================================",
    "   GBOT CERTIFICATE DATABASE",
    "   ---------------------------------------------------------",
    "   Auto-generated registry with all certificates.",
    "   ========================================================= */",
    "const CERTIFICATES = ["
  ];

  all.forEach((c, idx) => {
    jsLines.push("  {");
    jsLines.push(`    id: ${JSON.stringify(c.id || "")},`);
    jsLines.push(`    name: ${JSON.stringify(c.name || "")},`);
    jsLines.push(`    department: ${JSON.stringify(c.department || "")},`);
    jsLines.push(`    college: ${JSON.stringify(c.college || "")},`);
    jsLines.push(`    program: ${JSON.stringify(c.program || "")},`);
    jsLines.push(`    module: ${JSON.stringify(c.module || "")},`);
    jsLines.push(`    type: ${JSON.stringify(c.type || "")},`);
    jsLines.push(`    date: ${JSON.stringify(c.date || "")},`);
    jsLines.push(`    issuedBy: ${JSON.stringify(c.issuedBy || "")}`);
    const comma = idx < all.length - 1 ? "," : "";
    jsLines.push(`  }${comma}`);
  });
  jsLines.push("];");

  return jsLines.join("\n");
}

function downloadUpdatedScript(){
  const scriptElement = document.querySelector('script[src="script.js"]');
  fetch("script.js")
    .then(r => r.text())
    .then(fullJs => {
      const dbArrayRegex = /const\s+CERTIFICATES\s*=\s*\[[\s\S]*?\];/;
      const newArray = generateScriptContent();
      const updatedCode = fullJs.replace(dbArrayRegex, newArray);
      
      const blob = new Blob([updatedCode], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "script.js";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showAdminAlert("Downloaded updated script.js! Replace this in your repo to deploy globally.", "success");
    })
    .catch(() => {
      // Fallback: download just the array snippet
      const newArray = generateScriptContent();
      const blob = new Blob([newArray], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certificates-db.js";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
}

function copyDatabaseCode(){
  const code = generateScriptContent();
  navigator.clipboard.writeText(code).then(() => {
    showAdminAlert("Copied CERTIFICATES database code to clipboard!", "success");
  }).catch(() => {
    showAdminAlert("Failed to copy. Please allow clipboard permissions.", "error");
  });
}

function downloadSampleCSV(){
  const csvContent = "Certificate ID,Name,Department\n" +
    "GBOT-CTC-2026-0001,Arjun Krishna,Computer Science and Engineering\n" +
    "GBOT-CTC-2026-0002,Fathima Noor,Electronics and Communication Engineering\n" +
    "GBOT-CTC-2026-0003,Rahul Varma,Mechanical Engineering\n" +
    "GBOT-CTC-2026-0004,Ananya S,Electrical and Electronics Engineering\n" +
    "GBOT-CTC-2026-0005,Muhammed Mashhood K,Civil Engineering\n";

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample_certificates.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function attachAdminListeners(){
  const openBtn = document.getElementById("openAdminBtn");
  const closeBtn = document.getElementById("closeAdminBtn");
  const modal = document.getElementById("adminModal");
  const loginForm = document.getElementById("adminLoginForm");
  const logoutBtn = document.getElementById("adminLogoutBtn");
  const dropzone = document.getElementById("csvDropzone");
  const fileInput = document.getElementById("csvFileInput");
  const commitBtn = document.getElementById("commitImportBtn");
  const cancelPreviewBtn = document.getElementById("cancelPreviewBtn");
  const downloadScriptBtn = document.getElementById("downloadScriptBtn");
  const copyJsonBtn = document.getElementById("copyJsonBtn");
  const sampleCsvBtn = document.getElementById("downloadSampleCsvBtn");
  const clearStorageBtn = document.getElementById("clearStorageBtn");
  const dbSearchInput = document.getElementById("dbSearchInput");

  if(openBtn) openBtn.addEventListener("click", openAdminModal);
  if(closeBtn) closeBtn.addEventListener("click", closeAdminModal);
  
  if(modal){
    modal.addEventListener("click", function(e){
      if(e.target === modal) closeAdminModal();
    });
  }

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && modal && modal.classList.contains("open")){
      closeAdminModal();
    }
  });

  if(loginForm){
    loginForm.addEventListener("submit", function(e){
      e.preventDefault();
      const u = (document.getElementById("adminUsername")?.value || "").trim();
      const p = (document.getElementById("adminPassword")?.value || "");
      const errorEl = document.getElementById("loginError");

      if(u.toLowerCase() === ADMIN_CREDS.username.toLowerCase() && p === ADMIN_CREDS.password){
        setAdminAuthenticated(true);
        loginForm.reset();
        updateAdminView();
      } else {
        if(errorEl){
          errorEl.textContent = "Invalid username or password. Please try again.";
          errorEl.style.display = "block";
        }
      }
    });
  }

  if(logoutBtn){
    logoutBtn.addEventListener("click", function(){
      setAdminAuthenticated(false);
      updateAdminView();
    });
  }

  if(dropzone && fileInput){
    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if(e.dataTransfer.files && e.dataTransfer.files.length > 0){
        handleCsvFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if(e.target.files && e.target.files.length > 0){
        handleCsvFile(e.target.files[0]);
      }
    });
  }

  if(commitBtn) commitBtn.addEventListener("click", commitImport);
  if(cancelPreviewBtn){
    cancelPreviewBtn.addEventListener("click", () => {
      pendingParsedCerts = [];
      const card = document.getElementById("csvPreviewCard");
      if(card) card.style.display = "none";
    });
  }

  if(downloadScriptBtn) downloadScriptBtn.addEventListener("click", downloadUpdatedScript);
  if(copyJsonBtn) copyJsonBtn.addEventListener("click", copyDatabaseCode);
  if(sampleCsvBtn) sampleCsvBtn.addEventListener("click", downloadSampleCSV);

  if(clearStorageBtn){
    clearStorageBtn.addEventListener("click", () => {
      if(confirm("Are you sure you want to clear all browser-imported certificates? Built-in certificates will remain intact.")){
        localStorage.removeItem(STORAGE_KEY_CERTS);
        showAdminAlert("Cleared browser-imported certificates.", "success");
        refreshDashboardStats();
        renderDatabaseTable();
        // re-render home page stats
        const app = document.getElementById("app");
        if(app && (!window.location.search || window.location.search === "?")){
          app.innerHTML = renderHome();
          attachHomeHandlers();
        }
      }
    });
  }

  if(dbSearchInput){
    dbSearchInput.addEventListener("input", (e) => {
      renderDatabaseTable(e.target.value);
    });
  }
}

/* ---------- Main Initializer ---------- */
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

  attachAdminListeners();
}

init();
