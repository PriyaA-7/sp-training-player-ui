// -------------------------------
// Read parameters from URL
// -------------------------------
const params = new URLSearchParams(window.location.search);

const trainingId = params.get("trainingId");
const trainingVersion = params.get("version");
const trainingTitle = params.get("title");
const videoUrl = params.get("videoUrl");

if (!trainingId || !trainingVersion || !videoUrl) {
  alert("Invalid or incomplete training link.");
  throw new Error("Missing required training parameters");
}

// -------------------------------
// Setup video
// -------------------------------
const video = document.getElementById("trainingVideo");
const titleEl = document.getElementById("trainingTitle");

video.src = decodeURIComponent(videoUrl);
titleEl.innerText = trainingTitle
  ? decodeURIComponent(trainingTitle)
  : `Training: ${trainingId} (${trainingVersion})`;

// -------------------------------
// Telemetry state
// -------------------------------
let viewStartTime = null;
let lastPlayTime = null;
let totalWatchSeconds = 0;

// -------------------------------
// Video event handlers
// -------------------------------
video.addEventListener("play", () => {
  const now = Date.now();

  if (!viewStartTime) {
    viewStartTime = now;
  }

  lastPlayTime = now;
});

video.addEventListener("pause", accumulateWatchTime);

video.addEventListener("ended", () => {
  accumulateWatchTime();
  sendTelemetry("ended");
});

window.addEventListener("beforeunload", () => {
  accumulateWatchTime();
  sendTelemetry("abandoned");
});

// -------------------------------
// Helper functions
// -------------------------------
function accumulateWatchTime() {
  if (!lastPlayTime) return;

  const now = Date.now();
  totalWatchSeconds += Math.floor((now - lastPlayTime) / 1000);
  lastPlayTime = null;
}

function sendTelemetry(status) {
  const duration = Math.floor(video.duration || 0);
  const percentWatched =
    duration > 0
      ? Math.min(
          100,
          Math.round((video.currentTime / duration) * 100)
        )
      : 0;

  const payload = {
    trainingId,
    trainingVersion,
    trainingTitle: trainingTitle || null,

    viewStartTime: viewStartTime
      ? new Date(viewStartTime).toISOString()
      : null,

    viewEndTime: new Date().toISOString(),
    watchDurationSeconds: totalWatchSeconds,
    percentWatched,
    viewStatus: status // ended | abandoned
  };

  console.log("Training telemetry payload:", payload);

  // STEP 3:
  // POST this payload to Power Automate HTTP trigger
}
