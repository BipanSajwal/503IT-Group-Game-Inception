const landingSection = document.querySelector('.container');
const quizApp = document.getElementById('quizApp');
const quizProgress = document.getElementById('quizProgress');
const questionImage = document.getElementById('questionImage');
const currentScore = document.getElementById('currentScore');
const popupOverlay = document.getElementById('answerPopup');
const popupFeedbackImage = document.getElementById('popupFeedbackImage');
const popupFeedbackDomain = document.getElementById('popupFeedbackDomain');
const popupFeedbackThreat = document.getElementById('popupFeedbackThreat');
const popupFeedbackText = document.getElementById('popupFeedbackText');
const popupNextBtn = document.getElementById('popupNextBtn');
const resultScreen = document.getElementById('resultScreen');
const finalScore = document.getElementById('finalScore');
const resultStatus = document.getElementById('resultStatus');
const resultMessage = document.getElementById('resultMessage');
const resultTitle = document.getElementById('resultTitle');
const resultVideo = document.getElementById('resultVideo');
const watchVideoBtn = document.getElementById('watchVideoBtn');
const restartBtn = document.getElementById('restartBtn');
const returnHomeBtn = document.getElementById('returnHomeBtn');
const unmuteBtn = document.getElementById('unmuteBtn');
const startQuizBtn = document.getElementById('startQuizBtn');
const instructionsBtn = document.getElementById('instructionsBtn');
const instructionsModal = document.getElementById('instructionsModal');
const instructionsVideo = document.getElementById('instructionsVideo');
const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
const seeAgainBtn = document.getElementById('seeAgainBtn');
const playGameBtn = document.getElementById('playGameBtn');
const quitQuizBtn = document.getElementById('quitQuizBtn');
const choiceButtons = Array.from(document.querySelectorAll('.choice-btn'));
const textSizeButtons = Array.from(document.querySelectorAll('.text-size'));
const contrastToggle = document.getElementById('contrastToggle');
const soundToggle = document.getElementById('soundToggle');
const voiceToggle = document.getElementById('voiceToggle');
const nameModal = document.getElementById('nameModal');
const playerNameInput = document.getElementById('playerNameInput');
const saveNameBtn = document.getElementById('saveNameBtn');
const cancelNameBtn = document.getElementById('cancelNameBtn');
const openLeaderboardBtn = document.getElementById('openLeaderboardBtn');
const leaderboardTopScore = document.getElementById('leaderboardTopScore');
const leaderboardModal = document.getElementById('leaderboardModal');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
const leaderboardDoneBtn = document.getElementById('leaderboardDoneBtn');
const leaderboardModalList = document.getElementById('leaderboardModalList');
const LEADERBOARD_KEY = 'phishingQuizLeaderboard';
let currentPlayerName = '';
const settingsToggle = document.getElementById('settingsToggle');
const accessibilityPanel = document.getElementById('accessibilityPanel');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');

window.accessibilitySoundOn = false;
window.voiceEnabled = false;
window.accessibilityContrastOn = false;
window.accessibilitySize = 'medium';
window.gameEntered = false;
window.resultScreenActive = false;

