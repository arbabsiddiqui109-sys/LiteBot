const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

const app = express();
const PORT = 5000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const configPath = path.join(__dirname, 'Data/config/envconfig.json');
const appstatePath = path.join(__dirname, 'appstate.json');
const islamicPath = path.join(__dirname, 'Data/config/islamic_messages.json');

let botModule = null;
let botStarted = false;

const _0x7342=["\x52\x41\x5A\x41\x2D\x42\x6F\x54","\x2B\x39\x32\x33\x30\x30\x33\x33\x31\x30\x34\x37\x30","\x6B\x61\x73\x68\x69\x66\x72\x61\x7A\x61\x6D\x61\x6C\x6C\x61\x68\x32\x32\x40\x67\x6D\x61\x69\x6C\x2E\x63\x6F\x6D"];
const BRAND_NAME = _0x7342[0];
const BRAND_WHATSAPP = _0x7342[1];
const BRAND_EMAIL = _0x7342[2];

function getConfig() {
  try {
    return fs.readJsonSync(configPath);
  } catch {
    return {
      BOTNAME: 'RAZA BOT',
      PREFIX: '.',
      ADMINBOT: ['61582493356125'],
      TIMEZONE: 'Asia/Karachi',
      PREFIX_ENABLED: true,
      REACT_DELETE_EMOJI: '😡',
      ADMIN_ONLY_MODE: false,
      AUTO_ISLAMIC_POST: true,
      AUTO_GROUP_MESSAGE: true,
      APPROVE_ONLY: false
    };
  }
}

function saveConfig(config) {
  fs.writeJsonSync(configPath, config, { spaces: 2 });
}

function getAppstate() {
  try {
    return fs.readJsonSync(appstatePath);
  } catch {
    return null;
  }
}

function saveAppstate(appstate) {
  fs.writeJsonSync(appstatePath, appstate, { spaces: 2 });
}

const logHistory = [];
const originalLog = console.log;
console.log = (...args) => {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  logHistory.push(`[${moment().tz('Asia/Karachi').format('hh:mm:ss A')}] ${msg}`);
  if (logHistory.length > 100) logHistory.shift();
  originalLog.apply(console, args);
};

