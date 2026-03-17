// AI Gym Pro - Ultimate Fitness Assistant
const API_BASE = "http://localhost:8000";
let currentToken = localStorage.getItem("token");
let currentUser = null;
let progressChart = null;

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 AI Gym Pro Ultimate Edition Loaded!");

    if (currentToken) {
        checkAuth();
    }

    // Auto-fill email if saved
    const savedEmail = localStorage.getItem("saved_email");
    if (savedEmail) {
        const emailInput = document.getElementById("login-email");
        if (emailInput) emailInput.value = savedEmail;
    }
});

// Authentication
// Authentication
async function login() {
    // e.preventDefault(); // Not needed for onclick
    // element check to avoid null error
    const emailEl = document.getElementById("login-email");
    const passEl = document.getElementById("login-password");

    if (!emailEl || !passEl) {
        showToast("Error: Login form not found", "fa-exclamation-circle");
        return;
    }

    const email = emailEl.value;
    const password = passEl.value;

    if (!email || !password) {
        showToast("Please enter email and password", "fa-exclamation-circle");
        return;
    }

    showToast("🔐 Signing you in...", "fa-circle-notch fa-spin");

    try {
        const response = await fetch(API_BASE + "/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentToken = data.access_token;
            currentUser = data.user;
            localStorage.setItem("token", currentToken);
            localStorage.setItem("saved_email", email); // Remember user
            showToast("🎉 Welcome back! Dashboard loaded.", "fa-check-circle");
            await initializeDashboard();
        } else {
            showToast("❌ " + (data.detail || "Login failed"), "fa-times-circle");
        }
    } catch (error) {
        console.error(error);
        showToast("🌐 Network error. Check backend.", "fa-wifi");
    }
}

async function register() {
    // e.preventDefault();
    const nameEl = document.getElementById("reg-name");
    const emailEl = document.getElementById("reg-email");
    const passEl = document.getElementById("reg-password");
    const ageEl = document.getElementById("reg-age");
    const genderEl = document.getElementById("reg-gender");

    if (!nameEl || !emailEl || !passEl) {
        showToast("Error: Registration form inputs not found", "fa-exclamation-circle");
        return;
    }

    const finalEmail = emailEl.value;
    const finalPass = passEl.value;
    const finalName = nameEl.value;

    if (!finalEmail || !finalPass || !finalName) {
        showToast("Please fill in Name, Email and Password", "fa-exclamation-circle");
        return;
    }

    showToast("👤 Creating your account...", "fa-circle-notch fa-spin");

    const userData = {
        email: finalEmail,
        password: finalPass,
        full_name: finalName,
        age: parseInt(ageEl.value) || null,
        gender: genderEl.value || null,
        height_cm: null, // Not in simplified form
        weight_kg: null, // Not in simplified form
        activity_level: "moderate"
    };

    try {
        const response = await fetch(API_BASE + "/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            showToast("✅ Account created! Redirecting...", "fa-check-circle");
            localStorage.setItem("saved_email", userData.email); // Remember user
            setTimeout(() => {
                showAuth("login"); // Switch tab
                const loginEmail = document.getElementById("login-email");
                if (loginEmail) loginEmail.value = userData.email;
            }, 1000);
        } else {
            showToast("❌ " + (data.detail || "Registration failed"), "fa-times-circle");
        }
    } catch (error) {
        console.error(error);
        showToast("🌐 Network error. Check backend.", "fa-wifi");
    }
}

// Dashboard
async function initializeDashboard() {
    showApp();
    try {
        await loadUserProfile();
        await updateQuickStats();
        // await loadRecentActivity(); // Optional
    } catch (e) {
        console.log("Initial load partial fail", e);
    }
    // initializeProgressChart(); // If chart exists
    // showTab('dashboard'); // If tabs exist
    // loadAchievements();
}

function showApp() {
    document.getElementById("auth-section").classList.add("hidden");
    document.getElementById("app-section").classList.remove("hidden");
}

