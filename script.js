const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const outputDiv = document.getElementById('output');

let sentence = [];
const bufferSize = 10;
let predictionBuffer = [];
let lastPrediction = "";


const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5
});

hands.onResults(async (results) => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
      drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});

      let flatLandmarks = [];
      for (const lm of landmarks) {
        flatLandmarks.push(lm.x, lm.y, lm.z);
      }

      if (flatLandmarks.length === 63) {
        try {
          const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ landmarks: flatLandmarks })
          });
          const data = await response.json();
          const prediction = data.speech_text;

          predictionBuffer.push(prediction);
          if (predictionBuffer.length > bufferSize) predictionBuffer.shift();

          const mostFrequent = predictionBuffer.sort((a,b) =>
            predictionBuffer.filter(v => v===a).length - predictionBuffer.filter(v => v===b).length
          ).pop();

          if (mostFrequent && mostFrequent !== lastPrediction) {
            sentence.push(mostFrequent);
            lastPrediction = mostFrequent;
            outputDiv.textContent = sentence.join(" ");
          }

        } catch (err) {
          console.error('Error fetching prediction:', err);
        }
      }
    }
  }
  canvasCtx.restore();
});

const camera = new Camera(videoElement, {
  onFrame: async () => { await hands.send({image: videoElement}); },
  width: 640,
  height: 480
});
camera.start();