function getLeaderboardEntries() {
  try {
    const raw = window.localStorage.getItem(LEADERBOARD_KEY) || '[]';
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveLeaderboardEntries(entries) {
  window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

function renderLeaderboard() {
  const entries = getLeaderboardEntries();
  const html = entries.length
    ? entries.map(entry => `<li><strong>${entry.name}</strong> — ${entry.score}</li>`).join('')
    : '<li>No scores yet. Be the first!</li>';
  if (leaderboardModalList) leaderboardModalList.innerHTML = html;
  if (leaderboardTopScore) {
    const topEntry = entries[0];
    leaderboardTopScore.textContent = topEntry ? `Top score: ${topEntry.name} — ${topEntry.score}` : 'Top score: —';
  }
}

function addLeaderboardScore(name, score) {
  if (!name) name = 'Player';
  const entries = getLeaderboardEntries();
  const nextEntry = { name, score, date: new Date().toISOString() };
  const sorted = [...entries, nextEntry].sort((a, b) => b.score - a.score || new Date(b.date) - new Date(a.date));
  saveLeaderboardEntries(sorted.slice(0, 5));
  renderLeaderboard();
}

function openNameModal() {
  if (!nameModal) return;
  playerNameInput.value = currentPlayerName || '';
  nameModal.style.display = 'flex';
  nameModal.querySelector('input')?.focus();
}

function openLeaderboard() {
  if (!leaderboardModal) return;
  renderLeaderboard();
  leaderboardModal.style.display = 'flex';
}

function closeLeaderboard() {
  if (!leaderboardModal) return;
  leaderboardModal.style.display = 'none';
}

function closeNameModal() {
  if (!nameModal) return;
  nameModal.style.display = 'none';
}

function startGameWithName() {
  const trimmedName = playerNameInput?.value.trim();
  currentPlayerName = trimmedName || currentPlayerName || 'Player';
  closeNameModal();
  startQuiz();
}

if (soundToggle) {
  soundToggle.textContent = '🔇 Sound OFF';
  soundToggle.setAttribute('aria-pressed', 'false');
}

if (voiceToggle) {
  voiceToggle.textContent = '🗣 Voice OFF';
  voiceToggle.setAttribute('aria-pressed', 'false');
}

const speechSupported = 'speechSynthesis' in window;
let speechVoice = null;
let buttonAudioContext = null;
let buttonSoundGain = null;

function initializeAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx) {
    buttonAudioContext = new AudioCtx();
    buttonSoundGain = buttonAudioContext.createGain();
    buttonSoundGain.gain.value = 0.16;
    buttonSoundGain.connect(buttonAudioContext.destination);
  }

  if (speechSupported) {
    updateSpeechVoice();
    window.speechSynthesis.onvoiceschanged = updateSpeechVoice;
  }
}

function updateSpeechVoice() {
  if (!speechSupported) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return;
  speechVoice = voices.find(v => /female|en-US|Google|Microsoft/i.test(v.name)) || voices[0];
}

function resumeAudioContext() {
  if (buttonAudioContext && buttonAudioContext.state === 'suspended') {
    buttonAudioContext.resume().catch(() => {});
  }
}

function playButtonSound() {
  if (!window.userInteracted || !buttonAudioContext || !buttonSoundGain || !window.accessibilitySoundOn || !window.gameEntered) return;
  if (buttonAudioContext.state === 'suspended') {
    buttonAudioContext.resume().catch(() => {});
  }
  const oscillator = buttonAudioContext.createOscillator();
  oscillator.type = 'triangle';
  oscillator.frequency.value = 620;
  oscillator.connect(buttonSoundGain);
  oscillator.start();
  oscillator.stop(buttonAudioContext.currentTime + 0.045);
}

function speakText(text, rate = 1, pitch = 1, onEnd = null) {
  if (!speechSupported || !window.userInteracted || !text || !window.voiceEnabled || (!window.gameEntered && !window.resultScreenActive)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  if (speechVoice) utterance.voice = speechVoice;
  if (typeof onEnd === 'function') {
    utterance.onend = onEnd;
  }
  window.speechSynthesis.speak(utterance);
}

function getQuestionNarration(question, index) {
  if (!question) return '';
  const brandText = question.brand ? `The email is from ${question.brand}.` : 'The email is from an unknown sender.';
  const domainText = question.domain ? `The sender address is ${question.domain}.` : '';
  const narrationText = question.voice || '';
  const prompt = `Question ${index + 1}. ${brandText} ${domainText} ${narrationText} Please choose whether this message is phishing or legitimate.`;
  return prompt.trim();
}

function speakQuestion(question, index) {
  const prompt = getQuestionNarration(question, index);
  speakText(prompt, 1, 1);
}

function speakFeedback(question, answeredCorrect) {
  const text = answeredCorrect
    ? `Correct. ${question.feedback}`
    : `Wrong answer. ${question.feedback}`;
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;
  speakText(text, 1, 1, () => {
    if (!isLastQuestion && quizActive) {
      speakText('Let’s check the next one.', 1, 1);
    }
  });
}

initializeAudio();

const questions = [
  {
    image: 'google_login.png',
    logo: 'google_login.png',
    brand: 'Google',
    answer: 'phishing',
    domain: 'security@accounts.google.com',
    threat: 'Urgent phishing scam',
    feedback: 'Urgent sign-in alert asks you to click a link; check Google directly.',
    voice: 'This email says your Google account needs immediate sign-in verification and asks you to click a security link.'
  },
  {
    image: 'quickbook.png',
    logo: 'quickbook.png',
    brand: 'QuickBooks',
    answer: 'phishing',
    domain: 'payroll@quickbooks.com',
    threat: 'Credential harvesting',
    feedback: 'Payroll email asks for bank info via link; verify in HR portal.',
    voice: 'This payroll message asks you to open a link and confirm bank or payroll details.'
  },
  {
    image: 'photos_shared.png',
    logo: 'photos_shared.png',
    brand: 'Gmail',
    answer: 'legit',
    domain: 'lisa@gmail.com',
    threat: 'Safe message',
    feedback: 'Shared photos from a known contact, no sensitive data requested.',
    voice: 'This email says photos were shared with you by a known contact.'
  },
  {
    image: 'netflix_expiring.png',
    logo: 'netflix_expiring.png',
    brand: 'Netflix',
    answer: 'phishing',
    domain: 'billing@netflix.com',
    threat: 'Spoofed sender',
    feedback: 'Urgent billing link pressures you to act; check Netflix from your account.',
    voice: 'This message claims there is an urgent billing issue and asks you to click a payment link.'
  },
  {
    image: 'chase.png',
    logo: 'chase.png',
    brand: 'Chase',
    answer: 'legit',
    domain: 'no-reply@chase.com',
    threat: 'Safe message',
    feedback: 'One-time login code is a normal security message.',
    voice: 'This email delivers a one-time login code for your Chase account.'
  },
  {
    image: 'paypal.png',
    logo: 'paypal.png',
    brand: 'PayPal',
    answer: 'phishing',
    domain: 'support@paypal.com',
    threat: 'Impersonation attack',
    feedback: 'Urgent verification request; real PayPal checks are done through your account.',
    voice: 'This message asks you to verify your PayPal account details right away.'
  },
  {
    image: 'harvard.png',
    logo: 'harvard.png',
    brand: 'Harvard',
    answer: 'legit',
    domain: 'events@harvard.edu',
    threat: 'Safe message',
    feedback: 'Routine campus announcement with no suspicious request.',
    voice: 'This is a campus announcement from Harvard about an event or update.'
  },
  {
    image: 'dropbox.png',
    logo: 'dropbox.png',
    brand: 'Dropbox',
    answer: 'phishing',
    domain: 'alerts@dropbox.com',
    threat: 'Malicious upsell',
    feedback: 'Urgent storage upgrade prompt; sign in to Dropbox directly.',
    voice: 'This message asks you to upgrade your Dropbox storage and sign in through a link.'
  },
  {
    image: 'expedia.png',
    logo: 'expedia.png',
    brand: 'Expedia',
    answer: 'legit',
    domain: 'support@expedia.com',
    threat: 'Safe message',
    feedback: 'Normal booking confirmation without strange requests.',
    voice: 'This email is a booking confirmation from Expedia.'
  },
  {
    image: 'canvas.png',
    logo: 'canvas.png',
    brand: 'Canvas',
    answer: 'phishing',
    domain: 'admin@canvas.net',
    threat: 'Password theft attempt',
    feedback: 'Unexpected password reset email; use Canvas directly to change your password.',
    voice: 'This message tells you to reset your Canvas password through a link.'
  }
];

let currentQuestionIndex = 0;
let score = 0;
let quizActive = false;
let userAnswers = []; // Track user answers

// Track whether the user has performed a gesture (click/tap) this session.
// Many browsers allow unmuted autoplay only after a user gesture.
window.userInteracted = false;
document.addEventListener('click', () => { window.userInteracted = true; }, { once: true, capture: true });

// Remove any previous ended listeners from the result video
if (resultVideo) {
  resultVideo.removeEventListener('ended', handleVideoEnded);
  resultVideo.addEventListener('ended', handleVideoEnded);
}

function handleVideoEnded() {
  if (resultVideo) {
    resultVideo.pause();
    resultVideo.currentTime = resultVideo.duration; // Stay at the end
  }
}

function handleResultNarration() {
  if (!window.voiceEnabled || !speechSupported || !window.userInteracted || !window.resultScreenActive) return;
  const passed = score >= 70;
  const scoreText = `You scored ${score} out of 100.`;
  const summaryText = passed
    ? 'Great job — keep using what you learned.'
    : 'Nice effort — review the tips and try again.';
  speakText(`${scoreText} ${summaryText}`);
}

// Fisher-Yates shuffle: shuffles the questions array in-place.
function shuffleQuestions() {
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = questions[i];
    questions[i] = questions[j];
    questions[j] = temp;
  }
}

function setQuestion(index) {
  const item = questions[index];
  quizProgress.textContent = `Question ${index + 1} / ${questions.length}`;
  questionImage.src = item.image || 'chooseanswer.png';
  questionImage.alt = item.brand ? `${item.brand} question image` : 'Question prompt image';
  currentScore.textContent = score;
  speakQuestion(item, index);

  choiceButtons.forEach(button => {
    button.disabled = false;
    button.classList.remove('selected');
  });
}

function getFeedbackText(question, answeredCorrect, answer) {
  if (answeredCorrect) {
    return question.answer === 'phishing'
      ? `Correct. Phishing because ${question.feedback}`
      : `Correct. Legitimate because ${question.feedback}`;
  }

  return `Wrong. Answer is ${question.answer.toUpperCase()}. ${question.feedback}`;
}

function showPopup(answer) {
  const question = questions[currentQuestionIndex];
  const answeredCorrect = answer === question.answer;

  if (answeredCorrect) {
    score += 10;
    currentScore.textContent = score;
  }

  // Track user answer
  userAnswers.push({
    questionIndex: currentQuestionIndex,
    brand: question.brand,
    userAnswer: answer,
    correctAnswer: question.answer,
    isCorrect: answeredCorrect
  });

  popupFeedbackImage.src = answeredCorrect ? 'happy old man.png' : 'sad old man.png';
  popupFeedbackImage.alt = answeredCorrect ? 'Happy old man celebrating' : 'Sad old man reacting';
  popupFeedbackDomain.textContent = question.domain;
  popupFeedbackThreat.textContent = question.threat;
  popupFeedbackText.textContent = getFeedbackText(question, answeredCorrect, answer);

  popupOverlay.style.display = 'flex';
  speakFeedback(question, answeredCorrect);
}

function showResults() {
  quizApp.style.display = 'none';
  resultScreen.style.display = 'flex';
  window.gameEntered = false;
  window.resultScreenActive = true;
  addLeaderboardScore(currentPlayerName, score);
  // prevent body from scrolling while the result overlay is visible
  try { document.body.style.overflow = 'hidden'; } catch (e) {}

  const passed = score >= 70;
  resultTitle.textContent = passed ? 'Well done!' : 'Try again!';
  resultStatus.textContent = passed
    ? 'Great job — keep using what you learned.'
    : 'Nice effort — review the tips and try again.';
  finalScore.innerHTML = `
    <div class="result-summary">
      <strong>${score} / 100</strong>
      <span>${passed ? 'You passed the quiz!' : 'You can improve with one more run.'}</span>
    </div>
  `;

  // scroll the final scoreboard into view
  if (resultScreen && typeof resultScreen.scrollIntoView === 'function') {
    resultScreen.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // remove any leftover answer lists (we removed the HTML lists earlier)
  // set up and play result video (congratulations or tryagain)
  if (resultVideo) {
    try {
      resultVideo.pause();
    } catch (e) {}
    resultVideo.removeAttribute('src');
    resultVideo.load();

    const videoSource = passed ? 'congratulations.mp4' : 'tryagain.mp4';
    resultVideo.src = videoSource;
    resultVideo.load();
    resultVideo.currentTime = 0;

    // Play the final scoreboard video with audio once the user has already interacted.
    resultVideo.muted = !window.userInteracted;
    resultVideo.loop = false;
    resultVideo.controls = true;
    resultVideo.style.display = 'block';

    resultVideo.play().catch(() => {
      // Autoplay blocked; user can start the video manually with sound.
    });
  }
}

// removed watchVideoBtn: video now autoplays on results

function startQuiz() {
  landingSection.style.display = 'none';
  resultScreen.style.display = 'none';
  popupOverlay.style.display = 'none';
  quizApp.style.display = 'block';

  // Shuffle questions each time a new quiz starts so order is random.
  shuffleQuestions();

  currentQuestionIndex = 0;
  score = 0;
  userAnswers = []; // Reset user answers
  quizActive = true;
  window.gameEntered = true;
  window.resultScreenActive = false;
  setQuestion(currentQuestionIndex);
}

function returnToLanding() {
  quizApp.style.display = 'none';
  resultScreen.style.display = 'none';
  popupOverlay.style.display = 'none';
  landingSection.style.display = 'flex';
  quizActive = false;
  window.gameEntered = false;
  window.resultScreenActive = false;
  // Stop the result video when returning to landing
  if (resultVideo) {
    resultVideo.pause();
    resultVideo.currentTime = 0;
  }
  // restore page scrolling
  try { document.body.style.overflow = ''; } catch (e) {}
}

function restartQuiz() {
  resultScreen.style.display = 'none';
  // Stop the result video when restarting
  if (resultVideo) {
    resultVideo.pause();
    resultVideo.currentTime = 0;
  }
  // restore page scrolling
  try { document.body.style.overflow = ''; } catch (e) {}
  startQuiz();
}

function quitQuiz() {
  returnToLanding();
}

choiceButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (!quizActive) return;
    const choice = button.dataset.choice;
    button.classList.add('selected');
    choiceButtons.forEach(btn => btn.disabled = true);
    showPopup(choice);
  });
});

