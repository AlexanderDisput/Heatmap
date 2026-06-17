	      const SHARED_UPLOAD_MESSAGE = "shared-csv-upload";
        const SHARED_SLOTS_MESSAGE = "shared-csv-slots";
        const UI_LANGUAGE_MESSAGE = "ui-language-changed";
        const MAX_SHARED_DATASETS = 3;
        let appInitialized = false;
        const translations = {
          en: {
            title: "Marketing Analytics Suite",
            subtitle: "Switch between tools without leaving the page",
            sharedCsv: "Shared CSV",
            statusNone: "No shared file selected for active slot.",
            statusLoaded: "Loaded",
            tabBudget: "Budget Efficiency",
            tabHeatmap: "Geo Heatmap",
            tabScraper: "Intent Quadrant",
            tabComparison: "Campaign Comparison",
            slotLabel: "Dataset",
            slotEmpty: "Empty"
          },
          de: {
            title: "Marketing-Analyse Suite",
            subtitle: "Zwischen Tools wechseln, ohne die Seite zu verlassen",
            sharedCsv: "Geteilte CSV",
            statusNone: "Keine geteilte Datei für den aktiven Slot.",
            statusLoaded: "Geladen",
            tabBudget: "Budget-Effizienz",
            tabHeatmap: "Geo-Heatmap",
            tabScraper: "Intent-Quadrant",
            tabComparison: "Kampagnenvergleich",
            slotLabel: "Datensatz",
            slotEmpty: "Leer"
          },
          fr: {
            title: "Suite d'analyse marketing",
            subtitle: "Passez d'un outil à l'autre sans quitter la page",
            sharedCsv: "CSV partagé",
            statusNone: "Aucun fichier partagé pour l'emplacement actif.",
            statusLoaded: "Chargé",
            tabBudget: "Efficacité budget",
            tabHeatmap: "Heatmap géo",
            tabScraper: "Quadrant d'intention",
            tabComparison: "Comparaison campagnes",
            slotLabel: "Jeu",
            slotEmpty: "Vide"
          },
          es: {
            title: "Suite de analítica de marketing",
            subtitle: "Cambia entre herramientas sin salir de la página",
            sharedCsv: "CSV compartido",
            statusNone: "No hay archivo compartido en la ranura activa.",
            statusLoaded: "Cargado",
            tabBudget: "Eficiencia de presupuesto",
            tabHeatmap: "Mapa de calor geo",
            tabScraper: "Cuadrante de intención",
            tabComparison: "Comparación campañas",
            slotLabel: "Conjunto",
            slotEmpty: "Vacío"
          },
          it: {
            title: "Suite di analisi marketing",
            subtitle: "Passa tra gli strumenti senza lasciare la pagina",
            sharedCsv: "CSV condiviso",
            statusNone: "Nessun file condiviso nello slot attivo.",
            statusLoaded: "Caricato",
            tabBudget: "Efficienza budget",
            tabHeatmap: "Mappa di calore geo",
            tabScraper: "Quadrante intenzione",
            tabComparison: "Confronto campagne",
            slotLabel: "Dataset",
            slotEmpty: "Vuoto"
          },
          nl: {
            title: "Marketing Analyse Suite",
            subtitle: "Wissel tussen tools zonder de pagina te verlaten",
            sharedCsv: "Gedeelde CSV",
            statusNone: "Geen gedeeld bestand in actieve slot.",
            statusLoaded: "Geladen",
            tabBudget: "Budgetefficiëntie",
            tabHeatmap: "Geo-heatmap",
            tabScraper: "Intentie-kwadrant",
            tabComparison: "Campagnevergelijking",
            slotLabel: "Dataset",
            slotEmpty: "Leeg"
          }
        };
	      const tabs = Array.from(document.querySelectorAll(".tab"));
	      const panels = Array.from(document.querySelectorAll(".panel"));
	      const frames = Array.from(document.querySelectorAll("iframe"));
	      const sharedCsvInput = document.getElementById("sharedCsv");
	      const sharedStatus = document.getElementById("sharedStatus");
        const languageSelector = document.getElementById("languageSelector");
        const datasetToolbar = document.getElementById("datasetToolbar");
        let currentLanguage = "en";
        const sharedSlots = Array.from({ length: MAX_SHARED_DATASETS }, (_, index) => ({ index, name: "", text: "", customName: "" }));
        if (window.DEFAULT_SHARED_UPLOAD && window.DEFAULT_SHARED_UPLOAD.text) {
          sharedSlots[0] = { index: 0, name: window.DEFAULT_SHARED_UPLOAD.name || "demo-data.csv", text: window.DEFAULT_SHARED_UPLOAD.text, customName: "" };
        }
        let activeSlotIndex = 0;

      function setActive(view) {
        tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
        panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === view));
      }

      function getActiveSlot() {
        return sharedSlots[activeSlotIndex] || null;
      }

      function hasAnyLoadedSlot() {
        return sharedSlots.some((slot) => slot && slot.text);
      }

      function getSlotDisplayName(slot, index) {
        const t = translations[currentLanguage] || translations.en;
        return slot.customName || slot.name || `${t.slotLabel} ${index + 1}`;
      }

      function updateSharedStatus() {
        const t = translations[currentLanguage] || translations.en;
        const slot = getActiveSlot();
        if (!slot || !slot.text) {
          sharedStatus.textContent = t.statusNone;
          return;
        }
        sharedStatus.textContent = `${t.statusLoaded}: ${getSlotDisplayName(slot, activeSlotIndex)}`;
      }

      function activateSlot(index) {
        activeSlotIndex = index;
        renderDatasetSlots();
        updateSharedStatus();
        // Fire twice to avoid timing races when embedded pages are re-rendering async.
        broadcastSharedFile();
        broadcastSharedSlots();
        setTimeout(() => broadcastSharedFile(), 120);
        setTimeout(() => broadcastSharedSlots(), 120);
      }

      function renderDatasetSlots() {
        if (!datasetToolbar) return;
        datasetToolbar.innerHTML = "";
        const t = translations[currentLanguage] || translations.en;
        sharedSlots.forEach((slot, index) => {
          const wrapper = document.createElement("div");
          wrapper.className = "dataset-slot";
          wrapper.dataset.index = String(index);
          const mainBtn = document.createElement("button");
          mainBtn.type = "button";
          mainBtn.className = "dataset-main";
          if (index === activeSlotIndex) mainBtn.classList.add("active");
          if (!slot.text) mainBtn.classList.add("empty");
          const label = document.createElement("span");
          const baseName = getSlotDisplayName(slot, index);
          label.textContent = !slot.text ? `${baseName} (${t.slotEmpty})` : baseName;
          mainBtn.appendChild(label);
          mainBtn.addEventListener("click", () => activateSlot(index));
          wrapper.appendChild(mainBtn);
          const editBtn = document.createElement("button");
          editBtn.type = "button";
          editBtn.className = "edit-name";
          editBtn.setAttribute("aria-label", `Rename dataset ${index + 1}`);
          editBtn.textContent = "✎";
          editBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            const currentName = getSlotDisplayName(slot, index);
            const nextName = window.prompt("Rename dataset", currentName);
            if (nextName == null) return;
            slot.customName = nextName.trim();
            renderDatasetSlots();
            updateSharedStatus();
            broadcastSharedSlots();
            if (index === activeSlotIndex) {
              broadcastSharedFile();
            }
          });
          wrapper.appendChild(editBtn);
          datasetToolbar.appendChild(wrapper);
        });
      }

      function sendSharedFile(targetWindow) {
        const slot = getActiveSlot();
        if (!slot || !slot.text || !targetWindow) return;
        targetWindow.postMessage(
          {
            type: SHARED_UPLOAD_MESSAGE,
            payload: {
              name: getSlotDisplayName(slot, activeSlotIndex),
              text: slot.text
            }
          },
          "*"
        );
      }

	      function broadcastSharedFile() {
	        frames.forEach((frame) => sendSharedFile(frame.contentWindow));
	      }

        function sendSharedSlots(targetWindow) {
          if (!targetWindow) return;
          const slotsPayload = sharedSlots.slice(0, 2).map((slot, index) => ({
            index,
            name: getSlotDisplayName(slot, index),
            text: slot && slot.text ? slot.text : ""
          }));
          targetWindow.postMessage({ type: SHARED_SLOTS_MESSAGE, payload: { slots: slotsPayload } }, "*");
        }

        function broadcastSharedSlots() {
          frames.forEach((frame) => sendSharedSlots(frame.contentWindow));
        }

        function applyShellLanguage(lang) {
          const t = translations[lang] || translations.en;
          currentLanguage = lang;
          document.getElementById("suiteTitle").textContent = t.title;
          document.getElementById("suiteSubtitle").textContent = t.subtitle;
          document.getElementById("sharedCsvLabel").textContent = t.sharedCsv;
          document.getElementById("tabBudget").textContent = t.tabBudget;
          document.getElementById("tabHeatmap").textContent = t.tabHeatmap;
          document.getElementById("tabScraper").textContent = t.tabScraper;
          document.getElementById("tabComparison").textContent = t.tabComparison;
          renderDatasetSlots();
          updateSharedStatus();
        }

        function sendLanguage(targetWindow) {
          if (!targetWindow) return;
          targetWindow.postMessage({ type: UI_LANGUAGE_MESSAGE, payload: { language: currentLanguage } }, "*");
        }

        function broadcastLanguage() {
          frames.forEach((frame) => sendLanguage(frame.contentWindow));
        }

      function initApp() {
        if (appInitialized) return;
        appInitialized = true;
        tabs.forEach((tab) => {
          tab.addEventListener("click", () => setActive(tab.dataset.view));
        });

        frames.forEach((frame) => {
          frame.addEventListener("load", () => {
            sendSharedFile(frame.contentWindow);
            sendSharedSlots(frame.contentWindow);
            sendLanguage(frame.contentWindow);
          });
        });

        languageSelector.addEventListener("change", () => {
          applyShellLanguage(languageSelector.value);
          broadcastLanguage();
        });

        sharedCsvInput.addEventListener("change", async (event) => {
          const file = event.target.files && event.target.files[0];
          if (!file) return;
          const text = await file.text();
          const slot = getActiveSlot();
          if (!slot) return;
          slot.name = file.name;
          slot.text = text;
          if (!slot.customName) slot.customName = file.name;
          sharedCsvInput.value = "";
          activateSlot(activeSlotIndex);
        });

        window.addEventListener("beforeunload", (event) => {
          if (!hasAnyLoadedSlot()) return;
          event.preventDefault();
          event.returnValue = "";
        });

        applyShellLanguage("en");
        if (hasAnyLoadedSlot()) {
          broadcastSharedFile();
          broadcastSharedSlots();
        }
      }
      initApp();