// Tab Management
function showAuth(type) {
    // Buttons
    const btns = document.querySelectorAll('#auth-section .btn-sm');
    btns.forEach(b => {
        if (b.textContent.toLowerCase().includes(type)) {
            b.classList.add('active');
            b.style.background = 'var(--bg-card)';
            b.style.color = 'var(--text-main)';
            b.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        } else {
            b.classList.remove('active');
            b.style.background = 'transparent';
            b.style.color = 'var(--text-muted)';
            b.style.boxShadow = 'none';
        }
    });

    // Forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (type === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

// Legacy alias if needed
function switchTab(tab) {
    showAuth(tab);
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.style.display = 'none'; // Use display none/block for cleaner toggling
        tab.classList.remove("active");
    });

    // Remove active class from all nav tabs
    document.querySelectorAll(".nav-tab").forEach(navTab => {
        navTab.classList.remove("active");
    });

    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.style.display = 'block';
        setTimeout(() => selectedTab.classList.add("active"), 10); // Fade in
    }

    // Activate corresponding nav tab
    const navBtn = document.querySelector(`.nav-tab[onclick="showTab('${tabName}')"]`);
    if (navBtn) navBtn.classList.add("active");

    // Load tab-specific data
    switch (tabName) {
        case 'workouts':
            loadWorkoutHistory();
            break;
        case 'progress':
            updateProgressChart();
            break;
        case 'profile':
            loadProfileData();
            break;
    }
}

// Workout Functions
async function getWorkoutSuggestions() {
    try {
        showLoading("workout-suggestions", "💪 Generating smart workout recommendations...");

        const response = await fetch(API_BASE + "/diet/smart-workout-plan", {
            headers: { "Authorization": "Bearer " + currentToken }
        });

        if (response.ok) {
            const data = await response.json();
            const workoutElement = document.getElementById("workout-suggestions");

            let html = `
                <div class="workout-plan">
                    <h3>🎯 Your AI-Generated Workout Plan</h3>
                    <div class="ai-badge">Powered by AI</div>
                    <div class="workout-content">
                        ${data.workout_plan.replace(/\n/g, "<br>")}
                    </div>
                    ${data.is_ai_generated ? "<div class='ai-footer'>✨ Personalized using advanced AI</div>" : ""}
                </div>
            `;

            workoutElement.innerHTML = html;
            workoutElement.classList.remove("hidden");
        } else {
            showAlert("workout-suggestions", "❌ Failed to generate AI workout plan", "error");
        }
    } catch (error) {
        showAlert("workout-suggestions", "🌐 Error connecting to AI service", "error");
    }
}

async function generateDietPlan() {
    try {
        showLoading("diet-plan", "🍳 AI is crafting your personalized nutrition plan...");

        const response = await fetch(API_BASE + "/diet/generate-plan", {
            headers: { "Authorization": "Bearer " + currentToken }
        });

        if (response.ok) {
            const data = await response.json();
            const dietPlanElement = document.getElementById("diet-plan");

            let html = `
                <div class="ai-diet-plan">
                    <h3>🍎 Your AI-Generated Diet Plan</h3>
                    <div class="ai-badge">Powered by AI</div>
                    <div class="diet-content">
                        ${data.diet_plan.replace(/\n/g, "<br>")}
                    </div>
                </div>
            `;

            dietPlanElement.innerHTML = html;
            dietPlanElement.classList.remove("hidden");
            showAlert("diet-plan", "✅ Your AI-generated diet plan is ready!", "success");
        } else {
            showAlert("diet-plan", "❌ Failed to generate diet plan", "error");
        }
    } catch (error) {
        showAlert("diet-plan", "🌐 Error connecting to AI service", "error");
    }
}

