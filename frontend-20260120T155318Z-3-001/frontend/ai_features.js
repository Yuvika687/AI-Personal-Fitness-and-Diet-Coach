// AI Gym Pro - AI Features Enhancement
// Add these new functions to your existing app.js

// AI-Powered Workout Plan
async function getSmartWorkoutPlan() {
    try {
        showLoading("workout-suggestions", "🧠 AI is creating your personalized workout plan...");

        const response = await fetch(API_BASE + "/workouts/smart-workout-plan", {
            headers: { "Authorization": "Bearer " + currentToken }
        });

        if (response.ok) {
            const data = await response.json();
            const workoutElement = document.getElementById("workout-suggestions");

            let html = `
                <div class="ai-workout-plan">
                    <h3>🎯 Your AI-Generated Workout Plan</h3>
                    <div class="ai-badge">Powered by AI</div>
                    <div class="workout-content">
                        ${data.workout_plan.replace(/\n/g, "<br>")}
                    </div>
                    ${data.is_ai_generated ? "<div class=\"ai-footer\">✨ Personalized using advanced AI</div>" : ""}
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

// AI Performance Analytics
async function getPerformanceMetrics() {
    try {
        showLoading("progress-chart", "📊 Analyzing your performance data...");

        const response = await fetch(API_BASE + "/workouts/performance-metrics", {
            headers: { "Authorization": "Bearer " + currentToken }
        });

        if (response.ok) {
            const data = await response.json();
            displayPerformanceMetrics(data);
        } else {
            showAlert("progress-chart", "❌ Failed to load performance metrics", "error");
        }
    } catch (error) {
        showAlert("progress-chart", "🌐 Error loading analytics", "error");
    }
}

function displayPerformanceMetrics(metrics) {
    const progressElement = document.getElementById("progress-chart");

    let insightsHTML = "";
    if (metrics.ai_insights && metrics.ai_insights.length > 0) {
        insightsHTML = metrics.ai_insights.map(function(insight) {
            return "<div class=\"insight-item\">💡 " + insight + "</div>";
        }).join("");
    }

    let html = `
        <div class="performance-dashboard">
            <h3>📈 Your Performance Analytics</h3>

            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${metrics.total_workouts}</div>
                    <div class="metric-label">Total Workouts</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.total_calories_burned}</div>
                    <div class="metric-label">Calories Burned</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.consistency_score}%</div>
                    <div class="metric-label">Consistency</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.fitness_level}</div>
                    <div class="metric-label">Fitness Level</div>
                </div>
            </div>

            <div class="ai-insights">
                <h4>🧠 AI Insights</h4>
                ${insightsHTML}
            </div>

            <div class="weekly-progress">
                <h4>📅 This Week</h4>
                <p>Workouts: ${metrics.weekly_progress.workouts_this_week} | 
                   Calories: ${metrics.weekly_progress.calories_this_week} | 
                   Trend: ${metrics.weekly_progress.trend}</p>
            </div>

            <div class="favorite-exercise">
                <h4>⭐ Favorite Exercise</h4>
                <p>${metrics.favorite_exercise}</p>
            </div>
        </div>
    `;

    progressElement.innerHTML = html;
    progressElement.classList.remove("hidden");
}

// Update your existing functions to use AI features
async function generateDietPlan() {
    try {
        showLoading("diet-plan", "🍳 AI is crafting your personalized nutrition plan...");

        const response = await fetch(API_BASE + "/diet/generate-plan", {
            headers: { "Authorization": "Bearer " + currentToken }
        });

        if (response.ok) {
            const data = await response.json();
            const dietPlanElement = document.getElementById("diet-plan");

            let aiBadge = data.is_ai_generated ? "<div class=\"ai-badge\">Powered by AI</div>" : "";

            let html = `
                <div class="ai-diet-plan">
                    <h3>🍎 Your AI-Generated Diet Plan</h3>
                    ${aiBadge}
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

// Add AI workout plan button to your HTML or update existing
function addAIWorkoutButton() {
    const workoutCard = document.querySelector("[onclick=\"getWorkoutSuggestions()\"]").parentElement;
    const aiButton = document.createElement("button");
    aiButton.className = "btn btn-warning";
    aiButton.innerHTML = "<i class=\"fas fa-robot\"></i> Get AI Workout Plan";
    aiButton.onclick = getSmartWorkoutPlan;
    workoutCard.appendChild(aiButton);
}

// Add performance analytics button
function addAnalyticsButton() {
    const progressCard = document.querySelector("[onclick=\"showProgress()\"]").parentElement;
    const analyticsButton = document.createElement("button");
    analyticsButton.className = "btn btn-outline";
    analyticsButton.innerHTML = "<i class=\"fas fa-chart-line\"></i> AI Performance Analytics";
    analyticsButton.onclick = getPerformanceMetrics;
    progressCard.appendChild(analyticsButton);
}

// Initialize AI features when app loads
function initializeAIFeatures() {
    addAIWorkoutButton();
    addAnalyticsButton();
}

// Call this in your showApp function
// initializeAIFeatures();

// Add CSS for AI features
const aiStyles = `
    .ai-badge {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8em;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 15px;
    }
    
    .ai-workout-plan, .ai-diet-plan {
        position: relative;
    }
    
    .performance-dashboard {
        text-align: left;
    }
    
    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin: 20px 0;
    }
    
    .metric-card {
        background: rgba(99, 102, 241, 0.1);
        padding: 15px;
        border-radius: 12px;
        text-align: center;
    }
    
    .metric-value {
        font-size: 1.8em;
        font-weight: bold;
        color: var(--primary);
    }
    
    .metric-label {
        font-size: 0.9em;
        color: var(--gray);
    }
    
    .ai-insights {
        margin: 20px 0;
        padding: 15px;
        background: rgba(16, 185, 129, 0.1);
        border-radius: 12px;
    }
    
    .insight-item {
        padding: 8px 0;
        border-bottom: 1px solid rgba(0,0,0,0.1);
    }
    
    [data-theme="dark"] .insight-item {
        border-bottom-color: rgba(255,255,255,0.1);
    }
    
    .ai-footer {
        margin-top: 15px;
        padding: 10px;
        background: rgba(99, 102, 241, 0.1);
        border-radius: 8px;
        text-align: center;
        font-size: 0.9em;
    }
`;

// Inject AI styles
const aiStyleSheet = document.createElement("style");
aiStyleSheet.textContent = aiStyles;
document.head.appendChild(aiStyleSheet);

console.log("🤖 AI Features Loaded!");