const allButtons = Array.from(document.querySelectorAll('button'));
allButtons.forEach(button => {
  button.addEventListener('click', playButtonSound);
  if (!button.dataset.choice && button !== popupNextBtn) {
    button.addEventListener('click', () => {
      if (!window.userInteracted) return;
      const label = button.textContent.trim();
      if (label) {
        speakText(label, 1.2, 1);
      }
    });
  }
});

popupNextBtn.addEventListener('click', () => {
  popupOverlay.style.display = 'none';
  currentQuestionIndex += 1;

  if (currentQuestionIndex >= questions.length) {
    quizActive = false;
    showResults();
    return;
  }

  setQuestion(currentQuestionIndex);
});

function hideInstructions() {
  if (instructionsModal) instructionsModal.style.display = 'none';
  if (instructionsVideo) {
    instructionsVideo.pause();
    instructionsVideo.currentTime = 0;
  }
}

function openInstructions() {
  if (instructionsModal) instructionsModal.style.display = 'flex';
  if (instructionsVideo) {
    instructionsVideo.currentTime = 0;
    instructionsVideo.play().catch(() => {});
  }
}

if (startQuizBtn) {
  startQuizBtn.addEventListener('click', () => {
    if (currentPlayerName) {
      startQuiz();
    } else {
      openNameModal();
    }
  });
}

