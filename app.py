from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import numpy as np
from tensorflow.keras.models import load_model
import pickle
import translators as ts

app = Flask(__name__)
CORS(app)

# Load model and encoder
model = load_model("model/gesture_model.h5")
with open("model/label_encoder.pkl", "rb") as f:
    label_encoder = pickle.load(f)

def predict_from_landmarks(landmarks_np):
    pred = model.predict(landmarks_np, verbose=0)[0]
    class_id = np.argmax(pred)
    return label_encoder.inverse_transform([class_id])[0]

# Serve frontend
@app.route("/")
def home():
    return render_template("index.html")

# Server status check endpoint
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok"})

# API endpoint for sign prediction
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        landmarks = data.get("landmarks")
        
        if landmarks is None:
            return jsonify({"error": "Send 'landmarks' array"}), 400
            
        # Convert landmarks to numpy array and ensure correct shape
        landmarks_np = np.array(landmarks, dtype=np.float32)
        
        # Print debug info
        print(f"Received landmarks with shape: {landmarks_np.shape}")
        
        # Reshape for model input - ensure it matches model's expected input shape
        landmarks_np = landmarks_np.reshape(1, -1)
        print(f"Reshaped landmarks to: {landmarks_np.shape}")
        
        # Make prediction
        text = predict_from_landmarks(landmarks_np)
        print(f"Prediction result: {text}")
        
        return jsonify({"speech_text": text})
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# API endpoint for translation
@app.route("/translate", methods=["POST"])
def translate():
    data = request.get_json()
    text_to_translate = data.get("text")
    if not text_to_translate:
        return jsonify({"error": "Send 'text' to translate"}), 400
    
    try:
        english_translation = ts.translate_text(text_to_translate, to_language='en')
        hindi_translation = ts.translate_text(text_to_translate, to_language='hi')
        return jsonify({
            "english": english_translation,
            "hindi": hindi_translation
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