async function getDietTips() {
    try {
        showLoading("diet-tips", "🧠 Gathering expert nutrition tips...");

        const response = await fetch(API_BASE + "/diet/quick-tips", {
            headers: { "Authorization": "Bearer " + currentToken }
        });

        if (response.ok) {
            const data = await response.json();
            const tipsElement = document.getElementById("diet-tips");

            let html = `<div class="nutrition-tips"><h3>🍎 Expert Nutrition Advice</h3>`;
            if (data.tips && Array.isArray(data.tips)) {
                data.tips.forEach((tip, index) => {
                    html += `<div class="tip-item">${index + 1}. ${tip}</div>`;
                });
            }
            html += `</div>`;

            tipsElement.innerHTML = html;
            tipsElement.classList.remove("hidden");
        } else {
            showAlert("diet-tips", "❌ Failed to load nutrition tips", "error");
        }
    } catch (error) {
        showAlert("diet-tips", "🌐 Error loading tips", "error");
    }
}

async function calculateBMI() {
    try {
        showLoading("health-metrics", "📊 Calculating your health metrics...");

        const response = await fetch(API_BASE + "/diet/bmi", {
            headers: { "Authorization": "Bearer " + currentToken }
        });

        if (response.ok) {
            const data = await response.json();
            const metricsElement = document.getElementById("health-metrics");

            let html = `
                <div class="health-metrics">
                    <h3>❤️ Your Health Dashboard</h3>
            `;

            if (data.error) {
                html += `<p>${data.message}</p>`;
            } else {
                const bmiClass = getBMIClass(data.bmi);
                html += `
                    <div class="metric-row">
                        <strong>BMI Score:</strong> <span class="metric-value ${bmiClass}">${data.bmi}</span>
                    </div>
                    <div class="metric-row">
                        <strong>Category:</strong> <span class="metric-category">${data.category}</span>
                    </div>
                    <div class="metric-row">
                        <strong>Height:</strong> ${data.height} cm
                    </div>
                    <div class="metric-row">
                        <strong>Weight:</strong> ${data.weight} kg
                    </div>
                    <div class="metric-row">
                        <strong>Recommendation:</strong> ${data.recommendation}
                    </div>
                    <div class="bmi-chart">
                        <small>Underweight: <18.5 | Normal: 18.5-24.9 | Overweight: 25-29.9 | Obese: 30+</small>
                    </div>
                `;
            }

            html += `</div>`;
            metricsElement.innerHTML = html;
            metricsElement.classList.remove("hidden");
        } else {
            showAlert("health-metrics", "❌ Failed to calculate BMI", "error");
        }
    } catch (error) {
        showAlert("health-metrics", "🌐 Error calculating metrics", "error");
    }
}

function getBMIClass(bmi) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
}

// Workout Logging
document.getElementById("workoutForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const exercise = document.getElementById("exercise-name").value;
    if (!exercise) {
        showAlert("workout-history", "❌ Please enter an exercise name", "error");
        return;
    }

    showLoading("workout-history", "💪 Logging your workout...");

    const workoutData = {
        exercise_name: exercise,
        reps: parseInt(document.getElementById("exercise-reps").value) || 10,
        sets: parseInt(document.getElementById("exercise-sets").value) || 3,
        weight_kg: parseFloat(document.getElementById("exercise-weight").value) || 0,
        duration_min: parseInt(document.getElementById("exercise-duration").value) || 30
    };

    try {
        const response = await fetch(API_BASE + "/workouts/start-session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + currentToken
            },
            body: JSON.stringify(workoutData)
        });

        if (response.ok) {
            const data = await response.json();
            showAlert("workout-history", "✅ Workout logged successfully!", "success");
            document.getElementById("workoutForm").reset();
            await loadWorkoutHistory();
            updateQuickStats();
            addRecentActivity(`🏋️‍♂️ Logged ${exercise} workout`);
            checkAchievements();
        } else {
            showAlert("workout-history", "❌ Failed to log workout. Please try again.", "error");
        }
    } catch (error) {
        showAlert("workout-history", "🌐 Network error. Please try again.", "error");
    }
});

