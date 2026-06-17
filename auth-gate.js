/*
 * Simple site password gate for GitHub Pages.
 *
 * IMPORTANT: This is a client-side gate only. GitHub Pages is fully static, so
 * this can be bypassed by anyone who reads the page source. It keeps casual /
 * accidental visitors out — do NOT rely on it to protect sensitive data.
 *
 * To change the password: edit SITE_PASSWORD below.
 * To require it everywhere (incl. local dev): set GATE_ONLY_ON_GITHUB_PAGES = false.
 * To remember across browser sessions: change sessionStorage -> localStorage below.
 */
(function () {
  "use strict";

  var SITE_PASSWORD = "Indeed2026"; // <-- set your password here
  var GATE_ONLY_ON_GITHUB_PAGES = true;
  var STORAGE_KEY = "mas-site-auth";

  // Only gate on GitHub Pages (skip local file:// and localhost dev).
  if (GATE_ONLY_ON_GITHUB_PAGES && !/\.github\.io$/i.test(location.hostname)) {
    return;
  }

  // Don't prompt inside iframes — the top-level page handles auth, and
  // sessionStorage is shared same-origin so the iframes inherit it.
  if (window.top !== window.self) {
    return;
  }

  var store;
  try {
    store = window.sessionStorage;
  } catch (e) {
    store = null;
  }

  // Already authenticated this session.
  if (store && store.getItem(STORAGE_KEY) === "1") {
    return;
  }

  // Build the overlay. Append to documentElement so it shows before <body>
  // finishes parsing (avoids a flash of the underlying page).
  var overlay = document.createElement("div");
  overlay.id = "site-auth-gate";
  overlay.setAttribute(
    "style",
    [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "background:#0f141b",
      "font-family:'Sora',system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
    ].join(";")
  );

  overlay.innerHTML =
    '<form id="site-auth-form" style="' +
    [
      "width:min(360px,90vw)",
      "background:#161c25",
      "border:1px solid #2a323f",
      "border-radius:14px",
      "padding:28px 26px",
      "box-shadow:0 20px 60px rgba(0,0,0,.5)",
      "text-align:center",
    ].join(";") +
    '">' +
    '<div style="font-size:18px;font-weight:600;color:#e6eaf0;margin-bottom:6px;">Marketing Analytics Suite</div>' +
    '<div style="font-size:13px;color:#9aa6b6;margin-bottom:18px;">Enter the site password to continue</div>' +
    '<input id="site-auth-input" type="password" autocomplete="current-password" placeholder="Password" style="' +
    [
      "width:100%",
      "box-sizing:border-box",
      "padding:11px 13px",
      "border-radius:9px",
      "border:1px solid #2a323f",
      "background:#0f141b",
      "color:#e6eaf0",
      "font-size:14px",
      "outline:none",
    ].join(";") +
    '" />' +
    '<div id="site-auth-error" style="height:16px;margin-top:8px;font-size:12px;color:#ef4444;"></div>' +
    '<button type="submit" style="' +
    [
      "width:100%",
      "margin-top:6px",
      "padding:11px",
      "border:none",
      "border-radius:9px",
      "background:#5b9bff",
      "color:#0b1220",
      "font-size:14px",
      "font-weight:600",
      "cursor:pointer",
    ].join(";") +
    '">Unlock</button>' +
    "</form>";

  function wire() {
    var form = overlay.querySelector("#site-auth-form");
    var input = overlay.querySelector("#site-auth-input");
    var error = overlay.querySelector("#site-auth-error");
    input.focus();
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (input.value === SITE_PASSWORD) {
        if (store) store.setItem(STORAGE_KEY, "1");
        overlay.remove();
      } else {
        error.textContent = "Incorrect password";
        input.value = "";
        input.focus();
      }
    });
  }

  // Show immediately if the body exists; otherwise attach to <html> now and
  // wire up once the DOM is ready.
  document.documentElement.appendChild(overlay);
  if (document.body) {
    wire();
  } else {
    document.addEventListener("DOMContentLoaded", wire);
  }
})();
