const messagesEl = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");

let history = [];

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role === "user" ? "user" : "bot"}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addMessage("user", text);

  // Append to local history in Gemini-compatible shape
  history.push({ role: "user", parts: [{ text }] });

  const btn = document.getElementById("send");
  const prev = btn.textContent;
  btn.textContent = "Sending...";
  btn.disabled = true;

  try {
    const res = await fetch("/api/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data?.error || "Request failed");

    const reply = data.reply || "";
    addMessage("assistant", reply);

    history.push({ role: "model", parts: [{ text: reply }] });
  } catch (err) {
    addMessage("assistant", `Error: ${String(err)}`);
  } finally {
    btn.textContent = prev;
    btn.disabled = false;
    input.focus();
  }
});

// Greeting message
addMessage("assistant", "Hello! Ask me to edit, explain, or generate code. I use your Gemini backend at /api/edit.");