async function loadWorkoutHistory() {
    try {
        const response = await fetch(API_BASE + "/workouts/my-workouts", {
            headers: { "Authorization": "Bearer " + currentToken }
        });

        if (response.ok) {
            const workouts = await response.json();
            const historyElement = document.getElementById("workout-history");

            if (!workouts || workouts.length === 0) {
                historyElement.innerHTML = "<p>No workouts logged yet. Start your fitness journey! 🏋️‍♂️</p>";
                return;
            }

            let html = workouts.slice(0, 10).map(workout => `
                <div class="workout-item">
                    <strong>${workout.exercise_name}</strong>
                    <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                        <span>${workout.sets || 0} sets × ${workout.reps || 0} reps</span>
                        <span>${workout.calories_estimated || 0} cal</span>
                    </div>
                    <small>${new Date(workout.started_at).toLocaleDateString()}</small>
                </div>
            `).join('');

            historyElement.innerHTML = html;
        }
    } catch (error) {
        console.error("Error loading workout history:", error);
        document.getElementById("workout-history").innerHTML = "<p>Error loading workout history. Please try again.</p>";
    }
}

// Profile Management
async function loadUserProfile() {
    try {
        const response = await fetch(API_BASE + "/auth/me", {
            headers: { "Authorization": "Bearer " + currentToken }
        });

        if (response.ok) {
            currentUser = await response.json();
            updateProfileDisplay();
        }
    } catch (error) {
        console.error("Error loading user profile:", error);
    }
}

function updateProfileDisplay() {
    if (currentUser) {
        document.getElementById("user-name").textContent = currentUser.full_name || currentUser.email;
    }
}

function loadProfileData() {
    if (currentUser) {
        document.getElementById("profile-email").value = currentUser.email || "";
        document.getElementById("profile-name").value = currentUser.full_name || "";
        document.getElementById("profile-age").value = currentUser.age || "";
        document.getElementById("profile-gender").value = currentUser.gender || "male";
        document.getElementById("profile-height").value = currentUser.height_cm || "";
        document.getElementById("profile-weight").value = currentUser.weight_kg || "";
        document.getElementById("profile-activity").value = currentUser.activity_level || "moderate";
    }
}

async function updateProfile() {
    const profileData = {
        full_name: document.getElementById("profile-name").value,
        age: parseInt(document.getElementById("profile-age").value) || null,
        gender: document.getElementById("profile-gender").value,
        height_cm: parseFloat(document.getElementById("profile-height").value) || null,
        weight_kg: parseFloat(document.getElementById("profile-weight").value) || null,
        activity_level: document.getElementById("profile-activity").value
    };

    showAlert("user-profile", "🔄 Updating profile...", "info");

    // Note: You need to implement a profile update endpoint in your backend
    setTimeout(() => {
        showAlert("user-profile", "✅ Profile updated successfully!", "success");
        currentUser = { ...currentUser, ...profileData };
    }, 1000);
}

// Stats Management
async function updateQuickStats() {
    try {
        const response = await fetch(API_BASE + "/workouts/today-stats", {
            headers: { "Authorization": "Bearer " + currentToken }
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById("quick-workouts").textContent = data.total_workouts_today || 0;
            document.getElementById("quick-calories").textContent = data.total_calories_burned || 0;
        } else {
            // Use localStorage as fallback
            const stats = JSON.parse(localStorage.getItem('quickStats') || '{"workouts":0,"calories":0,"steps":0,"water":0}');
            document.getElementById("quick-workouts").textContent = stats.workouts;
            document.getElementById("quick-calories").textContent = stats.calories;
            document.getElementById("quick-steps").textContent = stats.steps || 0;
            document.getElementById("quick-water").textContent = stats.water || "0.0";
        }
    } catch (error) {
        console.error("Error updating quick stats:", error);
    }
}
// In your main app.js - Update the workout form submission
async function handleWorkoutSubmit(e) {
    e.preventDefault();

    const exercise = document.getElementById('exercise-name').value;
    if (!exercise) {
        showAlert('workout-history', '❌ Please enter an exercise name', 'error');
        return;
    }

    showLoading('workout-history', '💪 Logging your workout...');

    const workoutData = {
        exercise_name: exercise,
        reps: parseInt(document.getElementById('exercise-reps').value) || 10,
        sets: parseInt(document.getElementById('exercise-sets').value) || 3,
        weight_kg: parseFloat(document.getElementById('exercise-weight').value) || 0,
        duration_min: parseInt(document.getElementById('exercise-duration').value) || 30
    };

    try {
        const response = await fetch(API_BASE + '/workouts/start-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + currentToken
            },
            body: JSON.stringify(workoutData)
        });

        if (response.ok) {
            const data = await response.json();
            showAlert('workout-history', '✅ Workout logged successfully!', 'success');

            // Also log to habit tracker
            await logWorkoutToHabitTracker(exercise);

            document.getElementById('workoutForm').reset();
            loadWorkoutHistory();
            updateQuickStats();
        } else {
            const error = await response.json();
            showAlert('workout-history', `❌ ${error.detail || 'Failed to log workout'}`, 'error');
        }
    } catch (error) {
        console.error('Workout logging error:', error);
        showAlert('workout-history', '🌐 Network error. Please try again.', 'error');
    }
}

