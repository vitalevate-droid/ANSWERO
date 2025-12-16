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
            margin: 40px auto;
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
        }

        .answero-search button:hover {
            background: #5b21b6;
        }

        #answero-answer {
            background: #fff;
            margin-top: 16px;
            padding: 20px;
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(0,0,0,.1);
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

        try {
            const res = await fetch(`${API_BASE}/api/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessId: BUSINESS_ID, question })
            });

            const data = await res.json();

            if (data.fallback) {
                answerBox.innerHTML = `
                    <p>We couldn’t find an answer. Leave your email:</p>
                    <input id="answero-email" style="width:100%;padding:10px">
                    <button id="answero-send">Send</button>
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

                    answerBox.innerHTML = "Thanks! The business will contact you.";
                };

            } else {
                answerBox.innerHTML = data.answer;
            }

        } catch (err) {
            answerBox.innerHTML = "Something went wrong. Please try again.";
        }
    }

})();
