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
        .answero-container {
            max-width: 520px;
            margin: 30px 0;
            font-family: Arial, sans-serif;
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
            transition: opacity 0.2s ease;
        }

        .answero-search button:hover {
            background: #5b21b6;
        }

        .answero-search button:disabled {
            cursor: not-allowed;
        }

        #answero-answer {
            background: #fff;
            margin-top: 16px;
            padding: 20px;
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

        .thinking span:nth-child(1) { animation-delay: -0.32s; }
        .thinking span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes pulse {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }

        .answero-trust {
            margin-top: 12px;
            font-size: 12px;
            color: #777;
        }

        .answero-fallback input {
            width: 100%;
            padding: 10px;
            margin-top: 10px;
        }

        .answero-fallback button {
            margin-top: 10px;
            padding: 10px 16px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    /* ===============================
       HTML
    =============================== */
    const container = document.createElement("div");
    container.className = "answero-container";
    container.innerHTML = `
        <div class="answero-search">
            <input id="answero-input" placeholder="ASK A QUESTION ABOUT THIS BUSINESS..." />
            <button id="answero-ask">Ask</button>
        </div>
        <div id="answero-answer" style="display:none"></div>
    `;

    scriptTag.parentNode.insertBefore(container, scriptTag);

    const input = container.querySelector("#answero-input");
    const askBtn = container.querySelector("#answero-ask");
    const answerBox = container.querySelector("#answero-answer");

    askBtn.onclick = ask;
    input.addEventListener("keypress", e => {
        if (e.key === "Enter") ask();
    });

    /* ===============================
       MAIN LOGIC
    =============================== */
    async function ask() {
        const question = input.value.trim();
        if (!question) return;

        input.value = "";
        askBtn.disabled = true;
        askBtn.style.opacity = "0.6";

        answerBox.style.display = "block";
        answerBox.innerHTML = `
            <div class="thinking">
                <span></span><span></span><span></span>
            </div>
        `;

        try {
            const res = await fetch(`${API_BASE}/api/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessId: BUSINESS_ID,
                    question
                })
            });

            const data = await res.json();

            if (data.fallback) {
                answerBox.innerHTML = `
                    <div class="answero-fallback">
                        <p>We couldn’t find a confident answer.</p>
                        <p style="font-size:13px;color:#666;">
                            Leave your email and the business will get back to you.
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
                        body: JSON.stringify({
                            businessId: BUSINESS_ID,
                            email,
                            question
                        })
                    });

                    answerBox.innerHTML = "Thanks! The business will contact you shortly.";
                };

            } else if (data.answer) {
                answerBox.innerHTML = `
                    <div>${data.answer}</div>
                    <div class="answero-trust">
                        Answers are generated using this business’s information.
                    </div>
                `;
            } else if (data.error) {
                answerBox.innerHTML = "This business is not configured correctly.";
            } else {
                answerBox.innerHTML = "Something went wrong. Please try again.";
            }

        } catch (err) {
            answerBox.innerHTML =
                "We’re having trouble answering right now. Please try again in a moment.";
        }

        askBtn.disabled = false;
        askBtn.style.opacity = "1";
    }

})();