// Helper function to also log to habit tracker
async function logWorkoutToHabitTracker(exerciseName) {
    try {
        // Get current habit log if exists
        const response = await fetch(API_BASE + '/tracking/history', {
            headers: { 'Authorization': 'Bearer ' + currentToken }
        });

        if (response.ok) {
            const history = await response.json();
            const today = new Date().toISOString().split('T')[0];
            const todayLog = history.find(log =>
                new Date(log.date).toISOString().split('T')[0] === today
            );

            if (todayLog) {
                // Update existing log
                const updateData = {
                    workouts: (todayLog.workouts || 0) + 1,
                    water: todayLog.water || 0,
                    steps: todayLog.steps || 0
                };

                await fetch(API_BASE + '/tracking/log', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + currentToken
                    },
                    body: JSON.stringify(updateData)
                });
            } else {
                // Create new log
                const newLog = {
                    workouts: 1,
                    water: 0,
                    steps: 0
                };

                await fetch(API_BASE + '/tracking/log', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + currentToken
                    },
                    body: JSON.stringify(newLog)
                });
            }
        }
    } catch (error) {
        console.log('Error logging to habit tracker:', error);
        // Silently fail - this is just a convenience feature
    }
}
// Gym Recommendation Function - UPDATED
async function findNearbyGyms() {
    try {
        showLoading("gym-results", "📍 Finding nearby gyms...");

        // Make sure the gym results container is visible
        const gymResultsElement = document.getElementById("gym-results");
        if (gymResultsElement) {
            gymResultsElement.classList.remove("hidden");
        }

        // Get user's location
        if (!navigator.geolocation) {
            showAlert("gym-results", "❌ Geolocation is not supported by your browser", "error");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Ask for user's fitness goal
                const goal = prompt("What's your primary fitness goal? (e.g., strength, cardio, yoga, crossfit)") || "general";

                try {
                    const response = await fetch(API_BASE + "/recommend/gyms", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + currentToken
                        },
                        body: JSON.stringify({
                            lat: lat,
                            lon: lon,
                            goal: goal
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        displayGymResults(data.recommendations, lat, lon);
                    } else {
                        showAlert("gym-results", "❌ Failed to find gyms. Using demo data.", "error");
                        displayDemoGyms();
                    }
                } catch (error) {
                    console.error("Gym API error:", error);
                    showAlert("gym-results", "🌐 Network error. Showing demo gyms.", "error");
                    displayDemoGyms();
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                let errorMessage = "Could not access your location. ";

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += "Please enable location permissions.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage += "Location request timed out.";
                        break;
                    default:
                        errorMessage += "An unknown error occurred.";
                }

                showAlert("gym-results", errorMessage, "error");
                // Show demo gyms as fallback
                displayDemoGyms();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } catch (error) {
        console.error("Find gyms error:", error);
        showAlert("gym-results", "❌ Error finding gyms", "error");
    }
}

// Display Gym Results
function displayGymResults(gyms, userLat, userLon) {
    const resultsElement = document.getElementById("gym-results");
    if (!resultsElement) {
        console.error("Gym results element not found!");
        return;
    }

    if (!gyms || gyms.length === 0) {
        resultsElement.innerHTML = `
            <div class="no-gyms">
                <h3>🏢 No Gyms Found Nearby</h3>
                <p>Try expanding your search radius or check back later.</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="gym-results-header">
            <h3><i class="fas fa-dumbbell"></i> Nearby Gyms</h3>
            <p>Found ${gyms.length} gym${gyms.length !== 1 ? 's' : ''} near you</p>
        </div>
    `;

    html += gyms.map((gym, index) => `
        <div class="gym-card">
            <div class="gym-rank">#${index + 1}</div>
            <div class="gym-info">
                <h4>${gym.gym_name || 'Unnamed Gym'}</h4>
                <p class="gym-address">
                    <i class="fas fa-map-marker-alt"></i> ${gym.address || 'Address not available'}
                </p>
                <div class="gym-stats">
                    <span class="gym-distance">
                        <i class="fas fa-walking"></i> ${gym.distance_km ? gym.distance_km.toFixed(1) + ' km' : 'Distance unknown'}
                    </span>
                    <span class="gym-rating">
                        <i class="fas fa-star"></i> ${gym.score ? gym.score.toFixed(1) + '/10' : 'No rating'}
                    </span>
                </div>
                ${gym.facilities ? `<p class="gym-facilities"><strong>Facilities:</strong> ${gym.facilities.join(', ')}</p>` : ''}
            </div>
            <div class="gym-actions">
                <button class="btn btn-sm" onclick="openGoogleMaps(${userLat}, ${userLon}, ${gym.lat || 0}, ${gym.lon || 0})">
                    <i class="fas fa-directions"></i> Directions
                </button>
                <button class="btn btn-sm btn-outline" onclick="saveGym('${gym.gym_name}')">
                    <i class="fas fa-bookmark"></i> Save
                </button>
            </div>
        </div>
    `).join('');

    resultsElement.innerHTML = html;
    resultsElement.classList.remove("hidden");
}

// Display Demo Gyms (Fallback)
function displayDemoGyms() {
    const demoGyms = [
        {
            gym_name: "Elite Fitness Center",
            address: "123 Fitness Street, Your City",
            distance_km: 1.2,
            score: 8.7,
            facilities: ["Weights", "Cardio", "Pool", "Yoga"]
        },
        {
            gym_name: "Powerhouse Gym",
            address: "456 Muscle Avenue, Your City",
            distance_km: 2.5,
            score: 9.2,
            facilities: ["Crossfit", "Sauna", "Personal Training"]
        },
        {
            gym_name: "Zen Yoga & Wellness",
            address: "789 Peace Road, Your City",
            distance_km: 3.1,
            score: 8.9,
            facilities: ["Yoga Studio", "Meditation", "Massage"]
        }
    ];

    displayGymResults(demoGyms, 0, 0);
}

// Open Google Maps with directions
function openGoogleMaps(userLat, userLon, gymLat, gymLon) {
    if (gymLat === 0 || gymLon === 0) {
        alert("Location data not available for this gym.");
        return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${gymLat},${gymLon}&travelmode=driving`;
    window.open(url, '_blank');
}

// Save gym to favorites
function saveGym(gymName) {
    const savedGyms = JSON.parse(localStorage.getItem('savedGyms') || '[]');

    if (!savedGyms.includes(gymName)) {
        savedGyms.push(gymName);
        localStorage.setItem('savedGyms', JSON.stringify(savedGyms));
        showAlert("gym-results", `✅ Saved "${gymName}" to favorites!`, "success");
    } else {
        showAlert("gym-results", `ℹ️ "${gymName}" is already saved`, "info");
    }
}

// Load saved gyms
function loadSavedGyms() {
    const savedGyms = JSON.parse(localStorage.getItem('savedGyms') || '[]');
    if (savedGyms.length > 0) {
        console.log("Saved gyms:", savedGyms);
    }
}

async function loadRecentActivity() {
    const activityElement = document.getElementById("recent-activity");

    // Check if first time user
    const firstVisit = localStorage.getItem('firstVisit');
    if (!firstVisit) {
        localStorage.setItem('firstVisit', 'true');
        activityElement.innerHTML = `
            <div class="workout-item">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 8px; height: 8px; background: #D4AF37; border-radius: 50%;"></div>
                    <span>🎉 Welcome to AI Gym Pro! Your fitness journey starts now!</span>
                </div>
                <small>${new Date().toLocaleDateString()}</small>
            </div>
            <div class="workout-item">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 8px; height: 8px; background: #4CAF50; border-radius: 50%;"></div>
                    <span>📱 Download the app for notifications and reminders</span>
                </div>
                <small>Tip of the day</small>
            </div>
        `;
        return;
    }

    // Load from localStorage
    const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');

    if (activities.length === 0) {
        activityElement.innerHTML = `
            <div class="workout-item">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 8px; height: 8px; background: #4CAF50; border-radius: 50%;"></div>
                    <span>Start your fitness journey! Log your first workout.</span>
                </div>
                <small>Ready when you are!</small>
            </div>
        `;
        return;
    }

    let html = activities.slice(0, 5).map(activity => `
        <div class="workout-item">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 8px; height: 8px; background: #4CAF50; border-radius: 50%;"></div>
                <span>${activity.text}</span>
            </div>
            <small>${activity.time}</small>
        </div>
    `).join('');

    activityElement.innerHTML = html;
}

function addRecentActivity(text) {
    const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
    activities.unshift({
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Keep only last 10 activities
    if (activities.length > 10) {
        activities.pop();
    }

    localStorage.setItem('recentActivities', JSON.stringify(activities));
    loadRecentActivity();
}

// Achievements
function loadAchievements() {
    const achievements = JSON.parse(localStorage.getItem('achievements') || '{"firstLogin":true,"firstWorkout":false,"threeDayStreak":false,"dietPlan":false}');

    const achievementsList = document.getElementById("achievements-list");

    let html = '';

    // First Login Achievement (always unlocked for logged in users)
    html += `
        <div class="achievement-item unlocked">
            <strong>👋 Welcome Aboard!</strong>
            <p>Successfully logged into AI Gym Pro</p>
        </div>
    `;

    // First Workout
    if (achievements.firstWorkout) {
        html += `
            <div class="achievement-item unlocked">
                <strong>💪 First Workout</strong>
                <p>Logged your first workout session</p>
            </div>
        `;
    } else {
        html += `
            <div class="achievement-item">
                <strong>💪 First Workout</strong>
                <p>Log your first workout to unlock</p>
            </div>
        `;
    }

    // Three Day Streak
    if (achievements.threeDayStreak) {
        html += `
            <div class="achievement-item unlocked">
                <strong>🔥 3-Day Streak</strong>
                <p>Completed workouts for 3 consecutive days</p>
            </div>
        `;
    } else {
        html += `
            <div class="achievement-item">
                <strong>🔥 3-Day Streak</strong>
                <p>Workout for 3 days in a row</p>
            </div>
        `;
    }

    // Diet Plan
    if (achievements.dietPlan) {
        html += `
            <div class="achievement-item unlocked">
                <strong>🍎 Nutrition Master</strong>
                <p>Generated your first diet plan</p>
            </div>
        `;
    } else {
        html += `
            <div class="achievement-item">
                <strong>🍎 Nutrition Master</strong>
                <p>Generate a diet plan to unlock</p>
            </div>
        `;
    }

    // 7-Day Streak
    html += `
        <div class="achievement-item">
            <strong>🏆 7-Day Streak</strong>
            <p>Complete workouts for 7 consecutive days</p>
        </div>
    `;

    achievementsList.innerHTML = html;
}

function checkAchievements() {
    const achievements = JSON.parse(localStorage.getItem('achievements') || '{"firstLogin":true,"firstWorkout":false,"threeDayStreak":false,"dietPlan":false}');

    // Check workout count for first workout achievement
    const workoutCount = parseInt(localStorage.getItem('totalWorkouts') || '0');
    if (workoutCount >= 1 && !achievements.firstWorkout) {
        achievements.firstWorkout = true;
        showAlert('achievements-list', '🎉 Achievement Unlocked: First Workout!', 'success');
    }

    localStorage.setItem('achievements', JSON.stringify(achievements));
    loadAchievements();
}

// Progress Chart
function initializeProgressChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Workouts Completed',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#D4AF37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#b0b0b0'
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#b0b0b0'
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 5,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#b0b0b0',
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateProgressChart() {
    if (progressChart) {
        const workouts = JSON.parse(localStorage.getItem('weeklyWorkouts') || '[0,0,0,0,0,0,0]');
        progressChart.data.datasets[0].data = workouts;
        progressChart.update();
    }
}

// Goals
document.getElementById("goalsForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const goals = {
        targetWeight: document.getElementById("target-weight").value,
        workoutGoal: document.getElementById("workout-goal").value,
        targetDate: document.getElementById("target-date").value
    };

    localStorage.setItem("fitnessGoals", JSON.stringify(goals));
    showAlert("goalsForm", "🎯 Goals set successfully! You can do it! 💪", "success");

    // Add to recent activity
    addRecentActivity(`🎯 Set new goal: ${goals.workoutGoal} workouts/week`);
});

// Logout
function logout() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem("token");
    document.getElementById("app-section").classList.add("hidden");
    document.getElementById("auth-section").classList.remove("hidden");
    switchTab("login");
    showAlert("login-alert", "👋 Logged out successfully. See you soon!", "info");
}

// Authentication Check
async function checkAuth() {
    try {
        const response = await fetch(API_BASE + "/auth/me", {
            headers: { "Authorization": "Bearer " + currentToken }
        });

        if (response.ok) {
            currentUser = await response.json();
            initializeDashboard();
        } else {
            logout();
        }
    } catch (error) {
        console.error("Auth check failed:", error);
        logout();
    }
}

// Utility Functions
// Utility Functions
function showToast(message, icon = "fa-info-circle") {
    // Create toast container if not exists
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        // Inline styles for container
        container.style.position = "fixed";
        container.style.bottom = "30px";
        container.style.left = "50%";
        container.style.transform = "translateX(-50%)";
        container.style.zIndex = "2000";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "10px";
        document.body.appendChild(container);
    }

    // Create toast
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.style.background = "rgba(15, 23, 42, 0.9)";
    toast.style.color = "#fff";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "50px";
    toast.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
    toast.style.backdropFilter = "blur(10px)";
    toast.style.border = "1px solid rgba(255,255,255,0.1)";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.gap = "12px";
    toast.style.minWidth = "300px";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    toast.style.transition = "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";

    toast.innerHTML = `<i class="fas ${icon}" style="color: #06b6d4;"></i> <span>${message}</span>`;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    }, 10);

    // Remove after 3s
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Legacy support
function showAlert(elementId, message, type) {
    if (type === 'error') showToast(message, "fa-exclamation-triangle");
    else if (type === 'success') showToast(message, "fa-check");
    else showToast(message, "fa-info");
}

function showLoading(elementId, message) {
    showToast(message, "fa-circle-notch fa-spin");
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('light-mode');

    // Save preference
    const isLight = body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');

    // Update Icon
    const icon = document.querySelector('.header-btn[onclick="toggleTheme()"] i') || document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
    }

    showToast(isLight ? "Switched to Light Mode" : "Switched to Dark Mode", isLight ? "fa-sun" : "fa-moon");
}

function openVisionAI() {
    window.location.href = "vision/pose.html";
}

function openHabitTracker() {
    window.location.href = "habit.html";
}

function logWorkout() {
    showTab('workouts');
    document.getElementById('exercise-name').focus();
}

function exportData() {
    showAlert("user-profile", "📤 Export feature coming soon!", "info");
}

function clearData() {
    if (confirm("Are you sure you want to clear all local data? This will log you out.")) {
        localStorage.clear();
        location.reload();
    }
}

// Export for global access if needed (not strictly necessary for vanilla JS)
window.showToast = showToast;
window.toggleTheme = toggleTheme;
window.handleSettings = handleSettings;
window.handleGuestClick = handleGuestClick;
window.handleNotifications = handleNotifications;

console.log("🎯 FitForge AI Ultimate Edition Ready!");