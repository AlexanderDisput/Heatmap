      const SHARED_SLOTS_MESSAGE = "shared-csv-slots";
      let slotFiles = [{ name: "", text: "" }, { name: "", text: "" }];
      let parsedOne = null;
      let parsedTwo = null;
      let currentScope = "state";
      let comparisonDirection = "ab";
      let funnelBasis = "holistic";
      let tableSort = { key: "scope", dir: "asc" };
      let selectedDriverMetric = "applyStarts";
      let selectedPremiumMetric = "asr";

      const stateAliases = [
        "stateregion", "state/region", "state", "region", "countyregion",
        "provincieregio", "bundeslandregion", "departementregion", "regioneprovincia", "estadoregion"
      ];
      const cityAliases = ["city", "plaats", "stadt", "ville", "citta", "ciudad"];
      const countryAliases = ["country", "land", "pays", "paese", "pais"];
      const jobAliases = ["job", "jobtitle", "title", "job title", "functie", "functie/titel", "stellenbezeichnung", "poste", "ruolo", "puesto"];
      const premiumAliases = ["premium", "premiumplus", "premium plus", "premium_plus"];
      const jobCountAliases = ["jobcount", "jobs", "vacancies", "vacaturecount"];
      const metricAliases = {
        impressions: ["impressions", "impressies", "visualizzazioni", "impresiones"],
        clicks: ["clicks", "kliks", "klicks", "clics", "click"],
        applyStarts: ["applystarts", "apply starts", "gestartesollicitaties", "begonnenebewerbungen", "candidaturescommencees", "candidatureavviate", "postulacionesiniciadas"],
        applies: ["applications", "applies", "sollicitaties", "bewerbungen", "candidatures", "postulaciones"],
        spend: ["spend", "besteding", "ausgaben", "depenses", "spesa", "gasto", "cost"],
        cpa: ["cpa", "costperapply", "costperapplication"],
        cpas: ["cpas", "costperapplystart"],
        ctr: ["clickthroughratectr", "ctr", "clickthroughrate"],
        asr: ["applystartrateasr", "asr"],
        acr: ["applycompletionrateacr", "acr"]
      };

      function normHeader(value) {
        return String(value || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");
      }

      function parseNumber(value) {
        const raw = String(value ?? "").trim();
        if (!raw) return 0;
        const cleaned = raw.replace(/[€$£CHF]/g, "").replace(/%/g, "").replace(/\s/g, "").replace(/,/g, "");
        const num = Number(cleaned);
        return Number.isFinite(num) ? num : 0;
      }

      function escapeHtml(value) {
        return String(value == null ? "" : value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function asRate(value) {
        let num = parseNumber(value);
        if (!Number.isFinite(num)) return 0;
        if (num > 1) num /= 100;
        return Math.max(0, num);
      }

      function pickField(row, aliases) {
        const entries = Object.keys(row || {});
        const target = entries.find((k) => aliases.includes(normHeader(k)));
        return target ? row[target] : "";
      }

      function normalizePremiumValue(value) {
        const text = String(value ?? "").trim().toLowerCase();
        if (!text) return "unknown";
        if (["yes", "y", "true", "1", "premium", "premiumplus", "premium plus", "ja", "oui", "si"].includes(text)) return "yes";
        if (["no", "n", "false", "0", "nein", "non"].includes(text)) return "no";
        return "unknown";
      }

      function normalizeJobLabel(value) {
        return String(value || "").replace(/^\s*--+\s*/, "").trim() || "Unknown Job";
      }

      function keyToken(value) {
        return String(value || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");
      }

      function parseCsvToRows(csvText) {
        const result = Papa.parse(csvText || "", { header: true, skipEmptyLines: true });
        const rows = Array.isArray(result.data) ? result.data : [];
        const parsed = rows.map((row) => {
          const city = String(pickField(row, cityAliases) || "").trim() || "Unknown";
          const state = String(pickField(row, stateAliases) || "").trim() || "Unknown";
          const country = String(pickField(row, countryAliases) || "").trim() || "Unknown";
          const job = normalizeJobLabel(pickField(row, jobAliases));
          const premium = normalizePremiumValue(pickField(row, premiumAliases));
          const impressions = parseNumber(pickField(row, metricAliases.impressions));
          const clicks = parseNumber(pickField(row, metricAliases.clicks));
          const applyStarts = parseNumber(pickField(row, metricAliases.applyStarts));
          const applies = parseNumber(pickField(row, metricAliases.applies));
          let spend = parseNumber(pickField(row, metricAliases.spend));
          if (!(spend > 0)) {
            const cpa = parseNumber(pickField(row, metricAliases.cpa));
            const cpas = parseNumber(pickField(row, metricAliases.cpas));
            if (cpas > 0 && applyStarts > 0) spend = cpas * applyStarts;
            else if (cpa > 0 && applies > 0) spend = cpa * applies;
          }
          const explicitJobCount = parseNumber(pickField(row, jobCountAliases));
          let ctr = asRate(pickField(row, metricAliases.ctr));
          let asr = asRate(pickField(row, metricAliases.asr));
          let acr = asRate(pickField(row, metricAliases.acr));
          if (!(ctr > 0)) ctr = impressions > 0 ? clicks / impressions : 0;
          if (!(asr > 0)) asr = clicks > 0 ? applyStarts / clicks : 0;
          if (!(acr > 0)) acr = applyStarts > 0 ? applies / applyStarts : 0;
          return {
            state,
            city,
            country,
            job,
            premium,
            impressions,
            clicks,
            applyStarts,
            applies,
            spend,
            jobCount: explicitJobCount > 0 ? explicitJobCount : 1,
            ctr,
            asr,
            acr
          };
        });
        const hasApplies = parsed.some((r) => r.applies > 0);
        return { rows: parsed, hasApplies };
      }

      function aggregate(rows) {
        const stats = {
          jobCount: 0,
          spend: 0,
          impressions: 0,
          clicks: 0,
          applyStarts: 0,
          applies: 0,
          ctr: 0,
          asr: 0,
          acr: 0
        };
        (rows || []).forEach((r) => {
          stats.jobCount += r.jobCount;
          stats.spend += r.spend;
          stats.impressions += r.impressions;
          stats.clicks += r.clicks;
          stats.applyStarts += r.applyStarts;
          stats.applies += r.applies;
        });
        stats.ctr = stats.impressions > 0 ? stats.clicks / stats.impressions : 0;
        stats.asr = stats.clicks > 0 ? stats.applyStarts / stats.clicks : 0;
        stats.acr = stats.applyStarts > 0 ? stats.applies / stats.applyStarts : 0;
        return stats;
      }

      function aggregateByScope(rows, scope) {
        const keyField = scope === "city" ? "city" : "state";
        const map = new Map();
        (rows || []).forEach((row) => {
          const key = row[keyField] || "Unknown";
          if (!map.has(key)) map.set(key, []);
          map.get(key).push(row);
        });
        const out = new Map();
        map.forEach((groupRows, key) => out.set(key, aggregate(groupRows)));
        return out;
      }

      function formatCount(value) {
        return Number(value || 0).toLocaleString();
      }

      function formatPct(value) {
        return `${(Number(value || 0) * 100).toFixed(2)}%`;
      }

      function formatSpend(value) {
        return `€${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }

      function premiumMetricLabel(metricKey) {
        if (metricKey === "ctr") return "CTR";
        if (metricKey === "asr") return "ASR";
        if (metricKey === "acr") return "ACR";
        if (metricKey === "cpas") return "CPAS";
        if (metricKey === "cpa") return "CPA";
        return metricKey;
      }

      function premiumMetricValue(stats, metricKey) {
        if (metricKey === "ctr") return Number(stats.ctr || 0);
        if (metricKey === "asr") return Number(stats.asr || 0);
        if (metricKey === "acr") return Number(stats.acr || 0);
        if (metricKey === "cpas") return stats.applyStarts > 0 ? Number(stats.spend || 0) / Number(stats.applyStarts || 1) : 0;
        if (metricKey === "cpa") return stats.applies > 0 ? Number(stats.spend || 0) / Number(stats.applies || 1) : 0;
        return 0;
      }

      function formatPremiumMetric(metricKey, value) {
        if (metricKey === "ctr" || metricKey === "asr" || metricKey === "acr") return formatPct(value);
        return formatSpend(value);
      }

      function premiumLiftInfo(noValue, yesValue, metricKey) {
        const a = Number(noValue || 0);
        const b = Number(yesValue || 0);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return { text: "n/a", cls: "" };
        if (a === 0) {
          if (b === 0) return { text: "0.00%", cls: "" };
          if (metricKey === "cpas" || metricKey === "cpa") return { text: "new", cls: "bad" };
          return { text: "new", cls: "good" };
        }
        let pct = 0;
        if (metricKey === "cpas" || metricKey === "cpa") {
          pct = ((a - b) / Math.abs(a)) * 100;
        } else {
          pct = ((b - a) / Math.abs(a)) * 100;
        }
        if (pct > 0) return { text: `+${pct.toFixed(2)}%`, cls: "good" };
        if (pct < 0) return { text: `${pct.toFixed(2)}%`, cls: "bad" };
        return { text: "0.00%", cls: "" };
      }

      function aggregatePremiumByJob(rows) {
        const map = new Map();
        (rows || []).forEach((row) => {
          const premium = row.premium || "unknown";
          if (premium !== "yes" && premium !== "no") return;
          const key = [keyToken(row.job), keyToken(row.city), keyToken(row.state), keyToken(row.country)].join("|");
          if (!map.has(key)) {
            map.set(key, {
              key,
              job: row.job || "Unknown Job",
              city: row.city || "Unknown",
              state: row.state || "Unknown",
              country: row.country || "Unknown",
              yesRows: [],
              noRows: []
            });
          }
          const target = map.get(key);
          if (premium === "yes") target.yesRows.push(row);
          else target.noRows.push(row);
        });
        return map;
      }

      function renderPremiumComparison(fileOneRows, fileTwoRows, hasApplies) {
        const wrap = document.getElementById("premiumComparisonWrap");
        const selector = document.getElementById("premiumMetricSelector");
        if (!wrap || !selector) return;

        const acrOption = selector.querySelector('option[value="acr"]');
        const cpaOption = selector.querySelector('option[value="cpa"]');
        if (acrOption) acrOption.disabled = !hasApplies;
        if (cpaOption) cpaOption.disabled = !hasApplies;
        if (!hasApplies && (selector.value === "acr" || selector.value === "cpa")) {
          selector.value = "asr";
          selectedPremiumMetric = "asr";
        }
        const metric = selectedPremiumMetric || selector.value || "asr";
        if (selector.value !== metric) selector.value = metric;

        const fileOneMap = aggregatePremiumByJob(fileOneRows);
        const fileTwoMap = aggregatePremiumByJob(fileTwoRows);
        const keys = Array.from(new Set([...fileOneMap.keys(), ...fileTwoMap.keys()]));
        if (!keys.length) {
          wrap.innerHTML = `<div class="empty">No Premium Yes/No values found in File 1 or File 2.</div>`;
          return;
        }

        const rows = keys.map((key) => {
          const one = fileOneMap.get(key) || { yesRows: [], noRows: [], job: "Unknown Job", city: "Unknown", state: "Unknown", country: "Unknown" };
          const two = fileTwoMap.get(key) || { yesRows: [], noRows: [], job: one.job, city: one.city, state: one.state, country: one.country };
          const oneNoStats = aggregate(one.noRows);
          const oneYesStats = aggregate(one.yesRows);
          const twoNoStats = aggregate(two.noRows);
          const twoYesStats = aggregate(two.yesRows);
          const oneNoValue = premiumMetricValue(oneNoStats, metric);
          const oneYesValue = premiumMetricValue(oneYesStats, metric);
          const twoNoValue = premiumMetricValue(twoNoStats, metric);
          const twoYesValue = premiumMetricValue(twoYesStats, metric);
          const oneLift = premiumLiftInfo(oneNoValue, oneYesValue, metric);
          const twoLift = premiumLiftInfo(twoNoValue, twoYesValue, metric);
          return {
            key,
            job: one.job || two.job || "Unknown Job",
            city: one.city || two.city || "Unknown",
            state: one.state || two.state || "Unknown",
            country: one.country || two.country || "Unknown",
            oneNoStats,
            oneYesStats,
            twoNoStats,
            twoYesStats,
            oneNoValue,
            oneYesValue,
            twoNoValue,
            twoYesValue,
            oneLift,
            twoLift,
            rank: Math.max(Math.abs(parseFloat(oneLift.text)) || 0, Math.abs(parseFloat(twoLift.text)) || 0)
          };
        }).sort((a, b) => b.rank - a.rank);

        let html = `<table><thead><tr>
          <th>Job</th>
          <th>File 1 No (${premiumMetricLabel(metric)})</th>
          <th>File 1 Yes (${premiumMetricLabel(metric)})</th>
          <th>File 1 Lift</th>
          <th>File 2 No (${premiumMetricLabel(metric)})</th>
          <th>File 2 Yes (${premiumMetricLabel(metric)})</th>
          <th>File 2 Lift</th>
        </tr></thead><tbody>`;
        rows.forEach((row) => {
          const locationLine = `${row.city}, ${row.state} (${row.country})`;
          html += `<tr>
            <td>
              ${escapeHtml(row.job)}
              <span class="subline">${escapeHtml(locationLine)}</span>
            </td>
            <td>${formatPremiumMetric(metric, row.oneNoValue)}<span class="subline">jobs: ${formatCount(row.oneNoStats.jobCount)}</span></td>
            <td>${formatPremiumMetric(metric, row.oneYesValue)}<span class="subline">jobs: ${formatCount(row.oneYesStats.jobCount)}</span></td>
            <td><span class="delta ${row.oneLift.cls}">${row.oneLift.text}</span></td>
            <td>${formatPremiumMetric(metric, row.twoNoValue)}<span class="subline">jobs: ${formatCount(row.twoNoStats.jobCount)}</span></td>
            <td>${formatPremiumMetric(metric, row.twoYesValue)}<span class="subline">jobs: ${formatCount(row.twoYesStats.jobCount)}</span></td>
            <td><span class="delta ${row.twoLift.cls}">${row.twoLift.text}</span></td>
          </tr>`;
        });
        html += `</tbody></table>`;
        wrap.innerHTML = html;
      }

      function metricLabel(metricKey) {
        if (metricKey === "impressions") return "Impressions";
        if (metricKey === "clicks") return "Clicks";
        if (metricKey === "applyStarts") return "Apply starts";
        if (metricKey === "applies") return "Applies";
        return metricKey;
      }

      function deltaInfo(v1, v2) {
        const a = Number(v1 || 0);
        const b = Number(v2 || 0);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return { text: "n/a", cls: "" };
        if (a === 0) {
          if (b === 0) return { text: "0.00%", cls: "" };
          return { text: "new", cls: "good" };
        }
        const pct = ((b - a) / Math.abs(a)) * 100;
        if (pct > 0) return { text: `+${pct.toFixed(2)}%`, cls: "good" };
        if (pct < 0) return { text: `${pct.toFixed(2)}%`, cls: "bad" };
        return { text: "0.00%", cls: "" };
      }

      function orientedFiles() {
        if (comparisonDirection === "ba") {
          return {
            baseName: slotFiles[1].name || "File B",
            targetName: slotFiles[0].name || "File A",
            base: parsedTwo,
            target: parsedOne
          };
        }
        return {
          baseName: slotFiles[0].name || "File A",
          targetName: slotFiles[1].name || "File B",
          base: parsedOne,
          target: parsedTwo
        };
      }

      function stageDisplayValue(stats, stage) {
        const raw = stats[stage.key] || 0;
        if (funnelBasis === "perJob" && !stage.isRate) {
          return stats.jobCount > 0 ? raw / stats.jobCount : 0;
        }
        return raw;
      }

      function stageMetricList(hasApplies) {
        const base = [
          { key: "impressions", label: "Impressions", isRate: false },
          { key: "ctr", label: "CTR", isRate: true },
          { key: "clicks", label: "Clicks", isRate: false },
          { key: "asr", label: "Apply start rate", isRate: true },
          { key: "applyStarts", label: "Application starts", isRate: false }
        ];
        if (hasApplies) {
          base.push({ key: "acr", label: "ACR", isRate: true });
          base.push({ key: "applies", label: "Applies", isRate: false });
        }
        return base;
      }

      function tableMetricList(hasApplies) {
        const base = stageMetricList(hasApplies).slice();
        base.push({ key: "spend", label: "Spend", isRate: false, isCurrency: true });
        return base;
      }

      function formatStageValue(stage, value) {
        if (stage.isRate) return formatPct(value);
        if (stage.isCurrency) return funnelBasis === "perJob" ? `${formatSpend(value)} /job` : formatSpend(value);
        if (funnelBasis === "perJob") return `${value.toFixed(2)} /job`;
        return formatCount(value);
      }

      function renderFunnel(statsOne, statsTwo, hasApplies) {
        const container = document.getElementById("funnelChart");
        container.innerHTML = "";
        const stages = stageMetricList(hasApplies);
        const widthSteps = [100, 90, 80, 70, 60, 50, 40];

        stages.forEach((stage, idx) => {
          const valueOne = stageDisplayValue(statsOne, stage);
          const valueTwo = stageDisplayValue(statsTwo, stage);
          const delta = deltaInfo(valueOne, valueTwo);
          const row = document.createElement("div");
          row.className = `funnel-stage s${Math.min(idx + 1, 7)}`;
          row.style.width = `${widthSteps[idx] || 40}%`;
          row.style.animationDelay = `${idx * 90}ms`;
          const valueLabel = formatStageValue(stage, valueTwo);
          row.innerHTML = `
            <div class="stage-main">
              <span class="stage-left">${stage.label}</span>
              <span class="stage-value">${valueLabel}</span>
              <span class="delta ${delta.cls}">${delta.text}</span>
            </div>
          `;
          container.appendChild(row);
        });
        const jobDelta = deltaInfo(statsOne.jobCount, statsTwo.jobCount);
        const jobContext = document.getElementById("funnelJobContext");
        if (jobContext) {
          jobContext.innerHTML = `Jobs ${formatCount(statsOne.jobCount)} -> ${formatCount(statsTwo.jobCount)} <span class="delta ${jobDelta.cls}" style="margin-left:4px;">${jobDelta.text}</span>`;
        }
        const spendDelta = deltaInfo(statsOne.spend, statsTwo.spend);
        const spendContext = document.getElementById("funnelSpendContext");
        if (spendContext) {
          spendContext.innerHTML = `Spend ${formatSpend(statsOne.spend)} -> ${formatSpend(statsTwo.spend)} <span class="delta ${spendDelta.cls}" style="margin-left:4px;">${spendDelta.text}</span>`;
        }
      }

      function renderTable(scope, fileOneRows, fileTwoRows, hasApplies) {
        const wrap = document.getElementById("comparisonTableWrap");
        const mapOne = aggregateByScope(fileOneRows, scope);
        const mapTwo = aggregateByScope(fileTwoRows, scope);
        const keys = Array.from(new Set([...mapOne.keys(), ...mapTwo.keys()]));
        if (!keys.length) {
          wrap.innerHTML = `<div class="empty">No ${scope} rows available.</div>`;
          return;
        }
        const stages = stageMetricList(hasApplies);
        const rows = keys.map((key) => {
          const a = mapOne.get(key) || aggregate([]);
          const b = mapTwo.get(key) || aggregate([]);
          const rankDelta = deltaInfo(a.applyStarts, b.applyStarts);
          const rank = Math.abs(parseFloat(rankDelta.text)) || 0;
          return { key, a, b, rank };
        });

        const sortKey = tableSort.key || "scope";
        const sortDir = tableSort.dir === "desc" ? -1 : 1;
        rows.sort((left, right) => {
          if (sortKey === "scope") return left.key.localeCompare(right.key) * sortDir;
          const stage = stages.find((s) => s.key === sortKey);
          if (!stage) return left.key.localeCompare(right.key) * sortDir;
          const lv = stageDisplayValue(left.b, stage);
          const rv = stageDisplayValue(right.b, stage);
          return (lv - rv) * sortDir;
        });

        const sortArrow = (key) => tableSort.key === key ? (tableSort.dir === "asc" ? " ↑" : " ↓") : "";
        let html = `<table><thead><tr><th><button class="th-sort-btn" data-sort-key="scope">${scope === "city" ? "City" : "State/Region"}${sortArrow("scope")}</button></th>`;
        stages.forEach((stage) => { html += `<th><button class="th-sort-btn" data-sort-key="${stage.key}">${stage.label}${sortArrow(stage.key)}</button></th>`; });
        html += `</tr></thead><tbody>`;

        rows.forEach((row) => {
          html += `<tr><td>${row.key}</td>`;
          stages.forEach((stage) => {
            const v1 = stageDisplayValue(row.a, stage);
            const v2 = stageDisplayValue(row.b, stage);
            const delta = deltaInfo(v1, v2);
            const formatted = formatStageValue(stage, v2);
            html += `<td>${formatted}<span class="mini delta ${delta.cls}">${delta.text}</span></td>`;
          });
          html += `</tr>`;
        });
        html += `</tbody></table>`;
        wrap.innerHTML = html;
      }

      function renderEfficiencyAndDrivers(scope, fileOneRows, fileTwoRows, hasApplies) {
        const metricKey = selectedDriverMetric === "applies" && !hasApplies ? "applyStarts" : selectedDriverMetric;
        const selector = document.getElementById("driverMetricSelector");
        if (selector) {
          const appliesOption = selector.querySelector('option[value="applies"]');
          if (appliesOption) appliesOption.disabled = !hasApplies;
          if (selector.value !== metricKey) selector.value = metricKey;
        }

        const statsOne = aggregate(fileOneRows);
        const statsTwo = aggregate(fileTwoRows);
        const output1 = Number(statsOne[metricKey] || 0);
        const output2 = Number(statsTwo[metricKey] || 0);
        const spend1 = Number(statsOne.spend || 0);
        const spend2 = Number(statsTwo.spend || 0);

        const outputChange = deltaInfo(output1, output2);
        const spendChange = deltaInfo(spend1, spend2);
        let efficiencyIndex = null;
        if (output1 > 0 && spend1 > 0) {
          const outRatio = output2 / output1;
          const spendRatio = spend2 / spend1;
          if (spendRatio > 0) efficiencyIndex = outRatio / spendRatio;
        }
        const efficiencyDelta = efficiencyIndex == null ? { text: "n/a", cls: "" } : deltaInfo(1, efficiencyIndex);

        const tile = document.getElementById("efficiencyTile");
        if (tile) {
          tile.innerHTML = `
            <div class="kpi">
              <div class="label">Output metric</div>
              <div class="value">${metricLabel(metricKey)}</div>
            </div>
            <div class="kpi">
              <div class="label">Output change</div>
              <div class="value">${outputChange.text}</div>
            </div>
            <div class="kpi">
              <div class="label">Spend change</div>
              <div class="value">${spendChange.text}</div>
            </div>
            <div class="kpi">
              <div class="label">Efficiency index</div>
              <div class="value">${efficiencyIndex == null ? "n/a" : efficiencyIndex.toFixed(2)} <span class="delta ${efficiencyDelta.cls}">${efficiencyDelta.text}</span></div>
            </div>
          `;
        }

        const mapOne = aggregateByScope(fileOneRows, scope);
        const mapTwo = aggregateByScope(fileTwoRows, scope);
        const keys = Array.from(new Set([...mapOne.keys(), ...mapTwo.keys()]));
        const totalDelta = keys.reduce((sum, key) => {
          const a = mapOne.get(key) || aggregate([]);
          const b = mapTwo.get(key) || aggregate([]);
          return sum + ((b[metricKey] || 0) - (a[metricKey] || 0));
        }, 0);
        const drivers = keys.map((key) => {
          const a = mapOne.get(key) || aggregate([]);
          const b = mapTwo.get(key) || aggregate([]);
          const v1 = Number(a[metricKey] || 0);
          const v2 = Number(b[metricKey] || 0);
          const delta = v2 - v1;
          const pct = v1 === 0 ? (v2 === 0 ? 0 : Infinity) : ((v2 - v1) / Math.abs(v1)) * 100;
          const contribution = totalDelta === 0 ? 0 : (delta / totalDelta) * 100;
          return { key, v1, v2, delta, pct, contribution };
        }).sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta)).slice(0, 3);

        const wrap = document.getElementById("driverTableWrap");
        if (!wrap) return;
        if (!drivers.length) {
          wrap.innerHTML = `<div class="empty">No drivers available.</div>`;
          return;
        }
        const scopeLabel = scope === "city" ? "City" : "State/Region";
        let html = `<table><thead><tr><th>${scopeLabel}</th><th>File 1</th><th>File 2</th><th>Delta</th><th>Contribution</th></tr></thead><tbody>`;
        drivers.forEach((d) => {
          const deltaCls = d.delta > 0 ? "good" : d.delta < 0 ? "bad" : "";
          const valueFmt = metricKey === "spend" ? (v) => formatSpend(v) : (v) => formatCount(v);
          const deltaText = Number.isFinite(d.pct) ? `${d.pct > 0 ? "+" : ""}${d.pct.toFixed(2)}%` : "new";
          html += `<tr>
            <td>${d.key}</td>
            <td>${valueFmt(d.v1)}</td>
            <td>${valueFmt(d.v2)}</td>
            <td><span class="delta ${deltaCls}">${deltaText}</span></td>
            <td>${Number.isFinite(d.contribution) ? `${d.contribution.toFixed(1)}%` : "n/a"}</td>
          </tr>`;
        });
        html += `</tbody></table>`;
        wrap.innerHTML = html;
      }

      function updateBadges() {
        document.getElementById("slot1Badge").textContent = `File 1: ${slotFiles[0].name || "not loaded"}`;
        document.getElementById("slot2Badge").textContent = `File 2: ${slotFiles[1].name || "not loaded"}`;
      }

      function rerenderComparison() {
        updateBadges();
        const status = document.getElementById("status");
        const dataShownNote = document.getElementById("dataShownNote");
        const reverseBtn = document.getElementById("reverseBtn");
        if (reverseBtn) {
          reverseBtn.textContent = comparisonDirection === "ab" ? "Reverse (A -> B)" : "Reverse (B -> A)";
        }
        if (!slotFiles[0].text || !slotFiles[1].text) {
          status.textContent = "Please upload two files in slot 1 and slot 2 from the shared header uploader.";
          if (dataShownNote) dataShownNote.textContent = "Data shown: waiting for files";
          document.getElementById("funnelChart").innerHTML = "";
          const spendContext = document.getElementById("funnelSpendContext");
          const jobContext = document.getElementById("funnelJobContext");
          const premiumWrap = document.getElementById("premiumComparisonWrap");
          if (spendContext) spendContext.textContent = "Spend n/a";
          if (jobContext) jobContext.textContent = "Jobs n/a";
          document.getElementById("comparisonTableWrap").innerHTML = `<div class="empty">Waiting for both files.</div>`;
          if (premiumWrap) premiumWrap.innerHTML = `<div class="empty">Waiting for both files.</div>`;
          return;
        }
        parsedOne = parseCsvToRows(slotFiles[0].text);
        parsedTwo = parseCsvToRows(slotFiles[1].text);
        const oriented = orientedFiles();
        const statsOne = aggregate((oriented.base && oriented.base.rows) || []);
        const statsTwo = aggregate((oriented.target && oriented.target.rows) || []);
        const hasApplies = (oriented.base && oriented.base.hasApplies) || (oriented.target && oriented.target.hasApplies);
        status.textContent = `Comparing ${oriented.baseName} → ${oriented.targetName} (${funnelBasis === "perJob" ? "per job" : "holistic"})`;
        if (dataShownNote) dataShownNote.textContent = `Data shown: ${oriented.targetName} (compared vs ${oriented.baseName})`;
        renderFunnel(statsOne, statsTwo, hasApplies);
        renderEfficiencyAndDrivers(
          currentScope,
          (oriented.base && oriented.base.rows) || [],
          (oriented.target && oriented.target.rows) || [],
          hasApplies
        );
        renderPremiumComparison(
          (parsedOne && parsedOne.rows) || [],
          (parsedTwo && parsedTwo.rows) || [],
          (parsedOne && parsedOne.hasApplies) || (parsedTwo && parsedTwo.hasApplies)
        );
        renderTable(
          currentScope,
          (oriented.base && oriented.base.rows) || [],
          (oriented.target && oriented.target.rows) || [],
          hasApplies
        );
      }

      document.getElementById("scopeStateBtn").addEventListener("click", () => {
        currentScope = "state";
        tableSort = { key: "scope", dir: "asc" };
        document.getElementById("scopeStateBtn").classList.add("active");
        document.getElementById("scopeCityBtn").classList.remove("active");
        if (parsedOne && parsedTwo) {
          const oriented = orientedFiles();
          renderTable(
            currentScope,
            (oriented.base && oriented.base.rows) || [],
            (oriented.target && oriented.target.rows) || [],
            (oriented.base && oriented.base.hasApplies) || (oriented.target && oriented.target.hasApplies)
          );
          renderEfficiencyAndDrivers(
            currentScope,
            (oriented.base && oriented.base.rows) || [],
            (oriented.target && oriented.target.rows) || [],
            (oriented.base && oriented.base.hasApplies) || (oriented.target && oriented.target.hasApplies)
          );
        }
      });

      document.getElementById("scopeCityBtn").addEventListener("click", () => {
        currentScope = "city";
        tableSort = { key: "scope", dir: "asc" };
        document.getElementById("scopeCityBtn").classList.add("active");
        document.getElementById("scopeStateBtn").classList.remove("active");
        if (parsedOne && parsedTwo) {
          const oriented = orientedFiles();
          renderTable(
            currentScope,
            (oriented.base && oriented.base.rows) || [],
            (oriented.target && oriented.target.rows) || [],
            (oriented.base && oriented.base.hasApplies) || (oriented.target && oriented.target.hasApplies)
          );
          renderEfficiencyAndDrivers(
            currentScope,
            (oriented.base && oriented.base.rows) || [],
            (oriented.target && oriented.target.rows) || [],
            (oriented.base && oriented.base.hasApplies) || (oriented.target && oriented.target.hasApplies)
          );
        }
      });

      document.getElementById("reverseBtn").addEventListener("click", () => {
        comparisonDirection = comparisonDirection === "ab" ? "ba" : "ab";
        rerenderComparison();
      });

      document.getElementById("basisHolisticBtn").addEventListener("click", () => {
        funnelBasis = "holistic";
        document.getElementById("basisHolisticBtn").classList.add("active");
        document.getElementById("basisPerJobBtn").classList.remove("active");
        rerenderComparison();
      });

      document.getElementById("basisPerJobBtn").addEventListener("click", () => {
        funnelBasis = "perJob";
        document.getElementById("basisPerJobBtn").classList.add("active");
        document.getElementById("basisHolisticBtn").classList.remove("active");
        rerenderComparison();
      });

      document.getElementById("driverMetricSelector").addEventListener("change", (event) => {
        selectedDriverMetric = event.target.value || "applyStarts";
        if (parsedOne && parsedTwo) {
          const oriented = orientedFiles();
          renderEfficiencyAndDrivers(
            currentScope,
            (oriented.base && oriented.base.rows) || [],
            (oriented.target && oriented.target.rows) || [],
            (oriented.base && oriented.base.hasApplies) || (oriented.target && oriented.target.hasApplies)
          );
        }
      });

      document.getElementById("premiumMetricSelector").addEventListener("change", (event) => {
        selectedPremiumMetric = event.target.value || "asr";
        if (parsedOne && parsedTwo) {
          renderPremiumComparison(
            (parsedOne && parsedOne.rows) || [],
            (parsedTwo && parsedTwo.rows) || [],
            (parsedOne && parsedOne.hasApplies) || (parsedTwo && parsedTwo.hasApplies)
          );
        }
      });

      document.getElementById("comparisonTableWrap").addEventListener("click", (event) => {
        const btn = event.target && event.target.closest ? event.target.closest(".th-sort-btn") : null;
        if (!btn) return;
        const key = btn.dataset.sortKey || "scope";
        if (tableSort.key === key) {
          tableSort.dir = tableSort.dir === "asc" ? "desc" : "asc";
        } else {
          tableSort = { key, dir: "asc" };
        }
        if (parsedOne && parsedTwo) {
          const oriented = orientedFiles();
          renderTable(
            currentScope,
            (oriented.base && oriented.base.rows) || [],
            (oriented.target && oriented.target.rows) || [],
            (oriented.base && oriented.base.hasApplies) || (oriented.target && oriented.target.hasApplies)
          );
        }
      });

      window.addEventListener("message", (event) => {
        const data = event.data;
        if (!data) return;
        if (data.type === SHARED_SLOTS_MESSAGE && data.payload && Array.isArray(data.payload.slots)) {
          slotFiles = data.payload.slots.slice(0, 2).map((slot) => ({
            name: String((slot && slot.name) || "").trim(),
            text: String((slot && slot.text) || "")
          }));
          while (slotFiles.length < 2) slotFiles.push({ name: "", text: "" });
          rerenderComparison();
        }
      });

      rerenderComparison();
