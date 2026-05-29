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
const unmuteBtn = document.getElementById('unmuteBtn');
const startQuizBtn = document.getElementById('startQuizBtn');
const quitQuizBtn = document.getElementById('quitQuizBtn');
const choiceButtons = Array.from(document.querySelectorAll('.choice-btn'));

const questions = [
  {
    image: 'google_login.png',
    logo: 'google_login.png',
    brand: 'Google',
    answer: 'phishing',
    domain: 'security@accounts.google.com',
    threat: 'Urgent phishing scam',
    feedback: 'Urgent sign-in alert asks you to click a link; check Google directly.'
  },
  {
    image: 'quickbook.png',
    logo: 'quickbook.png',
    brand: 'QuickBooks',
    answer: 'phishing',
    domain: 'payroll@quickbooks.com',
    threat: 'Credential harvesting',
    feedback: 'Payroll email asks for bank info via link; verify in HR portal.'
  },
  {
    image: 'photos_shared.png',
    logo: 'photos_shared.png',
    brand: 'Gmail',
    answer: 'legit',
    domain: 'lisa@gmail.com',
    threat: 'Safe message',
    feedback: 'Shared photos from a known contact, no sensitive data requested.'
  },
  {
    image: 'netflix_expiring.png',
    logo: 'netflix_expiring.png',
    brand: 'Netflix',
    answer: 'phishing',
    domain: 'billing@netflix.com',
    threat: 'Spoofed sender',
    feedback: 'Urgent billing link pressures you to act; check Netflix from your account.'
  },
  {
    image: 'chase.png',
    logo: 'chase.png',
    brand: 'Chase',
    answer: 'legit',
    domain: 'no-reply@chase.com',
    threat: 'Safe message',
    feedback: 'One-time login code is a normal security message.'
  },
  {
    image: 'Paypal.png',
    logo: 'Paypal.png',
    brand: 'PayPal',
    answer: 'phishing',
    domain: 'support@paypal.com',
    threat: 'Impersonation attack',
    feedback: 'Urgent verification request; real PayPal checks are done through your account.'
  },
  {
    image: 'harvard.png',
    logo: 'harvard.png',
    brand: 'Harvard',
    answer: 'legit',
    domain: 'events@harvard.edu',
    threat: 'Safe message',
    feedback: 'Routine campus announcement with no suspicious request.'
  },
  {
    image: 'dropbox.png',
    logo: 'dropbox.png',
    brand: 'Dropbox',
    answer: 'phishing',
    domain: 'alerts@dropbox.com',
    threat: 'Malicious upsell',
    feedback: 'Urgent storage upgrade prompt; sign in to Dropbox directly.'
  },
  {
    image: 'expedia.png',
    logo: 'expedia.png',
    brand: 'Expedia',
    answer: 'legit',
    domain: 'support@expedia.com',
    threat: 'Safe message',
    feedback: 'Normal booking confirmation without strange requests.'
  },
  {
    image: 'canvas.png',
    logo: 'canvas.png',
    brand: 'Canvas',
    answer: 'phishing',
    domain: 'admin@canvas.net',
    threat: 'Password theft attempt',
    feedback: 'Unexpected password reset email; use Canvas directly to change your password.'
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
}

function showResults() {
  quizApp.style.display = 'none';
  // use the CSS display (grid) rather than forcing flex; clear any inline style
  resultScreen.style.display = 'grid';
  // prevent body from scrolling while the result overlay is visible
  try { document.body.style.overflow = 'hidden'; } catch (e) {}
  finalScore.textContent = score;

  const passed = score >= 70;
  resultScreen.classList.toggle('success', passed);
  resultScreen.classList.toggle('fail', !passed);
  resultTitle.textContent = passed ? 'Well done!' : 'Nice try!';
  resultStatus.textContent = passed ? 'PASS' : 'FAIL';
  resultStatus.classList.toggle('result-pass', passed);
  resultStatus.classList.toggle('result-fail', !passed);
  resultMessage.textContent = passed
    ? 'You scored high enough to spot dangerous email tricks. Review the feedback to stay sharp.'
    : 'You’re close. Review the feedback, develop your skills, and try again.';
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

    // Prefer muted autoplay to avoid browser blocks; unmute if user previously interacted.
    resultVideo.muted = !window.userInteracted;
    resultVideo.loop = false;
    // show controls to allow manual playback if autoplay is blocked
    resultVideo.controls = true;
    resultVideo.style.display = 'block';

    // Try to autoplay. If autoplay fails, keep controls visible so user can start playback.
    resultVideo.play().then(() => {
      // If the user already interacted, unmute so audio is audible.
      if (window.userInteracted) {
        resultVideo.muted = false;
      }
    }).catch(() => {
      // Autoplay blocked — show unmute button so user can start with sound.
      if (unmuteBtn) {
        unmuteBtn.style.display = 'inline-flex';
      }
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
  setQuestion(currentQuestionIndex);
}

function returnToLanding() {
  quizApp.style.display = 'none';
  resultScreen.style.display = 'none';
  popupOverlay.style.display = 'none';
  landingSection.style.display = 'flex';
  quizActive = false;
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

if (startQuizBtn) {
  startQuizBtn.addEventListener('click', startQuiz);
}

if (quitQuizBtn) {
  quitQuizBtn.addEventListener('click', quitQuiz);
}

if (restartBtn) {
  restartBtn.addEventListener('click', restartQuiz);
}

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

window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && popupOverlay.style.display === 'flex') {
    popupOverlay.style.display = 'none';
  }
});
