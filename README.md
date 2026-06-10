# ORBIT — Immobilienrechner

Minimalistische, „abgespacete" Website mit drei Immobilienrechnern und durchgerechneten Beispielprojekten. Reines HTML/CSS/JS — kein Build-Step, keine Dependencies.

## Seiten

- `index.html` — Landingpage mit animierter Orbit-Signatur
- `rechner.html` — drei Live-Rechner:
  - **Kaufnebenkosten** (Grunderwerbsteuer nach Bundesland, Notar/Grundbuch, Makler)
  - **Mietrendite & Cashflow** (Brutto-/Nettorendite, Kaufpreisfaktor, monatlicher Cashflow)
  - **Finanzierung** (Annuitätendarlehen: Monatsrate, Restschuld, Zinskosten, Laufzeit)
- `projekte.html` — drei fiktive Beispielprojekte mit Kennzahlen

## Auf Netlify deployen

**Option A — Drag & Drop (schnellster Weg):**
1. https://app.netlify.com/drop öffnen
2. Diesen Ordner reinziehen — fertig.

**Option B — Über Git (empfohlen):**
1. Repo zu GitHub/GitLab pushen:
   ```bash
   git remote add origin https://github.com/DEIN-USER/orbit-immo.git
   git push -u origin main
   ```
2. In Netlify: „Add new site" → „Import an existing project" → Repo auswählen
3. Build-Einstellungen leer lassen (Publish directory: `.`) → Deploy

**Option C — Netlify CLI:**
```bash
npm i -g netlify-cli
netlify deploy --prod --dir .
```

## Lokal ansehen

Einfach `index.html` im Browser öffnen, oder:
```bash
python3 -m http.server 8000
```

## Hinweis

Alle Berechnungen sind vereinfachte Richtwerte und keine Anlage- oder Steuerberatung.
