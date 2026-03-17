// frontend/habit_tracker.js - UPDATED VERSION
const API_BASE = "http://localhost:8000";
let habitChart = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    console.log("📊 Habit Tracker Initialized");
    initializeChart();
    loadHabitData();
});

// Initialize chart
function initializeChart() {
    const canvas = document.getElementById('progressChart');
    if (!canvas) {
        console.log("Chart canvas not found");
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Clear any existing chart
    if (habitChart) {
        habitChart.destroy();
    }
    
    habitChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Workouts',
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
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#b0b0b0'
                    }
                }
            }
        }
    });
}

// Load all habit data
async function loadHabitData() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.log("No token found");
        loadMockData();
        return;
    }

    try {
        // Load history
        const historyResponse = await fetch(API_BASE + '/tracking/history', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (historyResponse.ok) {
            const history = await historyResponse.json();
            updateHistoryDisplay(history);
            updateStatsFromHistory(history);
        } else {
            console.log("Failed to load history");
            loadMockData();
        }

        // Load summary
        const summaryResponse = await fetch(API_BASE + '/tracking/summary', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (summaryResponse.ok) {
            const summary = await summaryResponse.json();
            updateSummaryDisplay(summary);
        }

    } catch (error) {
        console.log('Error loading habit data:', error);
        loadMockData();
    }
}

// Update history display
function updateHistoryDisplay(history) {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    if (!history || history.length === 0) {
        historyList.innerHTML = `
            <div class="history-item">
                <span>No history yet. Start logging!</span>
            </div>
        `;
        return;
    }

    historyList.innerHTML = history.slice(0, 7).map(item => {
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        const workouts = item.workouts || 0;
        const water = item.water || 0;
        const steps = item.steps || 0;

        let summary = `${formattedDate} - `;
        if (workouts > 0) summary += `🏋️ ${workouts} workout${workouts > 1 ? 's' : ''} `;
        if (water > 0) summary += `💧 ${water.toFixed(1)}L `;
        if (steps > 0) summary += `👣 ${steps.toLocaleString()} steps`;

        const completed = workouts > 0 || water >= 2 || steps >= 5000;

        return `
            <div class="history-item ${completed ? 'completed' : 'missed'}">
                <span>${summary}</span>
                <span class="fas ${completed ? 'fa-check' : 'fa-times'}" 
                      style="color: ${completed ? '#4CAF50' : '#F44336'};"></span>
            </div>
        `;
    }).join('');
}

// Update stats from history
function updateStatsFromHistory(history) {
    if (!history || history.length === 0) {
        document.getElementById('streak-count').textContent = '0';
        document.getElementById('adherence-score').textContent = '0%';
        document.getElementById('total-workouts').textContent = '0';
        document.getElementById('avg-water').textContent = '0L';
        return;
    }

    // Calculate totals
    const totalWorkouts = history.reduce((sum, item) => sum + (item.workouts || 0), 0);
    const totalWater = history.reduce((sum, item) => sum + (item.water || 0), 0);
    const avgWater = (totalWater / history.length).toFixed(1);

    // Calculate streak (simplified)
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < history.length; i++) {
        const logDate = new Date(history[i].date);
        const diffDays = Math.floor((currentDate - logDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === streak && (history[i].workouts || 0) > 0) {
            streak++;
            currentDate = logDate;
        } else {
            break;
        }
    }

    // Calculate adherence
    const workoutDays = history.filter(item => (item.workouts || 0) > 0).length;
    const adherence = Math.round((workoutDays / history.length) * 100);

    // Update display
    document.getElementById('streak-count').textContent = streak;
    document.getElementById('adherence-score').textContent = adherence + '%';
    document.getElementById('total-workouts').textContent = totalWorkouts;
    document.getElementById('avg-water').textContent = avgWater + 'L';

    // Update chart
    updateChartData(history);
}

// Update summary display
function updateSummaryDisplay(summary) {
    if (!summary) return;
    
    document.getElementById('streak-count').textContent = summary.streak || 0;
    document.getElementById('adherence-score').textContent = (summary.adherence || 0) + '%';
}

// Update chart data
function updateChartData(history) {
    if (!habitChart || !history) return;

    // Get last 7 days
    const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toDateString();
    }).reverse();

    // Map history to days
    const workoutData = last7Days.map(day => {
        const dayHistory = history.find(item => 
            new Date(item.date).toDateString() === day
        );
        return dayHistory ? (dayHistory.workouts || 0) : 0;
    });

    habitChart.data.labels = last7Days.map(day => 
        new Date(day).toLocaleDateString('en-US', { weekday: 'short' })
    );
    habitChart.data.datasets[0].data = workoutData;
    habitChart.update();
}

