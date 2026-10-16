# 🤖 GBOT Certificate Verifier

An official certificate verification portal for **GBOT Robotics Club, GEC Wayanad**. Anyone holding a GBOT-issued certificate can verify its authenticity by entering the certificate ID or scanning the QR code on the certificate.

---

## ✨ Features

- 🔍 **Instant certificate lookup** by ID or QR code scan
- 🔐 **Admin panel** with CSV import for bulk certificate upload
- 💾 **Browser-local storage** for imported records
- 📥 **Export updated script** to bake certificates into the JS source
- 📱 **Fully responsive** — works on mobile and desktop
- 🚀 **Zero backend required** — pure static HTML/CSS/JS

---

## 🚀 Getting Started

### Option 1: Direct Hosting (Recommended)

Just upload `index.html`, `style.css`, `script.js`, and the `assets/` folder to any static host:

- [GitHub Pages](https://pages.github.com/)
- [Vercel](https://vercel.com/) — just import the repo, it works out of the box
- [Netlify](https://netlify.com/)
- Any basic web hosting (cPanel, etc.)

### Option 2: Local Dev Server (Node.js)

```bash
node server.js
# Opens at http://localhost:8085
```

---

## 🔑 Admin Panel

Click the **Admin** button on the site (bottom-right) to open the admin panel.

> **⚠️ Change the default credentials before deploying!**

Default credentials are set in `script.js`:

```js
const ADMIN_CREDS = {
  username: "Gbot",
  password: "Gbot@123"
};
```

Change these to your own username and password before pushing to GitHub or deploying.

---

## 📋 Adding Certificates

### Via Admin Panel (recommended)
1. Click **Admin** on the site
2. Log in with your credentials
3. Upload a `.csv` file with columns: `Certificate ID`, `Name`, `Department`
4. Preview & confirm the import
5. Use **Download Updated script.js** to get a new script.js with all records baked in
6. Replace the `script.js` in your repo and redeploy

### Via Python Script (bulk import to script.js)

```bash
python import_csv.py your_certificates.csv \
  --program "Your Workshop Name" \
  --date "October 2026" \
  --college "Your College"
```

### CSV Format

| Certificate ID     | Name          | Department                         |
|--------------------|---------------|------------------------------------|
| GBOT-CTC-2026-0001 | Arjun Krishna | Computer Science and Engineering   |
| GBOT-CTC-2026-0002 | Fathima Noor  | Electronics and Communication Engg |

---

## 📁 Project Structure

```
gbot-certificates-verifier/
├── index.html           # Main page
├── style.css            # All styles
├── script.js            # App logic + certificate database
├── server.js            # Local dev server (optional)
├── import_csv.py        # CLI tool to bulk-import CSV into script.js
├── sample_certificates.csv   # Example CSV template
└── assets/
    ├── gbot-logo.png
    └── gec-logo.png
```

> **Do not commit real participant data CSV files.** They are listed in `.gitignore`.

---

## 📄 License

This project is open for use by GBOT Robotics Club and GEC Wayanad. Feel free to fork and adapt it for your organization.

---

Made with ❤️ by GBOT Robotics Club, GEC Wayanad
