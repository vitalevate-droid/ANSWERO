(function () {

  const scriptTag = document.currentScript;
  const BUSINESS_ID = scriptTag.getAttribute("data-business-id");
  const API_BASE = "https://answero.onrender.com";
  if (!BUSINESS_ID) return;

  /* ================= STYLES ================= */
  const style = document.createElement("style");
  style.innerHTML = `
    .answero-wrapper{display:flex;justify-content:center;width:100%}
    .answero-container{max-width:520px;width:100%;margin:36px 0;font-family:Arial,sans-serif;position:relative}

    .answero-info-btn{
      position:absolute;top:-14px;right:4px;
      width:18px;height:18px;border-radius:50%;
      border:1.5px solid #999;background:#fff;
      color:#7c3aed;font-size:11px;font-weight:700;
      display:flex;align-items:center;justify-content:center;
      line-height:1;cursor:pointer
    }

    .answero-search{
      display:flex;background:#fff;border-radius:999px;padding:6px;
      box-shadow:0 10px 28px rgba(124,58,237,.18)
    }

    .answero-search input{
      flex:1;border:none;padding:14px 16px;font-size:14px;outline:none
    }

    .answero-search button{
      background:#7c3aed;color:#fff;border:none;border-radius:999px;
      padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer
    }

    #answero-answer{
      background:#fff;margin-top:16px;padding:22px;border-radius:18px;
      box-shadow:0 8px 22px rgba(0,0,0,.1);line-height:1.6
    }

    .thinking{display:flex;justify-content:center;gap:8px}
    .thinking span{width:9px;height:9px;background:#7c3aed;border-radius:50%;animation:pulse 1.4s infinite}
    @keyframes pulse{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}

    .answero-fallback input{
      width:100%;padding:12px;margin-top:12px;border-radius:10px;border:1px solid #ddd
    }
    .answero-fallback button{
      margin-top:12px;width:100%;padding:12px;border-radius:999px;
      background:#7c3aed;border:none;color:#fff;font-weight:600;cursor:pointer
    }

    .answero-branding{
      margin-top:18px;text-align:center;
      font-size:11px;color:#555;letter-spacing:.8px
    }
    .answero-branding span{
      color:#7c3aed;font-weight:900;
      text-transform:uppercase;letter-spacing:1.2px
    }
  `;
  document.head.appendChild(style);

  /* ================= HTML ================= */
  const wrapper = document.createElement("div");
  wrapper.className = "answero-wrapper";

  const container = document.createElement("div");
  container.className = "answero-container";

  container.innerHTML = `
    <div class="answero-search">
      <input id="answero-input" placeholder="Ask a question about this business…" />
      <button id="answero-ask">Ask</button>
    </div>
    <div id="answero-answer" style="display:none"></div>
    <div class="answero-branding">Powered by <span>ANSWERO</span></div>
  `;

  wrapper.appendChild(container);
  scriptTag.parentNode.insertBefore(wrapper, scriptTag);

  /* ================= LOGIC ================= */
  const input = container.querySelector("#answero-input");
  const answerBox = container.querySelector("#answero-answer");

  async function ask() {
    const q = input.value.trim();
    if (!q) return;

    input.value = "";
    answerBox.style.display = "block";
    answerBox.innerHTML =
      `<div class="thinking"><span></span><span></span><span></span></div>`;

    const res = await fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: BUSINESS_ID, question: q })
    });

    const data = await res.json();

    const answerText = (data.answer || "").toString().trim();
    const isFallback =
      data.fallback === true ||
      answerText.toLowerCase().includes("fallback_required");

    if (isFallback) {
      answerBox.innerHTML = `
        <div class="answero-fallback">
          <p><strong>We couldn’t confidently answer this.</strong></p>
          <input id="answero-email" placeholder="Your email">
          <button id="answero-send">Send</button>
        </div>
      `;

      container.querySelector("#answero-send").onclick = async () => {
        await fetch(`${API_BASE}/api/fallback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: BUSINESS_ID,
            email: container.querySelector("#answero-email").value,
            question: q
          })
        });

        answerBox.innerHTML =
          "Thank you. The business will contact you.";
      };

    } else {
      answerBox.innerHTML = answerText || "Something went wrong.";
    }
  }

  container.querySelector("#answero-ask").onclick = ask;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") ask();
  });

})();