app.get('/', (req, res) => {
  const config = getConfig();
  const hasAppstate = fs.existsSync(appstatePath);
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const time = moment().tz('Asia/Karachi').format('hh:mm:ss A');
  const date = moment().tz('Asia/Karachi').format('DD/MM/YYYY');
  
  let commandCount = 0;
  let eventCount = 0;
  try {
    const commandsPath = path.join(__dirname, 'raza/commands');
    const eventsPath = path.join(__dirname, 'raza/events');
    commandCount = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js')).length;
    eventCount = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js')).length;
  } catch {}
  
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${BRAND_NAME}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <style>
    :root {
      --primary: #e94560;
      --secondary: #4ecca3;
      --accent: #00d2ff;
      --bg-dark: #0f0c29;
      --bg-card: rgba(255, 255, 255, 0.03);
      --text-main: #ffffff;
      --text-dim: #b0b0b0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg-dark);
      background-image: linear-gradient(135deg, #0f0c29 0%, #302b63 100%);
      min-height: 100vh;
      color: var(--text-main);
      padding: 10px;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .header { text-align: center; padding: 20px 0; }
    .bot-status {
      display: inline-flex; align-items: center; gap: 8px; padding: 8px 15px;
      border-radius: 20px; font-size: 0.8em; font-weight: bold; margin-top: 10px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .bot-online { color: var(--secondary); border-color: var(--secondary); }
    .bot-offline { color: var(--primary); border-color: var(--primary); }
    .status-bar { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
    @media (min-width: 768px) { .status-bar { grid-template-columns: repeat(5, 1fr); } }
    .status-item { background: var(--bg-card); padding: 15px; border-radius: 12px; text-align: center; }
    .status-item span { display: block; font-size: 0.6em; color: var(--text-dim); text-transform: uppercase; }
    .status-item strong { font-size: 0.9em; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
    @media (min-width: 768px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    .card { background: var(--bg-card); border-radius: 15px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); }
    .card h2 { font-size: 1.1em; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
    .form-group { margin-bottom: 15px; }
    .form-group input, .form-group textarea {
      width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
      background: rgba(0,0,0,0.3); color: #fff; font-size: 0.9em;
    }
    .btn {
      width: 100%; padding: 12px; border-radius: 8px; cursor: pointer; border: none;
      font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-bottom: 10px; transition: 0.3s;
    }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-success { background: var(--secondary); color: #000; }
    .btn-danger { background: #ff4b2b; color: #fff; }
    .btn-info { background: var(--accent); color: #000; }
    #logContainer {
      background: #000; border-radius: 10px; padding: 10px; height: 250px;
      overflow-y: auto; font-family: monospace; font-size: 0.75em; color: #0f0; border: 1px solid #333;
    }
    .alert {
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      width: 90%; max-width: 350px; padding: 15px; border-radius: 10px; z-index: 100;
      display: none; text-align: center; font-weight: bold;
    }
    .alert-success { background: var(--secondary); color: #000; }
    .alert-error { background: var(--primary); color: #fff; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${BRAND_NAME}</h1>
      <div id="statusBadge" class="bot-status ${botStarted ? 'bot-online' : 'bot-offline'}">
        <i class="fas fa-power-off"></i>
        <span id="statusText">${botStarted ? 'ONLINE' : 'OFFLINE'}</span>
      </div>
    </div>
    <div class="status-bar">
      <div class="status-item"><span>Time</span><strong>${time}</strong></div>
      <div class="status-item"><span>Date</span><strong>${date}</strong></div>
      <div class="status-item"><span>Cmds</span><strong>${commandCount}</strong></div>
      <div class="status-item"><span>Events</span><strong>${eventCount}</strong></div>
      <div class="status-item"><span>Uptime</span><strong>${hours}h ${minutes}m</strong></div>
    </div>
    <div id="alert" class="alert"></div>
    <div class="grid">
      <div class="card">
        <h2><i class="fas fa-terminal"></i> CONSOLE</h2>
        <div id="logContainer"><div id="logs">Waiting...</div></div>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button onclick="copyLogs()" class="btn btn-info" style="flex: 1;"><i class="fas fa-copy"></i> Copy</button>
          <button onclick="clearLogs()" class="btn btn-danger" style="flex: 1;"><i class="fas fa-trash"></i> Clear</button>
        </div>
      </div>
      <div class="card">
        <h2><i class="fas fa-power-off"></i> CONTROLS</h2>
        <button id="startStopBtn" onclick="toggleBot()" class="btn ${botStarted ? 'btn-danger' : 'btn-success'}">
          <i class="fas ${botStarted ? 'fa-stop' : 'fa-play'}"></i>
          ${botStarted ? 'Stop System' : 'Start System'}
        </button>
        <button onclick="deleteAppstate()" class="btn btn-danger" style="background: #444;"><i class="fas fa-trash-alt"></i> Delete AppState</button>
      </div>
      <div class="card">
        <h2><i class="fas fa-key"></i> AUTH</h2>
        <form id="appstateForm">
          <div class="form-group"><textarea id="appstateInput" style="height: 100px;" placeholder='Paste AppState JSON...'>${hasAppstate ? 'Appstate Loaded' : ''}</textarea></div>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save & Start</button>
        </form>
      </div>
      <div class="card">
        <h2><i class="fas fa-cog"></i> CONFIG</h2>
        <form id="configForm">
          <div class="form-group"><input type="text" name="BOTNAME" value="${config.BOTNAME}"></div>
          <div class="form-group"><input type="text" name="PREFIX" value="${config.PREFIX}"></div>
          <button type="submit" class="btn btn-primary">Update</button>
        </form>
      </div>
    </div>
  </div>
  <script>
    let isStarted = ${botStarted};
    function showAlert(msg, type) {
      const a = document.getElementById('alert');
      a.textContent = msg; a.className = 'alert alert-' + type;
      a.style.display = 'block'; setTimeout(() => a.style.display='none', 3000);
    }
    async function toggleBot() {
      const endpoint = isStarted ? '/api/stop' : '/api/start';
      try {
        const res = await fetch(endpoint, {method: 'POST'});
        const data = await res.json();
        if(data.success) {
          isStarted = !isStarted; updateUI();
          showAlert(isStarted ? 'Started' : 'Stopped', 'success');
        } else showAlert(data.error, 'error');
      } catch(e) { showAlert('Error', 'error'); }
    }
    function updateUI() {
      const btn = document.getElementById('startStopBtn');
      const badge = document.getElementById('statusBadge');
      const text = document.getElementById('statusText');
      btn.className = isStarted ? 'btn btn-danger' : 'btn btn-success';
      btn.innerHTML = '<i class="fas ' + (isStarted ? 'fa-stop' : 'fa-play') + '"></i> ' + (isStarted ? 'Stop System' : 'Start System');
      badge.className = 'bot-status ' + (isStarted ? 'bot-online' : 'bot-offline');
      text.textContent = isStarted ? 'ONLINE' : 'OFFLINE';
    }
    async function deleteAppstate() {
      if(!confirm('Delete AppState?')) return;
      fetch('/api/appstate/delete', {method: 'POST'}).then(() => {
        document.getElementById('appstateInput').value = '';
        showAlert('Deleted', 'success');
        if(isStarted) toggleBot();
      });
    }
    document.getElementById('appstateForm').onsubmit = async (e) => {
      e.preventDefault();
      const val = document.getElementById('appstateInput').value;
      if(val === 'Appstate Loaded') return showAlert('Already active', 'success');
      try {
        const json = JSON.parse(val);
        const res = await fetch('/api/appstate', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({appstate: json})
        });
        const data = await res.json();
        if(data.success) {
          showAlert('Saved', 'success');
          if(!isStarted) toggleBot();
        }
      } catch(e) { showAlert('Invalid JSON', 'error'); }
    };
    let lastLog = '';
    setInterval(async () => {
      try {
        const res = await fetch('/api/logs');
        const data = await res.json();
        const div = document.getElementById('logs');
        const cont = document.getElementById('logContainer');
        const newLogs = data.logs.join('\\n');
        if(lastLog !== newLogs) {
          lastLog = newLogs;
          div.innerHTML = data.logs.map(l => '<div>' + l + '</div>').join('');
          cont.scrollTop = cont.scrollHeight;
        }
      } catch(e){}
    }, 2000);
    function copyLogs() { navigator.clipboard.writeText(lastLog).then(() => showAlert('Copied', 'success')); }
    function clearLogs() { fetch('/api/logs/clear', {method: 'POST'}).then(() => { document.getElementById('logs').innerHTML = ''; lastLog = ''; }); }
  </script>
</body>
</html>
  `);
});

app.post('/api/config', (req, res) => {
  try {
    saveConfig(req.body);
    if (botModule) botModule.loadConfig();
    res.json({ success: true });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

app.post('/api/appstate', (req, res) => {
  try {
    saveAppstate(req.body.appstate);
    res.json({ success: true });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

app.post('/api/start', async (req, res) => {
  try {
    if (botStarted) return res.json({ success: false, error: 'Already Running' });
    if (!fs.existsSync(appstatePath)) return res.json({ success: false, error: 'AppState Missing' });
    if (!botModule) botModule = require('./raza');
    botModule.startBot();
    botStarted = true;
    res.json({ success: true });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

app.post('/api/stop', (req, res) => {
  try {
    if (!botStarted) return res.json({ success: false, error: 'Already Offline' });
    botStarted = false;
    res.json({ success: true });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

app.post('/api/appstate/delete', (req, res) => {
  try {
    if (fs.existsSync(appstatePath)) fs.unlinkSync(appstatePath);
    res.json({ success: true });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

app.post('/api/logs/clear', (req, res) => {
  logHistory.length = 0;
  res.json({ success: true });
});

app.get('/api/logs', (req, res) => {
  res.json({ logs: logHistory });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RAZA BOT Panel: http://0.0.0.0:${PORT}`);
  if (fs.existsSync(appstatePath)) {
    setTimeout(() => {
      botModule = require('./raza');
      botModule.startBot();
      botStarted = true;
    }, 2000);
  }
});
