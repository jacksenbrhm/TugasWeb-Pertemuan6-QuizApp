'use strict';

/* =========================
   1. DATA SOAL (min. 5)
   ========================= */
const quizData = [
  {
    category: 'HTML',
    question: 'Apa kepanjangan dari HTML?',
    options: [
      'Hyper Text Markup Language',
      'High Tech Modern Language',
      'Home Tool Markup Language',
      'Hyperlink Text Mode Language'
    ],
    correct: 0
  },
  {
    category: 'CSS',
    question: 'CSS digunakan untuk?',
    options: ['Struktur halaman', 'Styling / tampilan', 'Logika program', 'Database'],
    correct: 1
  },
  {
    category: 'JavaScript',
    question: 'Method mana yang mengambil elemen pertama yang cocok dengan CSS selector?',
    options: ['getElementsByTagName()', 'querySelectorAll()', 'querySelector()', 'getElementsByName()'],
    correct: 2
  },
  {
    category: 'DOM',
    question: 'Apa fungsi document.createElement("div")?',
    options: [
      'Menghapus elemen div',
      'Membuat elemen div baru di memori',
      'Mengubah CSS semua div',
      'Menyalin elemen div yang ada'
    ],
    correct: 1
  },
  {
    category: 'Events',
    question: 'Teknik memasang satu event listener di parent untuk menangani banyak child disebut?',
    options: ['Event bubbling saja', 'Event delegation', 'Event capturing', 'Event emitter'],
    correct: 1
  },
  {
    category: 'Storage',
    question: 'Method untuk menyimpan data ke LocalStorage adalah?',
    options: ['localStorage.save()', 'localStorage.put()', 'localStorage.setItem()', 'localStorage.write()'],
    correct: 2
  }
];

const TIME_PER_QUESTION = 15; // detik
const STORAGE_KEY = 'quizHighScore';

/* =========================
   2. STATE
   ========================= */
let questions = [];        // soal yang sudah diacak
let currentQuestion = 0;
let score = 0;
let answered = false;
let timeLeft = TIME_PER_QUESTION;
let timerId = null;

/* =========================
   3. DOM ELEMENTS
   ========================= */
const questionEl     = document.querySelector('#question');
const optionsEl      = document.querySelector('#options');
const nextBtn        = document.querySelector('#nextBtn');
const progressEl     = document.querySelector('#progress');
const progressFill   = document.querySelector('#progressFill');
const categoryEl     = document.querySelector('#category');
const timerEl        = document.querySelector('#timer');
const quizContent    = document.querySelector('.quiz-content');
const resultEl       = document.querySelector('#result');
const scoreEl        = document.querySelector('#score');
const highScoreEl    = document.querySelector('#highScore');
const restartBtn     = document.querySelector('#restartBtn');
const themeToggle    = document.querySelector('#themeToggle');

/* =========================
   4. HELPER
   ========================= */
// Acak urutan array (Fisher–Yates) tanpa mengubah array asli
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* =========================
   5. RENDER SOAL
   ========================= */
function renderQuestion() {
  const q = questions[currentQuestion];
  answered = false;

  progressEl.textContent = `Soal ${currentQuestion + 1}/${questions.length}`;
  progressFill.style.width = `${(currentQuestion / questions.length) * 100}%`;
  categoryEl.textContent = q.category;
  questionEl.textContent = q.question;   // textContent = aman dari XSS

  // Kosongkan lalu render opsi dengan createElement
  optionsEl.replaceChildren();
  q.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.classList.add('option-btn');
    btn.dataset.index = index;           // dipakai event delegation
    optionsEl.append(btn);
  });

  nextBtn.classList.add('hidden');
  nextBtn.textContent = currentQuestion === questions.length - 1 ? 'Lihat Hasil' : 'Next →';

  // Animasi transisi
  quizContent.classList.remove('fade-in');
  void quizContent.offsetWidth;          // restart animasi
  quizContent.classList.add('fade-in');

  startTimer();
}

/* =========================
   6. TIMER PER SOAL
   ========================= */
function startTimer() {
  clearInterval(timerId);
  timeLeft = TIME_PER_QUESTION;
  updateTimerDisplay();

  timerId = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) handleTimeout();
  }, 1000);
}

function updateTimerDisplay() {
  timerEl.textContent = `⏱ ${timeLeft}`;
  timerEl.classList.toggle('danger', timeLeft <= 5);
}

function handleTimeout() {
  clearInterval(timerId);
  if (answered) return;
  answered = true;
  revealCorrectAnswer();
  lockOptions();
  nextBtn.classList.remove('hidden');
}

/* =========================
   7. EVENT DELEGATION — PILIHAN JAWABAN
   ========================= */
optionsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn || answered) return;          // abaikan klik ganda

  answered = true;
  clearInterval(timerId);

  const selectedIndex = parseInt(btn.dataset.index, 10);
  const correctIndex = questions[currentQuestion].correct;

  if (selectedIndex === correctIndex) {
    btn.classList.add('correct');
    score++;
  } else {
    btn.classList.add('wrong');
    revealCorrectAnswer();               // tunjukkan jawaban yang benar
  }

  lockOptions();
  nextBtn.classList.remove('hidden');
});

function revealCorrectAnswer() {
  const correctIndex = questions[currentQuestion].correct;
  const correctBtn = optionsEl.querySelector(`[data-index="${correctIndex}"]`);
  correctBtn.classList.add('correct');
}

function lockOptions() {
  optionsEl.querySelectorAll('.option-btn').forEach((b) => (b.disabled = true));
}

/* =========================
   8. NEXT BUTTON
   ========================= */
nextBtn.addEventListener('click', () => {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    renderQuestion();
  } else {
    showResult();
  }
});

/* =========================
   9. HASIL & HIGH SCORE (LocalStorage)
   ========================= */
function showResult() {
  clearInterval(timerId);
  progressFill.style.width = '100%';

  const total = questions.length;
  const percentage = Math.round((score / total) * 100);
  scoreEl.textContent = `${score}/${total} (${percentage}%)`;

  const savedHighScore = parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0;

  if (percentage > savedHighScore) {
    localStorage.setItem(STORAGE_KEY, percentage);
    highScoreEl.textContent = `${percentage}% 🎉 New Record!`;
  } else {
    highScoreEl.textContent = `${savedHighScore}%`;
  }

  quizContent.classList.add('hidden');
  resultEl.classList.remove('hidden');
  resultEl.classList.add('fade-in');
}

/* =========================
   10. RESTART
   ========================= */
function startQuiz() {
  questions = shuffle(quizData);         // urutan soal diacak tiap mulai
  currentQuestion = 0;
  score = 0;

  resultEl.classList.add('hidden');
  quizContent.classList.remove('hidden');
  renderQuestion();
}

restartBtn.addEventListener('click', startQuiz);

/* =========================
   11. DARK MODE TOGGLE
   ========================= */
function applyTheme(isDark) {
  document.body.classList.toggle('dark', isDark);
  themeToggle.textContent = isDark ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('dark');
  applyTheme(isDark);
  localStorage.setItem('quizTheme', isDark ? 'dark' : 'light');
});

/* =========================
   12. INISIALISASI
   ========================= */
applyTheme(localStorage.getItem('quizTheme') === 'dark');
startQuiz();