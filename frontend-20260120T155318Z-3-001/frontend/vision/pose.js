let video = document.getElementById("video");
let canvas = document.getElementById("output");
let ctx = canvas.getContext("2d");

// Initialize canvas size
canvas.width = 640;
canvas.height = 480;

let repCount = 0;
let formScore = 0;
let caloriesEst = 0;
let isWorkingOut = false;
let currentWorkout = 'squat';
let repGoingDown = false;
let lastAngle = 0;
let feedbackHistory = [];

// Workout configurations
const workoutConfigs = {
    squat: {
        joints: [24, 26, 28], // hip, knee, ankle
        upAngle: 150,
        downAngle: 80,
        calorieFactor: 0.2
    },
    pushup: {
        joints: [12, 14, 16], // shoulder, elbow, wrist
        upAngle: 160,
        downAngle: 90,
        calorieFactor: 0.15
    },
    bicep: {
        joints: [14, 12, 24], // elbow, shoulder, hip
        upAngle: 160,
        downAngle: 30,
        calorieFactor: 0.1
    },
    plank: {
        joints: [12, 24, 26], // shoulder, hip, knee
        upAngle: 180,
        downAngle: 170,
        calorieFactor: 0.05
    }
};

function selectWorkout(workoutType) {
    currentWorkout = workoutType;
    document.querySelectorAll('.workout-option').forEach(opt => {
        opt.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    addFeedback(`Switched to ${workoutType} analysis`, 'good');
    resetCounters();
}

function calculateAngle(a, b, c) {
    if (!a || !b || !c) return 0;
    
    const AB = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    const BC = Math.sqrt(Math.pow(b.x - c.x, 2) + Math.pow(b.y - c.y, 2));
    const AC = Math.sqrt(Math.pow(c.x - a.x, 2) + Math.pow(c.y - a.y, 2));

    let angle = Math.acos((AB * AB + BC * BC - AC * AC) / (2 * AB * BC));
    return angle * (180 / Math.PI);
}

function calculateFormScore(angle, targetAngle) {
    const diff = Math.abs(angle - targetAngle);
    return Math.max(0, 100 - diff);
}

function addFeedback(message, type = 'info') {
    const feedbackList = document.getElementById('feedbackList');
    const feedbackItem = document.createElement('div');
    feedbackItem.className = `feedback-item ${type}`;
    feedbackItem.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    
    feedbackList.appendChild(feedbackItem);
    feedbackHistory.push({ message, type, time: new Date() });
    
    // Limit to 5 feedback items
    if (feedbackList.children.length > 5) {
        feedbackList.removeChild(feedbackList.firstChild);
    }
    
    // Scroll to bottom
    feedbackList.scrollTop = feedbackList.scrollHeight;
}

function initCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        addFeedback("Camera not supported", "error");
        return;
    }

    navigator.mediaDevices.getUserMedia({
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
        },
        audio: false
    }).then(stream => {
        video.srcObject = stream;
        video.play();
        addFeedback("Camera started successfully", "good");
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('workoutBtn').disabled = false;
    }).catch(err => {
        addFeedback(`Camera error: ${err.message}`, "error");
    });
}

function startCamera() {
    initCamera();
}

function stopCamera() {
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        addFeedback("Camera stopped", "warning");
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('workoutBtn').disabled = true;
    }
}

function startWorkout() {
    isWorkingOut = !isWorkingOut;
    const btn = document.getElementById('workoutBtn');
    
    if (isWorkingOut) {
        btn.innerHTML = '<i class="fas fa-pause"></i> Pause Workout';
        btn.classList.add('pulsing');
        addFeedback(`Started ${currentWorkout} workout`, "good");
    } else {
        btn.innerHTML = '<i class="fas fa-dumbbell"></i> Start Workout';
        btn.classList.remove('pulsing');
        addFeedback("Workout paused", "warning");
    }
}

function resetCounters() {
    repCount = 0;
    formScore = 0;
    caloriesEst = 0;
    updateDisplay();
    addFeedback("Counters reset", "info");
}

function updateDisplay() {
    document.getElementById('repCount').textContent = repCount;
    document.getElementById('formScore').textContent = `${Math.round(formScore)}%`;
    document.getElementById('caloriesEst').textContent = Math.round(caloriesEst);
}

