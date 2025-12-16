(function () {

    /* ===============================
       CONFIG
    =============================== */
    const scriptTag = document.currentScript;
    const BUSINESS_ID = scriptTag.getAttribute("data-business-id");
    const API_BASE = "http://localhost:3000";

    if (!BUSINESS_ID) {
        console.error("ANSWERO: Missing data-business-id");
        return;
    }

    /* ===============================
       INJECT STYLES
    =============================== */
    const style = document.createElement("style");
    style.innerHTML = `
        .answero-container {
            max-width: 520px;
            margin: 40px auto;
            padding: 0 16px;
            font-family: Inter, Arial, sans-serif;
        }

        .answero-search {
            display: flex;
            align-items: center;
            background: #fff;
            border-radius: 999px;
            box-shadow: 0 10px 30px rgba(124, 58, 237, 0.18);
            padding: 6px;
        }

        .answero-search input {
            flex: 1;
            border: none;
            padding: 16px 18px;
            font-size: 15px;
            outline: none;
            background: transparent;
        }

        .answero-search button {
            background: #7c3aed;
            color: white;
            border: none;
            padding: 14px 30px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            border-radius: 999px;
            margin-left: 6px;
        }

        .answero-search button:hover {
            background: #5b21b6;
        }

        #answero-answer-wrapper {
            background: white;
            margin-top: 18px;
            padding: 22px;
            border-radius: 18px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
            line-height: 1.6;
            font-size: 15px;
            display: none;
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
            0%, 80%, 100% { transform: scale(0); opacity: .5; }
            40% { transform: scale(1); opacity: 1; }
        }

        .answero-fallback input {
            width: 100%;
            padding: 10px;
            margin-top: 8px;
        }

        .answero-fallback button {
            margin-top: 10px;
            padding: 10px 16px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    /* ===============================
       INJECT HTML
    =============================== */
    const container = document.createElement("div");
    container.className = "answero-container";

    container.innerHTML = `
        <div class="answero-search">
            <input 
                type="text" 
                placeholder="ASK A QUESTION ABOUT THIS BUSINESS..."
                id="answero-input"
            >
            <button id="answero-ask">Ask</button>
        </div>

        <div id="answero-answer-wrapper">
            <div class="thinking" id="answero-thinking">
                <span></span><span></span><span></span>
            </div>
            <div id="answero-answer"></div>
        </div>
    `;

    scriptTag.parentNode.insertBefore(container, scriptTag);

    /* ===============================
       LOGIC
    =============================== */
    const input = container.querySelector("#answero-input");
    const askBtn = container.querySelector("#answero-ask");
    const answerWrap = container.querySelector("#answero-answer-wrapper");
    const thinking = container.querySelector("#answero-thinking");
    const answerBox = container.querySelector("#answero-answer");

    askBtn.addEventListener("click", ask);
    input.addEventListener("keypress", e => {
        if (e.key === "Enter") ask();
    });

    async function ask() {
        const question = input.value.trim();
        if (!question) return;

        input.value = "";
        answerBox.innerHTML = "";
        thinking.style.display = "flex";
        answerWrap.style.display = "block";

        try {
            const response = await fetch(`${API_BASE}/api/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessId: BUSINESS_ID,
                    question
                })
            });

            const data = await response.json();
            thinking.style.display = "none";

            if (data.fallback) {
                answerBox.innerHTML = `
                    <div class="answero-fallback">
                        <p>We couldn’t find an answer. Leave your email and the business will get back to you.</p>
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

            } else {
                answerBox.innerHTML = data.answer;
            }

        } catch (err) {
            thinking.style.display = "none";
            answerBox.innerHTML = "Something went wrong. Please try again.";
        }
    }

})();

