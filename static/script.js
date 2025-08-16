document.addEventListener('DOMContentLoaded', function() {
    
    const landingPage = document.getElementById('landing-page');
    const mainApp = document.getElementById('main-app');
    const getStartedBtn = document.getElementById('get-started-btn');

    
    if (landingPage && mainApp && getStartedBtn) {
        landingPage.style.display = 'flex';
        mainApp.style.display = 'none';
        getStartedBtn.addEventListener('click', () => {
            landingPage.style.display = 'none';
            mainApp.style.display = 'block';
            
            setTimeout(() => {

        
        const videoElement = document.getElementById('webcam');
        const canvasElement = document.getElementById('canvas');
        const canvasCtx = canvasElement.getContext('2d');
        const outputDiv = document.getElementById('output');
        const translatedTextDiv = document.getElementById('translated-text');
        const alertsDiv = document.getElementById('alerts');

        let sentence = [];
        const bufferSize = 10;
        let predictionBuffer = [];
        let lastPrediction = "";

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                videoElement.srcObject = stream;
                videoElement.play();

                
                const hands = new Hands({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
                });

                hands.setOptions({
                    maxNumHands: 1,
                    minDetectionConfidence: 0.7,
                    minTrackingConfidence: 0.5
                });

                hands.onResults(async (results) => {
                    canvasElement.width = videoElement.videoWidth;
                    canvasElement.height = videoElement.videoHeight;

                    canvasCtx.save();
                    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

                    if (results.multiHandLandmarks) {
                        for (const landmarks of results.multiHandLandmarks) {
                            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
                            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });

                            let flatLandmarks = landmarks.flatMap(lm => [lm.x, lm.y, lm.z]);

                            if (flatLandmarks.length === 63) {
                                try {
                                    const response = await fetch('http://127.0.0.1:5000/predict', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ landmarks: flatLandmarks })
                                    });
                                    const data = await response.json();
                                    const prediction = data.speech_text;

                                    predictionBuffer.push(prediction);
                                    if (predictionBuffer.length > bufferSize) predictionBuffer.shift();

                                    const mostFrequent = predictionBuffer.sort((a, b) =>
                                        predictionBuffer.filter(v => v === a).length - predictionBuffer.filter(v => v === b).length
                                    ).pop();

                                    if (mostFrequent && mostFrequent !== lastPrediction) {
                                        sentence.push(mostFrequent);
                                        lastPrediction = mostFrequent;
                                        outputDiv.textContent = sentence.join(" ");
                                        translatedTextDiv.textContent = '';
                                    }
                                } catch (err) {
                                    alertsDiv.textContent = 'Error fetching prediction.';
                                }
                            }
                        }
                    }
                    canvasCtx.restore();
                });

                const camera = new Camera(videoElement, {
                    onFrame: async () => {
                        await hands.send({ image: videoElement });
                    },
                    width: 640,
                    height: 480
                });
                camera.start();
            })
            });
    })
            .catch(err => {
                if (alertsDiv) alertsDiv.textContent = 'Could not access webcam: ' + err.message;
            });
        }, 100); 
    });
}


const aboutLink = document.getElementById('about-us-link');
const alertsLink = document.getElementById('alerts-link');
const homeLink = document.getElementById('home-link');
const aboutOverlay = document.getElementById('about-overlay');
const alertsOverlay = document.getElementById('alerts-overlay');
const closeAbout = document.getElementById('close-about');
const closeAlerts = document.getElementById('close-alerts');

function hideOverlays() {
    aboutOverlay.style.display = 'none';
    alertsOverlay.style.display = 'none';
}

aboutLink.addEventListener('click', (e) => {
    e.preventDefault();
    hideOverlays();
    aboutOverlay.style.display = 'flex';
});
alertsLink.addEventListener('click', (e) => {
    e.preventDefault();
    hideOverlays();
    alertsOverlay.style.display = 'flex';
});
homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    hideOverlays();
});
if (closeAbout) closeAbout.addEventListener('click', hideOverlays);
if (closeAlerts) closeAlerts.addEventListener('click', hideOverlays);