function saveSession() {
    const sessionData = {
        workout: currentWorkout,
        reps: repCount,
        formScore: formScore,
        calories: caloriesEst,
        timestamp: new Date().toISOString(),
        feedback: feedbackHistory
    };
    
    // Save to localStorage
    const sessions = JSON.parse(localStorage.getItem('workoutSessions') || '[]');
    sessions.push(sessionData);
    localStorage.setItem('workoutSessions', JSON.stringify(sessions));
    
    addFeedback(`Session saved: ${repCount} reps, ${Math.round(caloriesEst)} calories`, "good");
    
    // Try to save to backend if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        fetch('http://localhost:8000/workouts/start-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                exercise_name: currentWorkout.charAt(0).toUpperCase() + currentWorkout.slice(1),
                reps: repCount,
                sets: 1,
                calories_estimated: caloriesEst,
                duration_min: Math.floor(repCount * 0.5) // Estimate 0.5 min per rep
            })
        }).then(response => {
            if (response.ok) {
                addFeedback("Session synced to cloud", "good");
            }
        }).catch(() => {
            // Silently fail if backend is not available
        });
    }
}

// Initialize MediaPipe Pose
const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
    modelComplexity: 2, // Use high complexity for better accuracy
    smoothLandmarks: true,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
    enableSegmentation: false,
    smoothSegmentation: true
});

pose.onResults(results => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw video frame
    if (results.image) {
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }
    
    // Draw pose landmarks if detected
    if (results.poseLandmarks && isWorkingOut) {
        // Draw pose connections
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: '#D4AF37',
            lineWidth: 4
        });
        
        // Draw landmarks
        drawLandmarks(ctx, results.poseLandmarks, {
            color: '#FFFFFF',
            radius: 6,
            lineWidth: 2
        });
        
        // Get workout configuration
        const config = workoutConfigs[currentWorkout];
        const [jointA, jointB, jointC] = config.joints;
        
        const pointA = results.poseLandmarks[jointA];
        const pointB = results.poseLandmarks[jointB];
        const pointC = results.poseLandmarks[jointC];
        
        if (pointA && pointB && pointC) {
            // Calculate angle
            const angle = calculateAngle(pointA, pointB, pointC);
            lastAngle = angle;
            
            // Update form score
            const targetAngle = angle < (config.upAngle + config.downAngle) / 2 ? config.downAngle : config.upAngle;
            const currentFormScore = calculateFormScore(angle, targetAngle);
            formScore = (formScore * 0.7 + currentFormScore * 0.3); // Smooth average
            
            // Update status
            let status = "Ready";
            if (angle < config.downAngle) {
                status = "Down";
                if (!repGoingDown) {
                    repGoingDown = true;
                }
            } else if (angle > config.upAngle) {
                status = "Up";
                if (repGoingDown) {
                    repCount++;
                    repGoingDown = false;
                    caloriesEst += config.calorieFactor;
                    
                    // Add form feedback
                    if (currentFormScore > 90) {
                        addFeedback(`Great form on rep ${repCount}!`, "good");
                    } else if (currentFormScore > 70) {
                        addFeedback(`Good rep ${repCount}, keep it up!`, "info");
                    } else {
                        addFeedback(`Rep ${repCount} - focus on form`, "warning");
                    }
                }
            } else {
                status = repGoingDown ? "Going Down" : "Going Up";
            }
            
            document.getElementById('poseStatus').textContent = status;
            document.getElementById('poseStatus').style.color = 
                currentFormScore > 90 ? '#4CAF50' : 
                currentFormScore > 70 ? '#FF9800' : '#F44336';
            
            // Update display
            updateDisplay();
            
            // Draw angle on canvas
            if (pointB) {
                ctx.beginPath();
                ctx.arc(pointB.x * canvas.width, pointB.y * canvas.height, 30, 0, 2 * Math.PI);
                ctx.strokeStyle = currentFormScore > 90 ? '#4CAF50' : 
                                 currentFormScore > 70 ? '#FF9800' : '#F44336';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Display angle
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 20px Arial';
                ctx.fillText(`${Math.round(angle)}°`, 
                    pointB.x * canvas.width - 15, 
                    pointB.y * canvas.height - 40);
            }
        }
    }
    
    // Request next frame
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        pose.send({image: video});
    }
});

// Initialize when page loads
window.onload = function() {
    // Set canvas size
    canvas.width = 640;
    canvas.height = 480;
    
    // Add initial feedback
    addFeedback("AI Pose Detection ready", "good");
    addFeedback("Select a workout type to begin", "info");
    
    // Start camera automatically
    setTimeout(initCamera, 1000);
};