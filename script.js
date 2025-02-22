/****************************************************
 * Polyfills for requestAnimationFrame and performance.now
 ****************************************************/
(function() {
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback) {
      return window.setTimeout(callback, 1000 / 60);
    };
  }
  if (!window.performance || !performance.now) {
    performance.now = function() {
      return new Date().getTime();
    };
  }
})();

/****************************************************
 * Global Variables
 ****************************************************/
let currentTheme = "dark";          // Track current theme
const timers = [];                  // Holds data for each Chrono Timer
const maxTimers = 3;                // Max number of timers allowed

/**
 * Ensure one timer is shown right away:
 *  1) Mark "chrono" tab as active
 *  2) Create the first timer
 */
window.addEventListener("DOMContentLoaded", () => {
  // Show the Chrono tab content
  document.getElementById("chrono").classList.add("active");
  // Create the first timer automatically
  createNewTimer();
});

/****************************************************
 * Theme Toggle
 ****************************************************/
function toggleTheme() {
  const body = document.body;
  body.classList.toggle('light-theme');
  
  // Grab the <i> element inside the toggle button
  const themeIcon = document.querySelector('.theme-toggle i');

  // If we’re in light mode, show the moon icon; if dark mode, show the sun icon
  if (body.classList.contains('light-theme')) {
    themeIcon.classList.remove('fa-lightbulb');
    themeIcon.classList.add('fa-moon');
  } else {
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-lightbulb');
  }
}

/****************************************************
 * Tab Switching
 ****************************************************/
function showTab(tabId) {
  // Hide all tabs
  const tabs = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove("active");
  }
  // Remove .active from all tab buttons
  const buttons = document.getElementsByClassName("tab-button");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("active");
  }

  // Show the requested tab
  document.getElementById(tabId).classList.add("active");

  // Safely mark the button active (if called by a click event)
  if (typeof event !== "undefined" && event.target) {
    event.target.classList.add("active");
  }
}

/****************************************************
 * Chrono Timer: Add Timer
 ****************************************************/
function addNewTimer() {
  if (timers.length >= maxTimers) {
    alert(`You can only have up to ${maxTimers} timers!`);
    return;
  }
  createNewTimer();
}

/****************************************************
 * Create & Initialize a Timer
 * (Uses a custom alarm dropdown)
 ****************************************************/
