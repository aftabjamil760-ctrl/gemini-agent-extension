// extension.js (CommonJS)
const vscode = require('vscode');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const API_URL = 'http://localhost:4000/api/edit';

function activate(context) {
  console.log('Gemini Code Agent is now active!');

  const disposable = vscode.commands.registerCommand(
    'gemini-agent.refactorCode',
    async function () {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('No active editor found.');
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        vscode.window.showErrorMessage('GEMINI_API_KEY is not set. Configure it in your launch config or settings.');
        return;
      }

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = 'gemini-2.5-flash';

      const document = editor.document;
      const selection = editor.selection;
      const textToRefactor = document.getText(selection.isEmpty ? undefined : selection);

      if (!textToRefactor.trim()) {
        vscode.window.showInformationMessage('No code selected or file is empty.');
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Gemini is refactoring your code...',
          cancellable: false
        },
        async () => {
          try {
            const prompt = `
You are a Code Refactoring AI. Review the following code snippet (language: ${document.languageId}).
Refactor it to be cleaner, modern, and efficient. Do not add commentary; return code only.

--- CODE TO REFACTOR ---
${textToRefactor}
---
            `.trim();

            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            let newCode = result.response.text().trim();

            // Remove markdown fences if present
            newCode = newCode.replace(/^```[a-zA-Z0-9_-]*\n?/i, '').replace(/\n?```$/i, '');

            await editor.edit(editBuilder => {
              if (selection.isEmpty) {
                const fullRange = new vscode.Range(
                  document.positionAt(0),
                  document.positionAt(document.getText().length)
                );
                editBuilder.replace(fullRange, newCode);
              } else {
                editBuilder.replace(selection, newCode);
              }
            });

            vscode.window.showInformationMessage('Refactoring complete!');
          } catch (error) {
            console.error('Gemini API Error:', error);
            const msg = (error && error.message) ? error.message : String(error);
            vscode.window.showErrorMessage(`Gemini Agent Error: ${msg}`);
          }
        }
      );
    }
  );

  const participant = vscode.chat.createChatParticipant(
    'gemini.chatParticipant',
    (request, chatContext, stream, token) => {
      return handleChatRequest(request, stream);
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(participant);
}

function deactivate() {}

async function handleChatRequest(request, stream) {
  try {
    const editor = vscode.window.activeTextEditor;
    let contextMessage = "";
    if (editor) {
      contextMessage = `User is currently viewing a ${editor.document.languageId} file.`;
    }

    const payload = {
      message: `${contextMessage}\n\nUser Question: ${request.prompt}`,
      history: []
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    const replyText = data.reply || 'An error occurred fetching the reply.';
    stream.markdown(replyText);
  } catch (error) {
    console.error('Chat Agent Error:', error);
    stream.markdown(`❌ **Error:** Could not connect to the Gemini Agent server. Is \`npm start\` running? (${error.message})`);
  }
}

module.exports = {
  activate,
  deactivate
};
