/* ST Indoor Zone - AI chat widget
   Add before </body> on every page:
   <script src="st-chatbot.js" defer></script>
*/
(function () {
  "use strict";

  var CONFIG = {
    webhookUrl: "https://stindoorzone.app.n8n.cloud/webhook/st-chat",
    whatsappNumber: "8801635990895", // country code + number, no + or spaces
    messengerUrl: "https://m.me/Stindoorzone",
    shopName: "ST Indoor Zone",
    tagline: "Play \u2022 Wear \u2022 Enjoy",
    greeting: "Hi! Welcome to ST Indoor Zone. Ask me about products, payment, or delivery.",
    quickReplies: ["Watch price", "Payment options", "Delivery", "I want to order"],
    topOffset: 80, // px from the top of the screen; set 16 if nothing is in the corner
    minGapMs: 1500,
    maxLen: 500,
    timeoutMs: 25000
  };

  var sessionId = (function () {
    try {
      var s = localStorage.getItem("st_chat_sid");
      if (!s) {
        s = "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
        localStorage.setItem("st_chat_sid", s);
      }
      return s;
    } catch (e) {
      return "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }
  })();

  var css = [
    "#stc-btn{position:fixed;right:16px;top:var(--stc-top,80px);width:56px;height:56px;border-radius:50%;border:none;background:#d4af37;color:#0d2427;cursor:pointer;z-index:99999;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.35)}",
    "#stc-btn:focus-visible,#stc-send:focus-visible,#stc-x:focus-visible{outline:2px solid #f1e6c0;outline-offset:2px}",
    "#stc-panel{position:fixed;right:16px;top:calc(var(--stc-top,80px) + 68px);width:min(360px,calc(100vw - 32px));height:min(520px,calc(100vh - var(--stc-top,80px) - 90px));background:#0d2427;border:1px solid #1f4a4f;border-radius:14px;overflow:hidden;z-index:99999;display:none;flex-direction:column;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.45)}",
    "#stc-panel.open{display:flex}",
    "#stc-head{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#123136;border-bottom:1px solid #1f4a4f}",
    "#stc-logo{width:34px;height:34px;border-radius:50%;background:#d4af37;color:#0d2427;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px}",
    "#stc-title{flex:1;line-height:1.25}",
    "#stc-title b{display:block;color:#f1e6c0;font-size:14px;font-weight:600}",
    "#stc-title span{color:#8fb5b3;font-size:12px}",
    "#stc-x{background:none;border:none;color:#8fb5b3;font-size:22px;cursor:pointer;line-height:1;padding:4px 8px}",
    "#stc-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}",
    ".stc-m{max-width:82%;padding:8px 12px;border-radius:14px;font-size:14px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}",
    ".stc-bot{align-self:flex-start;background:#1a3d42;color:#e8f1f0;border-bottom-left-radius:4px}",
    ".stc-user{align-self:flex-end;background:#d4af37;color:#1b1b10;border-bottom-right-radius:4px}",
    ".stc-wa{align-self:flex-start;background:#25a35a;color:#fff;text-decoration:none;border-radius:14px;padding:8px 14px;font-size:13px;font-weight:600}",
    "#stc-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 10px}",
    ".stc-chip{background:transparent;border:1px solid #d4af37;color:#e9d48a;border-radius:16px;font-size:12px;padding:5px 11px;cursor:pointer}",
    "#stc-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #1f4a4f;background:#123136}",
    "#stc-in{flex:1;min-width:0;background:#0d2427;border:1px solid #1f4a4f;color:#e8f1f0;border-radius:18px;padding:8px 14px;font-size:14px}",
    "#stc-in:focus{outline:none;border-color:#d4af37}",
    "#stc-send{width:38px;height:38px;border-radius:50%;border:none;background:#d4af37;color:#0d2427;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}",
    ".stc-ms{background:#0084ff}",
    ".stc-img{align-self:flex-start;max-width:70%;border-radius:12px;border:1px solid #1f4a4f}",
    ".stc-btns{align-self:flex-start;display:flex;flex-wrap:wrap;gap:6px}",
    "@media (prefers-reduced-motion:no-preference){#stc-panel.open{animation:stcUp .18s ease-out}@keyframes stcUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}}"
  ].join("");

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  document.documentElement.style.setProperty("--stc-top", CONFIG.topOffset + "px");

  var root = document.createElement("div");
  root.innerHTML =
    '<button id="stc-btn" aria-label="Open chat"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>' +
    '<div id="stc-panel" role="dialog" aria-label="Chat with ' + CONFIG.shopName + '">' +
      '<div id="stc-head"><div id="stc-logo">ST</div><div id="stc-title"><b></b><span></span></div><button id="stc-x" aria-label="Close chat">&times;</button></div>' +
      '<div id="stc-msgs" aria-live="polite"></div>' +
      '<div id="stc-chips"></div>' +
      '<form id="stc-form"><input id="stc-in" type="text" autocomplete="off" maxlength="' + CONFIG.maxLen + '" placeholder="Type a message" aria-label="Message" />' +
      '<button id="stc-send" type="submit" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></form>' +
    '</div>';
  document.body.appendChild(root);

  var $ = function (id) { return document.getElementById(id); };
  $("stc-title").querySelector("b").textContent = CONFIG.shopName;
  $("stc-title").querySelector("span").textContent = CONFIG.tagline;

  var panel = $("stc-panel"), msgs = $("stc-msgs"), input = $("stc-in");
  var busy = false, lastSent = 0, greeted = false;

  function addMsg(text, who) {
    var d = document.createElement("div");
    d.className = "stc-m " + (who === "user" ? "stc-user" : "stc-bot");
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function addWhatsApp(prefill) {
    var a = document.createElement("a");
    a.className = "stc-wa";
    a.target = "_blank";
    a.rel = "noopener";
    a.href = "https://wa.me/" + CONFIG.whatsappNumber + "?text=" + encodeURIComponent(prefill || "Hi, I want to order from " + CONFIG.shopName);
    a.textContent = "Chat on WhatsApp";
    a.addEventListener("click", function () { if (window.fbq) fbq("track", "Lead"); });
    msgs.appendChild(a);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addMessenger() {
    var a = document.createElement("a");
    a.className = "stc-wa stc-ms";
    a.target = "_blank";
    a.rel = "noopener";
    a.href = CONFIG.messengerUrl;
    a.textContent = "Chat on Messenger";
    a.addEventListener("click", function () { if (window.fbq) fbq("track", "Lead"); });
    msgs.appendChild(a);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addImage(url) {
    var img = document.createElement("img");
    img.className = "stc-img";
    img.alt = "Product photo";
    img.addEventListener("load", function () { msgs.scrollTop = msgs.scrollHeight; });
    img.src = url;
    msgs.appendChild(img);
  }

  function clearButtons() {
    var old = msgs.querySelectorAll(".stc-btns");
    for (var i = 0; i < old.length; i++) old[i].remove();
  }

  function addButtons(list) {
    var wrap = document.createElement("div");
    wrap.className = "stc-btns";
    list.slice(0, 6).forEach(function (label) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "stc-chip";
      b.textContent = String(label);
      b.addEventListener("click", function () { send(String(label)); });
      wrap.appendChild(b);
    });
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function toggle(open) {
    panel.classList.toggle("open", open);
    if (open) {
      if (!greeted) { addMsg(CONFIG.greeting, "bot"); greeted = true; }
      input.focus();
    }
  }

  CONFIG.quickReplies.forEach(function (q) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "stc-chip";
    b.textContent = q;
    b.addEventListener("click", function () { send(q); });
    $("stc-chips").appendChild(b);
  });

  function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    var now = Date.now();
    if (now - lastSent < CONFIG.minGapMs) return;
    lastSent = now;
    busy = true;
    addMsg(text.slice(0, CONFIG.maxLen), "user");
    input.value = "";
    $("stc-chips").style.display = "none";
    clearButtons();
    var typing = addMsg("...", "bot");

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, CONFIG.timeoutMs);

    fetch(CONFIG.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId, message: text.slice(0, CONFIG.maxLen), page: location.pathname }),
      signal: ctrl.signal
    })
      .then(function (r) {
        if (!r.ok) throw new Error("bad status");
        return r.json();
      })
      .then(function (data) {
        var reply = String(data.reply || "").trim();
        var handoff = reply.indexOf("[[WHATSAPP]]") !== -1;
        reply = reply.replace("[[WHATSAPP]]", "").trim();
        typing.textContent = reply || "Sorry, I couldn\u2019t get that. Try again or message us on WhatsApp.";
        if (data.image) addImage(String(data.image));
        if (handoff || data.whatsapp) { addWhatsApp(data.whatsappText); addMessenger(); }
        if (Array.isArray(data.buttons) && data.buttons.length) addButtons(data.buttons);
      })
      .catch(function () {
        typing.textContent = "Couldn\u2019t reach the assistant right now. Message us on WhatsApp or Messenger instead.";
        addWhatsApp();
        addMessenger();
      })
      .finally(function () {
        clearTimeout(timer);
        busy = false;
        msgs.scrollTop = msgs.scrollHeight;
      });
  }

  $("stc-btn").addEventListener("click", function () { toggle(!panel.classList.contains("open")); });
  $("stc-x").addEventListener("click", function () { toggle(false); });
  $("stc-form").addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });
})();