function createNewTimer() {
  const index = timers.length;
  const timerId = `timer${index + 1}`;

  // Build the timer markup (with custom dropdown for alarm)
  const wrapper = document.createElement("div");
  wrapper.classList.add("timer-wrapper");
  wrapper.id = timerId + "-wrapper";
  wrapper.innerHTML = `
    <div class="timer-header">
      <button id="${timerId}-removeBtn" class="remove-timer-button" title="Remove Timer">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="timer-container">
      <div class="timer-inputs">
        <input type="number" id="${timerId}-minutes" placeholder="Minutes" min="0" />
        <input type="number" id="${timerId}-seconds" placeholder="Seconds" min="0" />
      </div>

      <!-- Custom Alarm Dropdown Instead of <select> -->
      <div class="alarm-dropdown" id="${timerId}-alarmDropdown">
        <label for="${timerId}-alarmHidden">Alarm Sound:</label>

        <!-- Hidden input to store the chosen alarm path -->
        <input type="hidden" id="${timerId}-alarmHidden" name="${timerId}-alarmHidden" value="sounds/alarm1.mp3" />

        <!-- The visible “button” / trigger that shows the menu -->
        <div class="alarm-dropdown-trigger" id="${timerId}-dropdownTrigger">Traditional</div>

        <!-- The menu of clickable items -->
        <div class="alarm-dropdown-menu" id="${timerId}-dropdownMenu">
          <div class="alarm-dropdown-option" data-value="sounds/alarm1.mp3">Traditional</div>
          <div class="alarm-dropdown-option" data-value="sounds/alarm2.flac">Digital</div>
          <div class="alarm-dropdown-option" data-value="sounds/alarm3.wav">Oldschool</div>
          <div class="alarm-dropdown-option" data-value="sounds/alarm4.wav">Nighttime</div>
        </div>
      </div>
      <!-- End Custom Alarm Dropdown -->

      <div class="timer-display" id="${timerId}-display">00:00</div>
      <div class="timer-buttons">
        <button id="${timerId}-startResetBtn">
          <i class="fas fa-play"></i> Start
        </button>
        <button id="${timerId}-silenceBtn" class="silence-button">
          <i class="fas fa-bell-slash"></i> Silence
        </button>
      </div>
    </div>

    <div class="event-log-container">
      <div class="threshold-input">
        <label for="${timerId}-thresholdMin">Target Audit Time (min):</label>
        <input type="number" id="${timerId}-thresholdMin" min="0" />
       <span class="tooltip-trigger" id="${timerId}-thresholdTooltipTrigger">
        <i class="fas fa-question-circle"></i>
      </span>
      <div class="tooltip-content" id="${timerId}-thresholdTooltipContent">
        <p>
          Set a desired audit time in minutes. As the timer goes off and the timestamps are logged the value set in this field will give a 
            ✓ for each check that is lower, and a ✘ if the check is late. <p></p> Every check that is late will also show you the time it should have been. <p></p> E.G. entering 60 minutes here would mean that every 55 minute check
            would be good. If you didn't restart the timer until 61 minutes it would show as a bad check and give you the correct timestamp. 
        </p>
      </div>
      </div>
      <table class="event-log-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="${timerId}-eventLogBody"></tbody>
      </table>
    </div>
  `;

  document.getElementById("timersContainer").appendChild(wrapper);

  const tooltipTrigger = wrapper.querySelector(`#${timerId}-thresholdTooltipTrigger`);
  const tooltipContent = wrapper.querySelector(`#${timerId}-thresholdTooltipContent`);

  // Optional: a simple toggle on click
  tooltipTrigger.addEventListener("click", () => {
    // If hidden => show, else hide
    if (tooltipContent.style.display === "block") {
      tooltipContent.style.display = "none";
    } else {
      tooltipContent.style.display = "block";
    }
  });

  // Also, if you want to hide it when clicking outside:
  document.addEventListener("click", (evt) => {
    // If we clicked outside the tooltip + trigger
    if (!tooltipTrigger.contains(evt.target) && !tooltipContent.contains(evt.target)) {
      tooltipContent.style.display = "none";
    }
  });

  // Create a timer object with a 3-state approach: "idle", "running", "ended"
  const t = {
    timerId,
    wrapperEl: wrapper,
    removeBtn: wrapper.querySelector(`#${timerId}-removeBtn`),
    displayEl: wrapper.querySelector(`#${timerId}-display`),
    minutesEl: wrapper.querySelector(`#${timerId}-minutes`),
    secondsEl: wrapper.querySelector(`#${timerId}-seconds`),
    thresholdEl: wrapper.querySelector(`#${timerId}-thresholdMin`),
    logBody: wrapper.querySelector(`#${timerId}-eventLogBody`),
    silenceBtn: wrapper.querySelector(`#${timerId}-silenceBtn`),
    startResetBtn: wrapper.querySelector(`#${timerId}-startResetBtn`),

    // Custom dropdown references
    alarmDropdown: wrapper.querySelector(`#${timerId}-alarmDropdown`),
    alarmHiddenInput: wrapper.querySelector(`#${timerId}-alarmHidden`),
    dropdownTrigger: wrapper.querySelector(`#${timerId}-dropdownTrigger`),
    dropdownMenu: wrapper.querySelector(`#${timerId}-dropdownMenu`),
    dropdownOptions: null, // fill in below

    // Timer states: "idle", "running", "ended"
    currentState: "idle",

    isRunning: false,
    remainingSeconds: 0,
    rafId: null,
    alarmAudio: null,

    // for logging threshold differences
    lastEventTime: null,

    // after the timer ends, only one of (silence|reset) logs
    endCycleActionTaken: false
  };

  // Initialize
  t.displayEl.textContent = "00:00";
  t.silenceBtn.classList.remove("visible");

  // Add to global list
  timers.push(t);

  // Button event listeners
  t.startResetBtn.addEventListener("click", () => handleStartOrReset(t));
  t.silenceBtn.addEventListener("click", () => handleSilence(t));
  t.removeBtn.addEventListener("click", () => removeTimer(t));

  // Setup the custom dropdown logic
  setupAlarmDropdown(t);
}

