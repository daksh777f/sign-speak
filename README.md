# AI-Powered Real-Time Sign Language Recognition System

### 🌍 Bridging the Communication Gap Between the Deaf and the Hearing

---

## 📘 Overview
The **AI-Powered Real-Time Sign Language Recognition System** is a web-based application designed to translate **sign language gestures into text and speech** in **real-time**.  
Built to promote **inclusivity and accessibility**, this project uses **computer vision** and **deep learning** to help bridge communication barriers faced by the hearing-impaired community.  

The system recognizes **hand gestures** through a live webcam feed, interprets them using a trained **AI model**, and outputs both **text and speech** in **English and Hindi**, enabling seamless two-way communication.

---

## 🚀 Features
-  **Real-Time Gesture Detection** – Detects and interprets hand gestures through a live webcam feed.  
-  **Deep Learning Model** – Trained using TensorFlow/Keras for accurate sign classification.  
-  **Speech Conversion** – Converts recognized gestures into speech (supports English & Hindi).  
-  **Web-Based Interface** – Built with HTML, CSS, and JavaScript for easy accessibility.  
-  **Multilingual Support** – Converts recognized gestures into multiple languages.  
-  **Lightweight and Fast** – Optimized for browser performance and minimal lag.  

---

##  Tech Stack

| Category | Technologies Used |
|-----------|-------------------|
| **Frontend** | HTML, CSS, JavaScript |
| **Backend (optional)** | Flask / Node.js |
| **AI/ML Model** | TensorFlow / Keras / OpenCV |
| **Speech Conversion** | gTTS (Google Text-to-Speech), pyttsx3 |
| **Dataset** | Custom Sign Language Dataset / Kaggle ASL Dataset |
| **Deployment** | Streamlit / Flask Web App / GitHub Pages |

---

## ⚙️ How It Works

1. **Capture Gesture:** The webcam captures the user's hand gesture.  
2. **Preprocessing:** The frame is processed using OpenCV to isolate the hand region.  
3. **Prediction:** The deep learning model predicts the corresponding sign.  
4. **Output Generation:** The prediction is displayed as text and spoken aloud.  
5. **Translation (Optional):** The text can be translated to other languages (e.g., Hindi).  

---

## 🧠 Model Training

- The model was trained on a labeled dataset of hand gestures representing alphabets and basic words.  
- Data augmentation was used to handle variations in lighting and orientation.  
- A **CNN (Convolutional Neural Network)** was employed for feature extraction and classification.  

---
