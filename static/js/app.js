// === 進捗管理 (localStorage) ===

const STORAGE_KEY = 'codeReadingTrainer';

function getProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      completedLessons: [],
      quizCorrect: 0,
      dangerCorrect: 0,
      streak: 0,
      totalAttempts: 0
    };
  }
  return JSON.parse(raw);
}

function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // サーバーにも非同期で保存
  fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).catch(() => {}); // エラーは無視
}

function updateProgress(type, value) {
  const progress = getProgress();
  if (type === 'quizCorrect') {
    progress.quizCorrect = value;
    progress.totalAttempts = (progress.totalAttempts || 0) + 1;
  } else if (type === 'dangerCorrect') {
    progress.dangerCorrect = value;
  } else if (type === 'streak') {
    progress.streak = value;
  }
  saveProgress(progress);
}

function markLessonComplete(lessonId) {
  const progress = getProgress();
  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
    saveProgress(progress);
  }
  const btn = document.getElementById('completeBtn');
  const area = document.getElementById('lessonCompleteArea');
  if (btn) {
    btn.textContent = '✅ 完了済み！';
    btn.classList.remove('btn-success');
    btn.classList.add('btn-ghost');
    btn.disabled = true;
  }
  if (area) {
    const note = area.querySelector('.complete-note');
    if (note) note.textContent = '学習記録に保存されました';
  }
}

function checkLessonCompleted(lessonId) {
  const progress = getProgress();
  const btn = document.getElementById('completeBtn');
  if (btn && progress.completedLessons.includes(lessonId)) {
    btn.textContent = '✅ 完了済み！';
    btn.classList.remove('btn-success');
    btn.classList.add('btn-ghost');
    btn.disabled = true;
    const note = document.querySelector('.complete-note');
    if (note) note.textContent = '学習記録に保存済みです';
  }
}

// === トップページの統計表示 ===

function loadProgressStats() {
  const progress = getProgress();
  const el = (id) => document.getElementById(id);
  if (el('statLessons')) el('statLessons').textContent = progress.completedLessons.length;
  if (el('statQuiz')) el('statQuiz').textContent = progress.quizCorrect || 0;
  if (el('statDanger')) el('statDanger').textContent = progress.dangerCorrect || 0;
  if (el('statStreak')) el('statStreak').textContent = progress.streak || 0;
}

// === カテゴリ別進捗の表示 ===

async function loadCategoryProgress() {
  const progress = getProgress();
  try {
    const res = await fetch('/api/lessons');
    const data = await res.json();
    const categories = Object.keys(data.categories);
    categories.forEach(catId => {
      const catLessons = data.lessons.filter(l => l.category === catId);
      const completed = catLessons.filter(l => progress.completedLessons.includes(l.id)).length;
      const rate = catLessons.length > 0 ? Math.round((completed / catLessons.length) * 100) : 0;
      const fillEl = document.getElementById(`progress-${catId}`);
      const textEl = document.getElementById(`progress-text-${catId}`);
      if (fillEl) fillEl.style.width = rate + '%';
      if (textEl) textEl.textContent = `${rate}% 完了 (${completed}/${catLessons.length})`;
    });
  } catch (e) {}
}

// === カテゴリページ：レッスン完了状態の表示 ===

function updateCategoryProgress(lessons, categoryId) {
  const progress = getProgress();
  let completed = 0;
  lessons.forEach(lesson => {
    const el = document.getElementById(`status-${lesson.id}`);
    const item = el ? el.closest('.lesson-item') : null;
    if (progress.completedLessons.includes(lesson.id)) {
      completed++;
      if (el) el.querySelector('.status-circle').textContent = '✅';
      if (item) item.classList.add('completed');
    }
  });

  const progressBar = document.getElementById('cat-progress-bar');
  const progressText = document.getElementById('cat-progress-text');
  if (progressBar && lessons.length > 0) {
    const rate = Math.round((completed / lessons.length) * 100);
    progressBar.style.width = rate + '%';
  }
  if (progressText) {
    progressText.textContent = `${completed} / ${lessons.length} 完了`;
  }
}
