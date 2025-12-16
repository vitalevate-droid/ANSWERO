(function () {

    const scriptTag = document.currentScript;
    const BUSINESS_ID = scriptTag.getAttribute("data-business-id");
    const API_BASE = "https://answero.onrender.com";

    if (!BUSINESS_ID) return;

    /* ===============================
       STYLES
    =============================== */
    const style = document.createElement("style");
    style.innerHTML = `
        .answero-wrapper {
            display: flex;
            justify-content: center;
            width: 100%;
        }

        .answero-container {
            max-width: 520px;
            width: 100%;
            margin: 40px 0;
            font-family: Arial, sans-serif;
            position: relative;
        }

        /* INFO BUTTON */
        .answero-info-btn {
            position: absolute;
            top: -18px;
            right: 6px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 1px solid #ccc;
            background: #fff;
            color: #7c3aed;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .answero-info-btn:hover {
            background: #f5f3ff;
        }

        /* SEARCH */
        .answero-search {
            display: flex;
            background: #fff;
            border-radius: 999px;
            padding: 6px;
            box-shadow: 0 10px 30px rgba(124,58,237,.18);
        }

        .answero-search input {
            flex: 1;
            border: none;
            padding: 14px 16px;
            font-size: 14px;
            outline: none;
        }

        .answero-search button {
            background: #7c3aed;
            color: #fff;
            border: none;
            border-radius: 999px;
            padding: 10px 20px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
        }

        #answero-answer {
            background: #fff;
            margin-top: 16px;
            padding: 22px;
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(0,0,0,.1);
            line-height: 1.5;
        }

        .thinking {
            display: flex;
            justify-content: center;
            gap: 8px;
        }

        .thinking span {
            width: 10px;
            height: 10px;
            background: #7c3aed;
            border-radius: 50%;
            animation: pulse 1.4s infinite ease-in-out both;
        }

        @keyframes pulse {
            0%,80%,100%{transform:scale(0)}
            40%{transform:scale(1)}
        }

        .answero-branding {
            margin-top: 14px;
            text-align: center;
            font-size: 11px;
            color: #888;
        }

        .answero-branding span {
            color: #7c3aed;
            font-weight: 700;
        }

        /* MODAL */
        .answero-modal {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,.45);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }

        .answero-modal-content {
            background: #fff;
            max-width: 520px;
            padding: 26px;
            border-radius: 16px;
        }

        .answero-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
        }

        .answero-tab {
            flex: 1;
            text-align: center;
            padding: 10px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 8px;
            background: #f3f3f3;
            cursor: pointer;
            color: #555;
        }

        .answero-tab.active {
            background: #ede9fe;
            color: #7c3aed;
        }

        .answero-close {
            text-align: right;
            font-size: 13px;
            color: #666;
            cursor: pointer;
        }

        .answero-fallback input {
            width: 100%;
            padding: 12px;
            margin-top: 12px;
            border-radius: 8px;
            border: 1px solid #ddd;
        }

        .answero-fallback button {
            margin-top: 12px;
            padding: 12px;
            width: 100%;
            border-radius: 999px;
            border: none;
            background: #7c3aed;
            color: white;
            font-weight: 600;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    /* ===============================
       HTML
    =============================== */
    const wrapper = document.createElement("div");
    wrapper.className = "answero-wrapper";

    const container = document.createElement("div");
    container.className = "answero-container";

    container.innerHTML = `
        <div class="answero-info-btn" id="answero-info">i</div>

        <div class="answero-search">
            <input id="answero-input" placeholder="ASK A QUESTION ABOUT THIS BUSINESS..." />
            <button id="answero-ask">Ask</button>
        </div>

        <div id="answero-answer" style="display:none"></div>

        <div class="answero-branding">
            Powered by <span>ANSWERO</span>
        </div>
    `;

    const modal = document.createElement("div");
    modal.className = "answero-modal";
    modal.innerHTML = `
        <div class="answero-modal-content">
            <div class="answero-close" id="answero-close">Close ✕</div>

            <div class="answero-tabs">
                <div class="answero-tab active" data-tab="legal">Information & Data Protection</div>
                <div class="answero-tab" data-tab="ai">AI-Generated Responses</div>
            </div>

            <div id="legal">
                <p>We comply with South Africa’s POPIA. Email addresses are used strictly to forward enquiries to the business and are not stored or reused.</p>
            </div>

            <div id="ai" style="display:none">
                <p>Responses are generated by a specialised AI system configured exclusively for this business and constrained to its provided information.</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    wrapper.appendChild(container);
    scriptTag.parentNode.insertBefore(wrapper, scriptTag);

    modal.querySelectorAll(".answero-tab").forEach(tab => {
        tab.onclick = () => {
            modal.querySelectorAll(".answero-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            modal.querySelector("#legal").style.display = tab.dataset.tab === "legal" ? "block" : "none";
            modal.querySelector("#ai").style.display = tab.dataset.tab === "ai" ? "block" : "none";
        };
    });

    document.getElementById("answero-info").onclick = () => modal.style.display = "flex";
    document.getElementById("answero-close").onclick = () => modal.style.display = "none";

    const input = container.querySelector("#answero-input");
    const answerBox = container.querySelector("#answero-answer");

    container.querySelector("#answero-ask").onclick = async () => {
        const q = input.value.trim();
        if (!q) return;

        input.value = "";
        answerBox.style.display = "block";
        answerBox.innerHTML = `<div class="thinking"><span></span><span></span><span></span></div>`;

        const r = await fetch(`${API_BASE}/api/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId: BUSINESS_ID, question: q })
        });

        const d = await r.json();

        if (d.fallback) {
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
                answerBox.innerHTML = "Thank you. The business will contact you.";
            };
        } else {
            answerBox.innerHTML = d.answer || "Something went wrong.";
        }
    };

})();
