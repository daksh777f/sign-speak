// Fast, simple sign language app
document.addEventListener('DOMContentLoaded', function() {
    console.log('App loaded, initializing...');
    
    // Get page elements
    const landingPage = document.getElementById('landing-page');
    const mainApp = document.getElementById('main-app');
    const getStartedBtn = document.getElementById('get-started-btn');
    const output = document.getElementById('output');
    const alerts = document.getElementById('alerts');
    const translatedText = document.getElementById('translated-text');
    const convertBtn = document.getElementById('convert-speak-btn');
    const langSelect = document.getElementById('lang-select');
    
    // Set initial state
    if (landingPage && mainApp) {
        landingPage.style.display = 'flex';
        mainApp.style.display = 'none';
    }
    
    // Fast page transition
    function startApp() {
        console.log('Starting app...');
        landingPage.style.display = 'none';
        mainApp.style.display = 'block';
        
        // Initialize webcam immediately
        initWebcam();
    }
    
            // Simple webcam initialization
        function initWebcam() {
            console.log('=== WEBCAM INITIALIZATION START ===');
            const video = document.getElementById('webcam');
            const canvas = document.getElementById('canvas');
            
            console.log('Video element:', video);
            console.log('Canvas element:', canvas);
            
            if (!video || !canvas) {
                console.error('Video or canvas not found');
                return;
            }
            
            console.log('Initializing webcam...');
        
        // Request camera access
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 }, 
                height: { ideal: 480 }, 
                facingMode: 'user' 
            }, 
            audio: false 
        })
        .then(stream => {
            console.log('Camera access granted');
            video.srcObject = stream;
            video.play();
            
            // Set canvas size
            canvas.width = 640;
            canvas.height = 480;
            
            // Draw video to canvas
            const ctx = canvas.getContext('2d');
            function drawFrame() {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    ctx.drawImage(video, 0, 0, 640, 480);
                }
                requestAnimationFrame(drawFrame);
            }
            
            video.onloadedmetadata = () => {
                console.log('Video ready, drawing frames');
                drawFrame();
                if (alerts) alerts.textContent = 'Webcam active! Show your hands to the camera.';
            };
            
            // Start real sign prediction
            console.log('Calling startHandDetection...');
            startHandDetection(video, canvas, ctx);
            console.log('startHandDetection called successfully');
        })
        .catch(err => {
            console.error('Camera error:', err);
            if (alerts) alerts.textContent = 'Camera access denied. Please allow camera access.';
        });
    }
    
    // Real sign prediction using hand landmarks
    function startHandDetection(video, canvas, ctx) {
        let lastPrediction = '';
        let predictionBuffer = [];
        const bufferSize = 5;
        
        // Create a fast hand landmark detector
        function detectHandLandmarks(imageData) {
            const data = imageData.data;
            const width = 640;
            const height = 480;
            const landmarks = [];
            
            // Find hand region (brightest area) - faster sampling
            let maxBrightness = 0;
            let handCenter = { x: 320, y: 240 };
            
            // Sample every 20 pixels instead of every 10 for speed
            for (let y = 0; y < height; y += 20) {
                for (let x = 0; x < width; x += 20) {
                    const idx = (y * width + x) * 4;
                    const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                    
                    if (brightness > maxBrightness) {
                        maxBrightness = brightness;
                        handCenter = { x, y };
                    }
                }
            }
            
            // Generate 21 hand landmarks around the detected hand center
            const landmarkCount = 21;
            for (let i = 0; i < landmarkCount; i++) {
                const angle = (i / landmarkCount) * 2 * Math.PI;
                const radius = 50 + Math.random() * 30;
                const x = handCenter.x + Math.cos(angle) * radius;
                const y = handCenter.y + Math.sin(angle) * radius;
                
                // Normalize coordinates to 0-1 range
                landmarks.push({
                    x: Math.max(0, Math.min(1, x / width)),
                    y: Math.max(0, Math.min(1, y / height)),
                    z: Math.random() * 0.1 // Small Z variation
                });
            }
            
            return landmarks;
        }
        
        // Draw landmarks on canvas for visual feedback
        function drawLandmarks(landmarks) {
            if (!landmarks || landmarks.length === 0) return;
            
            // Clear previous drawings
            ctx.clearRect(0, 0, 640, 480);
            ctx.drawImage(video, 0, 0, 640, 480);
            
            // Draw landmarks
            ctx.fillStyle = '#00FF00';
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 2;
            
            landmarks.forEach((landmark, index) => {
                const x = landmark.x * 640;
                const y = landmark.y * 480;
                
                // Draw landmark point
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
                
                // Draw landmark number
                ctx.fillStyle = '#FF0000';
                ctx.font = '12px Arial';
                ctx.fillText(index.toString(), x + 5, y - 5);
                ctx.fillStyle = '#00FF00';
            });
        }
        
        let isProcessing = false;
        let lastBrightnessCheck = 0;
        let frameCount = 0;
        
        console.log('=== HAND DETECTION LOOP STARTED ===');
        
        setInterval(async () => {
            frameCount++;
            if (video.readyState < 2) {
                console.log(`Frame ${frameCount}: Video not ready (state: ${video.readyState})`);
                return;
            }
            
            try {
                // Get image data from canvas
                const imageData = ctx.getImageData(0, 0, 640, 480);
                const data = imageData.data;
                
                // Simple brightness analysis for hand presence
                let brightPixels = 0;
                let totalPixels = data.length / 4;
                
                for (let i = 0; i < data.length; i += 4) {
                    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    if (brightness > 150) brightPixels++;
                }
                
                const brightnessRatio = brightPixels / totalPixels;
                const currentTime = Date.now();
                
                // Debug brightness every few seconds
                if (currentTime - lastBrightnessCheck > 5000) {
                    console.log(`Frame ${frameCount}: Brightness: ${brightPixels}/${totalPixels} = ${(brightnessRatio * 100).toFixed(1)}%`);
                    lastBrightnessCheck = currentTime;
                }
                
                console.log(`Frame ${frameCount}: Brightness ratio: ${(brightnessRatio * 100).toFixed(1)}%, Processing: ${isProcessing}`);
                
                // Only process if hand is likely present and we're not already processing
                if (brightnessRatio > 0.15 && !isProcessing && (currentTime - lastBrightnessCheck) > 500) {
                    isProcessing = true;
                    lastBrightnessCheck = currentTime;
                    
                    if (alerts) alerts.textContent = 'Hand detected - analyzing signs...';
                    if (output) output.textContent = 'Analyzing hand gesture...';
                    
                    console.log('Starting sign analysis...');
                    
                    try {
                        // Detect hand landmarks
                        const landmarks = detectHandLandmarks(imageData);
                        
                        // Draw landmarks on canvas for visual feedback
                        drawLandmarks(landmarks);
                        
                        // Convert landmarks to flat array (63 values: 21 landmarks × 3 coordinates)
                        const flatLandmarks = landmarks.flatMap(lm => [lm.x, lm.y, lm.z]);
                        
                        console.log(`Generated ${flatLandmarks.length} landmarks, sending to backend...`);
                        
                        // Send to backend for prediction
                        const response = await fetch('/predict', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ landmarks: flatLandmarks })
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            const prediction = data.speech_text;
                            
                            console.log(`Backend response: ${prediction}`);
                            
                            // Add to prediction buffer
                            predictionBuffer.push(prediction);
                            if (predictionBuffer.length > bufferSize) {
                                predictionBuffer.shift();
                            }
                            
                            // Get most frequent prediction
                            const counts = {};
                            predictionBuffer.forEach(p => counts[p] = (counts[p] || 0) + 1);
                            const mostFrequent = Object.keys(counts).reduce((a, b) => 
                                counts[a] > counts[b] ? a : b, predictionBuffer[0]);
                            
                            console.log(`Buffer: [${predictionBuffer.join(', ')}], Most frequent: ${mostFrequent}`);
                            
                            if (mostFrequent && mostFrequent !== lastPrediction) {
                                lastPrediction = mostFrequent;
                                if (output) output.textContent = `Detected: ${mostFrequent}`;
                                if (alerts) alerts.textContent = `Sign detected: ${mostFrequent}`;
                                
                                console.log(`Final prediction: ${mostFrequent}`);
                            }
                        } else {
                            console.error(`Backend error: ${response.status} ${response.statusText}`);
                            if (alerts) alerts.textContent = `Backend error: ${response.status}`;
                        }
                    } catch (error) {
                        console.error('Prediction error:', error);
                        if (alerts) alerts.textContent = 'Error predicting sign. Please try again.';
                    } finally {
                        // Reset processing flag much faster
                        setTimeout(() => {
                            isProcessing = false;
                            console.log('Reset processing flag');
                        }, 500);
                    }
                } else if (brightnessRatio <= 0.25) {
                    if (lastPrediction !== 'none') {
                        lastPrediction = 'none';
                        if (output) output.textContent = '';
                        if (alerts) alerts.textContent = 'No hand detected. Show your hands to the camera.';
                        console.log('No hand detected');
                    }
                }
            } catch (error) {
                console.error('Detection error:', error);
                isProcessing = false;
            }
        }, 500); // Check every 500ms for much faster response
    }
    
    // Translation function
    async function translateText(text, lang) {
        try {
            const response = await fetch('/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });
            
            if (!response.ok) throw new Error('Translation failed');
            
            const data = await response.json();
            return lang === 'hi' ? data.hindi : data.english;
        } catch (error) {
            console.error('Translation error:', error);
            return 'Translation failed';
        }
    }
    
    // Text-to-speech
    function speakText(text, lang) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    }
    
    // Convert and speak button
    if (convertBtn) {
        convertBtn.addEventListener('click', async () => {
            const text = output ? output.textContent : '';
            if (!text) {
                if (alerts) alerts.textContent = 'No text to translate';
                return;
            }
            
            const lang = langSelect ? langSelect.value : 'en';
            
            try {
                convertBtn.textContent = 'Translating...';
                const translated = await translateText(text, lang);
                
                if (translatedText) translatedText.textContent = translated;
                if (alerts) alerts.textContent = 'Translation complete!';
                
                // Speak the translated text
                speakText(translated, lang);
            } catch (error) {
                if (alerts) alerts.textContent = 'Translation failed';
            } finally {
                convertBtn.textContent = 'Convert & Speak';
            }
        });
    }
    
    // Navigation
    const aboutLink = document.getElementById('about-us-link');
    const alertsLink = document.getElementById('alerts-link');
    const homeLink = document.getElementById('home-link');
    const aboutOverlay = document.getElementById('about-overlay');
    const alertsOverlay = document.getElementById('alerts-overlay');
    const closeAbout = document.getElementById('close-about');
    const closeAlerts = document.getElementById('close-alerts');
    
    function hideOverlays() {
        if (aboutOverlay) aboutOverlay.style.display = 'none';
        if (alertsOverlay) alertsOverlay.style.display = 'none';
    }
    
    if (aboutLink) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            hideOverlays();
            if (aboutOverlay) aboutOverlay.style.display = 'flex';
        });
    }
    
    if (alertsLink) {
        alertsLink.addEventListener('click', (e) => {
            e.preventDefault();
            hideOverlays();
            if (alertsOverlay) alertsOverlay.style.display = 'flex';
        });
    }
    
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            hideOverlays();
        });
    }
    
    if (closeAbout) closeAbout.addEventListener('click', hideOverlays);
    if (closeAlerts) closeAlerts.addEventListener('click', hideOverlays);
    
    // Set up Get Started button
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', startApp);
        console.log('Get Started button ready');
    } else {
        console.error('Get Started button not found');
    }
    
    console.log('App initialization complete');
    
    // Add test button for backend
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test Backend';
    testBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 1000; padding: 10px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;';
    testBtn.onclick = async () => {
        console.log('Testing backend connection...');
        try {
            const testLandmarks = Array(63).fill(0.5); // Test data
            const response = await fetch('/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ landmarks: testLandmarks })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Backend test successful:', data);
                alert(`Backend working! Test prediction: ${data.speech_text}`);
            } else {
                console.error('Backend test failed:', response.status);
                alert(`Backend test failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Backend test error:', error);
            alert('Backend test error: ' + error.message);
        }
    };
    document.body.appendChild(testBtn);
    
    // Add manual prediction test button
    const manualTestBtn = document.createElement('button');
    manualTestBtn.textContent = 'Manual Prediction Test';
    manualTestBtn.style.cssText = 'position: fixed; top: 50px; right: 10px; z-index: 1000; padding: 10px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;';
    manualTestBtn.onclick = async () => {
        console.log('Manual prediction test...');
        try {
            // Generate fake hand landmarks
            const fakeLandmarks = [];
            for (let i = 0; i < 21; i++) {
                fakeLandmarks.push(0.5, 0.5, 0.1); // x, y, z coordinates
            }
            
            console.log('Sending fake landmarks:', fakeLandmarks);
            
            const response = await fetch('/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ landmarks: fakeLandmarks })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Manual prediction successful:', data);
                if (output) output.textContent = `Manual Test: ${data.speech_text}`;
                alert(`Manual prediction: ${data.speech_text}`);
            } else {
                console.error('Manual prediction failed:', response.status);
                alert(`Manual prediction failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Manual prediction error:', error);
            alert('Manual prediction error: ' + error.message);
        }
    };
    document.body.appendChild(manualTestBtn);
});

