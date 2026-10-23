/**
 * CoolWatch – Beverage Cooling Time Predictor
 * Client-side logic:
 *  - Collects form values and sends them to Flask /calculate
 *  - Renders the result metrics, equation, explanation
 *  - Draws the cooling curve with Chart.js
 */

"use strict";

// ── References ──────────────────────────────────────────────────────────────
const form         = document.getElementById("coolForm");
const resetBtn     = document.getElementById("resetBtn");
const errorAlert   = document.getElementById("errorAlert");
const errorMsg     = document.getElementById("errorMsg");
const resultsCard  = document.getElementById("resultsCard");
const chartCard    = document.getElementById("chartCard");

// Result metric elements
const kValueEl     = document.getElementById("kValue");
const tValueEl     = document.getElementById("tValue");
const tDisplayEl   = document.getElementById("tDisplay");
const eqFilled     = document.getElementById("equationFilled");
const explanation  = document.getElementById("explanationText");

// Chart.js instance (kept so we can destroy & recreate it on each calculation)
let coolingChart = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Show the error alert with a given message. */
function showError(msg) {
  errorMsg.textContent   = msg;
  errorAlert.classList.remove("d-none");
  errorAlert.classList.add("cw-fade-in");
  resultsCard.classList.add("d-none");
  chartCard.classList.add("d-none");
}

/** Hide the error alert. */
function hideError() {
  errorAlert.classList.add("d-none");
}

/** Show / animate a results section. */
function showCard(el) {
  el.classList.remove("d-none");
  el.classList.add("cw-fade-in");
}

/**
 * Draw (or redraw) the Chart.js cooling curve.
 * Highlights: initial temp, observation point, target temp.
 */
function drawChart(times, temps, T0, T1, t1, T_target, Ts, t_estimated) {
  // Destroy previous instance if it exists
  if (coolingChart) {
    coolingChart.destroy();
    coolingChart = null;
  }

  const ctx = document.getElementById("coolingChart").getContext("2d");

  // --- Annotation datasets (scatter points) ---
  const annotationPoints = [
    { x: 0,           y: T0,        label: `T₀ = ${T0}°C`          },
    { x: t1,          y: T1,        label: `Observed = ${T1}°C`     },
    { x: t_estimated, y: T_target,  label: `Target = ${T_target}°C` },
  ];

  coolingChart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        // Main cooling curve
        {
          label: "Beverage Temperature (°C)",
          data: times.map((t, i) => ({ x: t, y: temps[i] })),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.08)",
          borderWidth: 2.5,
          pointRadius: 0,
          tension: 0.35,
          fill: true,
        },
        // Room temperature baseline
        {
          label: `Room Temp Tₛ = ${Ts}°C`,
          data: [
            { x: times[0],                       y: Ts },
            { x: times[times.length - 1], y: Ts },
          ],
          borderColor: "#94a3b8",
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        },
        // Annotation scatter for key points
        {
          label: "Key Points",
          type: "scatter",
          data: annotationPoints.map(p => ({ x: p.x, y: p.y })),
          backgroundColor: ["#16a34a", "#f97316", "#dc2626"],
          pointRadius: 7,
          pointHoverRadius: 9,
          showLine: false,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "nearest", axis: "x", intersect: false },
      plugins: {
        legend: {
          labels: { font: { size: 12 }, color: "#1e293b" },
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const pt = ctx.raw;
              // For the scatter key-points dataset, show a custom label
              if (ctx.datasetIndex === 2) {
                const labels = annotationPoints;
                return ` ${labels[ctx.dataIndex].label}`;
              }
              return ` ${pt.y.toFixed(2)}°C at t = ${pt.x.toFixed(2)} min`;
            },
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "Time (minutes)", font: { weight: "600" }, color: "#475569" },
          grid: { color: "rgba(0,0,0,0.05)" },
          ticks: { color: "#475569" },
        },
        y: {
          title: { display: true, text: "Temperature (°C)", font: { weight: "600" }, color: "#475569" },
          grid: { color: "rgba(0,0,0,0.05)" },
          ticks: { color: "#475569" },
        },
      },
    },
  });
}

// ── Form submit ───────────────────────────────────────────────────────────────
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  hideError();

  // --- Read & basic client-side presence check ---
  const T0       = form.T0.value.trim();
  const Ts       = form.Ts.value.trim();
  const T1       = form.T1.value.trim();
  const t1       = form.t1.value.trim();
  const T_target = form.T_target.value.trim();

  if ([T0, Ts, T1, t1, T_target].some(v => v === "")) {
    showError("Please fill in all five fields before calculating.");
    return;
  }

  // --- Button loading state ---
  const calcBtn = form.querySelector('button[type="submit"]');
  const origHTML = calcBtn.innerHTML;
  calcBtn.disabled = true;
  calcBtn.innerHTML = `<span class="cw-spinning"></span> Calculating…`;

  try {
    const response = await fetch("/calculate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ T0, Ts, T1, t1, T_target }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || "An unexpected error occurred.");
      return;
    }

    // --- Populate metrics ---
    kValueEl.textContent  = data.k.toFixed(6);
    tValueEl.textContent  = data.t_estimated.toFixed(2);
    tDisplayEl.textContent = data.time_display;

    // --- Filled-in equation ---
    eqFilled.innerHTML =
      `T(t) = ${data.Ts} + (${data.T0} − ${data.Ts}) · e<sup>−${data.k.toFixed(6)} × t</sup>`;

    // --- Explanation paragraph ---
    explanation.innerHTML = `
      <strong>Result:</strong> Your beverage starts at <strong>${data.T0}°C</strong>.
      In a room at <strong>${data.Ts}°C</strong>, you measured <strong>${data.T1}°C</strong>
      after <strong>${data.t1} minutes</strong>, giving a cooling constant
      <strong>k = ${data.k.toFixed(6)} min⁻¹</strong>.
      <br /><br />
      Based on this, the beverage is predicted to reach
      <strong>${data.T_target}°C</strong> in approximately
      <strong>${data.t_estimated.toFixed(2)} minutes</strong>
      (<strong>${data.time_display}</strong>).
      <br /><br />
      <em class="text-muted" style="font-size:0.82rem;">
        ⚠ This prediction assumes a constant room temperature (${data.Ts}°C) and a
        constant cooling rate (k = ${data.k.toFixed(6)}). Stirring, drafts, or
        container shape may alter real-world results.
      </em>
    `;

    // --- Show result and chart cards ---
    showCard(resultsCard);

    // Draw the chart
    drawChart(
      data.chart_times,
      data.chart_temps,
      data.T0,
      data.T1,
      data.t1,
      data.T_target,
      data.Ts,
      data.t_estimated
    );
    showCard(chartCard);

    // Smooth-scroll to results on small screens
    if (window.innerWidth < 992) {
      resultsCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }

  } catch (err) {
    showError("Could not connect to the server. Make sure the Flask app is running.");
  } finally {
    calcBtn.disabled  = false;
    calcBtn.innerHTML = origHTML;
  }
});

// ── Reset button ──────────────────────────────────────────────────────────────
resetBtn.addEventListener("click", function () {
  form.reset();
  hideError();
  resultsCard.classList.add("d-none");
  chartCard.classList.add("d-none");

  if (coolingChart) {
    coolingChart.destroy();
    coolingChart = null;
  }

  // Focus back to first field for usability
  form.T0.focus();
});
