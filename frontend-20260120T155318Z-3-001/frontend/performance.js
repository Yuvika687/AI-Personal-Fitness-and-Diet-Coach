// frontend/performance.js
const API = "http://localhost:8000";
async function loadPerformance() {
  const token = localStorage.getItem("token");
  const res = await fetch(API + "/performance/history", { headers: { "Authorization": "Bearer " + token }});
  if (!res.ok) return;
  const data = await res.json();
  // draw basic chart of overall scores
  const labels = data.map(d => new Date(d.date).toLocaleDateString()).reverse();
  const scores = data.map(d => d.overall).reverse();
  // minimal Chart.js usage (ensure Chart.js is included)
  if (window.perfChart) window.perfChart.destroy();
  const ctx = document.getElementById("perfChart").getContext("2d");
  window.perfChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Overall Score', data: scores, tension:0.3 }]},
    options: { responsive:true, maintainAspectRatio:false }
  });

  document.getElementById("perfHistory").innerHTML = data.map(d => `<div>${d.exercise} — ${d.reps} reps — form ${d.form}</div>`).join("");
}
loadPerformance();