// Save daily log
async function saveDailyLog() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert('Please login first');
        return;
    }

    const workouts = parseInt(document.getElementById('workouts-count').value) || 0;
    const water = parseFloat(document.getElementById('water-intake').value) || 0;
    const steps = parseInt(document.getElementById('steps-count').value) || 0;

    const logData = {
        workouts: workouts,
        water: water,
        steps: steps
    };

    try {
        const response = await fetch(API_BASE + '/tracking/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(logData)
        });

        if (response.ok) {
            const result = await response.json();
            alert('✅ ' + result.message);
            
            // Reset form
            document.getElementById('workouts-count').value = 0;
            document.getElementById('water-intake').value = 0;
            document.getElementById('steps-count').value = 0;
            
            // Reload data
            loadHabitData();
        } else {
            const error = await response.json();
            alert('❌ ' + (error.detail || 'Failed to save log'));
        }
    } catch (error) {
        console.log('Error saving log:', error);
        alert('🌐 Network error. Please check your connection.');
    }
}

// Get AI prediction
async function getAIPrediction() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert('Please login first');
        return;
    }

    const predictionResult = document.getElementById('prediction-result');
    const predictionContent = document.getElementById('prediction-content');

    // Show loading
    predictionContent.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> AI is analyzing your habits...</p>';
    predictionResult.style.display = 'block';

    try {
        const response = await fetch(API_BASE + '/tracking/predict', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.ok) {
            const result = await response.json();
            predictionContent.innerHTML = `
                <p><strong>📈 AI Predictions for Next Week:</strong></p>
                <p style="font-size: 14px;">${result.prediction || 'No prediction available.'}</p>
                <p style="margin-top: 10px; color: #D4AF37; font-size: 12px;">
                    <i class="fas fa-lightbulb"></i> ${result.basis || 'Based on your recent activity'}
                </p>
            `;
        } else {
            // Fallback prediction
            predictionContent.innerHTML = `
                <p style="color: #F44336; font-size: 12px;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Could not get AI prediction. Using default insights.
                </p>
                <p>Based on general fitness guidelines:</p>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li>Aim for 3-4 workouts per week</li>
                    <li>Drink 2-3 liters of water daily</li>
                    <li>Target 7,000+ steps daily</li>
                </ul>
            `;
        }
    } catch (error) {
        predictionContent.innerHTML = `
            <p style="color: #F44336;">
                <i class="fas fa-exclamation-triangle"></i> 
                Network error. Please check your connection.
            </p>
        `;
    }
}

// Mock data fallback
function loadMockData() {
    const mockHistory = [
        { 
            date: new Date().toISOString(), 
            workouts: 1, 
            water: 2.5, 
            steps: 7500,
            did_workout: true
        },
        { 
            date: new Date(Date.now() - 86400000).toISOString(), 
            workouts: 0, 
            water: 1.5, 
            steps: 4500,
            did_workout: false
        },
        { 
            date: new Date(Date.now() - 172800000).toISOString(), 
            workouts: 2, 
            water: 3.0, 
            steps: 10000,
            did_workout: true
        }
    ];

    updateHistoryDisplay(mockHistory);
    updateStatsFromHistory(mockHistory);
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Save log button
    const saveBtn = document.querySelector('.btn-primary');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveDailyLog);
    }
    
    // Prediction button
    const predictBtn = document.querySelector('.btn[onclick*="getAIPrediction"]');
    if (predictBtn) {
        predictBtn.addEventListener('click', getAIPrediction);
    }
});