if (instructionsBtn) {
  instructionsBtn.addEventListener('click', openInstructions);
}

if (closeInstructionsBtn) {
  closeInstructionsBtn.addEventListener('click', hideInstructions);
}

if (seeAgainBtn) {
  seeAgainBtn.addEventListener('click', () => {
    if (instructionsVideo) {
      instructionsVideo.currentTime = 0;
      instructionsVideo.play().catch(() => {});
    }
  });
}

if (playGameBtn) {
  playGameBtn.addEventListener('click', () => {
    hideInstructions();
    if (currentPlayerName) {
      startQuiz();
    } else {
      openNameModal();
    }
  });
}

if (quitQuizBtn) {
  quitQuizBtn.addEventListener('click', quitQuiz);
}

if (restartBtn) {
  restartBtn.addEventListener('click', restartQuiz);
}

if (saveNameBtn) {
  saveNameBtn.addEventListener('click', startGameWithName);
}

if (cancelNameBtn) {
  cancelNameBtn.addEventListener('click', closeNameModal);
}

if (openLeaderboardBtn) {
  openLeaderboardBtn.addEventListener('click', openLeaderboard);
}

if (closeLeaderboardBtn) {
  closeLeaderboardBtn.addEventListener('click', closeLeaderboard);
}

if (leaderboardDoneBtn) {
  leaderboardDoneBtn.addEventListener('click', closeLeaderboard);
}

