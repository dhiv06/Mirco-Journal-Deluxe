// ---------------- DOM Elements ----------------
const emojiPicker = document.getElementById('emoji-picker');
const entryBox = document.getElementById('entry');
const wordCount = document.getElementById('word-count');
const progressRing = document.getElementById('progress-ring');
const saveBtn = document.getElementById('save-btn');
const viewPastBtn = document.getElementById('view-past-btn');
const pastSection = document.getElementById('past-entries');
const entryList = document.getElementById('entry-list');
const promptBox = document.getElementById('daily-prompt');
const quoteBox = document.getElementById('quote-of-the-day');
const darkToggle = document.getElementById('dark-mode-toggle');
const exportTxt = document.getElementById('export-txt');
const exportJson = document.getElementById('export-json');
const statusMsg = document.getElementById('status-msg');
const savedBadge = document.getElementById('saved-badge');
const summaryBox = document.getElementById('entry-summary');
const confettiCanvas = document.getElementById('confetti-canvas');

let selectedMood = '';

// ---------------- Emoji Picker ----------------
const emojis = ['😊', '😢', '😠', '😌', '😕'];
emojis.forEach(emoji => {
  const btn = document.createElement('button');
  btn.textContent = emoji;
  btn.classList.add('emoji-btn');
  btn.onclick = () => {
    selectedMood = emoji;
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    updateMoodRingColor(emoji);
  };
  emojiPicker.appendChild(btn);
});

// ---------------- Mood Ring ----------------
const fullDash = 2 * Math.PI * 45;
function updateMoodRingProgress(count) {
  const maxWords = 100;
  const percent = Math.min(count / maxWords, 1);
  const offset = fullDash * (1 - percent);
  progressRing.style.strokeDashoffset = offset;
}
function updateMoodRingColor(emoji) {
  const colors = {
    '😊': '#f4a261',
    '😢': '#457b9d',
    '😠': '#e63946',
    '😌': '#2a9d8f',
    '😕': '#6c757d'
  };
  const color = colors[emoji] || '#d94f70';
  progressRing.style.stroke = color;
  progressRing.style.setProperty('--glow-color', color);
  progressRing.classList.add('glow-ring');
  setTimeout(() => progressRing.classList.remove('glow-ring'), 1200);
}

// ---------------- Word Count ----------------
entryBox.addEventListener('input', () => {
  const count = entryBox.value.trim().split(/\s+/).filter(Boolean).length;
  wordCount.textContent = `Words: ${count}`;
  updateMoodRingProgress(count);
});

// ---------------- Enter Key Save ----------------
entryBox.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    saveEntry();
  }
});

// ---------------- Mood Detection ----------------
function detectMoodFromText(text) {
  const moodMap = {
    '😊': ['happy', 'excited', 'love', 'great', 'fun', 'joy', 'awesome'],
    '😢': ['sad', 'tired', 'lonely', 'hurt', 'cry', 'down', 'lost'],
    '😠': ['mad', 'angry', 'annoyed', 'frustrated', 'hate', 'unfair'],
    '😌': ['relaxed', 'peaceful', 'okay', 'fine', 'chill', 'content'],
    '😕': ['confused', 'unsure', 'weird', 'strange', 'mixed', 'stuck']
  };

  const lowerText = text.toLowerCase();
  for (let emoji in moodMap) {
    if (moodMap[emoji].some(word => lowerText.includes(word))) {
      return emoji;
    }
  }
  return '';
}

// ---------------- Save Entry ----------------
saveBtn.onclick = () => saveEntry();

function saveEntry() {
  const entry = entryBox.value.trim();
  if (!entry) {
    statusMsg.textContent = "Please write something.";
    statusMsg.style.color = "#aa0000";
    return;
  }

  if (!selectedMood) {
    selectedMood = detectMoodFromText(entry);
    if (selectedMood) {
      document.querySelectorAll('.emoji-btn').forEach(b => {
        b.classList.remove('selected');
        if (b.textContent === selectedMood) b.classList.add('selected');
      });
      updateMoodRingColor(selectedMood);
    } else {
      statusMsg.textContent = "Couldn't detect mood — please select one.";
      statusMsg.style.color = "#aa0000";
      return;
    }
  }

  const timestamp = new Date().toISOString();
  const journalEntry = { mood: selectedMood, text: entry, time: timestamp };

  let history = JSON.parse(localStorage.getItem('journal-history') || '[]');
  history.push(journalEntry);
  localStorage.setItem('journal-history', JSON.stringify(history));

  launchConfetti();

  entryBox.value = '';
  wordCount.textContent = 'Words: 0';
  updateMoodRingProgress(0);
  selectedMood = '';
  document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
  entryBox.classList.add('saved-flash');
  setTimeout(() => entryBox.classList.remove('saved-flash'), 300);

  loadDailyPrompt(Math.floor(Math.random() * 10000));
  loadQuote();
  updatePastEntries();

  statusMsg.textContent = "Entry saved!";
  savedBadge.classList.add('show');
  setTimeout(() => savedBadge.classList.remove('show'), 2000);
  summaryBox.textContent = generateSummary(entry);
  statusMsg.style.color = "#007700";
}

