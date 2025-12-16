const input = document.getElementById("answero-input");
const askBtn = document.getElementById("answero-ask-btn");
const answerWrapper = document.getElementById("answero-answer-wrapper");
const thinking = document.getElementById("answero-thinking");
const answerBox = document.getElementById("answero-answer");

askBtn.addEventListener("click", askQuestion);
input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") askQuestion();
});

function askQuestion() {
    const question = input.value.trim();
    if (!question) return;

    // Reset UI
    input.value = "";
    answerBox.innerHTML = "";
    answerWrapper.classList.remove("hidden");
    thinking.style.display = "flex";

    // TEMP: Simulated AI response
    setTimeout(() => {
        thinking.style.display = "none";
        answerBox.innerHTML =
            "This is where ANSWERO will display an AI-generated answer based strictly on the business information.";
    }, 1800);
}
