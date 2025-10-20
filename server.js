// Minimal local server for chat participant testing
const express = require('express');

const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Gemini Code Agent local server is running');
});

// Expected by extension.js handleChatRequest()
app.post('/api/edit', (req, res) => {
  const { message = '', history = [] } = req.body || {};

  // Simple mock reply that echoes the question and context
  const reply = [
    '✅ Local server received your request.',
    history.length ? `History length: ${history.length}` : undefined,
    message ? `Message: ${message.substring(0, 200)}${message.length > 200 ? '…' : ''}` : 'No message provided.'
  ].filter(Boolean).join('\n\n');

  res.json({ reply });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Gemini Code Agent local server listening on http://localhost:${PORT}`);
});