if (leaderboardModal) {
  leaderboardModal.addEventListener('click', event => {
    if (event.target === leaderboardModal) closeLeaderboard();
  });
}

if (returnHomeBtn) {
  returnHomeBtn.addEventListener('click', returnToLanding);
}

renderLeaderboard();

// Unmute button: user-initiated action to enable audio and play video with sound.
if (unmuteBtn) {
  unmuteBtn.addEventListener('click', () => {
    if (resultVideo) {
      resultVideo.muted = false;
      resultVideo.play().catch(() => {});
    }
    unmuteBtn.style.display = 'none';
  });
}

if (textSizeButtons.length) {
  document.body.classList.add('text-size-medium');
  textSizeButtons.forEach(button => {
    const size = button.dataset.size;
    if (!size) return;
    button.addEventListener('click', () => {
      document.body.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
      document.body.classList.add(`text-size-${size}`);
      window.accessibilitySize = size;
      textSizeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.size === size));
    });
  });
}

if (contrastToggle) {
  contrastToggle.addEventListener('click', () => {
    window.accessibilityContrastOn = !window.accessibilityContrastOn;
    document.body.classList.toggle('high-contrast', window.accessibilityContrastOn);
    contrastToggle.textContent = window.accessibilityContrastOn ? '◑ Contrast ON' : '◐ Contrast';
    contrastToggle.setAttribute('aria-pressed', String(window.accessibilityContrastOn));
  });
}

