(function () {

    const scriptTag = document.currentScript;
    const BUSINESS_ID = scriptTag.getAttribute("data-business-id");

    const API_BASE = "https://answero.onrender.com";

    if (!BUSINESS_ID) {
        console.error("ANSWERO: Missing data-business-id");
        return;
    }

    /* ===============================
       STYLES
    =============================== */
    const style = document.createElement("style");
    style.innerHTML = `
        .answero-wrapper {
            display: flex;
            justify-content: center;
            width: 100%;
            position: relative;
        }

        .answero-container {
            max-width: 520px;
            width: 100%;
            margin: 40px 0;
            font-family: Arial, sans-serif;
            position: relative;
        }

        .answero-info-btn {
            position: absolute;
            top: -18px;
            right: 6px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 1px solid #7c3aed;
            background: #7c3aed;
            color: #fff;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

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
            color: white;
            border: none;
            border-radius: 999px;
            padding: 11px 22px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
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
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }

        .answero-branding {
            margin-top: 14px;
            text-align: center;
            font-size: 11px;
            color: #888;
            letter-spacing: 0.4px;
        }

        .answero-branding span {
            font-weight: 700;
            color: #7c3aed;
        }

        /* FALLBACK */
        .answero-fallback input {
            width: 100%;
            padding: 12px;
            margin-top: 12px;
            border-radius: 8px;
            border: 1px solid #ddd;
            font-size: 14px;
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

        /* MODAL */
        .answero-modal {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
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
            font-size: 14px;
            line-height: 1.6;
        }

        .answero-tabs {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
        }

        .answero-tab {
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            color: #777;
        }

        .answero-tab.active {
            color: #7c3aed;
        }

        .answero-close {
            text-align: right;
            font-size: 13px;
            cursor: pointer;
            color: #666;
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
                <p>
                    This service operates in accordance with South Africa’s
                    Protection of Personal Information Act (POPIA).
                    Email addresses are used strictly to forward customer enquiries
                    to the relevant business.
                </p>
                <p>
                    No personal data is retained, reused, or shared beyond the
                    purpose of facilitating a direct response from the business.
                </p>
            </div>

            <div id="ai" style="display:none">
                <p>
                    Responses are generated using a specialised artificial intelligence
                    system configured exclusively for this business.
                </p>
                <p>
                    The system is constrained to business-provided information and
                    is designed to defer to the business where certainty cannot
                    be confidently established.
                </p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    wrapper.appendChild(container);
    scriptTag.parentNode.insertBefore(wrapper, scriptTag);

    /* TAB LOGIC */
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
    const askBtn = container.querySelector("#answero-ask");
    const answerBox = container.querySelector("#answero-answer");

    askBtn.onclick = async () => {
        const question = input.value.trim();
        if (!question) return;

        input.value = "";
        answerBox.style.display = "block";
        answerBox.innerHTML = `<div class="thinking"><span></span><span></span><span></span></div>`;

        const res = await fetch(`${API_BASE}/api/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId: BUSINESS_ID, question })
        });

        const data = await res.json();

        if (data.fallback) {
            answerBox.innerHTML = `
                <div class="answero-fallback">
                    <p><strong>We couldn’t confidently answer this.</strong></p>
                    <p style="font-size:13px;color:#666;">
                        Enter your email and the business will respond directly.
                    </p>
                    <input id="answero-email" placeholder="Your email">
                    <button id="answero-send">Send</button>
                </div>
            `;

            container.querySelector("#answero-send").onclick = async () => {
                const email = container.querySelector("#answero-email").value;

                await fetch(`${API_BASE}/api/fallback`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ businessId: BUSINESS_ID, email, question })
                });

                answerBox.innerHTML = "Thank you. The business will contact you shortly.";
            };

        } else if (data.answer) {
            answerBox.innerHTML = data.answer;
        } else {
            answerBox.innerHTML = "Something went wrong. Please try again.";
        }
    };

})();