/****************************************************
 * Remove Timer
 ****************************************************/
function removeTimer(t) {
  // Stop the countdown if still running
  if (t.rafId) {
    cancelAnimationFrame(t.rafId);
    t.rafId = null;
  }
  // Silence any alarm
  if (t.alarmAudio) {
    t.alarmAudio.pause();
    t.alarmAudio.currentTime = 0;
    t.alarmAudio = null;
  }
  // Remove from the DOM
  t.wrapperEl.remove();

  // Remove from timers array
  const idx = timers.indexOf(t);
  if (idx !== -1) {
    timers.splice(idx, 1);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  // After the DOM loads, let's set up the Interval Calc tooltip
  const trigger = document.getElementById("intervalCalcTooltipTrigger");
  const content = document.getElementById("intervalCalcTooltipContent");

  trigger.addEventListener("click", () => {
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  });

  // Click outside to hide (optional)
  document.addEventListener("click", (e) => {
    if (!trigger.contains(e.target) && !content.contains(e.target)) {
      content.style.display = "none";
    }
  });
});

/****************************************************
 * Custom Alarm Dropdown Setup
 ****************************************************/
function setupAlarmDropdown(t) {
  // 1) Toggle the dropdown on trigger click
  t.dropdownTrigger.addEventListener("click", () => {
    t.alarmDropdown.classList.toggle("open");
  });

  // 2) Close if user clicks outside
  document.addEventListener("click", (e) => {
    if (!t.alarmDropdown.contains(e.target)) {
      t.alarmDropdown.classList.remove("open");
    }
  });

  // 3) Each option sets the hidden input & trigger text
  t.dropdownOptions = t.dropdownMenu.querySelectorAll(".alarm-dropdown-option");
  t.dropdownOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const newValue = option.getAttribute("data-value");
      const newLabel = option.textContent.trim();

      t.alarmHiddenInput.value = newValue;
      t.dropdownTrigger.textContent = newLabel;

      // Close menu
      t.alarmDropdown.classList.remove("open");
    });
  });
}

/****************************************************
 * Start/Reset Logic (with 3 states: idle, running, ended)
 ****************************************************/
function handleStartOrReset(t) {
  if (t.currentState === "idle") {
    // We are idle => user clicked "Start"
    logEventWithThreshold(t, "Start");
    startTimer(t);
    t.startResetBtn.innerHTML = `<i class="fas fa-undo"></i> Reset`;
    t.currentState = "running";

  } else if (t.currentState === "running") {
    // We are mid-run => user clicked "Reset" (timer ended early)
    logEventManualStatus(t, "Reset (timer ended early)", "✔ (timer ended early)");

    // Stop old countdown
    if (t.rafId) {
      cancelAnimationFrame(t.rafId);
      t.rafId = null;
    }
    // Restart
    startTimer(t);
    // Stay in "running"

  } else if (t.currentState === "ended") {
    // Timer ended => user clicked "Reset" post-completion
    // Only log if we haven't done a post-end action yet
    if (!t.endCycleActionTaken) {
      logEventWithThreshold(t, "Reset");
      t.endCycleActionTaken = true;
    }

    // Start a new cycle
    startTimer(t);
    t.currentState = "running";
    // We reset endCycleActionTaken = false once the new timer starts
    // because the new cycle can have its own post-end action
    t.endCycleActionTaken = false;
  }
}

/****************************************************
 * Start the Countdown using requestAnimationFrame
 ****************************************************/
