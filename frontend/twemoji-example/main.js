// Minimal example client that connects to WebSocket server and renders messages using Twemoji
(function(){
  const WS_URL = (location.hostname === 'localhost') ? 'ws://localhost:8080' : (location.origin.replace(/^http/, 'ws'));
  const messagesEl = document.getElementById('messages');
  const textEl = document.getElementById('text');
  const sendBtn = document.getElementById('send');

  // Safe append helper
  function appendMessage(html, isMe=false) {
    const div = document.createElement('div');
    div.className = 'msg' + (isMe ? ' me' : '');
    div.innerHTML = html;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    // Parse and replace Unicode emoji with Twemoji images
    if (window.twemoji && typeof window.twemoji.parse === 'function') {
      window.twemoji.parse(div, { folder: 'svg', ext: '.svg' });
    }
  }

  // Simple shortcode -> Unicode replacement map for demo (extendable)
  const shortcodes = {
    ':smile:': '😄',
    ':thumbsup:': '👍',
    ':party:': '🎉'
  };

  function expandShortcodes(text){
    return text.replace(/:\w+?:/g, (s)=> shortcodes[s] || s);
  }

  // Create WS connection
  let ws;
  try {
    ws = new WebSocket(WS_URL.replace(/\/$/, ''));
  } catch(e){
    appendMessage('<div class="meta">Failed to open WebSocket: '+String(e)+'</div>');
  }

  if (ws) {
    ws.addEventListener('open', ()=> appendMessage('<div class="meta">Connected to '+WS_URL+'</div>'));
    ws.addEventListener('close', ()=> appendMessage('<div class="meta">Disconnected</div>'));
    ws.addEventListener('error', (e)=> appendMessage('<div class="meta">WS error</div>'));

    ws.addEventListener('message', (ev)=>{
      let text = ev.data;
      // If server sends JSON with {type:'MESSAGE', text: '...' } handle accordingly
      try {
        const parsed = JSON.parse(ev.data);
        if (parsed && parsed.type === 'MESSAGE' && parsed.text) {
          text = parsed.text;
        }
      } catch(_){}

      // Escape to avoid HTML injection
      const escaped = text.replace(/[&<>\"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
      // Expand simple shortcodes, then append
      appendMessage('<div>' + expandShortcodes(escaped) + '</div>');
    });
  }

  sendBtn.addEventListener('click', ()=>{
    const raw = textEl.value || '';
    if (!raw) return;
    const expanded = expandShortcodes(raw);
    // Send raw text to server (application protocol may differ) as JSON message for many servers
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'CHAT_MESSAGE', text: raw }));
      }
    } catch(e){ console.error(e); }

    // Show locally
    const escaped = expanded.replace(/[&<>\"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    appendMessage('<div>' + escaped + '</div>', true);
    textEl.value = '';
  });
})();
