(function () {

    const scriptTag = document.currentScript;
    const BUSINESS_ID = scriptTag.getAttribute("data-business-id");

    const API_BASE = "https://YOUR_RENDER_URL.onrender.com";

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
            border: 1px solid #ccc;
            background: #fff;
            color: #666;
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
            padding: 16px;
            font-size: 15px;
            outline: none;
        }

        .answero-search button {
            background: #7c3aed;
            color: white;
            border: none;
            border-radius: 999px;
            padding: 14px 28px;
            cursor: pointer;
            font-weight: 600;
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

        .answero-modal h3 {
            margin-top: 0;
            color: #5b21b6;
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

            <h3>Information & Data Protection</h3>
            <p>
                This service operates in accordance with South Africa’s
                Protection of Personal Information Act (POPIA).
                When an email address is provided, it is used solely to forward
                the customer’s enquiry to the relevant business.
            </p>
            <p>
                No personal data is stored for marketing purposes, shared with
                third parties, or reused beyond the specific enquiry.
            </p>

            <h3>AI-Generated Responses</h3>
            <p>
                Responses are generated using an advanced artificial intelligence
                system configured specifically for this business.
                The system is constrained to the information supplied by the business
                and is designed to provide accurate, relevant guidance where possible.
            </p>
            <p>
                Where sufficient certainty cannot be established, the system
                intentionally defers the enquiry to the business directly to
                ensure clarity, accuracy, and accountability.
            </p>
        </div>
    `;
    document.body.appendChild(modal);

    wrapper.appendChild(container);
    scriptTag.parentNode.insertBefore(wrapper, scriptTag);

    const input = container.querySelector("#answero-input");
    const askBtn = container.querySelector("#answero-ask");
    const answerBox = container.querySelector("#answero-answer");

    document.getElementById("answero-info").onclick = () => modal.style.display = "flex";
    document.getElementById("answero-close").onclick = () => modal.style.display = "none";

    askBtn.onclick = ask;

    async function ask() {
        const question = input.value.trim();
        if (!question) return;

        input.value = "";
        answerBox.style.display = "block";
        answerBox.innerHTML = `
            <div class="thinking">
                <span></span><span></span><span></span>
            </div>
        `;

        const res = await fetch(`${API_BASE}/api/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId: BUSINESS_ID, question })
        });

        const data = await res.json();

        if (data.fallback) {
            answerBox.innerHTML = "Please leave your email so the business can respond directly.";
        } else if (data.answer) {
            answerBox.innerHTML = data.answer;
        } else {
            answerBox.innerHTML = "Something went wrong. Please try again.";
        }
    }

})();