// ---------------- Past Entries ----------------
viewPastBtn.onclick = () => {
  pastSection.classList.toggle('visible');
};

function updatePastEntries() {
  const history = JSON.parse(localStorage.getItem('journal-history') || '[]');
  entryList.innerHTML = '';

  [...history].reverse().forEach(entry => {
    const li = document.createElement('li');
    const date = new Date(entry.time).toLocaleString();
    li.textContent = `${date} — Mood: ${entry.mood} — ${entry.text.slice(0, 50)}...`;
    entryList.appendChild(li);
  });
}

// ---------------- Dark Mode Toggle ----------------
darkToggle.onclick = () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode'));
};

// ---------------- Export ----------------
exportTxt.onclick = () => {
  const history = JSON.parse(localStorage.getItem('journal-history') || '[]');
  const content = history.map(e => `${new Date(e.time).toLocaleString()} — ${e.mood}\n${e.text}\n\n`).join('');
  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'journal.txt';
  link.click();
};

exportJson.onclick = () => {
  const history = localStorage.getItem('journal-history') || '[]';
  const blob = new Blob([history], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'journal.json';
  link.click();
};

// ---------------- Prompt & Quote ----------------
function loadDailyPrompt(seed = null) {
  const prompts = [
    "What made you smile today?",
    "What’s something you’re proud of?",
    "What’s weighing on your mind?",
    "Who do you appreciate right now?",
    "What’s one thing you’re grateful for?",
    "What’s a small win you had today?",
    "What’s something you’re looking forward to?",
    "What’s something you learned today?",
    "What’s a moment you want to remember?",
    "What’s something you want to let go of?"
  ];
  const index = seed !== null ? seed % prompts.length : Math.floor(Math.random() * prompts.length);
  promptBox.textContent = prompts[index];
}

function loadQuote() {
  const quotes = [
    "“Start where you are. Use what you have. Do what you can.” – Arthur Ashe",
    "“Every moment is a fresh beginning.” – T.S. Eliot",
    "“Turn your wounds into wisdom.” – Oprah Winfrey",
    "“The best way out is always through.” – Robert Frost",
    "“You are enough just as you are.” – Meghan Markle",
    "“Do not wait for the perfect moment. Take the moment and make it perfect.” – Unknown",
    "“Your story matters.” – Unknown"
  ];
  const index = Math.floor(Math.random() * quotes.length);
  quoteBox.textContent = quotes[index];
}

// ---------------- Confetti Engine ----------------
function launchConfetti() {
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const moodColors = {
    '😊': ['#f4a261', '#ffe066', '#ffb4a2'],
    '😢': ['#457b9d', '#a8dadc', '#1d3557'],
    '😠': ['#e63946', '#ff6b6b', '#c1121f'],
    '😌': ['#2a9d8f', '#a8e6cf', '#70c1b3'],
    '😕': ['#6c757d', '#adb5bd', '#ced4da']
  };

  const colors = moodColors[selectedMood] || ['#d94f70', '#f8cdd8', '#fff0f5'];

  const particles = Array.from({ length: 100 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * confettiCanvas.height,
    r: Math.random() * 6 + 4,
    d: Math.random() * 10 + 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    tilt: Math.random() * 10 - 5
  }));

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      p.y += p.d;
      p.x += Math.sin(frame / 10) * 2;
      if (p.y > confettiCanvas.height) p.y = -10;
    });
    frame++;
    if (frame < 100) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }

  draw();
}

function generateSummary(text) {
  const keywords = {
    gratitude: ['grateful', 'thankful', 'appreciate'],
    growth: ['learned', 'improved', 'progress', 'challenge'],
    connection: ['friend', 'family', 'talked', 'shared'],
    emotion: ['sad', 'happy', 'angry', 'excited', 'lonely'],
    reflection: ['thought', 'realized', 'understood', 'noticed']
  };

  const lowerText = text.toLowerCase();
  let themes = [];

  for (let theme in keywords) {
    if (keywords[theme].some(word => lowerText.includes(word))) {
      themes.push(theme);
    }
  }

  if (themes.length === 0) return "You reflected on your day.";
  if (themes.length === 1) return `You reflected on ${themes[0]}.`;

  return `You reflected on ${themes.slice(0, 2).join(" and ")}.`;
}


// ---------------- Init ----------------
window.onload = () => {
  updateMoodRingProgress(0);
  updatePastEntries();
  loadDailyPrompt();
  loadQuote();

  if (localStorage.getItem('dark-mode') === 'true') {
    document.body.classList.add('dark-mode');
  }
};