function startTimer(t) {
  // Cancel any previous animation frame if exists
  if (t.rafId) {
    cancelAnimationFrame(t.rafId);
    t.rafId = null;
  }

  // Parse user input
  const minutes = parseInt(t.minutesEl.value, 10) || 0;
  const seconds = parseInt(t.secondsEl.value, 10) || 0;
  let totalSeconds = Math.max(0, minutes * 60 + seconds);
  t.remainingSeconds = totalSeconds;

  // Alarm setup
  if (t.alarmAudio) {
    t.alarmAudio.pause();
    t.alarmAudio.currentTime = 0;
  }
  const alarmPath = t.alarmHiddenInput.value;
  t.alarmAudio = new Audio(alarmPath);
  t.alarmAudio.loop = true;

  // Hide silence button
  t.silenceBtn.classList.remove("visible");

  // Reset end cycle action flag
  t.endCycleActionTaken = false;

  // Immediately update display
  updateDisplay(t);

  // Setup timing using performance.now
  t.startTime = performance.now();
  t.endTime = t.startTime + totalSeconds * 1000;

  // Define tick function using requestAnimationFrame
  function tick() {
    const now = performance.now();
    const remainingMs = t.endTime - now;
    if (remainingMs > 0) {
      t.remainingSeconds = Math.ceil(remainingMs / 1000);
      updateDisplay(t);
      t.rafId = requestAnimationFrame(tick);
    } else {
      // Timer done
      t.remainingSeconds = 0;
      updateDisplay(t);
      if (t.alarmAudio) {
        t.alarmAudio.play();
        t.silenceBtn.classList.add("visible");
      }
      t.currentState = "ended";
    }
  }
  // Start the animation loop
  t.rafId = requestAnimationFrame(tick);
}

function updateDisplay(t) {
  const mins = Math.floor(t.remainingSeconds / 60);
  const secs = t.remainingSeconds % 60;
  t.displayEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/****************************************************
 * Silence Alarm
 ****************************************************/
function handleSilence(t) {
  if (t.alarmAudio) {
    t.alarmAudio.pause();
    t.alarmAudio.currentTime = 0;
  }
  t.silenceBtn.classList.remove("visible");

  // Only log once at end of cycle
  if (t.currentState === "ended" && !t.endCycleActionTaken) {
    // Timer ended, user is silencing
    logEventWithThreshold(t, "Silence");
    t.endCycleActionTaken = true;
  }
}

/****************************************************
 * Logging & Threshold Logic
 ****************************************************/
/** 
 * Normal threshold logic:
 *  - If threshold is 0 => blank
 *  - Else if diff < threshold => "✔"
 *  - Else => "✘ (should have been at: HH:MM:SS)"
 */
function logEventWithThreshold(t, actionName) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", { hour12: false });

  const thresholdMin = parseInt(t.thresholdEl.value, 10) || 0;
  let statusCell = "";

  if (thresholdMin === 0) {
    // No threshold => blank
    appendLogRow(t.logBody, timeStr, "");
    t.lastEventTime = now;
    return;
  }

  if (t.lastEventTime !== null) {
    const diffSec = Math.floor((now - t.lastEventTime) / 1000);
    const thresholdSec = thresholdMin * 60;

    if (diffSec < thresholdSec) {
      statusCell = "✔";
    } else {
      // "✘ (should have been at: HH:MM:SS)"
      const correctedMs = t.lastEventTime.getTime() + (thresholdSec - 1) * 1000;
      const correctedDate = new Date(correctedMs);
      const correctedTimeStr = correctedDate.toLocaleTimeString("en-GB", { hour12: false });
      statusCell = `✘ (should have been at: ${correctedTimeStr})`;
    }
  }

  appendLogRow(t.logBody, timeStr, statusCell);
  t.lastEventTime = now;
}

/**
 * Logs an event ignoring threshold, with a fixed status text
 * (for mid-run resets => "✔ (timer ended early)")
 */