if (soundToggle) {
  soundToggle.addEventListener('click', () => {
    window.accessibilitySoundOn = !window.accessibilitySoundOn;
    soundToggle.textContent = window.accessibilitySoundOn ? '🔊 Sound ON' : '🔇 Sound OFF';
    soundToggle.setAttribute('aria-pressed', String(window.accessibilitySoundOn));
    if (resultVideo) {
      resultVideo.muted = !window.accessibilitySoundOn || !window.userInteracted;
    }
  });
}

if (voiceToggle) {
  voiceToggle.addEventListener('click', () => {
    window.voiceEnabled = !window.voiceEnabled;
    voiceToggle.textContent = window.voiceEnabled ? '🗣 Voice ON' : '🗣 Voice OFF';
    voiceToggle.setAttribute('aria-pressed', String(window.voiceEnabled));
  });
}

if (settingsToggle && accessibilityPanel) {
  settingsToggle.addEventListener('click', () => {
    const open = accessibilityPanel.classList.toggle('open');
    settingsToggle.setAttribute('aria-expanded', String(open));
    accessibilityPanel.setAttribute('aria-hidden', String(!open));
  });
}

if (closeSettingsBtn && accessibilityPanel && settingsToggle) {
  closeSettingsBtn.addEventListener('click', () => {
    accessibilityPanel.classList.remove('open');
    settingsToggle.setAttribute('aria-expanded', 'false');
    accessibilityPanel.setAttribute('aria-hidden', 'true');
  });
}

window.addEventListener('click', event => {
  if (accessibilityPanel && accessibilityPanel.classList.contains('open') && !accessibilityPanel.contains(event.target) && !settingsToggle.contains(event.target)) {
    accessibilityPanel.classList.remove('open');
    settingsToggle.setAttribute('aria-expanded', 'false');
    accessibilityPanel.setAttribute('aria-hidden', 'true');
  }
});

window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (popupOverlay.style.display === 'flex') {
      popupOverlay.style.display = 'none';
    }
    if (instructionsModal && instructionsModal.style.display === 'flex') {
      instructionsModal.style.display = 'none';
    }
    if (accessibilityPanel && accessibilityPanel.classList.contains('open')) {
      accessibilityPanel.classList.remove('open');
      settingsToggle.setAttribute('aria-expanded', 'false');
      accessibilityPanel.setAttribute('aria-hidden', 'true');
    }
  }
});
