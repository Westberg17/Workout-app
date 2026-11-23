# Pass – träningsapp för mobilen

En webbapp (PWA) som visar dagens pass, låter dig logga set direkt på gymmet och räknar ut nästa pass automatiskt.
Valfritt: Claude analyserar passet efteråt och föreslår justeringar.

## Funktioner
- **Idag**: dagens pass enligt veckoschemat, med målvikt och reps per övning. Vilodagar visar rörlighetsövningar. Pass som inte körts tidigare i veckan visas så att du kan köra dem senare.
- **Loggning**: vikt, reps och RIR per set, vilotimer, hoppa över eller lägga till set, anteckningar. Ett pågående pass sparas löpande.
- **Efter passet**: betyg (energi, passkänsla, ländrygg …) och kommentar. Därefter räknas nästa mål fram.
- **Progression** (`src/progression.ts`): dubbel progression med RIR-styrning, deload efter två missar i rad, och ingen viktökning en dålig dag.
- **AI-coach** (`src/ai.ts`): skickar en kompakt sammanfattning till Claude (Haiku 5.5 som standard) och får tillbaka strukturerad JSON med sammanfattning, tips och förslag på justeringar som du kan godkänna.
- **Program**: redigera pass, övningar, repintervall, viktsteg och veckoschema i appen.
- **Data**: allt ligger lokalt i telefonen. Backup kan exporteras och importeras som JSON.

## Utveckling
```bash
npm install
npm run dev      # lokal utvecklingsserver
npm test         # tester för progressionslogiken
npm run build    # bygger till dist/
```

## Publicering
Appen är statisk (mappen `dist/`) och kan hostas var som helst.
`.github/workflows/deploy.yml` publicerar till GitHub Pages vid push till `main`
(kräver Settings → Pages → Source: *GitHub Actions*).

## Installera på iPhone
1. Öppna appens adress i **Safari**.
2. Tryck på Dela → **Lägg till på hemskärmen**.
3. Öppna appen från hemskärmen. Den körs i helskärm och fungerar offline.
