    let map;
    let markersLayer = L.layerGroup();
    let clusterRingsLayer = L.layerGroup();
    const geocodeCache = {};
    const geocodeCacheKey = 'heatmap_geocode_cache_v1';
    const geocodeConcurrency = 8;
    let selectedMetric = 'apps';
    let selectedScale = 'log';
    let selectedViewMode = 'total';
    let showClusterRings = true;
    let selectedPositionStatus = 'both';
    let hasOpenUploadStatuses = false;
    let hasClosedUploadStatuses = false;
    let lastRingData = [];
    let lastRingScale = null;
    let activeCityFilter = '';
    let uploadedJobRows = [];
    let uploadedHeatRows = [];
    let uploadedSourceFormat = 'default';
    let cityCoordinateByKey = new Map();
    let isIndeedUploadData = false;
    let tableSort = { key: "city", dir: "asc" };
    let selectedCountryLayer = 'all';
    let performanceFilters = [];
    let nextPerformanceFilterId = 1;
    const gradientStops = { low: "#d93025", mid: "#f6c343", high: "#1a9850" };
    const embedded = new URLSearchParams(window.location.search).get("embedded") === "1";
    const SHARED_UPLOAD_MESSAGE = "shared-csv-upload";
    const UI_LANGUAGE_MESSAGE = "ui-language-changed";
    let currentLanguage = "en";
    const uiText = {
        en: {
            tableTitle: "Uploaded Jobs Table", showTable: "Show Table", hideTable: "Hide Table", clearFilter: "Clear filter",
            metric: "HEATMAP METRIC", scale: "COLOR SCALE", viewMode: "VIEW MODE", customFilters: "CUSTOM FILTERS", addFilter: "Add filter",
            positionStatus: "POSITION STATUS", positionStatusBoth: "Both", positionStatusOpen: "Open", positionStatusClosed: "Closed",
            positionStatusOpenOnly: "Open", positionStatusClosedOnly: "Closed",
            liveCsv: "LIVE CSV UPDATE", clusterRings: "Show area heat rings",
            countryLayer: "COUNTRY LAYER", allCountries: "All countries"
        },
        de: {
            tableTitle: "Hochgeladene Jobs", showTable: "Tabelle anzeigen", hideTable: "Tabelle ausblenden", clearFilter: "Filter löschen",
            metric: "HEATMAP-METRIK", scale: "FARBSKALA", viewMode: "ANSICHT", customFilters: "BENUTZERFILTER", addFilter: "Filter hinzufügen",
            positionStatus: "STELLENSTATUS", positionStatusBoth: "Beide", positionStatusOpen: "Offen", positionStatusClosed: "Geschlossen",
            positionStatusOpenOnly: "Offen", positionStatusClosedOnly: "Geschlossen",
            liveCsv: "LIVE-CSV-UPDATE", clusterRings: "Flächen-Heat-Ringe anzeigen",
            countryLayer: "LÄNDER-EBENE", allCountries: "Alle Länder"
        },
        fr: {
            tableTitle: "Tableau des emplois importés", showTable: "Afficher le tableau", hideTable: "Masquer le tableau", clearFilter: "Effacer le filtre",
            metric: "MÉTRIQUE HEATMAP", scale: "ÉCHELLE DE COULEUR", viewMode: "MODE D'AFFICHAGE", customFilters: "FILTRES PERSONNALISÉS", addFilter: "Ajouter un filtre",
            positionStatus: "STATUT DU POSTE", positionStatusBoth: "Les deux", positionStatusOpen: "Ouvert", positionStatusClosed: "Fermé",
            positionStatusOpenOnly: "Ouvert", positionStatusClosedOnly: "Fermé",
            liveCsv: "MISE À JOUR CSV", clusterRings: "Afficher les anneaux de zone",
            countryLayer: "COUCHE PAYS", allCountries: "Tous les pays"
        },
        es: {
            tableTitle: "Tabla de empleos cargados", showTable: "Mostrar tabla", hideTable: "Ocultar tabla", clearFilter: "Borrar filtro",
            metric: "MÉTRICA HEATMAP", scale: "ESCALA DE COLOR", viewMode: "MODO DE VISTA", customFilters: "FILTROS PERSONALIZADOS", addFilter: "Añadir filtro",
            positionStatus: "ESTADO DE LA VACANTE", positionStatusBoth: "Ambos", positionStatusOpen: "Abierta", positionStatusClosed: "Cerrada",
            positionStatusOpenOnly: "Abierta", positionStatusClosedOnly: "Cerrada",
            liveCsv: "ACTUALIZACIÓN CSV", clusterRings: "Mostrar anillos de zona",
            countryLayer: "CAPA DE PAÍS", allCountries: "Todos los países"
        },
        it: {
            tableTitle: "Tabella lavori caricati", showTable: "Mostra tabella", hideTable: "Nascondi tabella", clearFilter: "Cancella filtro",
            metric: "METRICA HEATMAP", scale: "SCALA COLORE", viewMode: "MODALITÀ VISTA", customFilters: "FILTRI PERSONALIZZATI", addFilter: "Aggiungi filtro",
            positionStatus: "STATO DELLA POSIZIONE", positionStatusBoth: "Entrambi", positionStatusOpen: "Aperta", positionStatusClosed: "Chiusa",
            positionStatusOpenOnly: "Aperta", positionStatusClosedOnly: "Chiusa",
            liveCsv: "AGGIORNAMENTO CSV", clusterRings: "Mostra anelli area",
            countryLayer: "LIVELLO PAESE", allCountries: "Tutti i paesi"
        },
        nl: {
            tableTitle: "Geüploade vacatures", showTable: "Tabel tonen", hideTable: "Tabel verbergen", clearFilter: "Filter wissen",
            metric: "HEATMAP-METRIEK", scale: "KLEURSCHAAL", viewMode: "WEERGAVE", customFilters: "AANGEPASTE FILTERS", addFilter: "Filter toevoegen",
            positionStatus: "VACATURESTATUS", positionStatusBoth: "Beide", positionStatusOpen: "Open", positionStatusClosed: "Gesloten",
            positionStatusOpenOnly: "Open", positionStatusClosedOnly: "Gesloten",
            liveCsv: "LIVE CSV-UPDATE", clusterRings: "Toon gebieds-ringen",
            countryLayer: "LAND-LAAG", allCountries: "Alle landen"
        }
    };
    const tableHeaderI18n = {
        en: { job: "Job", city: "City", impressions: "Impressions", ctr: "CTR", clicks: "Clicks", asr: "ASR", applyStarts: "Apply starts", acr: "ACR", applications: "Applies", trafficIntent: "Traffic intent", spend: "Spend", status: "Status" },
        de: { job: "Job", city: "Stadt", impressions: "Impressionen", ctr: "CTR", clicks: "Klicks", asr: "ASR", applyStarts: "Bewerbungsstarts", acr: "ACR", applications: "Bewerbungen", trafficIntent: "Traffic-Intent", spend: "Ausgaben", status: "Status" },
        fr: { job: "Poste", city: "Ville", impressions: "Impressions", ctr: "CTR", clicks: "Clics", asr: "ASR", applyStarts: "Débuts candidature", acr: "ACR", applications: "Candidatures", trafficIntent: "Intention trafic", spend: "Dépenses", status: "Statut" },
        es: { job: "Puesto", city: "Ciudad", impressions: "Impresiones", ctr: "CTR", clicks: "Clics", asr: "ASR", applyStarts: "Inicios solicitud", acr: "ACR", applications: "Solicitudes", trafficIntent: "Intención tráfico", spend: "Gasto", status: "Estado" },
        it: { job: "Ruolo", city: "Città", impressions: "Impression", ctr: "CTR", clicks: "Clic", asr: "ASR", applyStarts: "Avvii candidatura", acr: "ACR", applications: "Candidature", trafficIntent: "Intento traffico", spend: "Spesa", status: "Stato" },
        nl: { job: "Vacature", city: "Plaats", impressions: "Impressies", ctr: "CTR", clicks: "Klikken", asr: "ASR", applyStarts: "Gestarte sollicitaties", acr: "ACR", applications: "Sollicitaties", trafficIntent: "Traffic intent", spend: "Uitgaven", status: "Status" }
    };
    const scaleHelpTitleByLanguage = {
        en: "Color Scale Guide",
        de: "Leitfaden zur Farbskala",
        fr: "Guide de l'echelle de couleurs",
        nl: "Kleurschaal-gids"
    };
    const scaleHelpContentByLanguage = {
        en: `
            <p><strong>How to use this feature</strong></p>
            <p>Example with one metric: Apply starts per city.</p>
            <p>Data (12 cities):<br>
            [3, 5, 8, 12, 18, 30, 45, 70, 110, 180, 900, 4200]</p>
            <p>If you use P20–P80:</p>
            <p>20th percentile is around low double digits.<br>
            80th percentile is around low hundreds.<br>
            Values below P20 collapse near the low color.<br>
            Values above P80 collapse near the high color.<br>
            What happens:</p>
            <p>900 and 4200 both look similarly "max hot".<br>
            3 and 12 both look similarly "cool".<br>
            Great for quick "normal market" comparison, bad for separating extremes.</p>
            <p>If you use P10–P90:</p>
            <p>Band is wider, so you keep a bit more tail detail.<br>
            But still, 4200 likely saturates at top color.<br>
            900 may still be close to top saturation.<br>
            Better than P20–P80, still compresses extreme gaps.</p>
            <p>If you use log:</p>
            <p>Transform values with log1p(x).<br>
            Gap between 900 and 4200 becomes visible without dominating the whole palette.<br>
            Gap between 3 and 12 also becomes visible.<br>
            You can distinguish all tiers:<br>
            very low: 3-12<br>
            low-mid: 18-70<br>
            mid-high: 110-180<br>
            high outliers: 900, 4200</p>
            <p>Why this matters in client conversation:</p>
            <p>With percentile bands, you answer: "Which locations are strong/weak relative to typical range?"<br>
            With log, you answer: "Are our outliers different by 2x or by 5x, and are lower markets actually different from each other?"</p>
            <p>Concrete business moment where log is better:</p>
            <p>Client says: "Everything outside London looks the same, so where should we optimize first?"<br>
            In percentile mode, many non-London cities may all look similar.<br>
            In log mode, you can separate:<br>
            near-zero markets (need basic demand creation),<br>
            moderate markets (need conversion tuning),<br>
            high markets (budget efficiency focus).</p>
            <p>Rule of thumb:</p>
            <p>P20–P80: executive/default storytelling.<br>
            P10–P90: slightly more sensitivity.<br>
            Log: skewed data diagnostics and outlier decomposition.</p>
        `,
        de: `
            <p><strong>So verwenden Sie diese Funktion</strong></p>
            <p>Beispiel mit einer Kennzahl: Bewerbungsstarts pro Stadt.</p>
            <p>Daten (12 Stadte):<br>
            [3, 5, 8, 12, 18, 30, 45, 70, 110, 180, 900, 4200]</p>
            <p>Wenn Sie P20-P80 verwenden:</p>
            <p>Das 20. Perzentil liegt etwa im niedrigen zweistelligen Bereich.<br>
            Das 80. Perzentil liegt etwa im niedrigen dreistelligen Bereich.<br>
            Werte unter P20 fallen nahe an die niedrige Farbe.<br>
            Werte uber P80 fallen nahe an die hohe Farbe.<br>
            Was passiert:</p>
            <p>900 und 4200 wirken beide ahnlich als "maximal heiss".<br>
            3 und 12 wirken beide ahnlich als "kuhl".<br>
            Sehr gut fur einen schnellen Vergleich im "normalen Markt", aber schlecht zur Trennung von Extremen.</p>
            <p>Wenn Sie P10-P90 verwenden:</p>
            <p>Das Band ist breiter, daher bleibt etwas mehr Detail in den Randbereichen.<br>
            Trotzdem sattigt 4200 wahrscheinlich bei der Spitzenfarbe.<br>
            900 liegt wahrscheinlich weiterhin nahe der Spitzensattigung.<br>
            Besser als P20-P80, aber extreme Abstande werden weiterhin komprimiert.</p>
            <p>Wenn Sie Log verwenden:</p>
            <p>Transformieren Sie Werte mit log1p(x).<br>
            Der Abstand zwischen 900 und 4200 wird sichtbar, ohne die gesamte Farbpalette zu dominieren.<br>
            Der Abstand zwischen 3 und 12 wird ebenfalls sichtbar.<br>
            Sie konnen alle Stufen unterscheiden:<br>
            sehr niedrig: 3-12<br>
            niedrig-mittel: 18-70<br>
            mittel-hoch: 110-180<br>
            hohe Ausreisser: 900, 4200</p>
            <p>Warum das im Kundengesprach wichtig ist:</p>
            <p>Mit Perzentil-Bandern beantworten Sie: "Welche Standorte sind stark/schwach im typischen Bereich?"<br>
            Mit Log beantworten Sie: "Unterscheiden sich Ausreisser um 2x oder 5x, und unterscheiden sich niedrigere Markte wirklich voneinander?"</p>
            <p>Konkreter Business-Moment, in dem Log besser ist:</p>
            <p>Der Kunde sagt: "Alles ausserhalb von London sieht gleich aus, wo sollen wir zuerst optimieren?"<br>
            Im Perzentilmodus sehen viele Nicht-London-Stadte ahnlich aus.<br>
            Im Log-Modus konnen Sie unterscheiden:<br>
            nahezu null Markte (benotigen grundlegende Nachfrageerzeugung),<br>
            mittlere Markte (benotigen Conversion-Optimierung),<br>
            starke Markte (Fokus auf Budgeteffizienz).</p>
            <p>Faustregel:</p>
            <p>P20-P80: Executive-/Default-Storytelling.<br>
            P10-P90: etwas mehr Sensitivitat.<br>
            Log: Diagnose bei schiefen Daten und Zerlegung von Ausreissern.</p>
        `,
        fr: `
            <p><strong>Comment utiliser cette fonctionnalite</strong></p>
            <p>Exemple avec une metrique: debuts de candidature par ville.</p>
            <p>Donnees (12 villes):<br>
            [3, 5, 8, 12, 18, 30, 45, 70, 110, 180, 900, 4200]</p>
            <p>Si vous utilisez P20-P80:</p>
            <p>Le 20e percentile se situe autour de faibles valeurs a deux chiffres.<br>
            Le 80e percentile se situe autour de faibles valeurs a trois chiffres.<br>
            Les valeurs sous P20 se tassent vers la couleur basse.<br>
            Les valeurs au-dessus de P80 se tassent vers la couleur haute.<br>
            Ce qui se passe:</p>
            <p>900 et 4200 paraissent tous deux de facon similaire "maximum chaud".<br>
            3 et 12 paraissent tous deux de facon similaire "froid".<br>
            Tres utile pour une comparaison rapide du "marche normal", moins bon pour separer les extremes.</p>
            <p>Si vous utilisez P10-P90:</p>
            <p>La plage est plus large, donc vous conservez un peu plus de detail sur les extremites.<br>
            Mais 4200 saturera probablement encore la couleur haute.<br>
            900 peut rester proche de la saturation haute.<br>
            Mieux que P20-P80, mais les ecarts extremes restent compresses.</p>
            <p>Si vous utilisez log:</p>
            <p>Transformez les valeurs avec log1p(x).<br>
            L'ecart entre 900 et 4200 devient visible sans dominer toute la palette.<br>
            L'ecart entre 3 et 12 devient aussi visible.<br>
            Vous pouvez distinguer tous les niveaux:<br>
            tres faible: 3-12<br>
            faible-moyen: 18-70<br>
            moyen-eleve: 110-180<br>
            valeurs aberrantes elevees: 900, 4200</p>
            <p>Pourquoi c'est important en conversation client:</p>
            <p>Avec des bandes de percentiles, vous repondez: "Quels lieux sont forts/faibles par rapport a la plage typique?"<br>
            Avec log, vous repondez: "Nos valeurs aberrantes sont-elles differentes de 2x ou de 5x, et les marches faibles sont-ils vraiment differents entre eux?"</p>
            <p>Moment business concret ou log est meilleur:</p>
            <p>Le client dit: "Tout hors Londres se ressemble, ou optimiser en premier?"<br>
            En mode percentile, beaucoup de villes hors Londres peuvent sembler similaires.<br>
            En mode log, vous pouvez separer:<br>
            marches quasi nuls (besoin de creation de demande),<br>
            marches moderes (besoin d'optimiser la conversion),<br>
            marches eleves (focus efficacite budgetaire).</p>
            <p>Regle pratique:</p>
            <p>P20-P80: storytelling executif/par defaut.<br>
            P10-P90: sensibilite legerement plus elevee.<br>
            Log: diagnostic de donnees asymetriques et decomposition des valeurs aberrantes.</p>
        `,
        nl: `
            <p><strong>Hoe gebruik je deze functie</strong></p>
            <p>Voorbeeld met een metric: gestarte sollicitaties per stad.</p>
            <p>Data (12 steden):<br>
            [3, 5, 8, 12, 18, 30, 45, 70, 110, 180, 900, 4200]</p>
            <p>Als je P20-P80 gebruikt:</p>
            <p>Het 20e percentiel ligt rond lage dubbele cijfers.<br>
            Het 80e percentiel ligt rond lage honderden.<br>
            Waarden onder P20 vallen samen bij de lage kleur.<br>
            Waarden boven P80 vallen samen bij de hoge kleur.<br>
            Wat gebeurt er:</p>
            <p>900 en 4200 zien er allebei ongeveer hetzelfde "maximaal heet" uit.<br>
            3 en 12 zien er allebei ongeveer hetzelfde "koel" uit.<br>
            Goed voor snelle vergelijking van de "normale markt", minder goed om extremen te onderscheiden.</p>
            <p>Als je P10-P90 gebruikt:</p>
            <p>De band is breder, dus je behoudt iets meer detail in de staarten.<br>
            Maar 4200 zal waarschijnlijk nog steeds op de topkleur satureren.<br>
            900 kan nog steeds dicht bij topsaturatie liggen.<br>
            Beter dan P20-P80, maar extreme verschillen blijven gecomprimeerd.</p>
            <p>Als je log gebruikt:</p>
            <p>Transformeer waarden met log1p(x).<br>
            Het verschil tussen 900 en 4200 wordt zichtbaar zonder het hele kleurenpalet te domineren.<br>
            Het verschil tussen 3 en 12 wordt ook zichtbaar.<br>
            Je kunt alle niveaus onderscheiden:<br>
            zeer laag: 3-12<br>
            laag-midden: 18-70<br>
            midden-hoog: 110-180<br>
            hoge uitschieters: 900, 4200</p>
            <p>Waarom dit belangrijk is in klantgesprekken:</p>
            <p>Met percentielbanden beantwoord je: "Welke locaties zijn sterk/zwak ten opzichte van het typische bereik?"<br>
            Met log beantwoord je: "Verschillen uitschieters 2x of 5x, en verschillen lagere markten echt van elkaar?"</p>
            <p>Concreet zakelijk moment waarin log beter is:</p>
            <p>Klant zegt: "Alles buiten Londen lijkt hetzelfde, waar moeten we eerst optimaliseren?"<br>
            In percentielmodus lijken veel steden buiten Londen op elkaar.<br>
            In logmodus kun je scheiden:<br>
            bijna-nul markten (basis vraagcreatie nodig),<br>
            gematigde markten (conversie-optimalisatie nodig),<br>
            sterke markten (focus op budgetefficiency).</p>
            <p>Vuistregel:</p>
            <p>P20-P80: executive/default storytelling.<br>
            P10-P90: iets meer gevoeligheid.<br>
            Log: diagnose van scheve data en uitschieteranalyse.</p>
        `
    };
    const countryAliases = {
        deutschland: "Germany",
        deutschlande: "Germany",
        germany: "Germany",
        niederlande: "Netherlands",
        netherlands: "Netherlands",
        belgie: "Belgium",
        belgium: "Belgium"
    };
    const countryCurrencyMap = {
        US: "USD", GB: "GBP", UK: "GBP", IE: "EUR", DE: "EUR", FR: "EUR", NL: "EUR", ES: "EUR", IT: "EUR", BE: "EUR",
        CH: "CHF", AT: "EUR", LU: "EUR", PT: "EUR", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF",
        RO: "RON", BG: "BGN", HR: "EUR", SI: "EUR", SK: "EUR", CA: "CAD", AU: "AUD", NZ: "NZD", JP: "JPY"
    };
    
    const metricConfig = {
        apps: { label: "Applications", formatter: (v) => `${Math.round(v)}` },
        applyStarts: { label: "Application starts", formatter: (v) => `${Math.round(v)}` },
        clicks: { label: "Clicks", formatter: (v) => `${Math.round(v)}` },
        acr: { label: "Apply completion rate", formatter: (v) => `${(v * 100).toFixed(2)}%` },
        spend: { label: "Spend", formatter: (v) => `${Number(v || 0).toFixed(2)}` },
        jobs: { label: "Job count", formatter: (v) => `${Math.round(v)}` },
        ctr: { label: "Click-through rate", formatter: (v) => `${(v * 100).toFixed(2)}%` },
        asr: { label: "Apply start rate", formatter: (v) => `${(v * 100).toFixed(2)}%` },
        intent: { label: "Traffic intent", formatter: (v) => `${(v * 100).toFixed(2)}%` }
    };
    const metricOptionOrder = ['apps', 'applyStarts', 'clicks', 'acr', 'spend', 'jobs', 'ctr', 'asr', 'intent'];

    // Default data
    let campaignData = [
        {"name": "Drachten", "lat": 53.1125, "lng": 6.0989, "apps": 49, "impressions": 24662, "clicks": 1565, "cpa": 39.31, "jobs": 24, "spend": 1926.13},
        {"name": "Groningen", "lat": 53.2194, "lng": 6.5665, "apps": 39, "impressions": 18699, "clicks": 1212, "cpa": 17.42, "jobs": 10, "spend": 679.32},
        {"name": "Assen", "lat": 52.9925, "lng": 6.5642, "apps": 23, "impressions": 3171, "clicks": 373, "cpa": 6.55, "jobs": 3, "spend": 150.62},
        {"name": "Tolbert", "lat": 53.1667, "lng": 6.3667, "apps": 11, "impressions": 3705, "clicks": 227, "cpa": 13.36, "jobs": 2, "spend": 146.97},
        {"name": "Hoogeveen", "lat": 52.7214, "lng": 6.4919, "apps": 10, "impressions": 2106, "clicks": 158, "cpa": 15.1, "jobs": 4, "spend": 150.97},
        {"name": "Westerbroek", "lat": 53.1833, "lng": 6.6667, "apps": 5, "impressions": 4973, "clicks": 438, "cpa": 19.76, "jobs": 1, "spend": 98.81},
        {"name": "Hasselt", "lat": 52.5908, "lng": 6.0881, "apps": 3, "impressions": 1056, "clicks": 47, "cpa": 39.63, "jobs": 3, "spend": 118.9},
        {"name": "Drachtstercompagnie", "lat": 53.125, "lng": 6.1333, "apps": 2, "impressions": 1932, "clicks": 65, "cpa": 47.66, "jobs": 1, "spend": 95.31},
        {"name": "Heerenveen", "lat": 52.9575, "lng": 5.925, "apps": 2, "impressions": 4909, "clicks": 123, "cpa": 39.12, "jobs": 3, "spend": 78.25},
        {"name": "Roden", "lat": 53.1383, "lng": 6.425, "apps": 2, "impressions": 3848, "clicks": 291, "cpa": 40.04, "jobs": 1, "spend": 80.07},
        {"name": "Grootegast", "lat": 53.2133, "lng": 6.275, "apps": 1, "impressions": 3526, "clicks": 188, "cpa": 181.83, "jobs": 3, "spend": 181.83},
        {"name": "Kollum", "lat": 53.2833, "lng": 6.15, "apps": 1, "impressions": 2408, "clicks": 227, "cpa": 7.5, "jobs": 1, "spend": 7.5},
        {"name": "Veendam", "lat": 53.1, "lng": 6.8833, "apps": 1, "impressions": 154, "clicks": 8, "cpa": 18.29, "jobs": 1, "spend": 18.29},
        {"name": "Zuidbroek", "lat": 53.1667, "lng": 6.8667, "apps": 1, "impressions": 214, "clicks": 12, "cpa": 99.5, "jobs": 1, "spend": 99.5},
        {"name": "Joure", "lat": 52.9667, "lng": 5.7833, "apps": 0, "impressions": 52, "clicks": 5, "cpa": 0.0, "jobs": 2, "spend": 0.0},
        {"name": "Leek", "lat": 53.1611, "lng": 6.3925, "apps": 0, "impressions": 1721, "clicks": 106, "cpa": 0.0, "jobs": 2, "spend": 49.69},
        {"name": "Marum", "lat": 53.1417, "lng": 6.2611, "apps": 0, "impressions": 3431, "clicks": 227, "cpa": 0.0, "jobs": 1, "spend": 117.84}
    ];

    window.onload = function() {
        map = L.map('map').setView([53.1, 6.4], 9);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
        map.on('click', () => {
            // Background map click should only collapse the table, not clear the active city filter.
            setTableCollapsed(true);
        });
        campaignData = campaignData.map(enrichLocationMetrics);
        seedDefaultTableRows();
        renderMarkers();
        renderJobsTable();
        updateLegendBounds();
        document.getElementById('csvUploader').addEventListener('change', handleCsvUpload);
        document.getElementById('metricSelector').addEventListener('change', handleMetricChange);
        document.getElementById('scaleSelector').addEventListener('change', handleScaleChange);
        document.getElementById('scaleHelpBtn').addEventListener('click', openScaleHelpOverlay);
        document.getElementById('scaleHelpCloseBtn').addEventListener('click', closeScaleHelpOverlay);
        document.getElementById('scaleHelpOverlay').addEventListener('click', handleScaleHelpOverlayClick);
        document.addEventListener('keydown', handleScaleHelpEscape);
        document.getElementById('viewModeSelector').addEventListener('change', handleViewModeChange);
        document.getElementById('countryLayerSelector').addEventListener('change', handleCountryLayerChange);
        document.getElementById('positionStatusSelector').addEventListener('change', handlePositionStatusChange);
        document.getElementById('addPerformanceFilter').addEventListener('click', () => {
            addPerformanceFilter();
        });
        document.getElementById('clusterRingsToggle').addEventListener('change', (event) => {
            showClusterRings = Boolean(event.target.checked);
            renderMarkers();
        });
        loadGeocodeCache();
        applyUiLanguage(currentLanguage);
        addPerformanceFilter('cpas');
        if (embedded) {
            const uploader = document.getElementById('csvUploader');
            const liveLabel = uploader && uploader.previousElementSibling;
            if (uploader) uploader.style.display = 'none';
            if (liveLabel) liveLabel.textContent = 'SHARED CSV UPDATE';
            setUploadStatus('Use the shared uploader in the top navigation to update this map.');
        }
    };

    function seedDefaultTableRows() {
        uploadedJobRows = campaignData.map((loc) => ({
            job: "Aggregated location data",
            city: loc.name,
            country: "",
            currency: loc.currency || "EUR",
            region: "",
            impressions: loc.impressions,
            ctr: loc.ctr,
            clicks: loc.clicks,
            applyStarts: loc.apps,
            acr: loc.apps > 0 ? 1 : 0,
            applications: loc.apps,
            asr: loc.asr,
            trafficIntent: loc.trafficIntent,
            spend: loc.spend,
            status: "-",
            lastUpdated: ""
        }));
    }

    function toggleTablePanel() {
        const panel = document.getElementById('tablePanel');
        setTableCollapsed(!panel.classList.contains('collapsed'));
    }

    function setTableCollapsed(collapsed) {
        const panel = document.getElementById('tablePanel');
        panel.classList.toggle('collapsed', collapsed);
        const t = uiText[currentLanguage] || uiText.en;
        document.getElementById('toggleTableBtn').textContent = collapsed ? t.showTable : t.hideTable;
    }

    function applyUiLanguage(lang) {
        currentLanguage = uiText[lang] ? lang : "en";
        const t = uiText[currentLanguage];
        const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
        set("tablePanelTitle", t.tableTitle);
        set("clearTableFilter", t.clearFilter);
        set("metricLabel", t.metric);
        set("scaleLabel", t.scale);
        set("viewModeLabel", t.viewMode);
        set("countryLayerLabel", t.countryLayer);
        set("customFiltersLabel", t.customFilters);
        set("addPerformanceFilter", "+");
        set("liveCsvLabel", t.liveCsv);
        set("clusterRingsLabel", t.clusterRings);
        set("positionStatusLabel", t.positionStatus);
        set("positionStatusBoth", t.positionStatusBoth);
        set("positionStatusOpen", t.positionStatusOpen);
        set("positionStatusClosed", t.positionStatusClosed);
        const helpTitle = document.getElementById("scaleHelpModalTitle");
        if (helpTitle) helpTitle.textContent = scaleHelpTitleByLanguage[currentLanguage] || scaleHelpTitleByLanguage.en;
        const helpBody = document.getElementById("scaleHelpBody");
        if (helpBody) helpBody.innerHTML = scaleHelpContentByLanguage[currentLanguage] || scaleHelpContentByLanguage.en;
        const panel = document.getElementById("tablePanel");
        const collapsed = panel ? panel.classList.contains("collapsed") : true;
        setTableCollapsed(collapsed);
        updateTableSortButtons();
        updateMetricSelectorOptions();
        updateCountryLayerOptions();
        updatePositionStatusOptions();
        renderPerformanceFilters();
    }

    function normalizeStatusToken(rawStatus) {
        return String(rawStatus || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
    }

    function normalizePositionStatus(rawStatus) {
        const token = normalizeStatusToken(rawStatus);
        if (!token) return "other";

        const openTokens = [
            "open", "openposition", "openpost", "openvacature", "openjob", "openings", "actief", "active", "live", "running", "onbekend", "publ", "published", "publish", "veröffentlicht",
            "veroeffentlicht", "activo", "activa", "attivo", "ouvert", "actif", "abierta", "abierto", "aperta", "aperto"
        ];
        const closedTokens = [
            "closed", "close", "geschlossen", "gesloten", "inactief", "inactivo", "closedposition", "closedvacature", "closedjob", "uitgezet", "uitgesloten",
            "arrested", "suspended", "paused", "stopped", "terminated", "cerrada", "chiuso", "chiusa", "inattiva", "inativo", "ferme", "fermé"
        ];

        for (const candidate of openTokens) {
            if (token.includes(candidate)) return "open";
        }

        for (const candidate of closedTokens) {
            if (token.includes(candidate)) return "closed";
        }

        if (token === "offen" || token === "otvet") return "open";
        if (token === "gebru" || token === "buiten") return "closed";
        return "other";
    }

    function getLocationKey(city, country) {
        return `${normalizeStatusToken(city)}||${normalizeStatusToken(country || "")}`;
    }

    function passesPositionStatusFilter(row = {}) {
        if (!hasOpenUploadStatuses && !hasClosedUploadStatuses) return true;
        const status = normalizePositionStatus(row.status);
        if (selectedPositionStatus === 'both') return true;
        if (status === 'other') return false;
        return status === selectedPositionStatus;
    }

    function updatePositionStatusOptions() {
        const selector = document.getElementById('positionStatusSelector');
        if (!selector) return;
        const openOpt = selector.querySelector('option[value="open"]');
        const closedOpt = selector.querySelector('option[value="closed"]');

        if (openOpt) openOpt.disabled = !hasOpenUploadStatuses;
        if (closedOpt) closedOpt.disabled = !hasClosedUploadStatuses;

        if (selectedPositionStatus === 'open' && openOpt && openOpt.disabled) {
            selectedPositionStatus = 'both';
        }
        if (selectedPositionStatus === 'closed' && closedOpt && closedOpt.disabled) {
            selectedPositionStatus = 'both';
        }
        selector.value = selectedPositionStatus;
    }

    function setPositionFilterAvailabilityFromRows(rows) {
        const hasRows = Array.isArray(rows) ? rows : [];
        hasOpenUploadStatuses = hasRows.some((row) => normalizePositionStatus(row && row.status) === 'open');
        hasClosedUploadStatuses = hasRows.some((row) => normalizePositionStatus(row && row.status) === 'closed');
        if (!hasOpenUploadStatuses && !hasClosedUploadStatuses) {
            selectedPositionStatus = 'both';
        } else if (selectedPositionStatus === 'open' && !hasOpenUploadStatuses) {
            selectedPositionStatus = 'both';
        } else if (selectedPositionStatus === 'closed' && !hasClosedUploadStatuses) {
            selectedPositionStatus = 'both';
        }
    }

    function getFilteredCampaignDataSource(rows) {
        return (rows || []).filter(passesPositionStatusFilter);
    }

    function rebuildCampaignDataForStatus() {
        const statusRows = isIndeedUploadData ? getFilteredCampaignDataSource(uploadedJobRows) : uploadedJobRows;
        const sourceRows = Array.isArray(statusRows) ? statusRows : [];
        if (!sourceRows.length) {
            return { campaignData: [], resolvedCount: 0, unresolved: [] };
        }

        const filteredCampaign = isIndeedUploadData ? aggregateIndeedRows(sourceRows) : sourceRows;
        filteredCampaign.forEach((loc) => {
            const cityKey = getLocationKey(loc.name, loc.country);
            const cached = cityCoordinateByKey.get(cityKey);
            if (cached) {
                loc.lat = cached.lat;
                loc.lng = cached.lng;
            }
        });

        return { campaignData: filteredCampaign };
    }

    function syncUploadedCoordinates(rows) {
        rows.forEach((loc) => {
            const key = getLocationKey(loc.name, loc.country || "");
            if (Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
                cityCoordinateByKey.set(key, { lat: loc.lat, lng: loc.lng });
            }
        });
    }

    async function applyStatusFilterAndRender() {
        const { campaignData: nextCampaign } = rebuildCampaignDataForStatus();
        campaignData = nextCampaign;

        syncUploadedCoordinates(campaignData);
        const toResolve = campaignData.filter((loc) => !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng));
        if (toResolve.length) {
            setUploadStatus(`Resolving coordinates (deduplicated location queries)...`);
            const unresolved = await enrichWithCoordinates(campaignData, (done, total) => {
                setUploadStatus(`Resolving coordinates (${done}/${total} unique location queries)...`);
            });

            unresolved.forEach((name, idx) => {
                const key = getLocationKey(name, '');
                const cached = cityCoordinateByKey.get(key);
                if (cached) {
                    const row = campaignData.find((loc) => normalizeStatusToken(loc.name) === normalizeStatusToken(name));
                    if (row) {
                        row.lat = cached.lat;
                        row.lng = cached.lng;
                    }
                }
            });
            syncUploadedCoordinates(campaignData);
        }

        const resolvedData = campaignData.filter((loc) => Number.isFinite(loc.lat) && Number.isFinite(loc.lng));
        campaignData = resolvedData;
        activeCityFilter = '';
        tableSort = { key: "city", dir: "asc" };
        updateMetricSelectorOptions();
        updateCountryLayerOptions();
        updatePositionStatusOptions();
        renderPerformanceFilters();
        renderMarkers();
        renderJobsTable();
        updateLegendBounds();

        if (!campaignData.length) {
            setUploadStatus('No rows match the selected status filter.', 'error');
        }
    }

    function handlePositionStatusChange() {
        selectedPositionStatus = document.getElementById('positionStatusSelector').value;
        applyStatusFilterAndRender();
    }

    function clearLocationFilter() {
        activeCityFilter = '';
        renderJobsTable();
    }

    function handleMetricChange(event) {
        selectedMetric = event.target.value;
        renderMarkers();
        updateLegendBounds();
    }

    function handleScaleChange(event) {
        selectedScale = event.target.value;
        renderMarkers();
        updateLegendBounds();
    }

    function openScaleHelpOverlay(event) {
        if (event) event.stopPropagation();
        const overlay = document.getElementById('scaleHelpOverlay');
        if (!overlay) return;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
    }

    function closeScaleHelpOverlay() {
        const overlay = document.getElementById('scaleHelpOverlay');
        if (!overlay) return;
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    }

    function handleScaleHelpOverlayClick(event) {
        if (event.target && event.target.id === 'scaleHelpOverlay') {
            closeScaleHelpOverlay();
        }
    }

    function handleScaleHelpEscape(event) {
        if (event.key !== 'Escape') return;
        const overlay = document.getElementById('scaleHelpOverlay');
        if (!overlay || !overlay.classList.contains('open')) return;
        closeScaleHelpOverlay();
    }

    function handleViewModeChange(event) {
        selectedViewMode = event.target.value;
        renderMarkers();
        updateLegendBounds();
    }

    function handleCountryLayerChange(event) {
        selectedCountryLayer = event.target.value || 'all';
        activeCityFilter = '';
        renderMarkers();
        renderJobsTable();
        updateLegendBounds();
    }

    function isRateFilterMetric(metric) {
        return metric === 'ctr' || metric === 'asr' || metric === 'acr';
    }

    function getPerformanceFilterMetricOptions() {
        const support = getMetricSupportFlags();
        const options = [
            { value: 'ctr', label: 'CTR' },
            { value: 'asr', label: 'ASR' },
            { value: 'cpas', label: 'CPAS' },
            { value: 'cpa', label: 'CPA' },
            { value: 'jobs', label: 'Job count' }
        ];
        if (support.acr) {
            options.splice(2, 0, { value: 'acr', label: 'ACR' });
        }
        return options;
    }

    function readFilterValueInput(rawValue, metric) {
        const text = String(rawValue || '').trim();
        if (text === '') return null;
        const value = Number(text);
        if (!Number.isFinite(value)) return null;
        return isRateFilterMetric(metric) ? value / 100 : value;
    }

    function addPerformanceFilter(defaultMetric = 'cpas') {
        const options = getPerformanceFilterMetricOptions();
        const hasMetric = options.some((opt) => opt.value === defaultMetric);
        performanceFilters.push({
            id: nextPerformanceFilterId++,
            metric: hasMetric ? defaultMetric : options[0].value,
            op: 'gte',
            rawValue: ''
        });
        renderPerformanceFilters();
        activeCityFilter = '';
        renderMarkers();
        renderJobsTable();
        updateLegendBounds();
    }

    function removePerformanceFilter(id) {
        performanceFilters = performanceFilters.filter((filter) => filter.id !== id);
        renderPerformanceFilters();
        activeCityFilter = '';
        renderMarkers();
        renderJobsTable();
        updateLegendBounds();
    }

    function getMetricMedian(metric) {
        const values = (campaignData || [])
            .map((loc) => {
                if (metric === 'jobs') return Number(loc.jobs || 0);
                if (metric === 'cpa') return Number(loc.cpa || 0);
                if (metric === 'cpas') return Number(loc.cpas || 0);
                if (metric === 'ctr') return Number(loc.ctr || 0);
                if (metric === 'asr') return Number(loc.asr || 0);
                if (metric === 'acr') return Number(loc.acr || 0);
                return NaN;
            })
            .filter((v) => Number.isFinite(v))
            .sort((a, b) => a - b);
        if (!values.length) return null;
        const mid = Math.floor(values.length / 2);
        if (values.length % 2) return values[mid];
        return (values[mid - 1] + values[mid]) / 2;
    }

    function formatMedianPlaceholder(metric) {
        const median = getMetricMedian(metric);
        if (!Number.isFinite(median)) return 'MED:n/a';
        if (isRateFilterMetric(metric)) return `MED:${(median * 100).toFixed(2)}`;
        return `MED:${median.toFixed(2)}`;
    }

    function renderPerformanceFilters() {
        const container = document.getElementById('performanceFiltersContainer');
        if (!container) return;
        const metricOptions = getPerformanceFilterMetricOptions();
        const allowed = new Set(metricOptions.map((opt) => opt.value));
        container.innerHTML = '';

        performanceFilters = performanceFilters.map((filter) => {
            if (allowed.has(filter.metric)) return filter;
            return { ...filter, metric: metricOptions[0].value };
        });

        performanceFilters.forEach((filter) => {
            const row = document.createElement('div');
            row.className = 'performance-filter-row';

            const metricSelect = document.createElement('select');
            metricOptions.forEach((opt) => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                metricSelect.appendChild(option);
            });
            metricSelect.value = filter.metric;
            metricSelect.addEventListener('change', () => {
                filter.metric = metricSelect.value;
                valueInput.placeholder = formatMedianPlaceholder(filter.metric);
                valueInput.step = isRateFilterMetric(filter.metric) ? '0.1' : '0.01';
                activeCityFilter = '';
                renderMarkers();
                renderJobsTable();
                updateLegendBounds();
            });

            const opSelect = document.createElement('select');
            opSelect.innerHTML = `<option value="gte">&gt;</option><option value="lte">&lt;</option>`;
            opSelect.value = filter.op === 'lte' ? 'lte' : 'gte';
            opSelect.addEventListener('change', () => {
                filter.op = opSelect.value === 'lte' ? 'lte' : 'gte';
                activeCityFilter = '';
                renderMarkers();
                renderJobsTable();
                updateLegendBounds();
            });

            const valueInput = document.createElement('input');
            valueInput.type = 'number';
            valueInput.min = '0';
            valueInput.step = isRateFilterMetric(filter.metric) ? '0.1' : '0.01';
            valueInput.value = filter.rawValue || '';
            valueInput.placeholder = formatMedianPlaceholder(filter.metric);
            valueInput.addEventListener('input', () => {
                filter.rawValue = valueInput.value;
                activeCityFilter = '';
                renderMarkers();
                renderJobsTable();
                updateLegendBounds();
            });

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'performance-filter-remove';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', () => removePerformanceFilter(filter.id));

            row.appendChild(metricSelect);
            row.appendChild(opSelect);
            row.appendChild(valueInput);
            row.appendChild(removeBtn);
            container.appendChild(row);
        });
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function hexToRgb(hex) {
        const safeHex = hex.replace('#', '');
        const value = parseInt(safeHex, 16);
        return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
    }

    function rgbToHex(r, g, b) {
        return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
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

    function gradientColorForValue(value, minValue, maxValue) {
        if (!Number.isFinite(value) || !Number.isFinite(minValue) || !Number.isFinite(maxValue) || minValue === maxValue) {
            return gradientStops.mid;
        }
        const ratio = clamp((value - minValue) / (maxValue - minValue), 0, 1);
        if (ratio < 0.5) return blendColor(gradientStops.low, gradientStops.mid, ratio / 0.5);
        return blendColor(gradientStops.mid, gradientStops.high, (ratio - 0.5) / 0.5);
    }

    function normalizeByJobs(value, jobs) {
        const safeJobs = Number(jobs || 0);
        if (!(safeJobs > 0)) return 0;
        return value / safeJobs;
    }

    function metricUsesPerJob(metricKey) {
        return metricKey === 'apps' || metricKey === 'applyStarts' || metricKey === 'clicks' || metricKey === 'spend';
    }

    function getMetricSupportFlags() {
        const rows = Array.isArray(uploadedJobRows) && uploadedJobRows.length
            ? uploadedJobRows
            : campaignData.map((loc) => ({
                applications: Number(loc.apps || 0),
                applyStarts: Number(loc.applyStarts != null ? loc.applyStarts : loc.apps || 0),
                clicks: Number(loc.clicks || 0)
            }));

        const hasApplications = rows.some((row) => Number(row.applications || 0) > 0);
        const hasApplyStarts = rows.some((row) => Number(row.applyStarts || 0) > 0);
        return {
            apps: hasApplications,
            applyStarts: hasApplyStarts,
            clicks: true,
            acr: hasApplications && hasApplyStarts
        };
    }

    function buildMetricSelectorLabel(metricKey) {
        if (metricKey === 'apps') return 'Applications';
        if (metricKey === 'applyStarts') return 'Application starts';
        if (metricKey === 'clicks') return 'Clicks';
        if (metricKey === 'acr') return 'Apply completion rate (ACR)';
        if (metricKey === 'spend') return 'Spend';
        if (metricKey === 'jobs') return 'Job count';
        if (metricKey === 'ctr') return 'Click-through rate (CTR)';
        if (metricKey === 'asr') return 'Apply start rate (ASR)';
        if (metricKey === 'intent') return 'Traffic intent (CTR * ASR)';
        return metricConfig[metricKey] ? metricConfig[metricKey].label : metricKey;
    }

    function updateMetricSelectorOptions() {
        const selector = document.getElementById('metricSelector');
        if (!selector) return;
        const support = getMetricSupportFlags();
        const allowedMetrics = metricOptionOrder.filter((metricKey) => {
            if (metricKey === 'apps') return support.apps;
            if (metricKey === 'acr') return support.acr;
            if (metricKey === 'clicks') return support.clicks;
            if (metricKey === 'applyStarts') return support.applyStarts;
            return true;
        });

        selector.innerHTML = allowedMetrics
            .map((metricKey) => `<option value="${metricKey}">${buildMetricSelectorLabel(metricKey)}</option>`)
            .join('');

        if (!allowedMetrics.includes(selectedMetric)) {
            selectedMetric = allowedMetrics.includes('applyStarts')
                ? 'applyStarts'
                : allowedMetrics.includes('jobs')
                    ? 'jobs'
                    : (allowedMetrics[0] || 'jobs');
        }
        selector.value = selectedMetric;
    }

    function getMetricValue(location, metricKey = selectedMetric) {
        let value = 0;
        if (metricKey === 'applyStarts') value = location.applyStarts || 0;
        else if (metricKey === 'clicks') value = location.clicks || 0;
        else if (metricKey === 'acr') value = location.acr || 0;
        else if (metricKey === 'spend') value = location.spend || 0;
        else if (metricKey === 'jobs') value = location.jobs || 0;
        else if (metricKey === 'ctr') value = location.ctr || 0;
        else if (metricKey === 'asr') value = location.asr || 0;
        else if (metricKey === 'intent') value = location.trafficIntent || 0;
        else value = location.apps || 0;

        if (selectedViewMode === 'perJob' && metricUsesPerJob(metricKey)) {
            return normalizeByJobs(value, location.jobs);
        }
        return value;
    }

    function formatLegendValue(metricKey, value) {
        if (selectedViewMode === 'perJob' && metricUsesPerJob(metricKey)) {
            if (metricKey === 'spend') {
                const filteredRows = getFilteredCampaignData();
                const currency = getSingleCurrencyForRows(filteredRows);
                return `${formatCurrencyValue(value, currency, 2, 2)}/job`;
            }
            return `${value.toFixed(2)}/job`;
        }
        if (metricKey === 'spend') {
            const filteredRows = getFilteredCampaignData();
            const currency = getSingleCurrencyForRows(filteredRows);
            return formatCurrencyValue(value, currency, 2, 2);
        }
        return metricConfig[metricKey].formatter(value);
    }

    function metricLabelForMode(metricKey) {
        const base = metricConfig[metricKey].label;
        if (selectedViewMode === 'perJob' && metricUsesPerJob(metricKey)) {
            return `${base} per job`;
        }
        return base;
    }

    function getCountryKey(location) {
        const country = String(location.country || '').trim();
        return country || 'Unknown';
    }

    function getRowCountryKey(row) {
        const country = String((row && row.country) || '').trim();
        return country || 'Unknown';
    }

    function updateCountryLayerOptions() {
        const selector = document.getElementById('countryLayerSelector');
        if (!selector) return;
        const t = uiText[currentLanguage] || uiText.en;
        const countrySet = new Set();
        campaignData.forEach((loc) => countrySet.add(getCountryKey(loc)));
        const options = Array.from(countrySet).sort((a, b) => a.localeCompare(b));
        selector.innerHTML = '';
        const allOpt = document.createElement('option');
        allOpt.value = 'all';
        allOpt.textContent = t.allCountries;
        selector.appendChild(allOpt);
        options.forEach((country) => {
            const opt = document.createElement('option');
            opt.value = country;
            opt.textContent = country;
            selector.appendChild(opt);
        });
        if (selectedCountryLayer !== 'all' && !countrySet.has(selectedCountryLayer)) {
            selectedCountryLayer = 'all';
        }
        selector.value = selectedCountryLayer;
    }

    function buildCountryScaleMap(locations) {
        const grouped = new Map();
        (locations || []).forEach((loc) => {
            const key = getCountryKey(loc);
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key).push(Number(getMetricValue(loc)));
        });
        const scaleByCountry = new Map();
        grouped.forEach((values, countryKey) => {
            scaleByCountry.set(countryKey, buildScaleInfo(values));
        });
        return scaleByCountry;
    }

    function passesThreshold(value, filterConfig) {
        if (filterConfig.value == null || !Number.isFinite(filterConfig.value)) return true;
        if (!Number.isFinite(value)) return false;
        return filterConfig.op === 'lte' ? value <= filterConfig.value : value >= filterConfig.value;
    }

    function getPerformanceFilterMetricValue(location, metric) {
        if (metric === 'ctr') return Number(location.ctr || 0);
        if (metric === 'asr') return Number(location.asr || 0);
        if (metric === 'acr') return Number(location.acr || 0);
        if (metric === 'cpas') return Number(location.cpas || 0);
        if (metric === 'cpa') return Number(location.cpa || 0);
        if (metric === 'jobs') return Number(location.jobs || 0);
        return 0;
    }

    function passesPerformanceFilter(location) {
        if (!Array.isArray(performanceFilters) || !performanceFilters.length) return true;
        return performanceFilters.every((filter) => {
            const threshold = readFilterValueInput(filter.rawValue, filter.metric);
            const value = getPerformanceFilterMetricValue(location, filter.metric);
            return passesThreshold(value, { op: filter.op, value: threshold });
        });
    }

    function getFilteredCampaignData() {
        return campaignData.filter((loc) => {
            if (!passesPerformanceFilter(loc)) return false;
            if (selectedCountryLayer === 'all') return true;
            return getCountryKey(loc) === selectedCountryLayer;
        });
    }

    function percentile(sortedValues, p) {
        if (!sortedValues.length) return 0;
        const index = (sortedValues.length - 1) * p;
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) return sortedValues[lower];
        const weight = index - lower;
        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }

    function buildScaleInfo(values) {
        const clean = values.filter((v) => Number.isFinite(v));
        if (!clean.length) {
            return {
                low: 0, high: 1, mapValue: (v) => v, label: "linear", legendLow: 0, legendHigh: 0
            };
        }
        const sorted = [...clean].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];

        if (selectedScale === 'log') {
            const tMin = Math.log1p(Math.max(min, 0));
            const tMax = Math.log1p(Math.max(max, 0));
            return {
                low: tMin,
                high: tMax,
                mapValue: (v) => Math.log1p(Math.max(v, 0)),
                label: "log",
                legendLow: min,
                legendHigh: max
            };
        }

        if (selectedScale === 'percentile') {
            let pLow = percentile(sorted, 0.1);
            let pHigh = percentile(sorted, 0.9);
            if (pLow === pHigh) {
                pLow = min;
                pHigh = max;
            }
            return {
                low: pLow,
                high: pHigh,
                mapValue: (v) => v,
                label: "P10-P90",
                legendLow: pLow,
                legendHigh: pHigh
            };
        }

        if (selectedScale === 'percentile2080') {
            let pLow = percentile(sorted, 0.2);
            let pHigh = percentile(sorted, 0.8);
            if (pLow === pHigh) {
                pLow = min;
                pHigh = max;
            }
            return {
                low: pLow,
                high: pHigh,
                mapValue: (v) => v,
                label: "P20-P80",
                legendLow: pLow,
                legendHigh: pHigh
            };
        }

        return {
            low: min,
            high: max,
            mapValue: (v) => v,
            label: "min-max",
            legendLow: min,
            legendHigh: max
        };
    }

    function haversineKm(aLat, aLng, bLat, bLng) {
        const toRad = (deg) => (deg * Math.PI) / 180;
        const dLat = toRad(bLat - aLat);
        const dLng = toRad(bLng - aLng);
        const lat1 = toRad(aLat);
        const lat2 = toRad(bLat);
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
        return 2 * 6371 * Math.asin(Math.sqrt(h));
    }

    function buildLocationClusters(locations, thresholdKm = 50) {
        const clusters = [];
        const visited = new Set();
        for (let i = 0; i < locations.length; i += 1) {
            if (visited.has(i)) continue;
            const queue = [i];
            visited.add(i);
            const idxs = [];
            while (queue.length) {
                const current = queue.shift();
                idxs.push(current);
                const base = locations[current];
                for (let j = 0; j < locations.length; j += 1) {
                    if (visited.has(j)) continue;
                    const other = locations[j];
                    const km = haversineKm(base.lat, base.lng, other.lat, other.lng);
                    if (km <= thresholdKm) {
                        visited.add(j);
                        queue.push(j);
                    }
                }
            }
            clusters.push(idxs.map((idx) => locations[idx]));
        }
        return clusters;
    }

    function buildLocationClustersByPixels(locations, pixelThreshold = 90) {
        if (!map || typeof map.latLngToLayerPoint !== 'function') return [];
        const points = locations.map((loc) => map.latLngToLayerPoint([Number(loc.lat || 0), Number(loc.lng || 0)]));
        const clusters = [];
        const visited = new Set();
        for (let i = 0; i < locations.length; i += 1) {
            if (visited.has(i)) continue;
            const queue = [i];
            visited.add(i);
            const idxs = [];
            while (queue.length) {
                const current = queue.shift();
                idxs.push(current);
                const base = points[current];
                for (let j = 0; j < locations.length; j += 1) {
                    if (visited.has(j)) continue;
                    const other = points[j];
                    const dx = base.x - other.x;
                    const dy = base.y - other.y;
                    const dist = Math.sqrt((dx * dx) + (dy * dy));
                    if (dist <= pixelThreshold) {
                        visited.add(j);
                        queue.push(j);
                    }
                }
            }
            clusters.push(idxs.map((idx) => locations[idx]));
        }
        return clusters;
    }

    function median(values) {
        const clean = (Array.isArray(values) ? values : []).filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
        if (!clean.length) return 0;
        const mid = Math.floor(clean.length / 2);
        if (clean.length % 2 === 0) return (clean[mid - 1] + clean[mid]) / 2;
        return clean[mid];
    }

    function getClusterMetricValue(cluster) {
        if (!Array.isArray(cluster) || !cluster.length) return 0;
        if (selectedMetric === 'ctr') {
            const impressions = cluster.reduce((sum, loc) => sum + Number(loc.impressions || 0), 0);
            const clicks = cluster.reduce((sum, loc) => sum + Number(loc.clicks || 0), 0);
            return impressions > 0 ? clicks / impressions : 0;
        }
        if (selectedMetric === 'asr') {
            const clicks = cluster.reduce((sum, loc) => sum + Number(loc.clicks || 0), 0);
            const applyStarts = cluster.reduce((sum, loc) => sum + Number(loc.applyStarts || 0), 0);
            return clicks > 0 ? applyStarts / clicks : 0;
        }
        if (selectedMetric === 'acr') {
            const applyStarts = cluster.reduce((sum, loc) => sum + Number(loc.applyStarts || 0), 0);
            const applications = cluster.reduce((sum, loc) => sum + Number(loc.apps || 0), 0);
            return applyStarts > 0 ? applications / applyStarts : 0;
        }
        if (selectedMetric === 'intent') {
            const impressions = cluster.reduce((sum, loc) => sum + Number(loc.impressions || 0), 0);
            const clicks = cluster.reduce((sum, loc) => sum + Number(loc.clicks || 0), 0);
            const applyStarts = cluster.reduce((sum, loc) => sum + Number(loc.applyStarts || 0), 0);
            const ctr = impressions > 0 ? clicks / impressions : 0;
            const asr = clicks > 0 ? applyStarts / clicks : 0;
            return ctr * asr;
        }
        if (selectedMetric === 'jobs') {
            return cluster.reduce((sum, loc) => sum + Number(loc.jobs || 0), 0);
        }
        if (selectedMetric === 'applyStarts') {
            if (selectedViewMode === 'perJob') {
                const starts = cluster.reduce((sum, loc) => sum + Number(loc.applyStarts || 0), 0);
                const jobs = cluster.reduce((sum, loc) => sum + Number(loc.jobs || 0), 0);
                return jobs > 0 ? starts / jobs : 0;
            }
            return cluster.reduce((sum, loc) => sum + Number(loc.applyStarts || 0), 0);
        }
        if (selectedMetric === 'spend') {
            if (selectedViewMode === 'perJob') {
                const spend = cluster.reduce((sum, loc) => sum + Number(loc.spend || 0), 0);
                const jobs = cluster.reduce((sum, loc) => sum + Number(loc.jobs || 0), 0);
                return jobs > 0 ? spend / jobs : 0;
            }
            return cluster.reduce((sum, loc) => sum + Number(loc.spend || 0), 0);
        }
        if (selectedMetric === 'clicks') {
            if (selectedViewMode === 'perJob') {
                const clicks = cluster.reduce((sum, loc) => sum + Number(loc.clicks || 0), 0);
                const jobs = cluster.reduce((sum, loc) => sum + Number(loc.jobs || 0), 0);
                return jobs > 0 ? clicks / jobs : 0;
            }
            return cluster.reduce((sum, loc) => sum + Number(loc.clicks || 0), 0);
        }
        if (selectedMetric === 'apps') {
            if (selectedViewMode === 'perJob') {
                const apps = cluster.reduce((sum, loc) => sum + Number(loc.apps || 0), 0);
                const jobs = cluster.reduce((sum, loc) => sum + Number(loc.jobs || 0), 0);
                return jobs > 0 ? apps / jobs : 0;
            }
            return cluster.reduce((sum, loc) => sum + Number(loc.apps || 0), 0);
        }
        return cluster.reduce((sum, loc) => sum + Number(getMetricValue(loc) || 0), 0);
    }

    function renderClusterRings(filteredData, referenceScale = null) {
        clusterRingsLayer.clearLayers();
        if (!showClusterRings || !Array.isArray(filteredData) || filteredData.length < 2) return;
        const clusters = buildLocationClusters(filteredData, 15).filter((cluster) => cluster.length > 1);
        if (!clusters.length) return;
        const clusterValues = clusters.map((cluster) => getClusterMetricValue(cluster));
        const scale = referenceScale || buildScaleInfo(clusterValues);
        const zoomScale = 1;
        clusters.forEach((cluster, idx) => {
            const centroid = cluster.reduce((acc, loc) => {
                acc.lat += Number(loc.lat || 0);
                acc.lng += Number(loc.lng || 0);
                return acc;
            }, { lat: 0, lng: 0 });
            centroid.lat /= cluster.length;
            centroid.lng /= cluster.length;
            const value = clusterValues[idx];
            const scaledValue = scale.mapValue(value);
            const ringColor = gradientColorForValue(scaledValue, scale.low, scale.high);
            const flareLayers = [
                { radius: Math.round(5000 * zoomScale), fillOpacity: 0.18 },
                { radius: Math.round(10000 * zoomScale), fillOpacity: 0.10 },
                { radius: Math.round(15000 * zoomScale), fillOpacity: 0.05 }
            ];
            flareLayers.forEach((layer) => {
                const ring = L.circle([centroid.lat, centroid.lng], {
                    radius: layer.radius,
                    stroke: false,
                    fillColor: ringColor,
                    fillOpacity: layer.fillOpacity,
                    interactive: false
                });
                clusterRingsLayer.addLayer(ring);
            });
        });
        clusterRingsLayer.addTo(map);
    }

    function enrichLocationMetrics(location) {
        const impressions = Number(location.impressions || 0);
        const clicks = Number(location.clicks || 0);
        const apps = Number(location.apps || 0);
        const applyStarts = Number(location.applyStarts != null ? location.applyStarts : apps);
        const spend = Number(location.spend || 0);
        const currency = normalizeCurrencyCode(location.currency || '', location.country || '');
        const ctr = impressions > 0 ? clicks / impressions : 0;
        const asr = clicks > 0 ? applyStarts / clicks : 0;
        const acr = applyStarts > 0 ? apps / applyStarts : 0;
        const trafficIntent = ctr * asr;
        const cpa = apps > 0 ? spend / apps : Number(location.cpa || 0);
        const cpas = applyStarts > 0 ? spend / applyStarts : Number(location.cpas || 0);
        return { ...location, currency, impressions, clicks, apps, applyStarts, spend, ctr, asr, acr, trafficIntent, cpa, cpas };
    }

    function updateLegendBounds() {
        const filteredData = getFilteredCampaignData();
        if (!filteredData.length) {
            document.getElementById('legendLowLabel').textContent = 'NO DATA';
            document.getElementById('legendHighLabel').textContent = 'NO DATA';
            document.getElementById('legendHelp').textContent = 'No locations match the selected custom filters.';
            return;
        }

        const metricLabel = metricLabelForMode(selectedMetric);
        const values = filteredData.map((loc) => getMetricValue(loc));
        const scale = buildScaleInfo(values);
        document.getElementById('legendLowLabel').textContent = `LOW ${formatLegendValue(selectedMetric, scale.legendLow)}`;
        document.getElementById('legendHighLabel').textContent = `HIGH ${formatLegendValue(selectedMetric, scale.legendHigh)}`;
        document.getElementById('legendHelp').textContent = `Markers use ${scale.label} scaling for ${metricLabel.toLowerCase()} (normalized within each country).`;
    }

    function renderMarkers() {
        markersLayer.clearLayers();
        clusterRingsLayer.clearLayers();
        const filteredData = getFilteredCampaignData();
        const sortedData = [...filteredData].sort((a, b) => getMetricValue(a) - getMetricValue(b));
        if (!sortedData.length) return;
        const globalScale = buildScaleInfo(sortedData.map((loc) => getMetricValue(loc)));
        const countryScaleMap = buildCountryScaleMap(sortedData);
        lastRingData = sortedData;
        lastRingScale = globalScale;
        renderClusterRings(sortedData, globalScale);

        sortedData.forEach((loc) => {
            const activeScale = countryScaleMap.get(getCountryKey(loc)) || buildScaleInfo([getMetricValue(loc)]);
            const scaledValue = activeScale.mapValue(getMetricValue(loc));
            const markerColor = gradientColorForValue(scaledValue, activeScale.low, activeScale.high);
            const perJobMode = selectedViewMode === 'perJob';
            const appLabel = perJobMode ? 'Applications/job' : 'Applications';
            const applyStartLabel = perJobMode ? 'Application starts/job' : 'Application starts';
            const impressionsLabel = perJobMode ? 'Impressions/job' : 'Impressions';
            const clicksLabel = perJobMode ? 'Clicks/job' : 'Clicks';
            const spendLabel = perJobMode ? 'Spend/job' : 'Spend';
            const currencyCode = loc.currency || inferCurrencyFromCountry(loc.country || '');
            const appValue = perJobMode ? normalizeByJobs(loc.apps, loc.jobs).toFixed(2) : loc.apps;
            const applyStartValue = perJobMode ? normalizeByJobs(loc.applyStarts, loc.jobs).toFixed(2) : loc.applyStarts;
            const impressionsValue = perJobMode ? normalizeByJobs(loc.impressions, loc.jobs).toFixed(2) : loc.impressions.toLocaleString();
            const clicksValue = perJobMode ? normalizeByJobs(loc.clicks, loc.jobs).toFixed(2) : loc.clicks;
            const spendValueRaw = perJobMode ? normalizeByJobs(loc.spend, loc.jobs) : loc.spend;
            const spendValue = formatCurrencyValue(spendValueRaw, currencyCode, 2, 2);
            const cpaValue = formatCurrencyValue(loc.cpa || 0, currencyCode, 2, 2);
            const marker = L.circleMarker([loc.lat, loc.lng], {
                radius: 8,
                fillColor: markerColor,
                stroke: false,
                weight: 0,
                opacity: 1,
                fillOpacity: 0.9
            });

            const popupContent = `
                <div class="popup-card">
                    <div class="popup-header" style="border-bottom-color:${markerColor};">${loc.name}</div>
                    <div class="popup-grid">
                        <div class="popup-metric"><div class="popup-label">${appLabel}</div><div class="popup-value">${appValue}</div></div>
                        <div class="popup-metric"><div class="popup-label">${applyStartLabel}</div><div class="popup-value">${applyStartValue}</div></div>
                        <div class="popup-metric"><div class="popup-label">${impressionsLabel}</div><div class="popup-value">${impressionsValue}</div></div>
                        <div class="popup-metric"><div class="popup-label">${clicksLabel}</div><div class="popup-value">${clicksValue}</div></div>
                        <div class="popup-metric"><div class="popup-label">CTR</div><div class="popup-value">${(loc.ctr * 100).toFixed(2)}%</div></div>
                        <div class="popup-metric"><div class="popup-label">ASR</div><div class="popup-value">${(loc.asr * 100).toFixed(2)}%</div></div>
                        <div class="popup-metric"><div class="popup-label">Traffic intent</div><div class="popup-value">${(loc.trafficIntent * 100).toFixed(2)}%</div></div>
                        <div class="popup-metric"><div class="popup-label">Cost per application</div><div class="popup-value">${cpaValue}</div></div>
                        <div class="popup-metric"><div class="popup-label">Jobs</div><div class="popup-value">${loc.jobs}</div></div>
                        <div class="popup-metric"><div class="popup-label">${spendLabel}</div><div class="popup-value">${spendValue}</div></div>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent, { maxWidth: 390 });
            marker.on('click', () => {
                activeCityFilter = loc.name;
                renderJobsTable();
            });
            markersLayer.addLayer(marker);
        });

        markersLayer.addTo(map);

        if (sortedData.length > 0) {
            const bounds = L.latLngBounds(sortedData.map((loc) => [loc.lat, loc.lng]));
            map.fitBounds(bounds, { padding: [25, 25], maxZoom: 11 });
        }
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function normalizeToken(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function toIsoCountryCode(value) {
        const raw = String(value || '').trim();
        if (!raw) return '';
        if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
        const key = normalizeToken(raw);
        const lookup = {
            germany: 'DE',
            deutschland: 'DE',
            niederlande: 'NL',
            netherlands: 'NL',
            france: 'FR',
            frankreich: 'FR',
            espana: 'ES',
            spain: 'ES',
            italien: 'IT',
            italy: 'IT',
            belgium: 'BE',
            belgie: 'BE',
            belgique: 'BE',
            austria: 'AT',
            osterreich: 'AT',
            österreich: 'AT',
            unitedkingdom: 'GB',
            uk: 'GB',
            greatbritain: 'GB',
            grossbritannien: 'GB',
            ireland: 'IE'
        };
        return lookup[key] || raw.toUpperCase();
    }

    function sanitizeJobQueryTitle(rawTitle) {
        const title = String(rawTitle || '').trim();
        if (!title) return '';
        // Keep the title up to (m/w/d)-style markers to avoid noisy tail qualifiers.
        const match = title.match(/^(.*?)(\(\s*m\s*\/\s*w\s*\/\s*d\s*\))/i);
        if (match && match[1]) {
            const cleaned = String(match[1]).trim();
            return cleaned || title;
        }
        return title;
    }

    function monthTokenFromDateText(rawText) {
        const text = String(rawText || '').trim();
        const now = new Date();
        const fallback = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!text) return fallback;

        let m = text.match(/(\d{4})[-/](\d{2})/);
        if (m) return `${m[1]}${m[2]}`;

        const monthMap = {
            jan: '01', january: '01',
            feb: '02', february: '02',
            mar: '03', march: '03',
            apr: '04', april: '04',
            may: '05',
            jun: '06', june: '06',
            jul: '07', july: '07',
            aug: '08', august: '08',
            sep: '09', sept: '09', september: '09',
            oct: '10', october: '10',
            nov: '11', november: '11',
            dec: '12', december: '12'
        };
        m = text.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
        if (m) {
            const mm = monthMap[String(m[2] || '').toLowerCase()];
            if (mm) return `${m[3]}${mm}`;
        }
        m = text.match(/([A-Za-z]{3,})\s+\d{1,2},?\s+(\d{4})/);
        if (m) {
            const mm = monthMap[String(m[1] || '').toLowerCase()];
            if (mm) return `${m[2]}${mm}`;
        }
        return fallback;
    }

    function buildHiringInsightsUrl(row) {
        const job = sanitizeJobQueryTitle((row && row.job) || '');
        const city = String((row && row.city) || '').trim();
        const region = String((row && row.region) || '').trim();
        const country = String((row && row.country) || '').trim();
        if (!job) return '';
        const params = new URLSearchParams();
        params.set('q', job);
        params.set('month', monthTokenFromDateText(row && row.lastUpdated));
        if (city || region) params.set('l', [city, region].filter(Boolean).join(', '));
        const countryCode = toIsoCountryCode(country);
        if (countryCode) params.set('country', countryCode);
        return `https://employers.indeed.com/hiring-insights?${params.toString()}`;
    }

    function visibleTableRows() {
        const baseRows = uploadedJobRows.filter((row) => {
            if (!passesPerformanceFilter(row)) return false;
            if (!passesPositionStatusFilter(row)) return false;
            if (selectedCountryLayer === 'all') return true;
            return getRowCountryKey(row) === selectedCountryLayer;
        });
        if (!activeCityFilter) return baseRows;
        const selectedCityKey = normalizeToken(activeCityFilter);
        return baseRows.filter((row) => normalizeToken(row.city) === selectedCityKey);
    }

    function getTableSortValue(row, key) {
        if (key === 'job' || key === 'city' || key === 'status') return String(row[key] || '');
        return Number(row[key] || 0);
    }

    function updateTableSortButtons() {
        const labels = tableHeaderI18n[currentLanguage] || tableHeaderI18n.en;
        document.querySelectorAll('.jobs-th-btn').forEach((btn) => {
            const key = btn.dataset.sortKey;
            const active = key === tableSort.key;
            btn.classList.toggle('active', active);
            const base = labels[key] || btn.textContent.replace(/\s*[↑↓]$/, '');
            btn.textContent = active ? `${base} ${tableSort.dir === 'asc' ? '↑' : '↓'}` : base;
        });
    }

    function renderJobsTable() {
        const rows = visibleTableRows().slice().sort((a, b) => {
            const av = getTableSortValue(a, tableSort.key);
            const bv = getTableSortValue(b, tableSort.key);
            const dir = tableSort.dir === 'asc' ? 1 : -1;
            if (typeof av === 'string' || typeof bv === 'string') return String(av).localeCompare(String(bv)) * dir;
            return (Number(av) - Number(bv)) * dir;
        });
        const body = document.getElementById('jobsTableBody');
        const clearBtn = document.getElementById('clearTableFilter');
        const filterLabel = document.getElementById('tableFilterLabel');
        updateTableSortButtons();

        filterLabel.textContent = activeCityFilter ? `Filtered: ${activeCityFilter}` : 'Showing all locations';
        filterLabel.style.cursor = activeCityFilter ? 'pointer' : 'default';
        filterLabel.onclick = activeCityFilter ? clearLocationFilter : null;
        clearBtn.style.display = activeCityFilter ? 'inline-block' : 'none';

        if (!rows.length) {
            body.innerHTML = `<tr><td colspan="12">No rows for current filter.</td></tr>`;
            return;
        }

        body.innerHTML = rows.map((row) => `
            <tr>
                <td>${buildHiringInsightsUrl(row)
                    ? `<a href="${escapeHtml(buildHiringInsightsUrl(row))}" target="_blank" rel="noopener noreferrer">${escapeHtml(row.job)}</a>`
                    : `${escapeHtml(row.job)}`}</td>
                <td>${escapeHtml(row.city)}</td>
                <td>${Number(row.impressions || 0).toLocaleString()}</td>
                <td>${(Number(row.ctr || 0) * 100).toFixed(2)}%</td>
                <td>${Number(row.clicks || 0).toLocaleString()}</td>
                <td>${(Number(row.asr || 0) * 100).toFixed(2)}%</td>
                <td>${Number(row.applyStarts || 0).toLocaleString()}</td>
                <td>${(Number(row.acr || 0) * 100).toFixed(2)}%</td>
                <td>${Number(row.applications || 0).toLocaleString()}</td>
                <td>${(Number(row.trafficIntent || 0) * 100).toFixed(2)}%</td>
                <td>${formatCurrencyValue(Number(row.spend || 0), row.currency || inferCurrencyFromCountry(row.country || ''), 2, 2)}</td>
                <td>${escapeHtml(row.status || "-")}</td>
            </tr>
        `).join('');
    }

    function normalizeHeader(header) {
        return String(header || '')
            .replace(/^\uFEFF/, '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }

    function inferCurrencyFromCountry(countryRaw) {
        const code = toIsoCountryCode(countryRaw || '');
        return countryCurrencyMap[code] || '';
    }

    function normalizeCurrencyCode(rawCurrency, countryRaw = '') {
        const raw = String(rawCurrency || '').trim();
        if (!raw) return inferCurrencyFromCountry(countryRaw);
        const upper = raw.toUpperCase();
        if (/^[A-Z]{3}$/.test(upper)) return upper;
        const token = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (token.includes('usd') || token.includes('dollar')) return 'USD';
        if (token.includes('eur') || token.includes('euro')) return 'EUR';
        if (token.includes('gbp') || token.includes('pound') || token.includes('sterling')) return 'GBP';
        if (token.includes('chf') || token.includes('swiss') || token.includes('franc')) return 'CHF';
        if (token.includes('cad')) return 'CAD';
        if (token.includes('aud')) return 'AUD';
        if (token.includes('nzd')) return 'NZD';
        if (token.includes('jpy') || token.includes('yen')) return 'JPY';
        if (token.includes('sek')) return 'SEK';
        if (token.includes('nok')) return 'NOK';
        if (token.includes('dkk')) return 'DKK';
        if (token.includes('pln')) return 'PLN';
        if (token.includes('czk')) return 'CZK';
        if (token.includes('huf')) return 'HUF';
        if (token.includes('ron')) return 'RON';
        if (token.includes('bgn')) return 'BGN';
        if (token.includes('€')) return 'EUR';
        if (token.includes('£')) return 'GBP';
        if (token.includes('$')) return inferCurrencyFromCountry(countryRaw) || 'USD';
        return inferCurrencyFromCountry(countryRaw);
    }

    function formatCurrencyValue(value, currencyCode, minimumFractionDigits = 2, maximumFractionDigits = 2) {
        const amount = Number(value || 0);
        const code = String(currencyCode || '').trim().toUpperCase();
        if (!code) {
            return amount.toLocaleString(undefined, { minimumFractionDigits, maximumFractionDigits });
        }
        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: code,
                minimumFractionDigits,
                maximumFractionDigits
            }).format(amount);
        } catch {
            return `${code} ${amount.toLocaleString(undefined, { minimumFractionDigits, maximumFractionDigits })}`;
        }
    }

    function getSingleCurrencyForRows(rows) {
        const unique = Array.from(new Set((rows || []).map((row) => String((row && row.currency) || '').trim().toUpperCase()).filter(Boolean)));
        if (unique.length === 1) return unique[0];
        return '';
    }

    function parseNumber(value, fallback = 0) {
        const text = String(value || '').trim();
        if (!text) return fallback;
        const direct = Number(text.replace(/[%\s]/g, '').replace(/,/g, ''));
        if (Number.isFinite(direct)) return direct;
        const cleaned = text
            .replace(/[^\d,.-]/g, '')
            .replace(/\s/g, '');
        if (!cleaned) return fallback;
        const lastComma = cleaned.lastIndexOf(',');
        const lastDot = cleaned.lastIndexOf('.');
        const normalized = lastComma > lastDot
            ? cleaned.replace(/\./g, '').replace(',', '.')
            : cleaned.replace(/,/g, '');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function getField(row, aliases, required = false) {
        const key = Object.keys(row).find((k) => aliases.includes(normalizeHeader(k)));
        const value = key ? row[key] : '';
        if (required && String(value || '').trim() === '') return null;
        return value;
    }

    function hasAnyHeader(headers, aliases) {
        return aliases.some((alias) => headers.includes(alias));
    }

    function parseCampaignRows(rows) {
        const parsed = [];
        const skipped = [];

        rows.forEach((row, rowIndex) => {
            const name = getField(row, ['name', 'location', 'city', 'plaats'], true);
            const lat = parseNumber(getField(row, ['lat', 'latitude'], true), NaN);
            const lng = parseNumber(getField(row, ['lng', 'lon', 'long', 'longitude'], true), NaN);

            if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
                skipped.push(rowIndex + 2);
                return;
            }

            parsed.push({
                name: String(name).trim(),
                lat,
                lng,
                country: String(getField(row, ['country', 'land', 'pays', 'paese', 'pais'], false) || '').trim(),
                currency: normalizeCurrencyCode(
                    getField(row, ['currency', 'currencycode', 'valuta', 'waehrung', 'wahrung', 'devise', 'moneda'], false) ||
                    getField(row, ['spend', 'cost'], false),
                    getField(row, ['country', 'land', 'pays', 'paese', 'pais'], false)
                ),
                apps: parseNumber(getField(row, ['apps', 'applications', 'applies']), 0),
                impressions: parseNumber(getField(row, ['impressions', 'views']), 0),
                clicks: parseNumber(getField(row, ['clicks']), 0),
                cpa: parseNumber(getField(row, ['cpa', 'costperapplication']), 0),
                cpas: parseNumber(getField(row, ['cpas', 'costperapplystart']), 0),
                jobs: parseNumber(getField(row, ['jobs', 'vacancies']), 0),
                spend: parseNumber(getField(row, ['spend', 'cost']), 0)
            });
        });

        return { parsed, skipped };
    }

    function parseIndeedJobRows(rows) {
        const parsed = [];
        const skipped = [];

        rows.forEach((row, rowIndex) => {
            const cityRaw = getField(row, ['city', 'plaats', 'stadt', 'ville', 'citta', 'ciudad'], true);
            if (!cityRaw) {
                skipped.push(rowIndex + 2);
                return;
            }
            const country = String(getField(row, ['country', 'land', 'pays', 'paese', 'pais'], false) || '').trim();
            const region = String(getField(row, ['countyregion', 'stateregion', 'region', 'state', 'province', 'provincieregio', 'bundeslandregion', 'departementregion', 'regioneprovincia', 'estadoregion'], false) || '').trim();
            const lastUpdated = String(getField(row, ['lastupdated', 'last updated', 'zuletztaktualisiert', 'dernieremaj', 'dernieremiseajour', 'ultimoaggiornamento', 'ultimactualizacion'], false) || '').trim();
            const impressions = parseNumber(getField(row, ['impressions', 'impressies', 'visualizzazioni', 'impresiones']), 0);
            const clicks = parseNumber(getField(row, ['clicks', 'kliks', 'klicks', 'clics', 'click']), 0);
            const applyStarts = parseNumber(getField(row, ['applystarts', 'gestartesollicitaties', 'begonnenebewerbungen', 'candidaturescommencees', 'candidatureavviate', 'postulacionesiniciadas']), 0);
            const applications = parseNumber(getField(row, ['applications', 'applies', 'sollicitaties', 'bewerbungen', 'candidatures', 'postulaciones']), 0);
            let acr = parseNumber(getField(row, ['applycompletionrateacr', 'acr', 'tauxdecandidaturetermineeacr', 'sollicitatievoltooiingspercentageacr', 'abschlussratebewerbungacr', 'percentualedicompletamentocandidaturaacr', 'tasadefinalizaciondesolicitudacr']), NaN);
            const spend = parseNumber(getField(row, ['spend', 'besteding', 'ausgaben', 'depenses', 'spesa', 'gasto']), 0);

            let ctr = parseNumber(getField(row, ['clickthroughratectr', 'ctr', 'tauxdeclicksctr', 'percentualediclickctr', 'porcentajedeclicspc']), NaN);
            if (!Number.isFinite(ctr)) ctr = impressions > 0 ? clicks / impressions : 0;
            if (ctr > 1) ctr /= 100;

            let asr = parseNumber(getField(row, ['applystartrateasr', 'asr', 'percentagegestartesollicitaties', 'ratebegonnenerbewerbungenasr', 'tauxdecandidaturescommenceesasr', 'percentualedicandidatureavviatepca', 'porcentajedepostulacionesiniciadasppi']), NaN);
            if (!Number.isFinite(asr)) asr = clicks > 0 ? applyStarts / clicks : 0;
            if (asr > 1) asr /= 100;
            if (!Number.isFinite(acr)) acr = applyStarts > 0 ? applications / applyStarts : 0;
            if (acr > 1) acr /= 100;

            parsed.push({
                job: String(getField(row, ['job', 'vacature', 'stelle', 'emploi', 'annuncio', 'empleo'], false) || 'Unknown job').trim(),
                city: String(cityRaw).trim(),
                country,
                currency: normalizeCurrencyCode(
                    getField(row, ['currency', 'currencycode', 'valuta', 'waehrung', 'wahrung', 'devise', 'moneda'], false) ||
                    getField(row, ['spend', 'besteding', 'ausgaben', 'depenses', 'spesa', 'gasto'], false),
                    country
                ),
                region,
                lastUpdated,
                impressions,
                clicks,
                applyStarts,
                applications,
                ctr,
                asr,
                acr,
                trafficIntent: ctr * asr,
                spend,
                status: String(getField(row, ['jobstatus', 'vacaturestatus', 'status', 'statusderstellenanzeige', 'statutdelemploi', 'statodellannuncio', 'estadodelempleo'], false) || '-').trim()
            });
        });

        return { parsed, skipped };
    }

    function aggregateIndeedRows(jobRows) {
        const byCity = new Map();
        jobRows.forEach((job) => {
            const key = `${job.city.toLowerCase()}|${job.country.toLowerCase()}`;

            if (!byCity.has(key)) {
                byCity.set(key, {
                    name: job.city,
                    country: job.country,
                    currency: job.currency || inferCurrencyFromCountry(job.country || ''),
                    region: job.region,
                    lat: NaN,
                    lng: NaN,
                    apps: 0,
                    applyStarts: 0,
                    impressions: 0,
                    clicks: 0,
                    jobs: 0,
                    spend: 0
                });
            }

            const entry = byCity.get(key);
            entry.apps += job.applications;
            entry.applyStarts += job.applyStarts;
            entry.impressions += job.impressions;
            entry.clicks += job.clicks;
            entry.spend += job.spend;
            entry.jobs += 1;
            if (!entry.currency) entry.currency = job.currency || inferCurrencyFromCountry(job.country || '');
        });

        const aggregated = Array.from(byCity.values()).map((entry) => {
            const ctr = entry.impressions > 0 ? entry.clicks / entry.impressions : 0;
            const asr = entry.clicks > 0 ? entry.applyStarts / entry.clicks : 0;
            const acr = entry.applyStarts > 0 ? entry.apps / entry.applyStarts : 0;
            return {
                ...entry,
                apps: entry.apps,
                ctr,
                asr,
                acr,
                trafficIntent: ctr * asr,
                cpa: entry.apps > 0 ? entry.spend / entry.apps : 0,
                cpas: entry.applyStarts > 0 ? entry.spend / entry.applyStarts : 0
            };
        });

        return aggregated;
    }

    async function geocodeLocation(queryText) {
        const cacheKey = String(queryText || '').toLowerCase();
        if (geocodeCache[cacheKey]) return geocodeCache[cacheKey];

        try {
            const query = encodeURIComponent(queryText);
            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${query}`;
            const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
            if (!response.ok) return null;
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) return null;
            const point = { lat: Number(data[0].lat), lng: Number(data[0].lon) };
            if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null;
            geocodeCache[cacheKey] = point;
            saveGeocodeCache();
            return point;
        } catch {
            return null;
        }
    }

    function loadGeocodeCache() {
        try {
            const raw = localStorage.getItem(geocodeCacheKey);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return;
            Object.keys(parsed).forEach((key) => {
                const entry = parsed[key];
                if (entry && Number.isFinite(entry.lat) && Number.isFinite(entry.lng)) {
                    geocodeCache[key] = { lat: Number(entry.lat), lng: Number(entry.lng) };
                }
            });
        } catch {
            // no-op if localStorage is unavailable
        }
    }

    function saveGeocodeCache() {
        try {
            localStorage.setItem(geocodeCacheKey, JSON.stringify(geocodeCache));
        } catch {
            // no-op if localStorage is unavailable
        }
    }

    function normalizeCountryName(rawCountry) {
        const cleaned = String(rawCountry || '').trim();
        const key = cleaned.toLowerCase();
        return countryAliases[key] || cleaned;
    }

    async function resolveLocationCoordinate(loc) {
        const normalizedCountry = normalizeCountryName(loc.country || '');
        const searchQueries = [
            [loc.name, loc.region, normalizedCountry].filter(Boolean).join(', '),
            [loc.name, normalizedCountry].filter(Boolean).join(', '),
            loc.name
        ];

        for (const query of searchQueries) {
            const point = await geocodeLocation(query);
            if (point) return point;
        }
        return null;
    }

    function buildGeocodeSegmentation(locations) {
        const queryMap = new Map();
        (locations || []).forEach((loc) => {
            if (!loc) return;
            if (Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) return;
            const cityKey = getLocationKey(loc.name, loc.country || '');
            const cached = cityCoordinateByKey.get(cityKey);
            if (cached && Number.isFinite(cached.lat) && Number.isFinite(cached.lng)) {
                loc.lat = cached.lat;
                loc.lng = cached.lng;
                return;
            }
            const normalizedCountry = normalizeCountryName(loc.country || '');
            const segmentKey = [
                normalizeStatusToken(loc.name),
                normalizeStatusToken(loc.region || ''),
                normalizeStatusToken(normalizedCountry)
            ].join('||');
            if (!queryMap.has(segmentKey)) {
                queryMap.set(segmentKey, {
                    key: segmentKey,
                    queryPayload: {
                        name: loc.name || '',
                        region: loc.region || '',
                        country: normalizedCountry
                    },
                    targets: []
                });
            }
            queryMap.get(segmentKey).targets.push(loc);
        });
        return Array.from(queryMap.values());
    }

    async function enrichWithCoordinates(locations, onProgress) {
        const unresolvedSet = new Set();
        const segments = buildGeocodeSegmentation(locations);
        const total = segments.length;
        if (!total) return [];
        let completed = 0;
        let nextIndex = 0;
        const workerCount = Math.max(1, Math.min(geocodeConcurrency, total));

        const workers = Array.from({ length: workerCount }, async () => {
            while (true) {
                const currentIndex = nextIndex;
                nextIndex += 1;
                if (currentIndex >= total) return;

                const segment = segments[currentIndex];
                const point = await resolveLocationCoordinate(segment.queryPayload);
                if (point) {
                    segment.targets.forEach((target) => {
                        target.lat = point.lat;
                        target.lng = point.lng;
                    });
                    const cityKey = getLocationKey(segment.queryPayload.name, segment.queryPayload.country || '');
                    cityCoordinateByKey.set(cityKey, { lat: point.lat, lng: point.lng });
                } else {
                    unresolvedSet.add(String(segment.queryPayload.name || '').trim());
                }

                completed += 1;
                if (typeof onProgress === 'function') onProgress(completed, total);
            }
        });

        await Promise.all(workers);

        return Array.from(unresolvedSet);
    }

    function setUploadStatus(message, type = '') {
        const status = document.getElementById('uploadStatus');
        status.textContent = message;
        status.className = `upload-status${type ? ` ${type}` : ''}`;
    }

    async function processParsedRows(rows, sourceLabel) {
        const firstRow = rows[0] || {};
        const headers = Object.keys(firstRow).map((h) => normalizeHeader(h));
        const hasCity = hasAnyHeader(headers, ['city', 'plaats', 'stadt', 'ville', 'citta', 'ciudad']);
        const hasCountry = hasAnyHeader(headers, ['country', 'land', 'pays', 'paese', 'pais']);
        const hasImpressions = hasAnyHeader(headers, ['impressions', 'impressies', 'visualizzazioni', 'impresiones']);
        const isIndeedStructure = hasCity && hasCountry && hasImpressions;
        isIndeedUploadData = Boolean(isIndeedStructure);
        let parsed = [];
        let skipped = [];

        if (isIndeedStructure) {
            const indeedParsed = parseIndeedJobRows(rows);
            skipped = indeedParsed.skipped;
            uploadedJobRows = indeedParsed.parsed;
            setPositionFilterAvailabilityFromRows(uploadedJobRows);
            parsed = rebuildCampaignDataForStatus().campaignData;
        } else {
            const manualParsed = parseCampaignRows(rows);
            parsed = manualParsed.parsed.map(enrichLocationMetrics);
            skipped = manualParsed.skipped;
            uploadedJobRows = parsed.map((loc) => ({
                job: "Uploaded location row",
                city: loc.name,
                    country: loc.country || "",
                    region: loc.region || "",
                    impressions: loc.impressions || 0,
                    ctr: loc.ctr || 0,
                    clicks: loc.clicks || 0,
                    applyStarts: loc.applyStarts || loc.apps || 0,
                    acr: (loc.applyStarts || loc.apps || 0) > 0 ? (loc.apps || 0) / (loc.applyStarts || loc.apps || 0) : 0,
                    applications: loc.apps || 0,
                    asr: loc.asr || 0,
                    trafficIntent: loc.trafficIntent || 0,
                    spend: loc.spend || 0,
                    currency: loc.currency || inferCurrencyFromCountry(loc.country || ''),
                    status: "-",
                    lastUpdated: ""
                }));
            hasOpenUploadStatuses = false;
            hasClosedUploadStatuses = false;
            selectedPositionStatus = 'both';
            parsed = parsed.map((loc) => loc);
        }

        updatePositionStatusOptions();

        if (!parsed.length || !uploadedJobRows.length) {
            setUploadStatus('No valid rows found. Required fields: City and Country (Indeed export) or name/location + lat/lng.', 'error');
            return;
        }

        setUploadStatus(`Parsed ${parsed.length} location(s). Resolving deduplicated location queries...`);
        const unresolved = await enrichWithCoordinates(parsed, (done, total) => {
            setUploadStatus(`Parsed ${parsed.length} location(s). Resolving coordinates (${done}/${total} unique queries)...`);
        });
        const resolvedData = parsed.filter((loc) => Number.isFinite(loc.lat) && Number.isFinite(loc.lng));
        const unresolvedUnique = Array.from(new Set(unresolved.map((name) => String(name || '').trim()).filter(Boolean)));

        if (!resolvedData.length) {
            setUploadStatus('Could not resolve any coordinates. Check City/Country values or internet connection.', 'error');
            return;
        }

        activeCityFilter = '';
        tableSort = { key: "city", dir: "asc" };
        campaignData = resolvedData;
        updateCountryLayerOptions();
        updateMetricSelectorOptions();
        renderPerformanceFilters();
        renderMarkers();
        renderJobsTable();
        updateLegendBounds();

        if (unresolvedUnique.length || skipped.length) {
            const parts = [`Loaded ${resolvedData.length} location(s) from ${sourceLabel}.`];
            if (skipped.length) parts.push(`Skipped rows: ${skipped.length}.`);
            if (unresolvedUnique.length) {
                parts.push(`Unresolved locations: ${unresolvedUnique.slice(0, 5).join(', ')}${unresolvedUnique.length > 5 ? '...' : ''}.`);
            }
            setUploadStatus(parts.join(' '), 'error');
            return;
        }

        setUploadStatus(`Loaded ${resolvedData.length} location(s) from ${sourceLabel}.`, 'success');
    }

    function handleCsvUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        setUploadStatus(`Parsing ${file.name}...`);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                await processParsedRows(results.data || [], file.name);
            },
            error: () => {
                setUploadStatus('Could not parse CSV. Please verify the file format.', 'error');
            }
        });
    }

    function handleSharedCsvUpload(text, sourceLabel) {
        setUploadStatus(`Parsing ${sourceLabel}...`);
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                await processParsedRows(results.data || [], sourceLabel);
            },
            error: () => {
                setUploadStatus('Could not parse shared CSV. Please verify the file format.', 'error');
            }
        });
    }

    window.addEventListener("message", (event) => {
        const data = event.data;
        if (!data) return;
        if (data.type === SHARED_UPLOAD_MESSAGE && data.payload && data.payload.text) {
            handleSharedCsvUpload(data.payload.text, `shared file ${data.payload.name || "CSV"}`);
            return;
        }
        if (data.type === UI_LANGUAGE_MESSAGE && data.payload && data.payload.language) {
            applyUiLanguage(data.payload.language);
        }
    });

    document.querySelectorAll('.jobs-th-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.sortKey;
            if (tableSort.key === key) {
                tableSort.dir = tableSort.dir === 'asc' ? 'desc' : 'asc';
            } else {
                tableSort.key = key;
                tableSort.dir = key === 'job' || key === 'city' || key === 'status' ? 'asc' : 'desc';
            }
            renderJobsTable();
        });
    });

    // Keep selector options in sync with available metrics for default demo state.
    updateMetricSelectorOptions();