function logEventManualStatus(t, actionName, statusText) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", { hour12: false });
  appendLogRow(t.logBody, timeStr, statusText);
  t.lastEventTime = now;
}

/** Utility to append a row to the event log */
function appendLogRow(tbody, timestamp, status) {
  const row = document.createElement("tr");
  const timeCell = document.createElement("td");
  const statusCell = document.createElement("td");

  timeCell.textContent = timestamp;
  statusCell.textContent = status;

  row.appendChild(timeCell);
  row.appendChild(statusCell);
  tbody.appendChild(row);
}

/****************************************************
 * Interval Calculator
 ****************************************************/
function calculateIntervals() {
  const startTimeStr = document.getElementById("startTime").value;
  const hoursVal = parseInt(document.getElementById("hours").value, 10) || 0;

  // Up to 4 intervals (in minutes)
  const intervals = [
    parseInt(document.getElementById("interval1").value, 10) || 0,
    parseInt(document.getElementById("interval2").value, 10) || 0,
    parseInt(document.getElementById("interval3").value, 10) || 0,
    parseInt(document.getElementById("interval4").value, 10) || 0,
  ].filter(iv => iv > 0); // keep only > 0 intervals

  // Validate the start time in HHmmss
  if (!/^\d{5,6}$/.test(startTimeStr)) {
    alert("Please provide a valid start time in HHmmss format.");
    return;
  }

  let hh = 0, mm = 0, ss = 0;
  if (startTimeStr.length === 5) {
    // e.g. "93305" => 9:33:05
    hh = parseInt(startTimeStr.slice(0, 1), 10);
    mm = parseInt(startTimeStr.slice(1, 3), 10);
    ss = parseInt(startTimeStr.slice(3), 10);
  } else {
    // e.g. "133052" => 13:30:52
    hh = parseInt(startTimeStr.slice(0, 2), 10);
    mm = parseInt(startTimeStr.slice(2, 4), 10);
    ss = parseInt(startTimeStr.slice(4), 10);
  }

  // Create a Date for the start time
  const startDate = new Date();
  startDate.setHours(hh, mm, ss, 0);

  // We'll build an array of arrays, one for each interval,
  // storing all timestamps from start to 'hoursVal' hours.
  const intervalsData = intervals.map(iv => {
    const times = [];
    const totalMinutes = hoursVal * 60;

    // Step in multiples of iv up to totalMinutes
    for (let m = 0; m <= totalMinutes; m += iv) {
      // Clone startDate
      const current = new Date(startDate);
      // Add m minutes
      current.setMinutes(current.getMinutes() + m);
      times.push(current);
    }
    return times; // array of Date objects
  });

  // Now we build a single table:
  // The first column is "Index" (1-based).
  // Then one column per interval (with the number of rows = max length among intervals).
  const resultsHeader = document.getElementById("resultsHeader");
  const resultsBody = document.getElementById("resultsBody");

  // Clear old table
  resultsHeader.innerHTML = "";
  resultsBody.innerHTML = "";

  // Find the maximum occurrences among intervals
  const maxOccurrences = Math.max(...intervalsData.map(arr => arr.length));

  // Build the header row
  let headerRow = "<tr><th>Check #</th>";
  intervals.forEach((iv, i) => {
    headerRow += `<th> (${iv} min)</th>`;
  });
  headerRow += "</tr>";
  resultsHeader.innerHTML = headerRow;

  // Build each row
  for (let rowIndex = 0; rowIndex < maxOccurrences; rowIndex++) {
    let rowHTML = `<tr><td>${rowIndex + 1}</td>`;
    // Each column is intervalsData[i][rowIndex] if it exists, or blank
    intervalsData.forEach(timeArray => {
      if (timeArray[rowIndex]) {
        const timeStr = timeArray[rowIndex].toLocaleTimeString("en-GB", { hour12: false });
        rowHTML += `<td>${timeStr}</td>`;
      } else {
        rowHTML += "<td></td>";
      }
    });
    rowHTML += "</tr>";
    resultsBody.innerHTML += rowHTML;
  }
}
