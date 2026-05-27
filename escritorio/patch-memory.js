const fs = require('fs');
const file = '/var/www/starken-os/escritorio/src/server/socket-handlers.ts';
let content = fs.readFileSync(file, 'utf8');

const target1 = 'history.push({ role: "player", content: trimmed, timestamp: Date.now() });';
const inject1 = `
        history.push({ role: "player", content: trimmed, timestamp: Date.now() });
        
        const recentHistory = history.slice(-10);
        const historyString = recentHistory.map(h => \`\${h.role === 'player' ? 'Cliente' : 'Você'}: \${h.content}\`).join('\\n');
        const contextInjection = \`[Contexto recente da conversa]:\\n\${historyString}\\n\\n[Mensagem atual do cliente]:\\n\`;
`;
content = content.replace(target1, inject1);

const target2 = 'const messageToSend = withTaskReminder(trimmed + fileSection, getSocketLocale(socket));';
const inject2 = 'const messageToSend = withTaskReminder(contextInjection + trimmed + fileSection, getSocketLocale(socket));';
content = content.replace(target2, inject2);

fs.writeFileSync(file, content);
console.log("Memory injection applied successfully!");
