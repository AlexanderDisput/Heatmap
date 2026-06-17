      const sampleCityData = [
        { city: "New York", spend: 145000, applications: 1120, jobs: 74, cpa: 129.5 },
        { city: "Los Angeles", spend: 128000, applications: 980, jobs: 68, cpa: 130.6 },
        { city: "Chicago", spend: 101000, applications: 910, jobs: 65, cpa: 111.0 },
        { city: "Dallas", spend: 89000, applications: 780, jobs: 59, cpa: 114.1 },
        { city: "Houston", spend: 97000, applications: 690, jobs: 51, cpa: 140.6 },
        { city: "Phoenix", spend: 76000, applications: 720, jobs: 56, cpa: 105.6 },
        { city: "Philadelphia", spend: 92000, applications: 605, jobs: 44, cpa: 152.1 },
        { city: "San Antonio", spend: 63000, applications: 610, jobs: 47, cpa: 103.3 },
        { city: "San Diego", spend: 81000, applications: 560, jobs: 41, cpa: 144.6 },
        { city: "Jacksonville", spend: 58000, applications: 530, jobs: 40, cpa: 109.4 },
        { city: "Austin", spend: 84000, applications: 760, jobs: 58, cpa: 110.5 },
        { city: "San Jose", spend: 74000, applications: 495, jobs: 38, cpa: 149.5 },
        { city: "Columbus", spend: 52000, applications: 470, jobs: 35, cpa: 110.6 },
        { city: "Charlotte", spend: 61000, applications: 510, jobs: 37, cpa: 119.6 },
        { city: "Indianapolis", spend: 49000, applications: 450, jobs: 34, cpa: 108.9 },
        { city: "Seattle", spend: 88000, applications: 530, jobs: 39, cpa: 166.0 }
      ];

      const svg = document.getElementById("chart");
      const tableBody = document.getElementById("table-body");
      const fileInput = document.getElementById("csv-file");
      const statusEl = document.getElementById("status");
      const tooltipEl = document.getElementById("tooltip");
      const embedded = new URLSearchParams(window.location.search).get("embedded") === "1";
      const SHARED_UPLOAD_MESSAGE = "shared-csv-upload";
      const UI_LANGUAGE_MESSAGE = "ui-language-changed";
      const gradientStops = { low: "#d93025", mid: "#f6c343", high: "#1a9850" };
      const countryCurrencyMap = {
        US: "USD", GB: "GBP", UK: "GBP", IE: "EUR", DE: "EUR", FR: "EUR", NL: "EUR", ES: "EUR", IT: "EUR", BE: "EUR",
        CH: "CHF", AT: "EUR", LU: "EUR", PT: "EUR", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF",
        RO: "RON", BG: "BGN", HR: "EUR", SI: "EUR", SK: "EUR", CA: "CAD", AU: "AUD", NZ: "NZD", JP: "JPY"
      };
      let currentLanguage = "en";
      let expandedCities = new Set();
      let lastRawCityData = [];
      let lastRenderedCityData = [];
      let showApplicationsMetrics = true;
      const tableSort = { key: "spend", dir: "desc" };
      let selectedCostMetric = "cpas";
      let costFilter = { min: null, max: null };
      let medianJobFilterMode = "none";
      let medianCityCPA = null;
      let medianCityCPAS = null;
      let medianJobCPA = null;
      let medianJobCPAS = null;
      let zoomState = null;
      let chartScaleState = null;
      let zoomBrushState = { active: false, startX: 0, startY: 0, rect: null };
      let zoomPromptEl = null;
      let suppressZoomPromptClick = false;
      let lastUploadExportMeta = null;
      let selectedCityTableFilter = "";
      let selectedCityCountryFilter = "";
      let selectedCountryFilter = "__all__";
      let selectedPositionStatus = "both";
      let hasOpenUploadStatuses = false;
      let hasClosedUploadStatuses = false;
      let lastUploadRawRows = null;
      let lastUploadRawCsvText = "";
      let lastUploadSourceLabel = "";
      let activeCurrencyContext = { mixed: false, currencyCode: "USD" };
      const uiText = {
        en: { title: "Budget Efficiency (CPA/CPAS vs Volume)", subtitle: "X = Volume (Applications or Apply starts), Y = Cost (CPA or CPAS), bubble size = Jobs, color = cost percentile.", graphMetric: "Graph cost metric", min: "Min", max: "Max", apply: "Apply", resetZoom: "Reset Zoom", legend: "Higher on the Y-axis means higher cost.", cpaBtn: "CPA Above Median", cpasBtn: "CPAS Above Median", exportBtn: "Export", defaultStatus: "Showing built-in sample data. Upload a CSV to replace it." },
        de: { title: "Budget-Effizienz (CPA/CPAS vs Volumen)", subtitle: "X = Volumen (Bewerbungen oder Starts), Y = Kosten (CPA oder CPAS), Blasengröße = Jobs, Farbe = Kosten-Perzentil.", graphMetric: "Kostenmetrik", min: "Min", max: "Max", apply: "Anwenden", resetZoom: "Zoom zurücksetzen", legend: "Höher auf der Y-Achse bedeutet höhere Kosten.", cpaBtn: "CPA über Median", cpasBtn: "CPAS über Median", exportBtn: "Export", defaultStatus: "Beispieldaten werden angezeigt. CSV hochladen zum Ersetzen." },
        fr: { title: "Efficacité budget (CPA/CPAS vs volume)", subtitle: "X = volume (candidatures ou démarrages), Y = coût (CPA ou CPAS), taille = jobs, couleur = percentile de coût.", graphMetric: "Métrique de coût", min: "Min", max: "Max", apply: "Appliquer", resetZoom: "Réinitialiser le zoom", legend: "Plus haut sur l'axe Y signifie un coût plus élevé.", cpaBtn: "CPA au-dessus de la médiane", cpasBtn: "CPAS au-dessus de la médiane", exportBtn: "Exporter", defaultStatus: "Données de démonstration affichées. Importez un CSV pour remplacer." },
        es: { title: "Eficiencia de presupuesto (CPA/CPAS vs volumen)", subtitle: "X = volumen (solicitudes o inicios), Y = coste (CPA o CPAS), tamaño = empleos, color = percentil de coste.", graphMetric: "Métrica de coste", min: "Mín", max: "Máx", apply: "Aplicar", resetZoom: "Restablecer zoom", legend: "Más arriba en el eje Y significa mayor coste.", cpaBtn: "CPA por encima de mediana", cpasBtn: "CPAS por encima de mediana", exportBtn: "Exportar", defaultStatus: "Mostrando datos de demostración. Sube un CSV para reemplazar." },
        it: { title: "Efficienza budget (CPA/CPAS vs volume)", subtitle: "X = volume (candidature o avvii), Y = costo (CPA o CPAS), dimensione = lavori, colore = percentile costo.", graphMetric: "Metrica costo", min: "Min", max: "Max", apply: "Applica", resetZoom: "Reimposta zoom", legend: "Più in alto sull'asse Y significa costo più alto.", cpaBtn: "CPA sopra mediana", cpasBtn: "CPAS sopra mediana", exportBtn: "Esporta", defaultStatus: "Dati demo visualizzati. Carica un CSV per sostituire." },
        nl: { title: "Budgetefficiëntie (CPA/CPAS vs volume)", subtitle: "X = volume (sollicitaties of starts), Y = kosten (CPA of CPAS), bubbelgrootte = jobs, kleur = kostenpercentiel.", graphMetric: "Kostmetriek", min: "Min", max: "Max", apply: "Toepassen", resetZoom: "Zoom resetten", legend: "Hoger op de Y-as betekent hogere kosten.", cpaBtn: "CPA boven mediaan", cpasBtn: "CPAS boven mediaan", exportBtn: "Exporteren", defaultStatus: "Voorbeelddata wordt getoond. Upload een CSV om te vervangen." }
      };
      const defaultTableLabels = {
        name: "City / Job",
        spend: "Spend",
        applyStarts: "Apply starts",
        applications: "Applications",
        jobs: "Jobs",
        cpas: "CPAS",
        cpa: "CPA"
      };
      const tableLabelsByLanguage = {
        en: { ...defaultTableLabels },
        de: {
          name: "Stadt / Job",
          spend: "Ausgaben",
          applyStarts: "Bewerbungsstarts",
          applications: "Bewerbungen",
          jobs: "Jobs",
          cpas: "CPAS",
          cpa: "CPA"
        },
        fr: {
          name: "Ville / Poste",
          spend: "Dépenses",
          applyStarts: "Débuts de candidature",
          applications: "Candidatures",
          jobs: "Jobs",
          cpas: "CPAS",
          cpa: "CPA"
        },
        es: {
          name: "Ciudad / Puesto",
          spend: "Gasto",
          applyStarts: "Inicios de solicitud",
          applications: "Solicitudes",
          jobs: "Empleos",
          cpas: "CPAS",
          cpa: "CPA"
        },
        it: {
          name: "Città / Ruolo",
          spend: "Spesa",
          applyStarts: "Avvii candidatura",
          applications: "Candidature",
          jobs: "Lavori",
          cpas: "CPAS",
          cpa: "CPA"
        },
        nl: {
          name: "Plaats / Vacature",
          spend: "Uitgaven",
          applyStarts: "Gestarte sollicitaties",
          applications: "Sollicitaties",
          jobs: "Jobs",
          cpas: "CPAS",
          cpa: "CPA"
        }
      };
      const exportHeaderI18n = {
        en: { job: "Job", city: "City", country: "Country", region: "State/Region", company: "Company name", reference: "Reference #", impressions: "Impressions", ctr: "Clickthrough rate (CTR)", clicks: "Clicks", asr: "Apply start rate (ASR)", applystarts: "Apply starts", acr: "Apply completion rate (ACR)", applies: "Applies", ar: "Apply rate (AR)", spend: "Spend", cpc: "Cost per click (CPC)", cpas: "Cost per apply start (CPAS)", cpa: "Cost per apply (CPA)", status: "Job status", campaign: "Campaigns" },
        de: { job: "Stelle", city: "Stadt", country: "Land", region: "Bundesland/Region", company: "Unternehmensname", reference: "Referenz #", impressions: "Impressionen", ctr: "Klickrate (CTR)", clicks: "Klicks", asr: "Rate begonnener Bewerbungen (ASR)", applystarts: "Begonnene Bewerbungen", acr: "Abschlussrate Bewerbung (ACR)", applies: "Bewerbungen", ar: "Bewerbungsrate (AR)", spend: "Ausgaben", cpc: "Kosten pro Klick (CPC)", cpas: "Kosten pro begonnene Bewerbung (CPAS)", cpa: "Kosten pro Bewerbung (CPA)", status: "Status der Stellenanzeige", campaign: "Kampagnen" },
        fr: { job: "Emploi", city: "Ville", country: "Pays", region: "Région", company: "Nom de l'entreprise", reference: "Référence #", impressions: "Impressions", ctr: "Taux de clics (CTR)", clicks: "Clics", asr: "Taux de candidatures commencées (ASR)", applystarts: "Candidatures commencées", acr: "Taux de candidature terminée (ACR)", applies: "Candidatures", ar: "Taux de candidature (AR)", spend: "Dépenses", cpc: "Coût par clic (CPC)", cpas: "Coût par candidature commencée (CPAS)", cpa: "Coût par candidature (CPA)", status: "Statut de l'emploi", campaign: "Campagnes" },
        es: { job: "Empleo", city: "Ciudad", country: "País", region: "Estado/Región", company: "Nombre de la empresa", reference: "Referencia #", impressions: "Impresiones", ctr: "Porcentaje de clics (CTR)", clicks: "Clics", asr: "Porcentaje de postulaciones iniciadas (ASR)", applystarts: "Postulaciones iniciadas", acr: "Tasa de finalización de solicitud (ACR)", applies: "Postulaciones", ar: "Tasa de solicitud (AR)", spend: "Gasto", cpc: "Coste por clic (CPC)", cpas: "Coste por postulación iniciada (CPAS)", cpa: "Coste por solicitud (CPA)", status: "Estado del empleo", campaign: "Campañas" },
        it: { job: "Annuncio", city: "Città", country: "Paese", region: "Regione", company: "Nome dell'azienda", reference: "Riferimento #", impressions: "Impression", ctr: "Percentuale di click (CTR)", clicks: "Clic", asr: "Percentuale di candidature avviate (ASR)", applystarts: "Candidature avviate", acr: "Percentuale di completamento candidatura (ACR)", applies: "Candidature", ar: "Tasso di candidatura (AR)", spend: "Spesa", cpc: "Costo per clic (CPC)", cpas: "Costo per candidatura avviata (CPAS)", cpa: "Costo per candidatura (CPA)", status: "Stato dell'annuncio", campaign: "Campagne" },
        nl: { job: "Vacature", city: "Plaats", country: "Land", region: "Provincie/Regio", company: "Bedrijfsnaam", reference: "Referentie #", impressions: "Impressies", ctr: "Klikfrequentie (CTR)", clicks: "Kliks", asr: "Percentage gestarte sollicitaties (ASR)", applystarts: "Gestarte sollicitaties", acr: "Sollicitatievoltooiingspercentage (ACR)", applies: "Sollicitaties", ar: "Sollicitatiepercentage (AR)", spend: "Besteding", cpc: "Kosten per klik (CPC)", cpas: "Kosten per gestarte sollicitatie (CPAS)", cpa: "Kosten per sollicitatie (CPA)", status: "Vacaturestatus", campaign: "Campagnes" }
      };

      const width = 1120;
      const height = 620;
      const margin = { top: 26, right: 40, bottom: 65, left: 88 };
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      function normalizeHeader(header) {
        return String(header || "")
          .replace(/^\uFEFF/, "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");
      }

      function applyUiLanguage(lang) {
        currentLanguage = uiText[lang] ? lang : "en";
        const t = uiText[currentLanguage] || uiText.en;
        const set = (id, value) => {
          const el = document.getElementById(id);
          if (el) el.textContent = value;
        };
        set("pageTitle", t.title);
        set("pageSubtitle", t.subtitle);
        set("graphMetricLabel", t.graphMetric);
        set("minLabel", t.min);
        set("maxLabel", t.max);
        set("applyCostFilterBtn", t.apply);
        set("resetZoomBtn", t.resetZoom || "Reset Zoom");
        set("legendNote", t.legend);
        set("filterMedianCpaBtn", t.cpaBtn);
        set("filterMedianCpasBtn", t.cpasBtn);
        set("exportFilteredBtn", t.exportBtn);
        setTableHeaderLabels(tableLabelsByLanguage[currentLanguage] || defaultTableLabels);
        if (!lastUploadExportMeta) statusEl.textContent = t.defaultStatus;
      }

      function percentileRank(sortedValues, value) {
        const idx = sortedValues.indexOf(value);
        if (idx < 0 || sortedValues.length === 1) return 50;
        return (idx / (sortedValues.length - 1)) * 100;
      }

      function parseNumber(value) {
        if (value == null) return null;
        const trimmed = String(value).trim();
        if (!trimmed) return null;
        const direct = Number(trimmed.replace(/[%\s]/g, "").replace(/,/g, ""));
        if (Number.isFinite(direct)) return direct;
        const cleaned = trimmed
          .replace(/[^\d,.-]/g, "")
          .replace(/\s/g, "");
        if (!cleaned) return null;
        const lastComma = cleaned.lastIndexOf(",");
        const lastDot = cleaned.lastIndexOf(".");
        let normalized = cleaned;
        if (lastComma > lastDot) {
          normalized = cleaned.replace(/\./g, "").replace(",", ".");
        } else {
          normalized = cleaned.replace(/,/g, "");
        }
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
      }

      function inferCurrencyFromCountry(countryRaw) {
        const raw = String(countryRaw || "").trim();
        if (!raw) return "";
        const key = raw.toUpperCase();
        if (countryCurrencyMap[key]) return countryCurrencyMap[key];
        const token = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
        const nameToCode = {
          unitedstates: "US", usa: "US", us: "US",
          unitedkingdom: "GB", uk: "GB", greatbritain: "GB", britain: "GB", england: "GB",
          germany: "DE", deutschland: "DE",
          france: "FR", italy: "IT", italia: "IT", spain: "ES", espana: "ES", netherlands: "NL", nederland: "NL",
          belgium: "BE", belgique: "BE", belgie: "BE", ireland: "IE", switzerland: "CH", schweiz: "CH", suisse: "CH",
          austria: "AT", osterreich: "AT", österreich: "AT"
        };
        const iso = nameToCode[token] || "";
        return iso ? (countryCurrencyMap[iso] || "") : "";
      }

      function normalizeCurrencyCode(rawCurrency, countryRaw = "") {
        const raw = String(rawCurrency || "").trim();
        if (!raw) return inferCurrencyFromCountry(countryRaw);
        const upper = raw.toUpperCase();
        if (/^[A-Z]{3}$/.test(upper)) return upper;
        const token = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (token.includes("usd") || token.includes("dollar")) return "USD";
        if (token.includes("eur") || token.includes("euro")) return "EUR";
        if (token.includes("gbp") || token.includes("pound") || token.includes("sterling")) return "GBP";
        if (token.includes("chf") || token.includes("swiss") || token.includes("franc")) return "CHF";
        if (token.includes("cad")) return "CAD";
        if (token.includes("aud")) return "AUD";
        if (token.includes("nzd")) return "NZD";
        if (token.includes("jpy") || token.includes("yen")) return "JPY";
        if (token.includes("sek")) return "SEK";
        if (token.includes("nok")) return "NOK";
        if (token.includes("dkk")) return "DKK";
        if (token.includes("pln")) return "PLN";
        if (token.includes("czk")) return "CZK";
        if (token.includes("huf")) return "HUF";
        if (token.includes("ron")) return "RON";
        if (token.includes("bgn")) return "BGN";
        if (token.includes("€") || token.includes("eur")) return "EUR";
        if (token.includes("$")) return inferCurrencyFromCountry(countryRaw) || "USD";
        if (token.includes("£")) return "GBP";
        if (token.includes("₣") || token.includes("fr")) return "CHF";
        return inferCurrencyFromCountry(countryRaw);
      }

      function formatCurrencyValue(value, currencyCode, minimumFractionDigits = 2, maximumFractionDigits = 2) {
        const amount = Number(value || 0);
        const code = String(currencyCode || "").trim().toUpperCase();
        if (!code) return amount.toLocaleString(undefined, { minimumFractionDigits, maximumFractionDigits });
        try {
          return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: code,
            minimumFractionDigits,
            maximumFractionDigits
          }).format(amount);
        } catch {
          return `${code} ${amount.toLocaleString(undefined, { minimumFractionDigits, maximumFractionDigits })}`;
        }
      }

      function getCurrencyContext(rows) {
        const currencies = Array.from(
          new Set(
            (Array.isArray(rows) ? rows : [])
              .map((row) => String(row.currency || "").trim().toUpperCase())
              .filter(Boolean)
          )
        );
        if (!currencies.length) return { mixed: false, currencyCode: "" };
        if (currencies.length === 1) return { mixed: false, currencyCode: currencies[0] };
        return { mixed: true, currencyCode: "" };
      }

      function normalizePositionStatus(value) {
        const token = String(value || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z]/g, "");
        if (!token) return "unknown";
        const openTokens = [
          "open", "offen", "ouvert", "abierta", "aperta", "active", "actief", "activo", "attiva", "running", "live", "published", "publicada", "verooffentlicht", "veroefentlicht"
        ];
        const closedTokens = [
          "closed", "gesloten", "geschlossen", "ferme", "cerrada", "chiusa", "inactive", "inactief", "inactivo", "nonactive", "paused"
        ];
        if (openTokens.some((candidate) => token.includes(candidate))) return "open";
        if (closedTokens.some((candidate) => token.includes(candidate))) return "closed";
        return "unknown";
      }

      function passesPositionStatusFilter(row = {}) {
        if (selectedPositionStatus === "both") return true;
        return normalizePositionStatus(row.status) === selectedPositionStatus;
      }

      function setPositionFilterAvailabilityFromRows(rows) {
        const list = Array.isArray(rows) ? rows : [];
        hasOpenUploadStatuses = list.some((row) => normalizePositionStatus(row.status) === "open");
        hasClosedUploadStatuses = list.some((row) => normalizePositionStatus(row.status) === "closed");
        if (selectedPositionStatus === "open" && !hasOpenUploadStatuses) selectedPositionStatus = "both";
        if (selectedPositionStatus === "closed" && !hasClosedUploadStatuses) selectedPositionStatus = "both";
      }

      function updatePositionStatusOptions() {
        const selector = document.getElementById("positionStatusSelector");
        if (!selector) return;
        const openOpt = selector.querySelector('option[value="open"]');
        const closedOpt = selector.querySelector('option[value="closed"]');
        if (openOpt) openOpt.disabled = !hasOpenUploadStatuses;
        if (closedOpt) closedOpt.disabled = !hasClosedUploadStatuses;
        if (selectedPositionStatus === "open" && openOpt && openOpt.disabled) selectedPositionStatus = "both";
        if (selectedPositionStatus === "closed" && closedOpt && closedOpt.disabled) selectedPositionStatus = "both";
        selector.value = selectedPositionStatus;
      }

      function escapeHtml(value) {
        return String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function parseCsv(text) {
        const rows = [];
        let row = [];
        let field = "";
        let inQuotes = false;

        for (let i = 0; i < text.length; i += 1) {
          const char = text[i];

          if (inQuotes) {
            if (char === '"') {
              if (text[i + 1] === '"') {
                field += '"';
                i += 1;
              } else {
                inQuotes = false;
              }
            } else {
              field += char;
            }
          } else if (char === '"') {
            inQuotes = true;
          } else if (char === ",") {
            row.push(field);
            field = "";
          } else if (char === "\n") {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
          } else if (char !== "\r") {
            field += char;
          }
        }

        row.push(field);
        if (row.some((cell) => cell.length > 0)) rows.push(row);
        return rows;
      }

      function findHeaderMeta(headers, rawHeaders, aliases) {
        for (const alias of aliases) {
          const idx = headers.indexOf(normalizeHeader(alias));
          if (idx >= 0) return { idx, label: rawHeaders[idx] };
        }
        return { idx: -1, label: "" };
      }

      function setTableHeaderLabels(labels = {}) {
        const merged = { ...defaultTableLabels, ...labels };
        const mapping = {
          nameHeaderBtn: merged.name,
          spendHeaderBtn: merged.spend,
          applyStartsHeaderBtn: merged.applyStarts,
          applicationsHeaderBtn: merged.applications,
          jobsHeaderBtn: merged.jobs,
          cpasHeaderBtn: merged.cpas,
          cpaHeaderBtn: merged.cpa
        };
        Object.entries(mapping).forEach(([id, label]) => {
          const el = document.getElementById(id);
          if (el) el.textContent = label;
        });
      }

      function median(values) {
        if (!values.length) return null;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
        return sorted[mid];
      }

      function csvEscape(value) {
        const str = String(value ?? "");
        if (/[,"\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
        return str;
      }

      function getMedianValues(rows, metricKey, volumeKey) {
        const values = rows
          .filter((row) => Number(row[volumeKey] || 0) > 0)
          .map((row) => Number(row[metricKey]))
          .filter((v) => Number.isFinite(v));
        return median(values);
      }

      function updateGraphMedianNotice() {
        const graphEl = document.getElementById("graphMedianNotice");
        const tableEl = document.getElementById("tableMedianNotice");
        const parts = [];
        if (showApplicationsMetrics && Number.isFinite(medianJobCPA)) {
          parts.push(`Median CPA: ${formatCurrencyValue(medianJobCPA, activeCurrencyContext.currencyCode || "", 2, 2)}`);
        }
        if (Number.isFinite(medianJobCPAS)) {
          parts.push(`Median CPAS: ${formatCurrencyValue(medianJobCPAS, activeCurrencyContext.currencyCode || "", 2, 2)}`);
        }
        const suffix = activeCurrencyContext.mixed ? " (mixed currencies, excluding 0 values)" : " (excluding 0 values)";
        const message = parts.length ? `${parts.join(" | ")}${suffix}` : "";
        if (graphEl) graphEl.textContent = message;
        if (tableEl) tableEl.textContent = message;
      }

      function parseOptionalInputNumber(id) {
        const el = document.getElementById(id);
        if (!el) return null;
        const raw = String(el.value ?? "").trim();
        if (!raw) return null;
        const num = Number(raw);
        if (!Number.isFinite(num) || num < 0) return null;
        return num;
      }

      function getActiveThreshold(metric) {
        if (metric === "cpa") {
          const manual = parseOptionalInputNumber("cpaMedianInput");
          if (manual != null) return manual;
          return medianJobCPA;
        }
        const manual = parseOptionalInputNumber("cpasMedianInput");
        if (manual != null) return manual;
        return medianJobCPAS;
      }

      function updateMedianFilterButtons() {
        const cpaBtn = document.getElementById("filterMedianCpaBtn");
        const cpasBtn = document.getElementById("filterMedianCpasBtn");
        const exportMetricSelector = document.getElementById("exportMetricSelector");
        if (!cpaBtn || !cpasBtn) return;
        cpaBtn.classList.toggle("active", medianJobFilterMode === "cpa");
        cpasBtn.classList.toggle("active", medianJobFilterMode === "cpas");
        cpaBtn.disabled = !showApplicationsMetrics || !Number.isFinite(getActiveThreshold("cpa"));
        cpasBtn.disabled = !Number.isFinite(getActiveThreshold("cpas"));
        if (exportMetricSelector) {
          const cpaOption = exportMetricSelector.querySelector('option[value="cpa"]');
          if (cpaOption) cpaOption.disabled = !showApplicationsMetrics;
          if (!showApplicationsMetrics && exportMetricSelector.value === "cpa") exportMetricSelector.value = "cpas";
        }
      }

      function updateCountryFilterOptions(cityData) {
        const selector = document.getElementById("countryFilterSelector");
        if (!selector) return;
        const countries = Array.from(
          new Set(
            (Array.isArray(cityData) ? cityData : [])
              .map((row) => String(row.country || "").trim())
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));
        const previous = selectedCountryFilter || "__all__";
        selector.innerHTML = "";
        const allOpt = document.createElement("option");
        allOpt.value = "__all__";
        allOpt.textContent = "All countries";
        selector.appendChild(allOpt);
        countries.forEach((country) => {
          const opt = document.createElement("option");
          opt.value = country;
          opt.textContent = country;
          selector.appendChild(opt);
        });
        selectedCountryFilter = countries.includes(previous) || previous === "__all__" ? previous : "__all__";
        selector.value = selectedCountryFilter;
      }

      function triggerDownloadCsv(filename, headers, rows) {
        const lines = [];
        lines.push(headers.map(csvEscape).join(","));
        rows.forEach((row) => lines.push(row.map(csvEscape).join(",")));
        const csvText = lines.join("\n");
        const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }

      function localizeExportHeader(header) {
        const labels = exportHeaderI18n[currentLanguage] || exportHeaderI18n.en;
        const normalized = normalizeHeader(header);
        if (normalized.includes("jobstatus") || normalized === "status") return labels.status;
        if (normalized === "job" || normalized === "vacature" || normalized === "stelle" || normalized === "emploi" || normalized === "annuncio" || normalized === "empleo" || normalized === "functie" || normalized === "ruolo") return labels.job;
        if (normalized === "city" || normalized === "plaats" || normalized === "stadt" || normalized === "ville" || normalized === "citta" || normalized === "ciudad") return labels.city;
        if (normalized === "country" || normalized === "land" || normalized === "pays" || normalized === "paese" || normalized === "pais") return labels.country;
        if (normalized.includes("region") || normalized.includes("state") || normalized.includes("province") || normalized.includes("regio")) return labels.region;
        if (normalized.includes("companyname") || normalized.includes("bedrijfsnaam") || normalized.includes("unternehmensname")) return labels.company;
        if (normalized.includes("reference")) return labels.reference;
        if (normalized.includes("impression")) return labels.impressions;
        if (normalized.includes("clickthroughratectr") || normalized === "ctr" || normalized.includes("klickrate") || normalized.includes("tauxdeclicks")) return labels.ctr;
        if (normalized === "clicks" || normalized === "klicks" || normalized === "clics" || normalized === "kliks") return labels.clicks;
        if (normalized.includes("applystartrateasr") || normalized === "asr" || normalized.includes("ratebegonnenerbewerbungen") || normalized.includes("tauxdecandidaturescommencees") || normalized.includes("percentagegestartesollicitaties")) return labels.asr;
        if (normalized.includes("applystarts") || normalized.includes("gestartesollicitaties") || normalized.includes("begonnenebewerbungen") || normalized.includes("candidaturescommencees") || normalized.includes("candidatureavviate") || normalized.includes("postulacionesiniciadas")) return labels.applystarts;
        if (normalized.includes("applycompletionrateacr") || normalized === "acr" || normalized.includes("abschlussratebewerbung") || normalized.includes("tauxdecandidatureterminee") || normalized.includes("sollicitatievoltooiingspercentage")) return labels.acr;
        if (normalized === "applies" || normalized === "applications" || normalized.includes("sollicitaties") || normalized.includes("bewerbungen") || normalized.includes("candidatures") || normalized.includes("postulaciones")) return labels.applies;
        if (normalized.includes("applyratear") || normalized === "ar") return labels.ar;
        if (normalized === "spend" || normalized === "cost" || normalized === "besteding" || normalized === "ausgaben" || normalized === "depenses" || normalized === "spesa" || normalized === "gasto") return labels.spend;
        if (normalized.includes("costperclickcpc") || normalized === "cpc") return labels.cpc;
        if (normalized.includes("costperapplystartcpas") || normalized === "cpas") return labels.cpas;
        if (normalized.includes("costperapplycpa") || normalized === "cpa" || normalized.includes("costperapplication")) return labels.cpa;
        if (normalized.includes("campaign")) return labels.campaign;
        return header;
      }

      function exportRowsAboveThreshold() {
        if (!lastUploadExportMeta || !Array.isArray(lastUploadExportMeta.rows) || !lastUploadExportMeta.rows.length) {
          statusEl.textContent = "Export requires an uploaded CSV file.";
          return;
        }

        const metric = document.getElementById("exportMetricSelector").value === "cpas" ? "cpas" : "cpa";
        const thresholdRaw = document.getElementById("exportThresholdInput").value;
        const threshold = Number(thresholdRaw);
        if (!Number.isFinite(threshold)) {
          statusEl.textContent = "Enter a valid export threshold value.";
          return;
        }

        const selectedCityKey = normalizeCityKey(selectedCityTableFilter);
        const selectedCountryKey = normalizeCountryKey(selectedCityCountryFilter);
        const activeCountryFilterKey = selectedCountryFilter === "__all__" ? "" : normalizeCountryKey(selectedCountryFilter);
        const filtered = lastUploadExportMeta.rows.filter((row) => {
          if (activeCountryFilterKey && normalizeCountryKey(row.countryValue) !== activeCountryFilterKey) return false;
          if (selectedCityKey && normalizeCityKey(row.cityValue) !== selectedCityKey) return false;
          if (selectedCountryKey && normalizeCountryKey(row.countryValue) !== selectedCountryKey) return false;
          const value = metric === "cpas" ? row.cpasValue : row.cpaValue;
          return Number.isFinite(value) && value > threshold;
        });

        const outputRows = filtered.map((row) => row.cells);
        const localizedHeaders = lastUploadExportMeta.headers.map((header) => localizeExportHeader(header));
        const sourceName = lastUploadExportMeta.sourceName || "uploaded";
        const fileName = `${sourceName.replace(/\.csv$/i, "")}_${metric}_above_${threshold}.csv`;
        triggerDownloadCsv(fileName, localizedHeaders, outputRows);
        statusEl.textContent = selectedCityTableFilter
          ? `Exported ${outputRows.length} row(s) for ${selectedCityTableFilter} above ${metric.toUpperCase()} ${threshold}.`
          : `Exported ${outputRows.length} row(s) above ${metric.toUpperCase()} ${threshold}.`;
      }

      function computeMedianStats(cityData) {
        const cityRows = Array.isArray(cityData) ? cityData : [];
        medianCityCPAS = getMedianValues(cityRows, "cpas", "applyStartsTotal");
        medianCityCPA = showApplicationsMetrics ? getMedianValues(cityRows, "cpa", "applicationsTotal") : null;

        const jobRows = [];
        cityRows.forEach((cityRow) => {
          if (Array.isArray(cityRow.jobRows)) {
            cityRow.jobRows.forEach((jobRow) => jobRows.push(jobRow));
          }
        });
        medianJobCPAS = getMedianValues(jobRows, "cpas", "applyStartsTotal");
        medianJobCPA = showApplicationsMetrics ? getMedianValues(jobRows, "cpa", "applicationsTotal") : null;
        updateGraphMedianNotice();
        updateMedianFilterButtons();
      }

      function aggregateByCity(csvText) {
        const rows = parseCsv(csvText);
        if (rows.length < 2) {
          throw new Error("CSV must include headers and at least one data row.");
        }

        const rawHeaders = rows[0].map((h) => String(h || "").trim());
        const headers = rawHeaders.map(normalizeHeader);
        const cityMeta = findHeaderMeta(headers, rawHeaders, ["city", "plaats", "stadt", "ville", "citta", "ciudad"]);
        const spendMeta = findHeaderMeta(headers, rawHeaders, ["spend", "cost", "besteding", "ausgaben", "depenses", "spesa", "gasto"]);
        const appliesMeta = findHeaderMeta(headers, rawHeaders, [
          "applies",
          "applications",
          "sollicitaties",
          "bewerbungen",
          "candidatures",
          "postulaciones"
        ]);
        const applyStartsMeta = findHeaderMeta(headers, rawHeaders, [
          "apply starts",
          "applystarts",
          "gestarte sollicitaties",
          "begonnene bewerbungen",
          "candidatures commencees",
          "candidature avviate",
          "postulaciones iniciadas"
        ]);
        const cpaMeta = findHeaderMeta(headers, rawHeaders, [
          "cost per apply (cpa)",
          "cost per application (cpa)",
          "cost per application",
          "cpa",
          "kosten per sollicitatie",
          "kosten pro bewerbung",
          "cout par candidature",
          "cout par candidature (cpa)",
          "costo per candidatura",
          "coste por solicitud"
        ]);
        const cpasMeta = findHeaderMeta(headers, rawHeaders, [
          "cost per apply start (cpas)",
          "cost per apply start",
          "cpas",
          "kosten per gestarte sollicitatie",
          "kosten pro begonnene bewerbung",
          "cout par candidature commencee",
          "costo per candidatura avviata",
          "coste por postulacion iniciada"
        ]);
        const referenceMeta = findHeaderMeta(headers, rawHeaders, [
          "reference #",
          "reference no.",
          "reference no",
          "reference number",
          "referentie",
          "referenz",
          "n de reference",
          "ndereference",
          "n° de référence",
          "numero de referencia",
          "numero riferimento",
          "numero de reference"
        ]);
        const jobMeta = findHeaderMeta(headers, rawHeaders, ["job", "vacature", "stelle", "emploi", "annuncio", "empleo", "functie", "ruolo"]);
        const countryMeta = findHeaderMeta(headers, rawHeaders, ["country", "land", "pays", "paese", "pais"]);
        const currencyMeta = findHeaderMeta(headers, rawHeaders, ["currency", "currency code", "valuta", "waehrung", "wahrung", "devise", "moneda"]);
        const statusMeta = findHeaderMeta(headers, rawHeaders, [
          "status",
          "job status",
          "jobstatus",
          "vacaturestatus",
          "status der stellenanzeige",
          "statut de l'emploi",
          "estado del empleo",
          "stato dell'annuncio"
        ]);
        const idx = {
          city: cityMeta.idx,
          country: countryMeta.idx,
          currency: currencyMeta.idx,
          status: statusMeta.idx,
          spend: spendMeta.idx,
          applies: appliesMeta.idx,
          applyStarts: applyStartsMeta.idx,
          cpa: cpaMeta.idx,
          cpas: cpasMeta.idx,
          reference: referenceMeta.idx,
          job: jobMeta.idx
        };
        if (idx.city < 0 || idx.spend < 0 || (idx.applies < 0 && idx.applyStarts < 0)) {
          throw new Error("Required headers missing. Need City, Spend, and either Applies or Apply starts.");
        }

        const rawRows = rows.slice(1).map((cells) => ({
          spendRaw: idx.spend >= 0 ? (cells[idx.spend] || "") : "",
          city: (cells[idx.city] || "").trim(),
          country: idx.country >= 0 ? ((cells[idx.country] || "").trim().toUpperCase() || "N/A") : "N/A",
          currency: normalizeCurrencyCode(
            idx.currency >= 0 ? (cells[idx.currency] || "").trim() : (idx.spend >= 0 ? (cells[idx.spend] || "").trim() : ""),
            idx.country >= 0 ? (cells[idx.country] || "").trim() : ""
          ),
          status: idx.status >= 0 ? (cells[idx.status] || "").trim() : "",
          spend: parseNumber(cells[idx.spend]),
          applies: idx.applies >= 0 ? parseNumber(cells[idx.applies]) : null,
          applyStarts: idx.applyStarts >= 0 ? parseNumber(cells[idx.applyStarts]) : null,
          cpa: idx.cpa >= 0 ? parseNumber(cells[idx.cpa]) : null,
          cpas: idx.cpas >= 0 ? parseNumber(cells[idx.cpas]) : null,
          reference: idx.reference >= 0 ? (cells[idx.reference] || "").trim() : "",
          job: idx.job >= 0 ? (cells[idx.job] || "").trim() : ""
        }));
        const exportRows = rows.slice(1).map((cells) => {
          const spend = idx.spend >= 0 ? parseNumber(cells[idx.spend]) : null;
          const applies = idx.applies >= 0 ? parseNumber(cells[idx.applies]) : null;
          const applyStarts = idx.applyStarts >= 0 ? parseNumber(cells[idx.applyStarts]) : null;
          const cpaFromCell = idx.cpa >= 0 ? parseNumber(cells[idx.cpa]) : null;
          const cpasFromCell = idx.cpas >= 0 ? parseNumber(cells[idx.cpas]) : null;
          const cpaValue = cpaFromCell != null ? cpaFromCell : applies > 0 ? (spend ?? 0) / applies : null;
          const cpasValue = cpasFromCell != null ? cpasFromCell : applyStarts > 0 ? (spend ?? 0) / applyStarts : null;
          const cityValue = idx.city >= 0 ? (cells[idx.city] || "").trim() : "";
          const countryValue = idx.country >= 0 ? ((cells[idx.country] || "").trim().toUpperCase() || "N/A") : "N/A";
          const currencyValue = normalizeCurrencyCode(idx.currency >= 0 ? (cells[idx.currency] || "").trim() : "", countryValue);
          const statusValue = idx.status >= 0 ? (cells[idx.status] || "").trim() : "";
          return { cells, cpaValue, cpasValue, cityValue, countryValue, currencyValue, statusValue };
        });

        lastUploadRawRows = rawRows.slice();
        setPositionFilterAvailabilityFromRows(rawRows);
        updatePositionStatusOptions();
        const scopedRows = rawRows.filter((row) => passesPositionStatusFilter(row));

        const hasPositiveApplies = scopedRows.some((r) => r.applies != null && r.applies > 0);
        const hasPositiveApplyStarts = scopedRows.some((r) => r.applyStarts != null && r.applyStarts > 0);
        const defaultMetric = hasPositiveApplies || !hasPositiveApplyStarts ? "applies" : "applyStarts";
        const cityMap = new Map();

        scopedRows.forEach((rowData, rowIdx) => {
          if (!rowData.city) return;
          const spend = rowData.spend ?? 0;
          const applies = rowData.applies ?? 0;
          const applyStarts = rowData.applyStarts ?? 0;

          const country = rowData.country || "N/A";
          const cityKey = `${country}||${rowData.city}`;
          if (!cityMap.has(cityKey)) {
            cityMap.set(cityKey, {
              country,
              currency: rowData.currency || inferCurrencyFromCountry(country),
              city: rowData.city,
              spend: 0,
              applicationsTotal: 0,
              applyStartsTotal: 0,
              refSet: new Set(),
              jobMap: new Map(),
              cpaNumerator: 0,
              cpaDenominator: 0,
              cpasNumerator: 0,
              cpasDenominator: 0
            });
          }

          const current = cityMap.get(cityKey);
          current.spend += spend;
          current.applicationsTotal += applies;
          current.applyStartsTotal += applyStarts;
          if (applies > 0) {
            current.cpaNumerator += rowData.cpa != null ? rowData.cpa * applies : spend;
            current.cpaDenominator += applies;
          }
          if (applyStarts > 0) {
            current.cpasNumerator += rowData.cpas != null ? rowData.cpas * applyStarts : spend;
            current.cpasDenominator += applyStarts;
          }

          const jobKey = rowData.reference || rowData.job;
          if (jobKey) current.refSet.add(jobKey);

          const jobLabel = rowData.reference || rowData.job || `Row ${rowIdx + 1}`;
          const jobTitle = rowData.job || rowData.reference || `Row ${rowIdx + 1}`;
          if (!current.jobMap.has(jobLabel)) {
            current.jobMap.set(jobLabel, {
              jobTitle,
              currency: rowData.currency || inferCurrencyFromCountry(country),
              spend: 0,
              applicationsTotal: 0,
              applyStartsTotal: 0,
              refSet: new Set(),
              cpaNumerator: 0,
              cpaDenominator: 0,
              cpasNumerator: 0,
              cpasDenominator: 0
            });
          }

          const jobEntry = current.jobMap.get(jobLabel);
          jobEntry.spend += spend;
          jobEntry.applicationsTotal += applies;
          jobEntry.applyStartsTotal += applyStarts;
          if (applies > 0) {
            jobEntry.cpaNumerator += rowData.cpa != null ? rowData.cpa * applies : spend;
            jobEntry.cpaDenominator += applies;
          }
          if (applyStarts > 0) {
            jobEntry.cpasNumerator += rowData.cpas != null ? rowData.cpas * applyStarts : spend;
            jobEntry.cpasDenominator += applyStarts;
          }
          const refKey = rowData.reference || jobLabel;
          if (refKey) jobEntry.refSet.add(refKey);
        });

        const cityData = Array.from(cityMap.values())
          .map((d) => {
            const jobRows = Array.from(d.jobMap.values())
              .map((jobData) => {
                const jobCpa = jobData.cpaDenominator > 0 ? jobData.cpaNumerator / jobData.cpaDenominator : 0;
                const jobCpas = jobData.cpasDenominator > 0 ? jobData.cpasNumerator / jobData.cpasDenominator : 0;
                const primaryApplications = defaultMetric === "applies" ? jobData.applicationsTotal : jobData.applyStartsTotal;
                const primaryCost = defaultMetric === "applies" ? jobCpa : jobCpas;
                return {
                  jobTitle: jobData.jobTitle,
                  currency: jobData.currency || d.currency || inferCurrencyFromCountry(d.country || ""),
                  spend: jobData.spend,
                  applicationsTotal: jobData.applicationsTotal,
                  applyStartsTotal: jobData.applyStartsTotal,
                  applications: primaryApplications,
                  jobs: jobData.refSet.size || 1,
                  cpa: jobCpa,
                  cpas: jobCpas,
                  primaryCost
                };
              })
              .filter((jobData) => jobData.spend > 0 || jobData.applicationsTotal > 0 || jobData.applyStartsTotal > 0)
              .sort((a, b) => b.cpa - a.cpa);

            const cityCpa = d.cpaDenominator > 0 ? d.cpaNumerator / d.cpaDenominator : 0;
            const cityCpas = d.cpasDenominator > 0 ? d.cpasNumerator / d.cpasDenominator : 0;
            const primaryApplications = defaultMetric === "applies" ? d.applicationsTotal : d.applyStartsTotal;
            const primaryCost = defaultMetric === "applies" ? cityCpa : cityCpas;
            return {
              country: d.country || "N/A",
              currency: d.currency || inferCurrencyFromCountry(d.country || ""),
              city: d.city,
              spend: d.spend,
              applicationsTotal: d.applicationsTotal,
              applyStartsTotal: d.applyStartsTotal,
              applications: primaryApplications,
              jobs: d.refSet.size || 1,
              cpa: cityCpa,
              cpas: cityCpas,
              primaryCost,
              cityKey: `${d.country || "N/A"}||${d.city}`,
              jobRows
            };
          })
          .filter((d) => d.spend > 0 || d.applicationsTotal > 0 || d.applyStartsTotal > 0)
          .sort((a, b) => b.spend - a.spend);

        const metricLabel = defaultMetric === "applies" ? "Primary volume = Applications" : "Primary volume = Apply starts";
        const preferredCostMetric = defaultMetric === "applies" ? "cpa" : "cpas";
        const scopedExportRows = exportRows.filter((row) => passesPositionStatusFilter({ status: row.statusValue }));
        return { cityData, metricLabel, preferredCostMetric, exportMeta: { headers: rawHeaders, rows: scopedExportRows } };
      }

      function hexToRgb(hex) {
        const safeHex = hex.replace("#", "");
        const value = parseInt(safeHex, 16);
        return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
      }

      function rgbToHex(r, g, b) {
        return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
      }

      function blendColor(startHex, endHex, t) {
        const start = hexToRgb(startHex);
        const end = hexToRgb(endHex);
        return rgbToHex(
          Math.round(start.r + (end.r - start.r) * t),
          Math.round(start.g + (end.g - start.g) * t),
          Math.round(start.b + (end.b - start.b) * t)
        );
      }

      function cpaColor(percentile) {
        const p = Math.max(0, Math.min(100, percentile)) / 100;
        if (p < 0.5) return blendColor(gradientStops.high, gradientStops.mid, p / 0.5);
        return blendColor(gradientStops.mid, gradientStops.low, (p - 0.5) / 0.5);
      }

      function tableMetricColor(ratio, reverse = false) {
        const r = Math.max(0, Math.min(1, ratio));
        const t = reverse ? (1 - r) : r;
        const green = { r: 228, g: 246, b: 235 };
        const red = { r: 252, g: 231, b: 229 };
        const lerp = (a, b, v) => Math.round(a + (b - a) * v);
        return `rgba(${lerp(green.r, red.r, t)}, ${lerp(green.g, red.g, t)}, ${lerp(green.b, red.b, t)}, 0.58)`;
      }

      function drawAxisLine(x1, y1, x2, y2) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", "var(--axis)");
        line.setAttribute("stroke-width", "1.5");
        svg.appendChild(line);
      }

      function drawText(x, y, text, anchor = "middle", extra = {}) {
        const node = document.createElementNS("http://www.w3.org/2000/svg", "text");
        node.setAttribute("x", x);
        node.setAttribute("y", y);
        node.setAttribute("text-anchor", anchor);
        node.setAttribute("fill", extra.fill || "var(--axis)");
        node.setAttribute("font-size", extra.size || "12");
        node.setAttribute("font-weight", extra.weight || "500");
        if (extra.rotate) node.setAttribute("transform", `rotate(${extra.rotate} ${x} ${y})`);
        node.textContent = text;
        svg.appendChild(node);
      }

      function drawGrid(minX, maxX, minY, maxY, xFormatter, yFormatter) {
        const ticks = 6;
        for (let i = 0; i <= ticks; i++) {
          const tx = margin.left + (innerW / ticks) * i;
          const ty = margin.top + (innerH / ticks) * i;

          const vert = document.createElementNS("http://www.w3.org/2000/svg", "line");
          vert.setAttribute("x1", tx);
          vert.setAttribute("y1", margin.top);
          vert.setAttribute("x2", tx);
          vert.setAttribute("y2", margin.top + innerH);
          vert.setAttribute("stroke", "var(--grid)");
          vert.setAttribute("stroke-width", "1");
          vert.setAttribute("stroke-dasharray", "3 5");
          svg.appendChild(vert);

          const horiz = document.createElementNS("http://www.w3.org/2000/svg", "line");
          horiz.setAttribute("x1", margin.left);
          horiz.setAttribute("y1", ty);
          horiz.setAttribute("x2", margin.left + innerW);
          horiz.setAttribute("y2", ty);
          horiz.setAttribute("stroke", "var(--grid)");
          horiz.setAttribute("stroke-width", "1");
          horiz.setAttribute("stroke-dasharray", "3 5");
          svg.appendChild(horiz);

          const xTick = minX + ((maxX - minX) / ticks) * i;
          drawText(tx, margin.top + innerH + 18, xFormatter(xTick), "middle", { fill: "#6d6559" });

          const yTick = minY + ((maxY - minY) / ticks) * (ticks - i);
          drawText(margin.left - 10, ty + 4, yFormatter(yTick), "end", { fill: "#6d6559" });
        }
      }

      function showTooltip(point, x, y, metricName, volumeLabel) {
        const chartCost = Number.isFinite(point.chartCost) ? point.chartCost : point.primaryCost ?? point.cpa ?? 0;
        const rowCurrency = point.currency || inferCurrencyFromCountry(point.country || "");
        tooltipEl.innerHTML = [
          `<strong>${point.city}</strong>`,
          `Country: ${point.country || "N/A"}`,
          `Spend: ${formatCurrencyValue(point.spend || 0, rowCurrency, 2, 2)}`,
          `Apply starts: ${Math.round(point.applyStartsTotal ?? 0).toLocaleString()}`,
          `Applications: ${Math.round(point.applicationsTotal ?? 0).toLocaleString()}`,
          `Jobs: ${point.jobs.toLocaleString()}`,
          `${metricName}: ${formatCurrencyValue(chartCost, rowCurrency, 2, 2)}`,
          `${metricName} percentile: ${Math.round(point.cpaPercentile)}th`
        ].join("<br/>");
        tooltipEl.style.left = `${x}px`;
        tooltipEl.style.top = `${y}px`;
        tooltipEl.style.opacity = "1";
      }

      function hideTooltip() {
        tooltipEl.style.opacity = "0";
      }

      function hideZoomClickMenu() {
        if (zoomPromptEl && zoomPromptEl.parentNode) {
          zoomPromptEl.parentNode.removeChild(zoomPromptEl);
        }
        zoomPromptEl = null;
      }

      function resetZoomAndRender() {
        zoomState = null;
        hideZoomClickMenu();
        updateZoomButtonState();
        if (lastRawCityData.length) render(lastRawCityData, "Zoom reset");
      }

      function showZoomClickMenu(event) {
        if (!zoomState) return;
        hideZoomClickMenu();
        const host = tooltipEl.parentElement;
        if (!host) return;
        const hostRect = host.getBoundingClientRect();
        const x = event.clientX - hostRect.left + 8;
        const y = event.clientY - hostRect.top + 8;

        const menu = document.createElement("div");
        menu.className = "zoom-click-menu";
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.innerHTML = `
          <p class="zoom-click-menu-title">Zoom active</p>
          <p class="zoom-click-menu-text">Reset zoom to full view?</p>
          <div class="zoom-click-menu-actions">
            <button type="button" class="cancel-btn">Cancel</button>
            <button type="button" class="reset-btn">Reset Zoom</button>
          </div>
        `;

        const maxLeft = Math.max(8, host.clientWidth - 292);
        const maxTop = Math.max(8, host.clientHeight - 152);
        menu.style.left = `${Math.max(8, Math.min(x, maxLeft))}px`;
        menu.style.top = `${Math.max(8, Math.min(y, maxTop))}px`;

        menu.querySelector(".cancel-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          hideZoomClickMenu();
        });
        menu.querySelector(".reset-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          resetZoomAndRender();
        });
        menu.addEventListener("click", (e) => e.stopPropagation());

        host.appendChild(menu);
        zoomPromptEl = menu;
      }

      function updateZoomButtonState() {
        const resetBtn = document.getElementById("resetZoomBtn");
        if (resetBtn) resetBtn.disabled = !zoomState;
      }

      function getSvgPoint(event) {
        const rect = svg.getBoundingClientRect();
        return {
          x: ((event.clientX - rect.left) / rect.width) * width,
          y: ((event.clientY - rect.top) / rect.height) * height
        };
      }

      function clampToPlot(point) {
        return {
          x: Math.max(margin.left, Math.min(margin.left + innerW, point.x)),
          y: Math.max(margin.top, Math.min(margin.top + innerH, point.y))
        };
      }

      function startZoomBrush(event) {
        if (event.button !== 0) return;
        if (!chartScaleState) return;
        const targetTag = String(event.target && event.target.tagName || "").toLowerCase();
        if (targetTag === "circle") return;
        const start = clampToPlot(getSvgPoint(event));
        zoomBrushState.active = true;
        zoomBrushState.startX = start.x;
        zoomBrushState.startY = start.y;
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", String(start.x));
        rect.setAttribute("y", String(start.y));
        rect.setAttribute("width", "0");
        rect.setAttribute("height", "0");
        rect.setAttribute("fill", "rgba(0, 58, 155, 0.18)");
        rect.setAttribute("stroke", "#003A9B");
        rect.setAttribute("stroke-width", "1");
        rect.setAttribute("stroke-dasharray", "4 4");
        rect.setAttribute("pointer-events", "none");
        svg.appendChild(rect);
        zoomBrushState.rect = rect;
      }

      function moveZoomBrush(event) {
        if (!zoomBrushState.active || !zoomBrushState.rect) return;
        const current = clampToPlot(getSvgPoint(event));
        const x = Math.min(zoomBrushState.startX, current.x);
        const y = Math.min(zoomBrushState.startY, current.y);
        const w = Math.abs(current.x - zoomBrushState.startX);
        const h = Math.abs(current.y - zoomBrushState.startY);
        zoomBrushState.rect.setAttribute("x", String(x));
        zoomBrushState.rect.setAttribute("y", String(y));
        zoomBrushState.rect.setAttribute("width", String(w));
        zoomBrushState.rect.setAttribute("height", String(h));
      }

      function endZoomBrush(event) {
        if (!zoomBrushState.active) return;
        const rectEl = zoomBrushState.rect;
        const end = clampToPlot(getSvgPoint(event));
        const x1 = zoomBrushState.startX;
        const y1 = zoomBrushState.startY;
        const x2 = end.x;
        const y2 = end.y;
        zoomBrushState.active = false;
        zoomBrushState.rect = null;
        if (rectEl && rectEl.parentNode) rectEl.parentNode.removeChild(rectEl);
        if (!chartScaleState) return;

        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        if (dx < 8 || dy < 8) return;

        const pxMin = Math.min(x1, x2);
        const pxMax = Math.max(x1, x2);
        const pyMin = Math.min(y1, y2);
        const pyMax = Math.max(y1, y2);

        const xMin = chartScaleState.xFromPixel(pxMin);
        const xMax = chartScaleState.xFromPixel(pxMax);
        const yMax = chartScaleState.yFromPixel(pyMin);
        const yMin = chartScaleState.yFromPixel(pyMax);

        if (!(Number.isFinite(xMin) && Number.isFinite(xMax) && Number.isFinite(yMin) && Number.isFinite(yMax))) return;
        if (xMax <= xMin || yMax <= yMin) return;

        zoomState = { xMin, xMax, yMin, yMax };
        suppressZoomPromptClick = true;
        setTimeout(() => {
          suppressZoomPromptClick = false;
        }, 0);
        hideZoomClickMenu();
        updateZoomButtonState();
        if (lastRawCityData.length) render(lastRawCityData, "Zoom updated");
      }

      function getCardRelativeMouse(event) {
        const cardRect = tooltipEl.parentElement.getBoundingClientRect();
        return {
          x: event.clientX - cardRect.left + 14,
          y: event.clientY - cardRect.top - 10
        };
      }

      function drawBubbles(cityData, xScale, yScale, rScale, metricName, volumeLabel) {
        cityData.forEach((point) => {
          const x = xScale(point.chartVolume || 0);
          const y = yScale(point.chartCost || 0);
          const r = rScale(point.jobs);

          const bubble = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          bubble.setAttribute("cx", x);
          bubble.setAttribute("cy", y);
          bubble.setAttribute("r", r);
          bubble.setAttribute("fill", cpaColor(point.cpaPercentile));
          bubble.setAttribute("fill-opacity", "0.72");
          bubble.setAttribute("stroke", "#2e2a22");
          bubble.setAttribute("stroke-width", "1.2");

          bubble.style.cursor = "pointer";
          bubble.addEventListener("mouseenter", () =>
            showTooltip(point, x + svg.offsetLeft + 14, y + svg.offsetTop - 10, metricName, volumeLabel)
          );
          bubble.addEventListener("mousemove", (event) => {
            const mouse = getCardRelativeMouse(event);
            showTooltip(point, mouse.x, mouse.y, metricName, volumeLabel);
          });
          bubble.addEventListener("mouseleave", hideTooltip);
          bubble.addEventListener("click", (event) => {
            event.stopPropagation();
            selectedCityTableFilter = point.city;
            selectedCityCountryFilter = point.country || "";
            expandedCities = new Set([point.cityKey || `${point.country || ""}||${point.city}`]);
            buildTable(lastRenderedCityData);
          });
          svg.appendChild(bubble);
        });
      }

      function rowCostValue(row) {
        if (selectedCostMetric === "cpas") return Number(row.cpas || 0);
        return Number(row.cpa || 0);
      }

      function applyCostFilter(cityData) {
        const min = costFilter.min;
        const max = costFilter.max;
        if (min == null && max == null) return cityData;
        return cityData.filter((row) => {
          const value = rowCostValue(row);
          if (!Number.isFinite(value)) return false;
          if (min != null && value < min) return false;
          if (max != null && value > max) return false;
          return true;
        });
      }

      function applyCountryFilter(cityData) {
        if (selectedCountryFilter === "__all__") return cityData;
        return cityData.filter((row) => normalizeCountryKey(row.country) === normalizeCountryKey(selectedCountryFilter));
      }

      function jobPassesActiveCostFilter(jobRow) {
        const min = costFilter.min;
        const max = costFilter.max;
        if (min == null && max == null) return true;
        const value = selectedCostMetric === "cpas" ? Number(jobRow.cpas || 0) : Number(jobRow.cpa || 0);
        if (!Number.isFinite(value)) return false;
        if (min != null && value < min) return false;
        if (max != null && value > max) return false;
        return true;
      }

      function enrichPerformanceMetrics(points) {
        if (!points.length) return;

        const costValues = points.map((d) => rowCostValue(d));
        const cpaSorted = [...costValues].sort((a, b) => a - b);

        points.forEach((d, i) => {
          d.chartCost = costValues[i];
          d.cpaPercentile = percentileRank(cpaSorted, d.chartCost);
        });
      }

      function getSortableValue(row, key, isJobRow = false) {
        if (key === "name") return isJobRow ? row.jobTitle || "" : row.city || "";
        if (key === "spend") return row.spend || 0;
        if (key === "applyStarts") return row.applyStartsTotal || 0;
        if (key === "applications") return row.applicationsTotal || 0;
        if (key === "jobs") return row.jobs || 0;
        if (key === "cpas") return row.cpas || 0;
        if (key === "cpa") return row.cpa || 0;
        return 0;
      }

      function updateConditionalColumnsVisibility() {
        const applicationsHeader = document.getElementById("applicationsHeader");
        const cpaHeader = document.getElementById("cpaHeader");
        const displayValue = showApplicationsMetrics ? "" : "none";
        if (applicationsHeader) applicationsHeader.style.display = displayValue;
        if (cpaHeader) cpaHeader.style.display = displayValue;

        if (!showApplicationsMetrics && (tableSort.key === "applications" || tableSort.key === "cpa")) {
          tableSort.key = "cpas";
          tableSort.dir = "desc";
        }
      }

      function sortRows(rows, isJobRow = false) {
        const sorted = [...rows];
        const dir = tableSort.dir === "asc" ? 1 : -1;
        sorted.sort((a, b) => {
          const av = getSortableValue(a, tableSort.key, isJobRow);
          const bv = getSortableValue(b, tableSort.key, isJobRow);
          if (typeof av === "string" || typeof bv === "string") {
            return String(av).localeCompare(String(bv)) * dir;
          }
          return (Number(av) - Number(bv)) * dir;
        });
        return sorted;
      }

      function percentileRatioFromSorted(sortedValues, value) {
        if (!Array.isArray(sortedValues) || !sortedValues.length || !Number.isFinite(value)) return 0.5;
        if (sortedValues.length === 1) return 0.5;
        let idx = sortedValues.findIndex((v) => v >= value);
        if (idx === -1) idx = sortedValues.length - 1;
        if (idx > 0 && sortedValues[idx] === value) {
          while (idx > 0 && sortedValues[idx - 1] === value) idx -= 1;
        }
        return idx / (sortedValues.length - 1);
      }

      function updateSortButtons() {
        document.querySelectorAll(".sort-btn").forEach((btn) => {
          const key = btn.dataset.sortKey;
          const active = key === tableSort.key;
          btn.classList.toggle("active", active);
          btn.textContent = btn.textContent.replace(/\s*[↑↓]$/, "");
          if (active) btn.textContent = `${btn.textContent} ${tableSort.dir === "asc" ? "↑" : "↓"}`;
        });
      }

      function normalizeCityKey(value) {
        return String(value || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, " ");
      }

      function normalizeCountryKey(value) {
        return String(value || "")
          .trim()
          .toUpperCase();
      }

      function updateCityFilterButton() {
        const btn = document.getElementById("clearCityFilterBtn");
        if (!btn) return;
        if (!selectedCityTableFilter) {
          btn.style.display = "none";
          btn.textContent = "";
          return;
        }
        btn.style.display = "inline-flex";
        const countrySuffix = selectedCityCountryFilter ? ` (${selectedCityCountryFilter})` : "";
        btn.textContent = `Filtered location: ${selectedCityTableFilter}${countrySuffix} ×`;
      }

      function buildTable(cityData) {
        tableBody.innerHTML = "";
        updateConditionalColumnsVisibility();
        updateMedianFilterButtons();
        updateSortButtons();
        updateCityFilterButton();

        const cityScopedRows = selectedCityTableFilter
          ? cityData.filter(
            (row) =>
              normalizeCityKey(row.city) === normalizeCityKey(selectedCityTableFilter) &&
              (!selectedCityCountryFilter || normalizeCountryKey(row.country) === normalizeCountryKey(selectedCityCountryFilter))
          )
          : cityData;
        const rows = sortRows(cityScopedRows);
        const validCityKeys = new Set(rows.map((row) => row.cityKey || `${row.country || ""}||${row.city}`));
        expandedCities = new Set(Array.from(expandedCities).filter((cityKey) => validCityKeys.has(cityKey)));
        const metricColorMode = medianJobFilterMode === "none"
          ? (tableSort.key === "applyStarts" || tableSort.key === "applications" || tableSort.key === "cpa" || tableSort.key === "cpas")
            ? tableSort.key
            : "none"
          : "none";
        const metricValues = [];
        rows.forEach((r) => {
          (r.jobRows || []).forEach((j) => {
            const value = metricColorMode === "applyStarts"
              ? Number(j.applyStartsTotal || 0)
              : metricColorMode === "applications"
                ? Number(j.applicationsTotal || 0)
              : metricColorMode === "cpa"
                ? Number(j.cpa || 0)
                : metricColorMode === "cpas"
                  ? Number(j.cpas || 0)
                  : NaN;
            if (Number.isFinite(value)) metricValues.push(value);
          });
        });
        const metricMin = metricValues.length ? Math.min(...metricValues) : 0;
        const metricMax = metricValues.length ? Math.max(...metricValues) : 1;
        const metricSorted = metricValues.length ? [...metricValues].sort((a, b) => a - b) : [];

        function toggleCityExpansion(cityKey) {
          if (expandedCities.has(cityKey)) {
            expandedCities.delete(cityKey);
          } else {
            expandedCities.add(cityKey);
          }
          buildTable(cityData);
        }

        rows.forEach((cityRow) => {
          const tr = document.createElement("tr");
          tr.classList.add("city-row");
          const cityRowKey = cityRow.cityKey || `${cityRow.country || ""}||${cityRow.city}`;
          const visibleJobRows = Array.isArray(cityRow.jobRows)
            ? cityRow.jobRows.filter((jobRow) => jobPassesActiveCostFilter(jobRow))
            : [];
          const hasJobRows = visibleJobRows.length > 0;
          const isExpanded = expandedCities.has(cityRowKey);
          const toggleSymbol = hasJobRows ? (isExpanded ? "-" : "+") : "";
          const cityDisplay = selectedCountryFilter === "__all__" && cityRow.country
            ? `${cityRow.city} (${cityRow.country})`
            : cityRow.city;
          const cityLabel = hasJobRows
            ? `<button class="row-toggle">${toggleSymbol}</button>${escapeHtml(cityDisplay)}`
            : `${escapeHtml(cityDisplay)}`;
          const applicationsCell = showApplicationsMetrics
            ? `<td>${Math.round(cityRow.applicationsTotal || 0).toLocaleString()}</td>`
            : "";
          const cityCurrency = cityRow.currency || inferCurrencyFromCountry(cityRow.country || "");
          const cpaCell = showApplicationsMetrics ? `<td>${formatCurrencyValue(cityRow.cpa || 0, cityCurrency, 2, 2)}</td>` : "";

          tr.innerHTML = `
            <td>${cityLabel}</td>
            <td>${formatCurrencyValue(cityRow.spend || 0, cityCurrency, 2, 2)}</td>
            <td>${Math.round(cityRow.applyStartsTotal || 0).toLocaleString()}</td>
            ${applicationsCell}
            <td>${cityRow.jobs.toLocaleString()}</td>
            <td>${formatCurrencyValue(cityRow.cpas || 0, cityCurrency, 2, 2)}</td>
            ${cpaCell}
          `;

          tableBody.appendChild(tr);

          if (hasJobRows) {
            tr.classList.add("clickable");
            tr.addEventListener("click", () => toggleCityExpansion(cityRowKey));
          }

          const toggleBtn = tr.querySelector(".row-toggle");
          if (toggleBtn && hasJobRows) {
            toggleBtn.addEventListener("click", (event) => {
              event.stopPropagation();
              toggleCityExpansion(cityRowKey);
            });
          }

          if (medianJobFilterMode !== "none" && hasJobRows) {
            const threshold = getActiveThreshold(medianJobFilterMode);
            const comparableJobs = visibleJobRows.filter((job) => {
              const metric = Number(medianJobFilterMode === "cpa" ? job.cpa : job.cpas);
              const volume = Number(medianJobFilterMode === "cpa" ? job.applicationsTotal : job.applyStartsTotal);
              return Number.isFinite(metric) && volume > 0;
            });
            const cityAllAboveMedian = Number.isFinite(threshold)
              && comparableJobs.length > 0
              && comparableJobs.every((job) => {
                const metric = Number(medianJobFilterMode === "cpa" ? job.cpa : job.cpas);
                return metric > threshold;
              });
            if (cityAllAboveMedian) tr.classList.add("above-median");
          }

          if (!isExpanded || !hasJobRows) return;

          sortRows(visibleJobRows, true).forEach((jobRow, jobIndex) => {
            const jobTr = document.createElement("tr");
            jobTr.classList.add("job-row", `tone-${jobIndex % 10}`);
            let isAboveMedian = false;
            if (medianJobFilterMode === "cpa") {
              const metric = Number(jobRow.cpa || 0);
              const volume = Number(jobRow.applicationsTotal || 0);
              const threshold = getActiveThreshold("cpa");
              if (Number.isFinite(threshold) && Number.isFinite(metric) && volume > 0 && metric > threshold) {
                jobTr.classList.add("above-median");
                isAboveMedian = true;
              }
            } else if (medianJobFilterMode === "cpas") {
              const metric = Number(jobRow.cpas || 0);
              const volume = Number(jobRow.applyStartsTotal || 0);
              const threshold = getActiveThreshold("cpas");
              if (Number.isFinite(threshold) && Number.isFinite(metric) && volume > 0 && metric > threshold) {
                jobTr.classList.add("above-median");
                isAboveMedian = true;
              }
            }
            const jobApplicationsCell = showApplicationsMetrics
              ? `<td>${Math.round(jobRow.applicationsTotal || 0).toLocaleString()}</td>`
              : "";
            const jobCurrency = jobRow.currency || cityRow.currency || inferCurrencyFromCountry(cityRow.country || "");
            const jobCpaCell = showApplicationsMetrics ? `<td>${formatCurrencyValue(jobRow.cpa || 0, jobCurrency, 2, 2)}</td>` : "";
            jobTr.innerHTML = `
              <td>${escapeHtml(jobRow.jobTitle)}</td>
              <td>${formatCurrencyValue(jobRow.spend || 0, jobCurrency, 2, 2)}</td>
              <td>${Math.round(jobRow.applyStartsTotal || 0).toLocaleString()}</td>
              ${jobApplicationsCell}
              <td>-</td>
              <td>${formatCurrencyValue(jobRow.cpas || 0, jobCurrency, 2, 2)}</td>
              ${jobCpaCell}
            `;
            tableBody.appendChild(jobTr);
            if (!isAboveMedian && (metricColorMode === "cpa" || metricColorMode === "cpas" || metricColorMode === "applyStarts" || metricColorMode === "applications")) {
              const rawValue = metricColorMode === "applyStarts"
                ? Number(jobRow.applyStartsTotal || 0)
                : metricColorMode === "applications"
                  ? Number(jobRow.applicationsTotal || 0)
                : metricColorMode === "cpa"
                  ? Number(jobRow.cpa || 0)
                  : Number(jobRow.cpas || 0);
              const ratio = (metricColorMode === "cpa" || metricColorMode === "cpas")
                ? percentileRatioFromSorted(metricSorted, rawValue)
                : (metricMax === metricMin ? 0.5 : Math.max(0, Math.min(1, (rawValue - metricMin) / (metricMax - metricMin))));
              const reverse = metricColorMode === "applyStarts" || metricColorMode === "applications";
              const color = tableMetricColor(ratio, reverse);
              jobTr.querySelectorAll("td").forEach((td) => {
                td.style.backgroundColor = color;
              });
            }
          });
        });
      }

      function render(cityData, metricLabel) {
        const countryScopedData = applyCountryFilter(cityData);
        computeMedianStats(countryScopedData);
        svg.innerHTML = "";
        hideTooltip();
        hideZoomClickMenu();
        chartScaleState = null;
        const filteredCityData = applyCostFilter(countryScopedData);
        lastRenderedCityData = filteredCityData;
        if (!filteredCityData.length) {
          statusEl.textContent = "No rows match the selected CPA/CPAS filter.";
          buildTable([]);
          updateZoomButtonState();
          return;
        }
        filteredCityData.forEach((cityRow) => {
          if (!Array.isArray(cityRow.jobRows)) cityRow.jobRows = [];
          if (!Number.isFinite(cityRow.applicationsTotal)) cityRow.applicationsTotal = cityRow.applications || 0;
          if (!Number.isFinite(cityRow.applyStartsTotal)) cityRow.applyStartsTotal = cityRow.applications || 0;
          if (!Number.isFinite(cityRow.cpas)) cityRow.cpas = cityRow.cpa || 0;
          if (!Number.isFinite(cityRow.primaryCost)) cityRow.primaryCost = cityRow.cpa || 0;
          cityRow.chartVolume = selectedCostMetric === "cpas" ? cityRow.applyStartsTotal || 0 : cityRow.applicationsTotal || 0;
        });
        const graphCityData = filteredCityData.filter((d) => {
          const cost = selectedCostMetric === "cpas" ? Number(d.cpas || 0) : Number(d.cpa || 0);
          return Number.isFinite(cost) && cost > 0;
        });
        activeCurrencyContext = getCurrencyContext(graphCityData);
        updateGraphMedianNotice();
        if (!graphCityData.length) {
          statusEl.textContent = `No non-zero ${selectedCostMetric.toUpperCase()} points to plot.`;
          buildTable(filteredCityData);
          updateZoomButtonState();
          return;
        }
        const minVolume = Math.min(...graphCityData.map((d) => d.chartVolume || 0));
        const maxVolume = Math.max(...graphCityData.map((d) => d.chartVolume || 0));
        const maxJobs = Math.max(...graphCityData.map((d) => d.jobs));

        enrichPerformanceMetrics(graphCityData);
        const minCost = Math.min(...graphCityData.map((d) => d.chartCost || 0));
        const maxCost = Math.max(...graphCityData.map((d) => d.chartCost || 0));
        if (zoomState) {
          const validZoom =
            Number.isFinite(zoomState.xMin) &&
            Number.isFinite(zoomState.xMax) &&
            Number.isFinite(zoomState.yMin) &&
            Number.isFinite(zoomState.yMax) &&
            zoomState.xMin < zoomState.xMax &&
            zoomState.yMin < zoomState.yMax;
          if (!validZoom) {
            zoomState = null;
          }
        }

        const activeMinVolume = zoomState ? zoomState.xMin : minVolume;
        const activeMaxVolume = zoomState ? zoomState.xMax : maxVolume;
        const activeMinCost = zoomState ? zoomState.yMin : minCost;
        const activeMaxCost = zoomState ? zoomState.yMax : maxCost;
        const volumeRange = activeMaxVolume - activeMinVolume || 1;
        const costRange = activeMaxCost - activeMinCost || 1;

        function xScale(v) {
          return margin.left + ((v - activeMinVolume) / volumeRange) * innerW;
        }

        function yScale(v) {
          return margin.top + innerH - ((v - activeMinCost) / costRange) * innerH;
        }

        function rScale(v) {
          return 8 + (v / (maxJobs || 1)) * 20;
        }

        drawGrid(
          activeMinVolume,
          activeMaxVolume,
          activeMinCost,
          activeMaxCost,
          (v) => Math.round(v).toLocaleString(),
          (v) => {
            if (activeCurrencyContext.mixed) return v.toFixed(2);
            return formatCurrencyValue(v, activeCurrencyContext.currencyCode || "", 2, 2);
          }
        );
        drawAxisLine(margin.left, margin.top + innerH, margin.left + innerW, margin.top + innerH);
        drawAxisLine(margin.left, margin.top, margin.left, margin.top + innerH);
        const graphMetricName = selectedCostMetric === "cpas" ? "CPAS" : "CPA";
        const volumeLabel = selectedCostMetric === "cpas" ? "Apply starts" : "Applications";
        drawText(margin.left + innerW / 2, height - 16, `${volumeLabel}`, "middle", { size: "14", weight: "600" });
        const currencyAxisSuffix = activeCurrencyContext.mixed ? "mixed currencies" : (activeCurrencyContext.currencyCode || "currency");
        drawText(20, margin.top + innerH / 2, `${graphMetricName} (${currencyAxisSuffix})`, "middle", {
          size: "14",
          weight: "600",
          rotate: -90
        });
        document.getElementById("legendCostLow").textContent = `LOW ${graphMetricName} percentile`;
        document.getElementById("legendCostHigh").textContent = `HIGH ${graphMetricName} percentile`;
        const visibleCityData = graphCityData.filter((point) => {
          const volume = Number(point.chartVolume || 0);
          const cost = Number(point.chartCost || 0);
          return volume >= activeMinVolume && volume <= activeMaxVolume && cost >= activeMinCost && cost <= activeMaxCost;
        });
        drawBubbles(visibleCityData, xScale, yScale, rScale, graphMetricName, volumeLabel);
        chartScaleState = {
          xMin: activeMinVolume,
          xMax: activeMaxVolume,
          yMin: activeMinCost,
          yMax: activeMaxCost,
          xFromPixel(px) {
            const ratio = (px - margin.left) / innerW;
            return this.xMin + ratio * (this.xMax - this.xMin);
          },
          yFromPixel(py) {
            const ratio = (py - margin.top) / innerH;
            return this.yMax - ratio * (this.yMax - this.yMin);
          }
        };
        updateZoomButtonState();
        buildTable(filteredCityData);
        statusEl.textContent = `${metricLabel}. Graph cost metric: ${graphMetricName}.`;
      }

      function toggleTableSort(key) {
        if (tableSort.key === key) {
          tableSort.dir = tableSort.dir === "asc" ? "desc" : "asc";
        } else {
          tableSort.key = key;
          tableSort.dir = key === "name" ? "asc" : "desc";
        }
        if (lastRenderedCityData.length) buildTable(lastRenderedCityData);
      }

      function applyCostFiltersAndRender() {
        const minRaw = document.getElementById("costMinInput").value;
        const maxRaw = document.getElementById("costMaxInput").value;
        const minVal = minRaw === "" ? null : Number(minRaw);
        const maxVal = maxRaw === "" ? null : Number(maxRaw);
        costFilter = {
          min: Number.isFinite(minVal) ? minVal : null,
          max: Number.isFinite(maxVal) ? maxVal : null
        };
        zoomState = null;
        hideZoomClickMenu();
        updateZoomButtonState();
        if (lastRawCityData.length) render(lastRawCityData, "Filters updated");
      }

      async function applyCsvText(csvText, sourceLabel) {
        try {
          const { cityData, metricLabel, exportMeta } = aggregateByCity(csvText);
          lastRawCityData = cityData;
          medianJobFilterMode = "none";
          selectedCityTableFilter = "";
          selectedCityCountryFilter = "";
          showApplicationsMetrics = cityData.some((row) => Number(row.applicationsTotal || 0) > 0);
          lastUploadExportMeta = exportMeta ? { ...exportMeta, sourceName: sourceLabel } : null;
          updateCountryFilterOptions(cityData);
          setTableHeaderLabels(tableLabelsByLanguage[currentLanguage] || defaultTableLabels);
          document.getElementById("costMetricSelector").value = selectedCostMetric;
          zoomState = null;
          hideZoomClickMenu();
          updateZoomButtonState();
          render(cityData, `Loaded ${sourceLabel}. ${metricLabel}`);
        } catch (error) {
          statusEl.textContent = `Could not parse CSV: ${error.message}`;
          lastUploadExportMeta = null;
          lastUploadRawRows = null;
          hasOpenUploadStatuses = false;
          hasClosedUploadStatuses = false;
          updatePositionStatusOptions();
          selectedCountryFilter = "__all__";
          updateCountryFilterOptions([]);
          setTableHeaderLabels(tableLabelsByLanguage[currentLanguage] || defaultTableLabels);
        }
      }

      async function handleFileSelection(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const csvText = await file.text();
        lastUploadRawCsvText = csvText;
        lastUploadSourceLabel = file.name;
        await applyCsvText(csvText, file.name);
      }

      if (embedded) {
        fileInput.style.display = "none";
        statusEl.textContent = "Use the shared uploader in the top navigation to update this chart.";
      }

      window.addEventListener("message", (event) => {
        const data = event.data;
        if (!data) return;
        if (data.type === SHARED_UPLOAD_MESSAGE && data.payload && data.payload.text) {
          lastUploadRawCsvText = data.payload.text;
          lastUploadSourceLabel = `shared file ${data.payload.name || "CSV"}`;
          applyCsvText(data.payload.text, `shared file ${data.payload.name || "CSV"}`);
          return;
        }
        if (data.type === UI_LANGUAGE_MESSAGE && data.payload && data.payload.language) {
          applyUiLanguage(data.payload.language);
        }
      });

      document.getElementById("costMetricSelector").addEventListener("change", (event) => {
        selectedCostMetric = event.target.value === "cpas" ? "cpas" : "cpa";
        zoomState = null;
        hideZoomClickMenu();
        updateZoomButtonState();
        if (lastRawCityData.length) render(lastRawCityData, "Graph metric updated");
      });
      document.getElementById("applyCostFilterBtn").addEventListener("click", applyCostFiltersAndRender);
      document.getElementById("resetZoomBtn").addEventListener("click", () => {
        if (!zoomState) return;
        resetZoomAndRender();
      });
      document.getElementById("filterMedianCpaBtn").addEventListener("click", () => {
        if (!showApplicationsMetrics || !Number.isFinite(getActiveThreshold("cpa"))) return;
        medianJobFilterMode = medianJobFilterMode === "cpa" ? "none" : "cpa";
        if (medianJobFilterMode === "none") expandedCities = new Set();
        if (medianJobFilterMode !== "none" && lastRenderedCityData.length) {
          expandedCities = new Set(
            lastRenderedCityData
              .filter((row) => Array.isArray(row.jobRows) && row.jobRows.length > 0)
              .map((row) => row.cityKey || `${row.country || ""}||${row.city}`)
          );
        }
        if (lastRenderedCityData.length) buildTable(lastRenderedCityData);
      });
      document.getElementById("filterMedianCpasBtn").addEventListener("click", () => {
        if (!Number.isFinite(getActiveThreshold("cpas"))) return;
        medianJobFilterMode = medianJobFilterMode === "cpas" ? "none" : "cpas";
        if (medianJobFilterMode === "none") expandedCities = new Set();
        if (medianJobFilterMode !== "none" && lastRenderedCityData.length) {
          expandedCities = new Set(
            lastRenderedCityData
              .filter((row) => Array.isArray(row.jobRows) && row.jobRows.length > 0)
              .map((row) => row.cityKey || `${row.country || ""}||${row.city}`)
          );
        }
        if (lastRenderedCityData.length) buildTable(lastRenderedCityData);
      });

      document.querySelectorAll(".sort-btn").forEach((btn) => {
        btn.addEventListener("click", () => toggleTableSort(btn.dataset.sortKey));
      });
      document.getElementById("cpaMedianInput").addEventListener("input", () => {
        updateMedianFilterButtons();
        if (lastRenderedCityData.length) buildTable(lastRenderedCityData);
      });
      document.getElementById("cpasMedianInput").addEventListener("input", () => {
        updateMedianFilterButtons();
        if (lastRenderedCityData.length) buildTable(lastRenderedCityData);
      });
      document.getElementById("exportFilteredBtn").addEventListener("click", exportRowsAboveThreshold);
      document.getElementById("clearCityFilterBtn").addEventListener("click", () => {
        selectedCityTableFilter = "";
        selectedCityCountryFilter = "";
        expandedCities = new Set();
        if (lastRenderedCityData.length) buildTable(lastRenderedCityData);
      });
      document.getElementById("countryFilterSelector").addEventListener("change", (event) => {
        selectedCountryFilter = event.target.value || "__all__";
        selectedCityTableFilter = "";
        selectedCityCountryFilter = "";
        expandedCities = new Set();
        zoomState = null;
        hideZoomClickMenu();
        updateZoomButtonState();
        if (lastRawCityData.length) render(lastRawCityData, "Country filter updated");
      });
      document.getElementById("positionStatusSelector").addEventListener("change", async (event) => {
        selectedPositionStatus = event.target.value || "both";
        selectedCityTableFilter = "";
        selectedCityCountryFilter = "";
        expandedCities = new Set();
        zoomState = null;
        hideZoomClickMenu();
        updateZoomButtonState();
        if (lastUploadRawCsvText) {
          await applyCsvText(lastUploadRawCsvText, lastUploadSourceLabel || "uploaded.csv");
          return;
        }
        hasOpenUploadStatuses = false;
        hasClosedUploadStatuses = false;
        updatePositionStatusOptions();
        if (lastRawCityData.length) render(lastRawCityData, "Position status filter updated");
      });
      svg.addEventListener("mousedown", startZoomBrush);
      window.addEventListener("mousemove", moveZoomBrush);
      window.addEventListener("mouseup", endZoomBrush);
      svg.addEventListener("click", (event) => {
        if (!zoomState) return;
        if (suppressZoomPromptClick) return;
        event.stopPropagation();
        showZoomClickMenu(event);
      });
      window.addEventListener("click", (event) => {
        if (!zoomPromptEl) return;
        if (zoomPromptEl.contains(event.target)) return;
        hideZoomClickMenu();
      });

      fileInput.addEventListener("change", handleFileSelection);
      lastRawCityData = [...sampleCityData].map((row) => ({
        ...row,
        status: row.status || "",
        currency: row.currency || inferCurrencyFromCountry(row.country || "US") || "USD",
        country: row.country || "N/A",
        cityKey: `${row.country || "N/A"}||${row.city}`
      }));
      medianJobFilterMode = "none";
      hasOpenUploadStatuses = false;
      hasClosedUploadStatuses = false;
      updatePositionStatusOptions();
      updateCountryFilterOptions(lastRawCityData);
      setTableHeaderLabels(tableLabelsByLanguage[currentLanguage] || defaultTableLabels);
      showApplicationsMetrics = lastRawCityData.some((row) => Number(row.applicationsTotal || row.applications || 0) > 0);
      document.getElementById("costMetricSelector").value = selectedCostMetric;
      applyUiLanguage(currentLanguage);
      render(
        lastRawCityData,
        embedded
          ? "Showing built-in sample data. Use the shared uploader in the top navigation to replace it."
          : "Showing built-in sample data. Upload a CSV to replace it."
      );
