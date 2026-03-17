// frontend/recommend.js
const API = "http://localhost:8000";
document.getElementById("findGymsBtn").addEventListener("click", () => {
  if (!navigator.geolocation) return alert("Location not supported");
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    const goal = prompt("What's your primary goal? e.g., strength, cardio") || "";
    const token = localStorage.getItem("token");
    const res = await fetch(API + "/recommend/gyms", {
      method: "POST",
      headers: {"Content-Type":"application/json","Authorization":"Bearer " + token},
      body: JSON.stringify({ lat, lon, goal })
    });
    if (!res.ok) return alert("Failed to fetch gyms");
    const data = await res.json();
    const el = document.getElementById("gymList");
    el.innerHTML = data.recommendations.map(r => `<div><strong>${r.gym_name}</strong> — ${r.distance_km}km — score ${r.score} — <a href="https://www.google.com/maps/search/?api=1&query=${r.distance_km}">Map</a></div>`).join("");
  }, (err) => alert("Location permission required"));
});
