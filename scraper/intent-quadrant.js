      const columnAliases = {
        job: ["Job", "Vacature", "Stelle", "Emploi", "Annuncio", "Empleo"],
        company: [
          "Company name",
          "Bedrijfsnaam",
          "Unternehmensname",
          "Nom de l'entreprise",
          "Nome dell'azienda",
          "Nombre de la empresa"
        ],
        ctr: [
          "Click-through rate (CTR)",
          "Clickthrough rate (CTR)",
          "Click Through Rate (CTR)",
          "CTR",
          "Klikfrequentie (CTR)",
          "Klickrate (CTR)",
          "Taux de clics (CTR)",
          "Percentuale di click (CTR)",
          "Porcentaje de clics (CTR)"
        ],
        asr: [
          "Apply start rate (ASR)",
          "Apply Start Rate (ASR)",
          "ASR",
          "Percentage gestarte sollicitaties",
          "Rate begonnener Bewerbungen (ASR)",
          "Taux de candidatures commencees (ASR)",
          "Percentuale di candidature avviate",
          "Porcentaje de postulaciones iniciadas"
        ],
        acr: [
          "Apply completion rate (ACR)",
          "Apply Completion Rate (ACR)",
          "ACR",
          "Sollicitatievoltooiingspercentage (ACR)",
          "Abschlussrate Bewerbung (ACR)",
          "Taux de candidature terminee (ACR)",
          "Percentuale di completamento candidatura (ACR)",
          "Tasa de finalizacion de solicitud (ACR)"
        ],
        status: [
          "Status",
          "Job status",
          "Jobstatus",
          "Vacaturestatus",
          "Status der Stellenanzeige",
          "Statut de l'emploi",
          "Estado del empleo",
          "Stato dell'annuncio"
        ]
      };

      let xThreshold = 0;
      let yThreshold = 0;
      let ctrThreshold = 0;
      let asrThreshold = 0;
      let medianByMetric = { ctr: null, asr: null, acr: null };
      let selectedXAxisMetric = "ctr";
      let selectedYAxisMetric = "asr";

      const csvFile = document.getElementById("csvFile");
      const errorBox = document.getElementById("error");
      const tableHead = document.getElementById("tableHead");
      const tableBody = document.getElementById("tableBody");
      const chart = document.getElementById("chart");
      const tooltip = document.getElementById("tooltip");
      const tileHoverTooltip = document.getElementById("tileHoverTooltip");
      const tiles = document.getElementById("tiles");
      const benchmarkNotice = document.getElementById("benchmarkNotice");
      const uploadSection = document.querySelector(".upload");
      const xAxisMetricSelector = document.getElementById("xAxisMetricSelector");
      const yAxisMetricSelector = document.getElementById("yAxisMetricSelector");
      const xBenchmarkInput = document.getElementById("xBenchmarkInput");
      const yBenchmarkInput = document.getElementById("yBenchmarkInput");
      const filterQHHBtn = document.getElementById("filterQHH");
      const filterQHLBtn = document.getElementById("filterQHL");
      const filterQLHBtn = document.getElementById("filterQLH");
      const filterQLLBtn = document.getElementById("filterQLL");
      const embedded = new URLSearchParams(window.location.search).get("embedded") === "1";
      const SHARED_UPLOAD_MESSAGE = "shared-csv-upload";
      const UI_LANGUAGE_MESSAGE = "ui-language-changed";
      let currentLanguage = "en";
      const uiText = {
        en: { title: "Job Intent Quadrant", upload: "Upload CSV", hint: "Required columns: job, company name, CTR, and ASR. English, NL, DE, FR, IT, and ES header variants are supported.", jobs: "List of Jobs", quadrant: "Intent Quadrant", benchTitle: "Manual Benchmarks (Optional)", ctr: "CTR Benchmark (%)", asr: "ASR Benchmark (%)", applyBench: "Apply", legend: "X-axis: Clickthrough intent (CTR), Y-axis: Apply start intent (ASR). Marker size and color are based on intent score = CTR * ASR. Dotted reference lines use manual benchmarks when provided; otherwise dataset medians are used.", tiles: "Action Tiles", noticeDefault: "Upload data to compute current medians." },
        de: { title: "Job-Intent-Quadrant", upload: "CSV hochladen", hint: "Erforderliche Spalten: Job, Firmenname, CTR und ASR. EN/NL/DE/FR/IT/ES Varianten werden unterstützt.", jobs: "Jobliste", quadrant: "Intent-Quadrant", benchTitle: "Manuelle Benchmarks (optional)", ctr: "CTR-Benchmark (%)", asr: "ASR-Benchmark (%)", applyBench: "Anwenden", legend: "X-Achse: Klickintention (CTR), Y-Achse: Bewerbungsstart-Intention (ASR). Punktgröße und Farbe basieren auf CTR * ASR. Gepunktete Linien nutzen manuelle Benchmarks, sonst Mediane.", tiles: "Aktionskacheln", noticeDefault: "Daten hochladen, um Mediane zu berechnen." },
        fr: { title: "Quadrant d'intention des emplois", upload: "Importer CSV", hint: "Colonnes requises : job, nom d'entreprise, CTR et ASR. Variantes EN/NL/DE/FR/IT/ES prises en charge.", jobs: "Liste des emplois", quadrant: "Quadrant d'intention", benchTitle: "Benchmarks manuels (optionnel)", ctr: "Benchmark CTR (%)", asr: "Benchmark ASR (%)", applyBench: "Appliquer", legend: "Axe X : intention de clic (CTR), axe Y : intention de démarrage (ASR). Taille et couleur selon CTR * ASR. Les lignes pointillées utilisent les benchmarks manuels, sinon les médianes.", tiles: "Tuiles d'action", noticeDefault: "Importez des données pour calculer les médianes." },
        es: { title: "Cuadrante de intención de empleo", upload: "Subir CSV", hint: "Columnas requeridas: empleo, empresa, CTR y ASR. Se admiten variantes EN/NL/DE/FR/IT/ES.", jobs: "Lista de empleos", quadrant: "Cuadrante de intención", benchTitle: "Benchmarks manuales (opcional)", ctr: "Benchmark CTR (%)", asr: "Benchmark ASR (%)", applyBench: "Aplicar", legend: "Eje X: intención de clic (CTR), eje Y: intención de inicio (ASR). Tamaño y color por CTR * ASR. Las líneas punteadas usan benchmarks manuales; si no, medianas.", tiles: "Bloques de acción", noticeDefault: "Sube datos para calcular medianas." },
        it: { title: "Quadrante di intenzione lavoro", upload: "Carica CSV", hint: "Colonne richieste: lavoro, azienda, CTR e ASR. Supportate varianti EN/NL/DE/FR/IT/ES.", jobs: "Elenco lavori", quadrant: "Quadrante intenzione", benchTitle: "Benchmark manuali (opzionale)", ctr: "Benchmark CTR (%)", asr: "Benchmark ASR (%)", applyBench: "Applica", legend: "Asse X: intenzione click (CTR), asse Y: intenzione avvio candidatura (ASR). Dimensione e colore su CTR * ASR. Le linee tratteggiate usano benchmark manuali, altrimenti mediane.", tiles: "Riquadri azione", noticeDefault: "Carica dati per calcolare le mediane." },
        nl: { title: "Job intent-kwadrant", upload: "CSV uploaden", hint: "Vereiste kolommen: job, bedrijfsnaam, CTR en ASR. EN/NL/DE/FR/IT/ES-varianten worden ondersteund.", jobs: "Lijst met vacatures", quadrant: "Intentie-kwadrant", benchTitle: "Handmatige benchmarks (optioneel)", ctr: "CTR-benchmark (%)", asr: "ASR-benchmark (%)", applyBench: "Toepassen", legend: "X-as: klikintentie (CTR), Y-as: sollicitatiestart-intentie (ASR). Grootte en kleur op basis van CTR * ASR. Gestippelde lijnen gebruiken handmatige benchmarks, anders medianen.", tiles: "Actietegels", noticeDefault: "Upload data om medianen te berekenen." }
      };
      const localizedTableHeaders = {
        en: { job: "Job", company: "Company", ctr: "CTR", asr: "ASR", acr: "ACR", city: "City", country: "Country", impressions: "Impressions", clicks: "Clicks", applications: "Applications", applystarts: "Apply starts", spend: "Spend", cpa: "CPA", cpas: "CPAS", campaign: "Campaign", status: "Status", reference: "Reference" },
        de: { job: "Job", company: "Unternehmen", ctr: "CTR", asr: "ASR", acr: "ACR", city: "Stadt", country: "Land", impressions: "Impressionen", clicks: "Klicks", applications: "Bewerbungen", applystarts: "Bewerbungsstarts", spend: "Ausgaben", cpa: "CPA", cpas: "CPAS", campaign: "Kampagne", status: "Status", reference: "Referenz" },
        fr: { job: "Poste", company: "Entreprise", ctr: "CTR", asr: "ASR", acr: "ACR", city: "Ville", country: "Pays", impressions: "Impressions", clicks: "Clics", applications: "Candidatures", applystarts: "Débuts de candidature", spend: "Dépenses", cpa: "CPA", cpas: "CPAS", campaign: "Campagne", status: "Statut", reference: "Référence" },
        es: { job: "Puesto", company: "Empresa", ctr: "CTR", asr: "ASR", acr: "ACR", city: "Ciudad", country: "País", impressions: "Impresiones", clicks: "Clics", applications: "Solicitudes", applystarts: "Inicios de solicitud", spend: "Gasto", cpa: "CPA", cpas: "CPAS", campaign: "Campaña", status: "Estado", reference: "Referencia" },
        it: { job: "Ruolo", company: "Azienda", ctr: "CTR", asr: "ASR", acr: "ACR", city: "Città", country: "Paese", impressions: "Impression", clicks: "Clic", applications: "Candidature", applystarts: "Avvii candidatura", spend: "Spesa", cpa: "CPA", cpas: "CPAS", campaign: "Campagna", status: "Stato", reference: "Riferimento" },
        nl: { job: "Vacature", company: "Bedrijf", ctr: "CTR", asr: "ASR", acr: "ACR", city: "Plaats", country: "Land", impressions: "Impressies", clicks: "Klikken", applications: "Sollicitaties", applystarts: "Gestarte sollicitaties", spend: "Uitgaven", cpa: "CPA", cpas: "CPAS", campaign: "Campagne", status: "Status", reference: "Referentie" }
      };
      const tileText = {
        en: {
          hoverHint: "Hover for interpretation and possible drivers.",
          highTitle: "High CTR, Low ASR",
          highInterpretation: "Interpretation: Attraction works. Commitment fails.",
          highDrivers: [
            "Expectation mismatch (title vs. actual scope)",
            "Compensation misalignment (below market or unclear range)",
            "Location / work model friction (onsite, hybrid ambiguity, travel)",
            "Requirement inflation (too many or unrealistic must-haves)",
            "Role ambiguity (unclear outcomes, reporting line, growth path)",
            "Employer trust gap (weak brand, low differentiation, low credibility)",
            "Seniority inconsistency (title vs. responsibility mismatch)",
            "Posting fatigue (role aged or repeatedly reposted)"
          ],
          lowHighTitle: "Low CTR, High ASR",
          lowHighInterpretation: "Interpretation: Strong conversion once discovered. Visibility and relevance in search are limiting performance.",
          lowHighDrivers: [
            "Title not aligned with common market search terms",
            "Overly internal or branded job titles",
            "Missing high-volume keywords in title or first lines",
            "Seniority not clearly signaled (Junior, Senior, Lead, etc.)",
            "Location formatting reducing search eligibility",
            "Narrow or overly specific phrasing limiting match breadth",
            "Low budget / limited distribution (if sponsored)",
            "Competitive search saturation in that job category"
          ],
          lowLowTitle: "Low CTR, Low ASR",
          lowLowRecommendation: "Relevance issue across both stages. Rework title, keywords, and core value proposition.",
          jobsInTile: "jobs in this tile",
          noJobs: "No jobs in this tile.",
          unknownJob: "Unknown job",
          export: "Export CSV"
        },
        de: {
          hoverHint: "Für Interpretation und mögliche Treiber hovern.",
          highTitle: "Hohe CTR, niedrige ASR",
          highInterpretation: "Interpretation: Aufmerksamkeit funktioniert. Verbindlichkeit scheitert.",
          highDrivers: [
            "Erwartungsmismatch (Titel vs. tatsächlicher Umfang)",
            "Vergütungsmismatch (unter Markt oder unklare Spanne)",
            "Standort-/Arbeitsmodell-Reibung (onsite, Hybrid-Unklarheit, Reiseanteil)",
            "Anforderungsinflation (zu viele oder unrealistische Must-haves)",
            "Rollenunklarheit (Ergebnisse, Berichtslinie, Entwicklungspfad)",
            "Arbeitgeber-Vertrauenslücke (schwache Marke, geringe Differenzierung, geringe Glaubwürdigkeit)",
            "Senioritätsinkonsistenz (Titel passt nicht zur Verantwortung)",
            "Posting-Müdigkeit (Rolle alt oder wiederholt repostet)"
          ],
          lowHighTitle: "Niedrige CTR, hohe ASR",
          lowHighInterpretation: "Interpretation: Starke Conversion, sobald entdeckt. Sichtbarkeit und Suchrelevanz begrenzen die Performance.",
          lowHighDrivers: [
            "Titel nicht an gängige Suchbegriffe im Markt angepasst",
            "Zu interne oder markenspezifische Jobtitel",
            "Fehlende Keywords mit hohem Suchvolumen im Titel oder in den ersten Zeilen",
            "Seniorität nicht klar signalisiert (Junior, Senior, Lead usw.)",
            "Standortformatierung reduziert Suchsichtbarkeit",
            "Zu enge oder zu spezifische Formulierung begrenzt Reichweite",
            "Niedriges Budget / begrenzte Distribution (bei Sponsored)",
            "Hohe Wettbewerbssättigung in dieser Jobkategorie"
          ],
          lowLowTitle: "Niedrige CTR, niedrige ASR",
          lowLowRecommendation: "Relevanzproblem in beiden Stufen. Titel, Keywords und Kernbotschaft überarbeiten.",
          jobsInTile: "Jobs in dieser Kachel",
          noJobs: "Keine Jobs in dieser Kachel.",
          unknownJob: "Unbekannter Job",
          export: "CSV exportieren"
        },
        fr: {
          hoverHint: "Survolez pour l'interprétation et les facteurs possibles.",
          highTitle: "CTR élevée, ASR faible",
          highInterpretation: "Interprétation : l'attraction fonctionne. L'engagement échoue.",
          highDrivers: [
            "Décalage d'attentes (intitulé vs périmètre réel)",
            "Décalage de rémunération (sous le marché ou fourchette floue)",
            "Friction lieu/modèle de travail (sur site, ambiguïté hybride, déplacements)",
            "Inflation des exigences (trop de prérequis ou irréalistes)",
            "Ambiguïté du rôle (résultats, rattachement, progression)",
            "Manque de confiance envers l'employeur (marque faible, faible différenciation, crédibilité faible)",
            "Incohérence de séniorité (intitulé vs responsabilités)",
            "Fatigue de publication (annonce ancienne ou repostée)"
          ],
          lowHighTitle: "CTR faible, ASR élevée",
          lowHighInterpretation: "Interprétation : forte conversion une fois trouvé. La visibilité et la pertinence en recherche limitent la performance.",
          lowHighDrivers: [
            "Titre non aligné avec les termes de recherche du marché",
            "Titres trop internes ou trop marqués marque",
            "Mots-clés à fort volume absents du titre ou des premières lignes",
            "Séniorité non clairement signalée (Junior, Senior, Lead, etc.)",
            "Format de localisation réduisant l'éligibilité en recherche",
            "Formulation trop étroite ou trop spécifique limitant la portée",
            "Budget faible / diffusion limitée (si sponsorisé)",
            "Forte saturation concurrentielle sur cette catégorie"
          ],
          lowLowTitle: "CTR faible, ASR faible",
          lowLowRecommendation: "Problème de pertinence aux deux étapes. Revoir intitulé, mots-clés et proposition de valeur.",
          jobsInTile: "emplois dans cette tuile",
          noJobs: "Aucun emploi dans cette tuile.",
          unknownJob: "Emploi inconnu",
          export: "Exporter CSV"
        },
        es: {
          hoverHint: "Pasa el cursor para ver interpretación y posibles causas.",
          highTitle: "CTR alto, ASR bajo",
          highInterpretation: "Interpretación: La atracción funciona. El compromiso falla.",
          highDrivers: [
            "Desajuste de expectativas (título vs alcance real)",
            "Desajuste de compensación (por debajo del mercado o rango poco claro)",
            "Fricción por ubicación/modelo de trabajo (presencial, ambigüedad híbrida, viajes)",
            "Inflación de requisitos (demasiados o poco realistas)",
            "Ambigüedad del rol (resultados, línea de reporte, crecimiento)",
            "Brecha de confianza en la empresa (marca débil, baja diferenciación, baja credibilidad)",
            "Inconsistencia de seniority (título vs responsabilidad)",
            "Fatiga de publicación (vacante antigua o republicada)"
          ],
          lowHighTitle: "CTR bajo, ASR alto",
          lowHighInterpretation: "Interpretación: Conversión fuerte una vez descubierto. La visibilidad y relevancia en búsqueda limitan el rendimiento.",
          lowHighDrivers: [
            "Título no alineado con términos de búsqueda comunes del mercado",
            "Títulos demasiado internos o de marca",
            "Faltan keywords de alto volumen en el título o primeras líneas",
            "Seniority no indicado con claridad (Junior, Senior, Lead, etc.)",
            "Formato de ubicación que reduce elegibilidad en búsqueda",
            "Redacción demasiado estrecha o específica que limita alcance",
            "Presupuesto bajo / distribución limitada (si es patrocinado)",
            "Alta saturación competitiva en esa categoría"
          ],
          lowLowTitle: "CTR bajo, ASR bajo",
          lowLowRecommendation: "Problema de relevancia en ambas etapas. Revisa título, keywords y propuesta de valor.",
          jobsInTile: "empleos en este bloque",
          noJobs: "No hay empleos en este bloque.",
          unknownJob: "Empleo desconocido",
          export: "Exportar CSV"
        },
        it: {
          hoverHint: "Passa il mouse per interpretazione e possibili fattori.",
          highTitle: "CTR alto, ASR basso",
          highInterpretation: "Interpretazione: l'attrazione funziona. L'impegno fallisce.",
          highDrivers: [
            "Mismatch di aspettative (titolo vs reale ambito)",
            "Mismatch retributivo (sotto mercato o range poco chiaro)",
            "Friction su sede/modello di lavoro (onsite, ambiguità ibrido, trasferte)",
            "Inflazione requisiti (troppi o irrealistici)",
            "Ambiguità del ruolo (outcome, riporto, crescita)",
            "Gap di fiducia nel datore (brand debole, bassa differenziazione, scarsa credibilità)",
            "Incoerenza di seniority (titolo vs responsabilità)",
            "Stanchezza del posting (ruolo vecchio o ripubblicato)"
          ],
          lowHighTitle: "CTR basso, ASR alto",
          lowHighInterpretation: "Interpretazione: conversione forte una volta scoperto. Visibilità e rilevanza in ricerca limitano le performance.",
          lowHighDrivers: [
            "Titolo non allineato ai termini di ricerca più usati sul mercato",
            "Titoli troppo interni o brandizzati",
            "Mancano keyword ad alto volume nel titolo o nelle prime righe",
            "Seniority non chiaramente indicata (Junior, Senior, Lead, ecc.)",
            "Formato della location che riduce l'idoneità in ricerca",
            "Formulazione troppo stretta o specifica che limita la copertura",
            "Budget basso / distribuzione limitata (se sponsorizzato)",
            "Elevata saturazione competitiva in quella categoria"
          ],
          lowLowTitle: "CTR basso, ASR basso",
          lowLowRecommendation: "Problema di rilevanza in entrambe le fasi. Rivedere titolo, keyword e proposta di valore.",
          jobsInTile: "lavori in questo riquadro",
          noJobs: "Nessun lavoro in questo riquadro.",
          unknownJob: "Lavoro sconosciuto",
          export: "Esporta CSV"
        },
        nl: {
          hoverHint: "Hover voor interpretatie en mogelijke oorzaken.",
          highTitle: "Hoge CTR, lage ASR",
          highInterpretation: "Interpretatie: Aantrekkingskracht werkt. Commitment faalt.",
          highDrivers: [
            "Mismatch in verwachting (titel vs daadwerkelijke scope)",
            "Mismatch in beloning (onder markt of onduidelijke range)",
            "Wrijving in locatie/werkmodel (onsite, onduidelijk hybride, reizen)",
            "Eiseninflatie (te veel of onrealistische must-haves)",
            "Rol-ambiguïteit (uitkomsten, rapportagelijn, groeipad)",
            "Vertrouwensgat in werkgever (zwak merk, lage differentiatie, lage geloofwaardigheid)",
            "Senioriteitsinconsistentie (titel vs verantwoordelijkheid)",
            "Posting-moeheid (rol oud of herhaald geplaatst)"
          ],
          lowHighTitle: "Lage CTR, hoge ASR",
          lowHighInterpretation: "Interpretatie: Sterke conversie zodra gevonden. Zichtbaarheid en zoekrelevantie beperken de performance.",
          lowHighDrivers: [
            "Titel niet afgestemd op gangbare zoektermen in de markt",
            "Te interne of gebrandde functietitels",
            "Ontbrekende hoogvolume-keywords in titel of eerste regels",
            "Senioriteit niet duidelijk aangegeven (Junior, Senior, Lead, etc.)",
            "Locatie-opmaak verlaagt zoekgeschiktheid",
            "Te smalle of te specifieke formulering beperkt bereik",
            "Laag budget / beperkte distributie (bij gesponsord)",
            "Hoge concurrentieverzadiging in die jobcategorie"
          ],
          lowLowTitle: "Lage CTR, lage ASR",
          lowLowRecommendation: "Relevantieprobleem in beide fasen. Herwerk titel, keywords en waardepropositie.",
          jobsInTile: "jobs in deze tegel",
          noJobs: "Geen jobs in deze tegel.",
          unknownJob: "Onbekende job",
          export: "CSV exporteren"
        }
      };

      let currentHeaders = [];
      let currentTableHeaders = [];
      let currentRows = [];
      let currentStatusHeader = null;
      let currentJobHeader = null;
      let currentCompanyHeader = null;
      let currentCtrHeader = null;
      let currentAsrHeader = null;
      let currentAcrHeader = null;
      let selectedPositionStatus = "both";
      let hasOpenUploadStatuses = false;
      let hasClosedUploadStatuses = false;
      let tableSort = { key: null, dir: "asc" };
      let tableQuadrantFilter = "all";
      const hiddenTableColumnKeys = new Set(["applystarts"]);
      const tableHeaderPriority = [
        "status",
        "job",
        "company",
        "country",
        "city",
        "ctr",
        "asr",
        "acr",
        "impressions",
        "clicks",
        "applications",
        "spend",
        "cpa",
        "cpas",
        "campaign",
        "reference",
        "created",
        "lastupdated",
        "sourcewebsite"
      ];

      const metricMeta = {
        ctr: { short: "CTR", axisLabel: "Clickthrough intent (CTR)" },
        asr: { short: "ASR", axisLabel: "Apply start intent (ASR)" },
        acr: { short: "ACR", axisLabel: "Apply completion intent (ACR)" }
      };
      const countryCurrencyMap = {
        US: "USD", GB: "GBP", UK: "GBP", IE: "EUR", DE: "EUR", FR: "EUR", NL: "EUR", ES: "EUR", IT: "EUR", BE: "EUR",
        CH: "CHF", AT: "EUR", LU: "EUR", PT: "EUR", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF",
        RO: "RON", BG: "BGN", HR: "EUR", SI: "EUR", SK: "EUR", CA: "CAD", AU: "AUD", NZ: "NZD", JP: "JPY"
      };

      function applyUiLanguage(lang) {
        currentLanguage = uiText[lang] ? lang : "en";
        const t = uiText[currentLanguage] || uiText.en;
        const set = (id, value) => {
          const el = document.getElementById(id);
          if (el) el.textContent = value;
        };
        set("pageTitle", t.title);
        set("uploadLabel", t.upload);
        set("hintText", t.hint);
        set("jobsTitle", t.jobs);
        set("quadrantTitle", t.quadrant);
        set("benchTitle", t.benchTitle);
        set("xAxisLabel", "X-axis metric");
        set("yAxisLabel", "Y-axis metric");
        set("chartLegendText", t.legend);
        set("tilesTitle", t.tiles);
        refreshBenchmarkFieldLabels();
        updateQuadrantFilterButtons();
        updatePositionStatusOptions();
        if (!currentRows.length) set("benchmarkNotice", t.noticeDefault);
        if (currentTableHeaders.length) renderTable(currentTableHeaders, getTableRowsForActiveQuadrantFilter());
        if (currentRows.length) rerenderCurrentData();
      }

      function normalizePositionStatus(value) {
        const token = String(value || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z]/g, "");
        if (!token) return "unknown";
        const openTokens = ["open", "offen", "ouvert", "abierta", "aperta", "active", "actief", "activo", "attiva", "running", "live", "published", "publicada"];
        const closedTokens = ["closed", "gesloten", "geschlossen", "ferme", "cerrada", "chiusa", "inactive", "inactief", "inactivo", "paused"];
        if (openTokens.some((candidate) => token.includes(candidate))) return "open";
        if (closedTokens.some((candidate) => token.includes(candidate))) return "closed";
        return "unknown";
      }

      function setPositionFilterAvailability(rows) {
        const list = Array.isArray(rows) ? rows : [];
        if (!currentStatusHeader) {
          hasOpenUploadStatuses = false;
          hasClosedUploadStatuses = false;
          selectedPositionStatus = "both";
          return;
        }
        hasOpenUploadStatuses = list.some((row) => normalizePositionStatus(row[currentStatusHeader]) === "open");
        hasClosedUploadStatuses = list.some((row) => normalizePositionStatus(row[currentStatusHeader]) === "closed");
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

      function getStatusFilteredRows(rows = currentRows) {
        const list = Array.isArray(rows) ? rows : [];
        if (selectedPositionStatus === "both" || !currentStatusHeader) return list;
        return list.filter((row) => normalizePositionStatus(row[currentStatusHeader]) === selectedPositionStatus);
      }

      function getMetricHeader(metricKey) {
        if (metricKey === "ctr") return currentCtrHeader;
        if (metricKey === "asr") return currentAsrHeader;
        if (metricKey === "acr") return currentAcrHeader;
        return null;
      }

      function getMetricLabel(metricKey) {
        return (metricMeta[metricKey] && metricMeta[metricKey].short) || String(metricKey || "").toUpperCase();
      }

      function refreshBenchmarkFieldLabels() {
        const xMetricLabel = getMetricLabel(selectedXAxisMetric);
        const yMetricLabel = getMetricLabel(selectedYAxisMetric);
        const xBenchLabel = document.getElementById("xBenchLabel");
        const yBenchLabel = document.getElementById("yBenchLabel");
        if (xBenchLabel) xBenchLabel.textContent = `${xMetricLabel} Benchmark (%)`;
        if (yBenchLabel) yBenchLabel.textContent = `${yMetricLabel} Benchmark (%)`;
        if (filterQHHBtn) filterQHHBtn.textContent = `High ${xMetricLabel} / High ${yMetricLabel}`;
        if (filterQHLBtn) filterQHLBtn.textContent = `High ${xMetricLabel} / Low ${yMetricLabel}`;
        if (filterQLHBtn) filterQLHBtn.textContent = `Low ${xMetricLabel} / High ${yMetricLabel}`;
        if (filterQLLBtn) filterQLLBtn.textContent = `Low ${xMetricLabel} / Low ${yMetricLabel}`;
      }

      function refreshAxisSelectorsAvailability() {
        const available = {
          ctr: Boolean(currentCtrHeader),
          asr: Boolean(currentAsrHeader),
          acr: Boolean(currentAcrHeader)
        };
        [xAxisMetricSelector, yAxisMetricSelector].forEach((selector) => {
          if (!selector) return;
          Array.from(selector.options).forEach((opt) => {
            const key = opt.value;
            opt.disabled = !available[key];
          });
        });
        if (!available[selectedXAxisMetric]) {
          selectedXAxisMetric = available.ctr ? "ctr" : available.asr ? "asr" : "acr";
        }
        if (!available[selectedYAxisMetric] || selectedYAxisMetric === selectedXAxisMetric) {
          const candidates = ["asr", "ctr", "acr"];
          selectedYAxisMetric = candidates.find((key) => key !== selectedXAxisMetric && available[key]) || selectedXAxisMetric;
        }
        if (xAxisMetricSelector) xAxisMetricSelector.value = selectedXAxisMetric;
        if (yAxisMetricSelector) yAxisMetricSelector.value = selectedYAxisMetric;
        refreshBenchmarkFieldLabels();
      }

      function buildTableHeaders(headers) {
        const withMeta = headers
          .map((header, index) => ({ header, key: getHeaderKey(header), index }))
          .filter(({ key }) => !hiddenTableColumnKeys.has(key));
        const priorityIndex = (key) => {
          const idx = tableHeaderPriority.indexOf(key);
          return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
        };
        withMeta.sort((a, b) => {
          const pa = priorityIndex(a.key);
          const pb = priorityIndex(b.key);
          if (pa !== pb) return pa - pb;
          return a.index - b.index;
        });
        return withMeta.map((item) => item.header);
      }

      async function applyCsvText(text) {
        try {
          hideError();
          const rows = parseCSV(text.replace(/^\uFEFF/, ""));
          if (!rows.length) throw new Error("CSV is empty.");

          const headers = rows[0];
          const jobHeader = pickHeader(headers, columnAliases.job);
          const companyHeader = pickHeader(headers, columnAliases.company);
          if (!jobHeader || !companyHeader) {
            throw new Error(
              "Missing required columns for Job and Company name. Supported header variants include EN/NL/DE/FR/IT/ES."
            );
          }

          const ctrHeader = pickHeader(headers, columnAliases.ctr);
          const asrHeader = pickHeader(headers, columnAliases.asr);
          const acrHeader = pickHeader(headers, columnAliases.acr);
          const statusHeader = pickHeader(headers, columnAliases.status);
          if (!ctrHeader || !asrHeader) {
            throw new Error(
              "Missing required rate columns. Supported CTR/ASR header variants include EN/NL/DE/FR/IT/ES."
            );
          }

          const dataRows = rows.slice(1).map((r) => {
            const obj = {};
            headers.forEach((h, i) => {
              obj[h] = r[i] ?? "";
            });
            return obj;
          });

          currentHeaders = headers.slice();
          currentTableHeaders = buildTableHeaders(headers);
          currentRows = dataRows;
          currentStatusHeader = statusHeader;
          setPositionFilterAvailability(dataRows);
          updatePositionStatusOptions();
          tableSort = { key: null, dir: "asc" };
          tableQuadrantFilter = "all";
          updateQuadrantFilterButtons();
          renderTable(currentTableHeaders, getTableRowsForActiveQuadrantFilter());
          currentJobHeader = jobHeader;
          currentCompanyHeader = companyHeader;
          currentCtrHeader = ctrHeader;
          currentAsrHeader = asrHeader;
          currentAcrHeader = acrHeader;
          refreshAxisSelectorsAvailability();
          rerenderCurrentData();
        } catch (err) {
          showError(err.message || "Failed to parse CSV.");
          currentHeaders = [];
          currentTableHeaders = [];
          currentRows = [];
          currentStatusHeader = null;
          hasOpenUploadStatuses = false;
          hasClosedUploadStatuses = false;
          selectedPositionStatus = "both";
          updatePositionStatusOptions();
          currentJobHeader = null;
          currentCompanyHeader = null;
          currentCtrHeader = null;
          currentAsrHeader = null;
          currentAcrHeader = null;
          benchmarkNotice.textContent = (uiText[currentLanguage] || uiText.en).noticeDefault;
          renderTable([], []);
          clearQuadrant();
          tiles.innerHTML = "";
          tableQuadrantFilter = "all";
          updateQuadrantFilterButtons();
        }
      }

      csvFile.addEventListener("change", async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const text = await file.text();
        await applyCsvText(text);
      });

      if (embedded && uploadSection) {
        uploadSection.style.display = "none";
      }

      window.addEventListener("message", async (event) => {
        const data = event.data;
        if (!data) return;
        if (data.type === SHARED_UPLOAD_MESSAGE && data.payload && data.payload.text) {
          await applyCsvText(data.payload.text);
          return;
        }
        if (data.type === UI_LANGUAGE_MESSAGE && data.payload && data.payload.language) {
          applyUiLanguage(data.payload.language);
        }
      });

      function rerenderCurrentData() {
        if (!currentRows.length || !currentJobHeader || !currentCompanyHeader || !currentCtrHeader || !currentAsrHeader) return;
        const filteredRows = getStatusFilteredRows(currentRows);
        const ctrValues = filteredRows.map((row) => parseMetricRate(row[currentCtrHeader], "ctr")).filter((v) => v != null);
        const asrValues = filteredRows.map((row) => parseMetricRate(row[currentAsrHeader], "asr")).filter((v) => v != null);
        const acrValues = currentAcrHeader ? filteredRows.map((row) => parseMetricRate(row[currentAcrHeader], "acr")).filter((v) => v != null) : [];
        medianByMetric.ctr = medianExcludingZero(ctrValues);
        medianByMetric.asr = medianExcludingZero(asrValues);
        medianByMetric.acr = acrValues.length ? medianExcludingZero(acrValues) : null;

        const manualX = parseBenchmarkInput(xBenchmarkInput.value);
        const manualY = parseBenchmarkInput(yBenchmarkInput.value);
        xThreshold = manualX != null ? manualX : (medianByMetric[selectedXAxisMetric] ?? 0);
        yThreshold = manualY != null ? manualY : (medianByMetric[selectedYAxisMetric] ?? 0);
        const manualCtr = selectedXAxisMetric === "ctr" ? manualX : selectedYAxisMetric === "ctr" ? manualY : null;
        const manualAsr = selectedXAxisMetric === "asr" ? manualX : selectedYAxisMetric === "asr" ? manualY : null;
        ctrThreshold = manualCtr != null ? manualCtr : (medianByMetric.ctr ?? 0);
        asrThreshold = manualAsr != null ? manualAsr : (medianByMetric.asr ?? 0);

        const modeLabel = manualX != null || manualY != null ? "manual/median mixed" : "median auto";
        benchmarkNotice.innerHTML = `Current medians (excluding 0 values): <span class="benchmark-accent">${getMetricLabel(selectedXAxisMetric)} ${pctLabel(medianByMetric[selectedXAxisMetric] ?? 0)}</span>, <span class="benchmark-accent">${getMetricLabel(selectedYAxisMetric)} ${pctLabel(medianByMetric[selectedYAxisMetric] ?? 0)}</span>. Active benchmark mode: ${escapeHTML(modeLabel)}.`;
        renderQuadrant(filteredRows, currentCompanyHeader, currentJobHeader);
        renderTiles(currentHeaders, filteredRows, currentCtrHeader, currentAsrHeader, currentCompanyHeader, currentJobHeader);
        updateQuadrantFilterButtons();
        renderTable(currentTableHeaders, getTableRowsForActiveQuadrantFilter());
      }

      function parseBenchmarkInput(rawValue) {
        const text = String(rawValue ?? "").trim();
        if (!text) return null;
        const num = Number(text);
        if (!Number.isFinite(num) || num < 0) return null;
        return num / 100;
      }

      function applyBenchmarkInputs() {
        rerenderCurrentData();
      }

      xBenchmarkInput.addEventListener("input", applyBenchmarkInputs);
      yBenchmarkInput.addEventListener("input", applyBenchmarkInputs);
      xAxisMetricSelector.addEventListener("change", () => {
        selectedXAxisMetric = xAxisMetricSelector.value;
        if (selectedYAxisMetric === selectedXAxisMetric) {
          const candidates = ["asr", "ctr", "acr"];
          const next = candidates.find((k) => k !== selectedXAxisMetric && getMetricHeader(k));
          if (next) selectedYAxisMetric = next;
        }
        refreshAxisSelectorsAvailability();
        rerenderCurrentData();
      });
      yAxisMetricSelector.addEventListener("change", () => {
        selectedYAxisMetric = yAxisMetricSelector.value;
        if (selectedYAxisMetric === selectedXAxisMetric) {
          const candidates = ["asr", "ctr", "acr"];
          const next = candidates.find((k) => k !== selectedYAxisMetric && getMetricHeader(k));
          if (next) selectedXAxisMetric = next;
        }
        refreshAxisSelectorsAvailability();
        rerenderCurrentData();
      });

      [
        { key: "highHigh", btn: filterQHHBtn },
        { key: "highLow", btn: filterQHLBtn },
        { key: "lowHigh", btn: filterQLHBtn },
        { key: "lowLow", btn: filterQLLBtn }
      ].forEach(({ key, btn }) => {
        if (!btn) return;
        btn.addEventListener("click", () => {
          tableQuadrantFilter = tableQuadrantFilter === key ? "all" : key;
          updateQuadrantFilterButtons();
          renderTable(currentTableHeaders, getTableRowsForActiveQuadrantFilter());
        });
      });
      document.getElementById("positionStatusSelector").addEventListener("change", () => {
        selectedPositionStatus = document.getElementById("positionStatusSelector").value || "both";
        tableQuadrantFilter = "all";
        updateQuadrantFilterButtons();
        rerenderCurrentData();
      });
      applyUiLanguage(currentLanguage);

      function showError(message) {
        errorBox.textContent = message;
        errorBox.hidden = false;
      }

      function hideError() {
        errorBox.hidden = true;
        errorBox.textContent = "";
      }

      function parseRate(value) {
        if (value == null) return null;
        const raw = String(value).trim();
        if (!raw) return null;

        const percent = raw.endsWith("%");
        const cleaned = raw.replace(/,/g, "").replace("%", "").trim();
        const n = Number(cleaned);
        if (!Number.isFinite(n)) return null;
        return percent ? n / 100 : n;
      }

      function parseMetricRate(value, metricKey) {
        const rate = parseRate(value);
        if (rate == null) return null;
        if (metricKey === "asr") return Math.min(rate, 1);
        return rate;
      }

      function classifyRows(rows, ctrHeader, asrHeader) {
        const groups = {
          highCtrLowAsr: [],
          lowCtrHighAsr: [],
          lowBoth: [],
        };

        rows.forEach((row) => {
          const ctr = parseMetricRate(row[ctrHeader], "ctr");
          const asr = parseMetricRate(row[asrHeader], "asr");
          if (ctr == null || asr == null) return;

          if (ctr >= ctrThreshold && asr < asrThreshold) {
            groups.highCtrLowAsr.push(row);
          } else if (ctr < ctrThreshold && asr >= asrThreshold) {
            groups.lowCtrHighAsr.push(row);
          } else if (ctr < ctrThreshold && asr < asrThreshold) {
            groups.lowBoth.push(row);
          }
        });

        return groups;
      }

      function classifyRowsByCurrentAxes(rows) {
        const xHeader = getMetricHeader(selectedXAxisMetric);
        const yHeader = getMetricHeader(selectedYAxisMetric);
        const groups = {
          highHigh: [],
          highLow: [],
          lowHigh: [],
          lowLow: []
        };
        if (!xHeader || !yHeader) return groups;
        rows.forEach((row) => {
          const xVal = parseMetricRate(row[xHeader], selectedXAxisMetric);
          const yVal = parseMetricRate(row[yHeader], selectedYAxisMetric);
          if (xVal == null || yVal == null) return;
          if (xVal >= xThreshold && yVal >= yThreshold) groups.highHigh.push(row);
          else if (xVal >= xThreshold && yVal < yThreshold) groups.highLow.push(row);
          else if (xVal < xThreshold && yVal >= yThreshold) groups.lowHigh.push(row);
          else groups.lowLow.push(row);
        });
        return groups;
      }

      function getTableRowsForActiveQuadrantFilter() {
        const filteredRows = getStatusFilteredRows(currentRows);
        if (tableQuadrantFilter === "all") return filteredRows;
        const groups = classifyRowsByCurrentAxes(filteredRows);
        return groups[tableQuadrantFilter] || [];
      }

      function updateQuadrantFilterButtons() {
        const mapping = [
          { key: "highHigh", btn: filterQHHBtn },
          { key: "highLow", btn: filterQHLBtn },
          { key: "lowHigh", btn: filterQLHBtn },
          { key: "lowLow", btn: filterQLLBtn }
        ];
        mapping.forEach(({ key, btn }) => {
          if (!btn) return;
          btn.classList.toggle("active", tableQuadrantFilter === key);
        });
      }

      function renderTiles(headers, rows, ctrHeader, asrHeader, companyHeader, jobHeader) {
        const groups = classifyRows(rows, ctrHeader, asrHeader);
        const tileI18n = tileText[currentLanguage] || tileText.en;
        const config = [
          {
            key: "highCtrLowAsr",
            title: tileI18n.highTitle,
            recommendation: tileI18n.hoverHint,
            hoverDetails: {
              interpretation: tileI18n.highInterpretation,
              drivers: tileI18n.highDrivers
            },
            filename: "high_ctr_low_asr_jobs.csv",
          },
          {
            key: "lowCtrHighAsr",
            title: tileI18n.lowHighTitle,
            recommendation: tileI18n.hoverHint,
            hoverDetails: {
              interpretation: tileI18n.lowHighInterpretation,
              drivers: tileI18n.lowHighDrivers
            },
            filename: "low_ctr_high_asr_jobs.csv",
          },
          {
            key: "lowBoth",
            title: tileI18n.lowLowTitle,
            recommendation: tileI18n.lowLowRecommendation,
            filename: "low_ctr_low_asr_jobs.csv",
          },
        ];

        tiles.innerHTML = "";

        config.forEach((item) => {
          const setRows = groups[item.key];
          const card = document.createElement("article");
          card.className = "tile";

          const sampleJobs = setRows.slice(0, 8).map((r) => {
            const job = r[jobHeader] || tileI18n.unknownJob;
            return `<li>${escapeHTML(job)}</li>`;
          });

          card.innerHTML = `
            <h3>${item.title}</h3>
            <p class="tile-hint">${item.recommendation}</p>
            <div class="count"><strong>${setRows.length}</strong> ${tileI18n.jobsInTile}</div>
            <ul class="job-list">${sampleJobs.join("") || `<li>${escapeHTML(tileI18n.noJobs)}</li>`}</ul>
            <button class="export" ${setRows.length ? "" : "disabled"}>${tileI18n.export}</button>
          `;

          const btn = card.querySelector("button.export");
          btn.addEventListener("click", () => {
            downloadCsv(item.filename, headers, setRows, item, tileI18n);
          });

          if (item.hoverDetails) {
            const hoverHtml = `
              <p><strong>${escapeHTML(item.hoverDetails.interpretation)}</strong></p>
              <ul>${item.hoverDetails.drivers.map((d) => `<li>${escapeHTML(d)}</li>`).join("")}</ul>
            `;
            const placeHover = (event) => {
              const pad = 16;
              const offset = 16;
              const rect = tileHoverTooltip.getBoundingClientRect();
              let x = event.clientX + offset;
              let y = event.clientY + offset;
              if (x + rect.width + pad > window.innerWidth) x = event.clientX - rect.width - offset;
              if (y + rect.height + pad > window.innerHeight) y = event.clientY - rect.height - offset;
              if (x < pad) x = pad;
              if (y < pad) y = pad;
              tileHoverTooltip.style.left = `${x}px`;
              tileHoverTooltip.style.top = `${y}px`;
            };
            card.addEventListener("mouseenter", (event) => {
              tileHoverTooltip.innerHTML = hoverHtml;
              tileHoverTooltip.style.display = "block";
              placeHover(event);
            });
            card.addEventListener("mousemove", placeHover);
            card.addEventListener("mouseleave", () => {
              tileHoverTooltip.style.display = "none";
            });
          }

          tiles.appendChild(card);
        });
      }

      function normalizeHeaderName(value) {
        return String(value || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");
      }

      function getHeaderKey(header) {
        const normalized = normalizeHeaderName(header);
        if (columnAliases.job.some((h) => normalizeHeaderName(h) === normalized)) return "job";
        if (columnAliases.company.some((h) => normalizeHeaderName(h) === normalized)) return "company";
        if (columnAliases.ctr.some((h) => normalizeHeaderName(h) === normalized)) return "ctr";
        if (columnAliases.asr.some((h) => normalizeHeaderName(h) === normalized)) return "asr";
        if (columnAliases.acr.some((h) => normalizeHeaderName(h) === normalized)) return "acr";
        if (normalized.includes("currency") || normalized.includes("valuta") || normalized.includes("waehrung") || normalized.includes("wahrung") || normalized.includes("devise") || normalized.includes("moneda")) return "currency";
        if (normalized.includes("city") || normalized.includes("plaats") || normalized.includes("stadt") || normalized.includes("ville") || normalized.includes("citta") || normalized.includes("ciudad")) return "city";
        if (normalized.includes("country") || normalized.includes("land") || normalized.includes("pais") || normalized.includes("paese") || normalized.includes("pays")) return "country";
        if (normalized.includes("impression")) return "impressions";
        if (normalized === "clicks" || normalized === "clics" || normalized === "klicks") return "clicks";
        if (normalized.includes("application") || normalized.includes("applies") || normalized.includes("bewerbung") || normalized.includes("candidature") || normalized.includes("sollicit")) return "applications";
        if (normalized.includes("applystart") || normalized.includes("gestartesollicitaties") || normalized.includes("begonnenebewerbungen") || normalized.includes("postulacionesiniciadas")) return "applystarts";
        if (normalized.includes("spend") || normalized.includes("cost") || normalized.includes("depense") || normalized.includes("gasto") || normalized.includes("spesa") || normalized.includes("uitgav")) return "spend";
        if (normalized === "cpa" || normalized.includes("costperapply")) return "cpa";
        if (normalized === "cpas" || normalized.includes("costperapplystart")) return "cpas";
        if (normalized.includes("campaign")) return "campaign";
        if (normalized.includes("status")) return "status";
        if (normalized.includes("reference")) return "reference";
        if (normalized.includes("created")) return "created";
        if (normalized.includes("lastupdated") || normalized.includes("updated")) return "lastupdated";
        if (normalized.includes("sourcewebsite") || (normalized.includes("source") && normalized.includes("website"))) return "sourcewebsite";
        return null;
      }

      function inferCurrencyFromCountry(countryRaw) {
        const raw = String(countryRaw || "").trim();
        if (!raw) return "";
        const upper = raw.toUpperCase();
        if (countryCurrencyMap[upper]) return countryCurrencyMap[upper];
        const token = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
        const alias = {
          unitedstates: "US", usa: "US", us: "US",
          unitedkingdom: "GB", uk: "GB", greatbritain: "GB", britain: "GB", england: "GB",
          germany: "DE", deutschland: "DE",
          france: "FR", italy: "IT", italia: "IT", spain: "ES", espana: "ES", netherlands: "NL", nederland: "NL",
          belgium: "BE", belgique: "BE", belgie: "BE", ireland: "IE", switzerland: "CH", schweiz: "CH", suisse: "CH",
          austria: "AT", osterreich: "AT", österreich: "AT"
        };
        const iso = alias[token] || "";
        return iso ? (countryCurrencyMap[iso] || "") : "";
      }

      function normalizeCurrencyCode(rawCurrency, countryRaw = "") {
        const raw = String(rawCurrency || "").trim();
        if (!raw) return inferCurrencyFromCountry(countryRaw);
        const upper = raw.toUpperCase();
        if (/^[A-Z]{3}$/.test(upper)) return upper;
        const token = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (token.includes("usd") || token.includes("dollar")) return "USD";
        if (token.includes("eur") || token.includes("euro") || token.includes("€")) return "EUR";
        if (token.includes("gbp") || token.includes("pound") || token.includes("sterling") || token.includes("£")) return "GBP";
        if (token.includes("chf") || token.includes("swiss") || token.includes("franc")) return "CHF";
        return inferCurrencyFromCountry(countryRaw);
      }

      function parseNumberLoose(value) {
        const text = String(value ?? "").trim();
        if (!text) return null;
        const direct = Number(text.replace(/[%\s]/g, "").replace(/,/g, ""));
        if (Number.isFinite(direct)) return direct;
        const cleaned = text.replace(/[^\d,.-]/g, "").replace(/\s/g, "");
        if (!cleaned) return null;
        const lastComma = cleaned.lastIndexOf(",");
        const lastDot = cleaned.lastIndexOf(".");
        const normalized = lastComma > lastDot
          ? cleaned.replace(/\./g, "").replace(",", ".")
          : cleaned.replace(/,/g, "");
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
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

      function localizedHeaderLabel(header) {
        const key = getHeaderKey(header);
        if (!key) return header;
        const labels = localizedTableHeaders[currentLanguage] || localizedTableHeaders.en;
        return labels[key] || header;
      }

      function sortTableRows(rows) {
        if (!tableSort.key) return rows.slice();
        const dir = tableSort.dir === "asc" ? 1 : -1;
        return rows.slice().sort((a, b) => {
          const left = a[tableSort.key];
          const right = b[tableSort.key];
          const leftRate = parseRate(left);
          const rightRate = parseRate(right);
          if (leftRate != null && rightRate != null) return (leftRate - rightRate) * dir;
          const leftRaw = String(left ?? "").replace(/,/g, "");
          const rightRaw = String(right ?? "").replace(/,/g, "");
          const leftNum = Number(leftRaw);
          const rightNum = Number(rightRaw);
          if (Number.isFinite(leftNum) && Number.isFinite(rightNum)) return (leftNum - rightNum) * dir;
          return String(left ?? "").localeCompare(String(right ?? "")) * dir;
        });
      }

      function renderTable(headers, rows) {
        tableHead.innerHTML = "";
        tableBody.innerHTML = "";

        if (!headers.length) return;
        const countryHeader = headers.find((h) => getHeaderKey(h) === "country") || null;
        const currencyHeader = headers.find((h) => getHeaderKey(h) === "currency") || null;

        const tr = document.createElement("tr");
        headers.forEach((h) => {
          const th = document.createElement("th");
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "th-sort-btn";
          const arrow = tableSort.key === h ? (tableSort.dir === "asc" ? " ↑" : " ↓") : "";
          btn.textContent = `${localizedHeaderLabel(h)}${arrow}`;
          btn.addEventListener("click", () => {
            if (tableSort.key === h) {
              tableSort.dir = tableSort.dir === "asc" ? "desc" : "asc";
            } else {
              tableSort.key = h;
              tableSort.dir = "asc";
            }
            renderTable(currentTableHeaders, getTableRowsForActiveQuadrantFilter());
          });
          th.appendChild(btn);
          tr.appendChild(th);
        });
        tableHead.appendChild(tr);

        sortTableRows(rows).forEach((row) => {
          const bodyTr = document.createElement("tr");
          headers.forEach((h) => {
            const td = document.createElement("td");
            const key = getHeaderKey(h);
            if (key === "spend" || key === "cpa" || key === "cpas") {
              const num = parseNumberLoose(row[h]);
              const rowCountry = countryHeader ? row[countryHeader] : "";
              const rowCurrency = currencyHeader ? row[currencyHeader] : "";
              const currency = normalizeCurrencyCode(rowCurrency, rowCountry);
              td.textContent = num == null ? (row[h] ?? "") : formatCurrencyValue(num, currency, 2, 2);
            } else if (key === "ctr" || key === "asr" || key === "acr") {
              const rate = parseMetricRate(row[h], key);
              td.textContent = rate == null ? (row[h] ?? "") : pctLabel(rate);
            } else {
              td.textContent = row[h] ?? "";
            }
            bodyTr.appendChild(td);
          });
          tableBody.appendChild(bodyTr);
        });
      }

      function clearQuadrant() {
        chart.innerHTML = "";
      }

      function renderQuadrant(rows, companyHeader, jobHeader) {
        clearQuadrant();
        const xHeader = getMetricHeader(selectedXAxisMetric);
        const yHeader = getMetricHeader(selectedYAxisMetric);
        if (!xHeader || !yHeader) return;

        const points = rows
          .map((row) => {
            const xMetric = parseMetricRate(row[xHeader], selectedXAxisMetric);
            const yMetric = parseMetricRate(row[yHeader], selectedYAxisMetric);
            if (xMetric == null || yMetric == null) return null;
            return {
              company: row[companyHeader] || "",
              job: row[jobHeader] || "",
              xMetric,
              yMetric,
              intent: xMetric * yMetric,
            };
          })
          .filter(Boolean);

        if (!points.length) return;

        const W = 1000;
        const H = 620;
        const margin = { top: 30, right: 24, bottom: 60, left: 78 };
        const plotW = W - margin.left - margin.right;
        const plotH = H - margin.top - margin.bottom;

        const maxX = Math.max(xThreshold, ...points.map((p) => p.xMetric));
        const maxY = Math.max(yThreshold, ...points.map((p) => p.yMetric));
        const xMax = niceMax(maxX);
        const yMax = niceMax(maxY);

        const toX = (v) => margin.left + (v / xMax) * plotW;
        const toY = (v) => margin.top + plotH - (v / yMax) * plotH;

        const bg = svgEl("rect", {
          x: margin.left,
          y: margin.top,
          width: plotW,
          height: plotH,
          fill: cssVar("--t-plot-bg"),
          stroke: cssVar("--t-border"),
        });
        chart.appendChild(bg);

        const midV = svgEl("line", {
          x1: toX(xThreshold),
          x2: toX(xThreshold),
          y1: margin.top,
          y2: margin.top + plotH,
          stroke: cssVar("--t-faint"),
          "stroke-dasharray": "6 5",
          "stroke-width": "2",
        });
        chart.appendChild(midV);

        const midH = svgEl("line", {
          x1: margin.left,
          x2: margin.left + plotW,
          y1: toY(yThreshold),
          y2: toY(yThreshold),
          stroke: cssVar("--t-faint"),
          "stroke-dasharray": "6 5",
          "stroke-width": "2",
        });
        chart.appendChild(midH);

        chart.appendChild(
          svgEl(
            "text",
            {
              x: toX(xThreshold) + 6,
              y: margin.top + 16,
              fill: cssVar("--t-muted"),
              "font-size": "12",
            },
            `${getMetricLabel(selectedXAxisMetric)} benchmark ${pctLabel(xThreshold)}`
          )
        );

        chart.appendChild(
          svgEl(
            "text",
            {
              x: margin.left + 8,
              y: toY(yThreshold) - 6,
              fill: cssVar("--t-muted"),
              "font-size": "12",
            },
            `${getMetricLabel(selectedYAxisMetric)} benchmark ${pctLabel(yThreshold)}`
          )
        );

        chart.appendChild(
          svgEl("line", {
            x1: margin.left,
            y1: margin.top + plotH,
            x2: margin.left + plotW,
            y2: margin.top + plotH,
            stroke: cssVar("--t-axis"),
            "stroke-width": "2",
          })
        );

        chart.appendChild(
          svgEl("line", {
            x1: margin.left,
            y1: margin.top,
            x2: margin.left,
            y2: margin.top + plotH,
            stroke: cssVar("--t-axis"),
            "stroke-width": "2",
          })
        );

        for (let i = 0; i <= 5; i += 1) {
          const xVal = (xMax / 5) * i;
          const yVal = (yMax / 5) * i;

          const x = toX(xVal);
          const y = toY(yVal);

          chart.appendChild(
            svgEl(
              "text",
              {
                x,
                y: margin.top + plotH + 22,
                fill: cssVar("--t-faint"),
                "font-size": "12",
                "text-anchor": "middle",
              },
              pctLabel(xVal)
            )
          );

          chart.appendChild(
            svgEl(
              "text",
              {
                x: margin.left - 10,
                y: y + 4,
                fill: cssVar("--t-faint"),
                "font-size": "12",
                "text-anchor": "end",
              },
              pctLabel(yVal)
            )
          );
        }

        chart.appendChild(
          svgEl(
            "text",
            {
              x: margin.left + plotW / 2,
              y: H - 12,
              fill: cssVar("--t-text"),
              "font-size": "14",
            "text-anchor": "middle",
            },
            metricMeta[selectedXAxisMetric] ? metricMeta[selectedXAxisMetric].axisLabel : getMetricLabel(selectedXAxisMetric)
          )
        );

        chart.appendChild(
          svgEl(
            "text",
            {
              x: 20,
              y: margin.top + plotH / 2,
              fill: cssVar("--t-text"),
              "font-size": "14",
              transform: `rotate(-90 20 ${margin.top + plotH / 2})`,
              "text-anchor": "middle",
            },
            metricMeta[selectedYAxisMetric] ? metricMeta[selectedYAxisMetric].axisLabel : getMetricLabel(selectedYAxisMetric)
          )
        );

        const maxIntent = Math.max(0.0001, ...points.map((p) => p.intent));

        points.forEach((p) => {
          const cx = toX(p.xMetric);
          const cy = toY(p.yMetric);
          const r = 4 + (p.intent / maxIntent) * 14;

          const c = svgEl("circle", {
            cx,
            cy,
            r: String(r.toFixed(2)),
            fill: intentColor(p.intent / maxIntent),
            stroke: "rgba(255, 255, 255, 0.3)",
            "stroke-width": "1",
            opacity: "0.88",
            tabindex: "0",
          });

          const show = (evt) => {
            const x = evt.clientX + 12;
            const y = evt.clientY + 12;
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
            tooltip.innerHTML = `<strong>${escapeHTML(p.company)}</strong><br>${escapeHTML(p.job)}<br>${escapeHTML(getMetricLabel(selectedXAxisMetric))}: ${pctLabel(p.xMetric)}<br>${escapeHTML(getMetricLabel(selectedYAxisMetric))}: ${pctLabel(p.yMetric)}<br>Intent: ${p.intent.toFixed(4)}`;
            tooltip.style.display = "block";
          };

          c.addEventListener("mousemove", show);
          c.addEventListener("mouseenter", show);
          c.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
          });

          chart.appendChild(c);
        });
      }

      function downloadCsv(filename, headers, rows, tileConfig = null, tileI18n = null) {
        const localizedHeaders = headers.map((h) => localizedHeaderLabel(h));
        const headerLine = localizedHeaders.map(csvEscape).join(",");
        const dataLines = rows.map((row) => headers.map((h) => csvEscape(row[h] ?? "")).join(","));
        const lines = [headerLine, ...dataLines];
        if (tileConfig) {
          const exportActionTexts = {
            highCtrLowAsr: `High CTR + Low ASR:

Interpretation: Attraction works. Commitment fails.
Goal: Reduce perceived risk and align expectations to increase apply intent.

Action Steps

1. Tighten Title Accuracy

Remove inflated seniority (e.g., “Manager” without direct reports).

Replace broad keywords with precise functional titles.

Align title with actual scope and compensation level.

2. Align First 5 Lines with Search Promise

Ensure responsibilities match what the title implies.

Clearly state core function, team context, and impact.

Avoid generic intros (e.g., “We are looking for a dynamic…”).

3. Surface Compensation & Contract Early

Add salary range (competitive and realistic).

Clarify bonus structure if applicable.

State contract type and working hours clearly.

4. Reduce Requirement Inflation

Limit must-haves to 5–7 essentials.

Move secondary skills to “nice-to-have.”

Remove unrealistic experience stacking.

5. Clarify Work Model & Logistics

Explicitly state remote/hybrid/onsite.

Clarify travel expectations.

Avoid multi-location ambiguity.

6. Increase Role Clarity

Add reporting line.

Define success metrics or first-year expectations.

Clarify growth path if applicable.

7. Strengthen Employer Credibility

Add concrete differentiators (growth stage, market position).

Include impact statements.

Reduce generic employer branding language.`,
            lowCtrHighAsr: `Low CTR + High ASR

Interpretation: Strong conversion once discovered. Visibility is limiting performance.
Goal: Expand qualified reach without damaging conversion quality.

Action Steps

1. Optimize Job Title for Market Search

Replace internal titles with market-standard equivalents.

Add searchable functional keywords.

Include seniority markers (Junior, Senior, Lead).

2. Strengthen Keyword Density Strategically

Include high-volume keywords naturally in first 200 words.

Mirror common candidate search terms.

Avoid overly niche phrasing.

3. Broaden Functional Framing (Carefully)

Replace narrow tool-specific titles with broader functional roles.

Ensure expanded phrasing still matches actual scope.

4. Optimize Location Formatting

Use standardized city formatting.

Separate multi-location listings if needed.

Ensure remote roles are clearly marked.

5. Improve Early Scannability

Add bullet points in the intro section.

Move key responsibilities upward.

Reduce long, dense paragraphs.

6. Assess Visibility Levers

Evaluate sponsored budget competitiveness.

Check impression share against similar roles.

Consider reposting if aged.

7. Monitor Conversion Protection

After expanding reach, monitor ASR closely.

If ASR drops significantly, refine keyword breadth.`
          };
          const actionText = exportActionTexts[tileConfig.key] || tileConfig.recommendation || "";
          lines.push("");
          lines.push(csvEscape("Action Items"));
          lines.push("Type,Value");
          lines.push(`Tile,${csvEscape(tileConfig.title || "")}`);
          lines.push(`Action Text,${csvEscape(actionText)}`);
        }
        const csvText = lines.join("\n");
        const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
      }

      function csvEscape(value) {
        const s = String(value);
        if (/[,"\n\r]/.test(s)) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      }

      function normalizeHeader(text) {
        return String(text || "")
          .replace(/^\uFEFF/, "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");
      }

      function pickHeader(headers, aliases) {
        const byNormalized = new Map();
        headers.forEach((h) => {
          const normalized = normalizeHeader(h);
          if (!byNormalized.has(normalized)) byNormalized.set(normalized, h);
        });
        for (const alias of aliases) {
          const normalizedAlias = normalizeHeader(alias);
          if (byNormalized.has(normalizedAlias)) return byNormalized.get(normalizedAlias);
        }
        return null;
      }

      function median(values) {
        if (!values.length) return null;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
        return sorted[mid];
      }

      function medianExcludingZero(values) {
        const nonZero = (Array.isArray(values) ? values : []).filter((v) => Number.isFinite(v) && v > 0);
        if (nonZero.length) return median(nonZero);
        const withZero = (Array.isArray(values) ? values : []).filter((v) => Number.isFinite(v));
        return withZero.length ? median(withZero) : null;
      }

      function niceMax(v) {
        if (v <= 0.05) return 0.05;
        if (v <= 0.1) return 0.1;
        if (v <= 0.2) return 0.2;
        if (v <= 0.5) return 0.5;
        return Math.ceil(v * 10) / 10;
      }

      function pctLabel(v) {
        return (v * 100).toFixed(1).replace(/\.0$/, "") + "%";
      }

      function intentColor(norm) {
        // Cool steel-blue (low intent) -> warm bright yellow (high intent).
        // Tuned to stay visible on the dark plot background.
        const n = Math.max(0, Math.min(1, norm));
        const r = Math.round(90 + 155 * n);
        const g = Math.round(140 + 60 * n);
        const b = Math.round(180 - 100 * n);
        return `rgb(${r},${g},${b})`;
      }

      // Resolve a CSS custom property to a concrete value. SVG presentation
      // attributes (set via setAttribute) don't reliably support var().
      function cssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      }

      function svgEl(tag, attrs, text) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
        if (text != null) el.textContent = text;
        return el;
      }

      function escapeHTML(s) {
        return String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function parseCSV(text) {
        const rows = [];
        let row = [];
        let cell = "";
        let inQuotes = false;

        for (let i = 0; i < text.length; i += 1) {
          const ch = text[i];
          const next = text[i + 1];

          if (inQuotes) {
            if (ch === '"' && next === '"') {
              cell += '"';
              i += 1;
            } else if (ch === '"') {
              inQuotes = false;
            } else {
              cell += ch;
            }
            continue;
          }

          if (ch === '"') {
            inQuotes = true;
            continue;
          }

          if (ch === ',') {
            row.push(cell);
            cell = "";
            continue;
          }

          if (ch === '\n') {
            row.push(cell.replace(/\r$/, ""));
            rows.push(row);
            row = [];
            cell = "";
            continue;
          }

          cell += ch;
        }

        if (cell.length || row.length) {
          row.push(cell.replace(/\r$/, ""));
          rows.push(row);
        }

        return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
      }
