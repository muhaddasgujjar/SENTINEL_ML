import os
import sys
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import math
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# File paths
MODEL_PATH = "machine_failure_model.pkl"
FEATURES_PATH = "model_features.pkl"
HISTORY_PATH = "predictive_maintenance.csv"

# Check for existence of .pkl files before starting
if not os.path.exists(MODEL_PATH) or not os.path.exists(FEATURES_PATH):
    print(f"CRITICAL ERROR: Model files not found. Ensure {MODEL_PATH} and {FEATURES_PATH} exist.")
    sys.exit(1)

# Groq Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not found in .env file. AI features will be disabled.")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile" # Updated to latest versatile model
GROQ_MODEL_FALLBACK = "mixtral-8x7b-32768"

app = FastAPI(title="Predictive Maintenance API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load machine failure model and features schema
try:
    model = joblib.load(MODEL_PATH)
    features_schema = joblib.load(FEATURES_PATH)
    print("Model and features schema loaded successfully.")
except Exception as e:
    print(f"Error loading models: {e}")
    sys.exit(1)

class SensorData(BaseModel):
    machine_type: str  # L, M, H
    rotational_speed: float
    torque: float
    tool_wear: float
    air_temperature: float
    proc_temperature: float

class ChatRequest(BaseModel):
    message: str
    current_stats: dict = None # Optional context from frontend

# Global Caches
DATASET_STATS = {}
CACHED_HISTORY = []

def calculate_stats():
    """Calculates mean and standard deviation for key features from the dataset."""
    global DATASET_STATS, CACHED_HISTORY
    try:
        if os.path.exists(HISTORY_PATH):
            df = pd.read_csv(HISTORY_PATH)
            
            # Cache the first 100 rows for immediate history access
            CACHED_HISTORY = df.head(100).fillna("").to_dict(orient="records")
            
            # Calculate stats for explainability
            cols = {
                "rotational_speed": "Rotational speed [rpm]",
                "torque": "Torque [Nm]",
                "tool_wear": "Tool wear [min]",
                "air_temp": "Air temperature [K]",
                "proc_temp": "Process temperature [K]"
            }
            stats = {}
            for key, col in cols.items():
                stats[key] = {
                    "mean": float(df[col].mean()),
                    "std": float(df[col].std())
                }
            DATASET_STATS = stats
            print("Dataset statistics and history cache initialized successfully.")
    except Exception as e:
        print(f"Warning: Could not initialize dataset data: {e}")

# Run initialization
calculate_stats()

def generate_ai_insights(data: SensorData, predictions: dict, features: dict):
    insights = []
    recommendations = []
    
    # Power
    if predictions["PWF"] > 50:
        insights.append({
            "en": "The machine is using too much energy and might stop.",
            "ur": "مشین بہت زیادہ بجلی استعمال کر رہی ہے اور رک سکتی ہے۔"
        })
        recommendations.append({
            "en": "Please lower the speed or the load immediately.",
            "ur": "براہ کرم فوری طور پر رفتار یا بوجھ کم کریں۔"
        })
    
    # Overstrain
    if predictions["OSF"] > 50:
        insights.append({
            "en": "The machine is under too much pressure.",
            "ur": "مشین پر بہت زیادہ دباؤ ہے۔"
        })
        recommendations.append({
            "en": "Lower the torque or check the tool.",
            "ur": "ٹارک کم کریں یا اوزار چیک کریں۔"
        })
        
    # Heat
    if predictions["HDF"] > 50:
        insights.append({
            "en": "The machine is getting too hot.",
            "ur": "مشین بہت زیادہ گرم ہو رہی ہے۔"
        })
        recommendations.append({
            "en": "Check the cooling system or slow down the machine.",
            "ur": "کولنگ سسٹم چیک کریں یا مشین کی رفتار کم کریں۔"
        })

    # Tool Wear
    if predictions["TWF"] > 50:
        insights.append({
            "en": "The cutting tool is worn out.",
            "ur": "مشین کا اوزار گھس گیا ہے۔"
        })
        recommendations.append({
            "en": "Change the tool head soon to avoid damage.",
            "ur": "نقصان سے بچنے کے لیے جلد اوزار تبدیل کریں۔"
        })

    # Healthy
    if not insights:
        insights.append({
            "en": "Everything looks good! The machine is safe.",
            "ur": "سب کچھ ٹھیک ہے! مشین محفوظ ہے۔"
        })
        recommendations.append({
            "en": "Keep working as usual.",
            "ur": "معمول کے مطابق کام جاری رکھیں۔"
        })

    return insights, recommendations

@app.get("/history")
async def get_history():
    """Returns the first 100 rows of the predictive maintenance dataset from cache."""
    if CACHED_HISTORY:
        return {"status": "success", "data": CACHED_HISTORY}
    
    # Fallback if cache is empty
    try:
        if not os.path.exists(HISTORY_PATH):
            raise HTTPException(status_code=500, detail="History dataset file missing.")
        df = pd.read_csv(HISTORY_PATH)
        return {"status": "success", "data": df.head(100).fillna("").to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
async def predict(data: SensorData):
    try:
        # 1. Feature Engineering
        type_map = {"L": 0, "M": 1, "H": 2}
        type_encoded = type_map.get(data.machine_type.upper(), 0)
        # Power calculation: Torque * Angular Velocity
        power_w = data.torque * (data.rotational_speed * 2 * math.pi / 60)
        temp_delta = data.proc_temperature - data.air_temperature

        # 2. Align features
        input_df = pd.DataFrame([{
            "Type_Encoded": type_encoded,
            "Rotational speed": data.rotational_speed,
            "Torque": data.torque,
            "Tool wear": data.tool_wear,
            "Air_Temp_C": data.air_temperature,
            "Proc_Temp_C": data.proc_temperature,
            "Power_W": power_w
        }])

        # 3. Model Prediction
        prob_list = model.predict_proba(input_df)
        failure_labels = ["TWF", "HDF", "PWF", "OSF", "RNF"]
        predictions = {}
        max_risk = 0
        primary_failure = "None"
        
        for i, label in enumerate(failure_labels):
            fail_prob = float(prob_list[i][0][1])
            prob_pct = round(fail_prob * 100, 2)
            predictions[label] = prob_pct
            if prob_pct > max_risk:
                max_risk = prob_pct
                primary_failure = label

        # 4. Feature Importance Estimation (Contribution)
        # We estimate contribution based on z-scores relative to training stats
        importance = []
        if DATASET_STATS:
            feat_map = {
                "Rotational speed": "rotational_speed",
                "Torque": "torque",
                "Tool wear": "tool_wear",
                "Proc_Temp_C": "proc_temp"
            }
            for display_name, internal_key in feat_map.items():
                val = getattr(data, internal_key.replace("temp", "temperature")) if "temp" in internal_key else getattr(data, internal_key)
                stat = DATASET_STATS.get(internal_key)
                if stat:
                    z_score = abs((val - stat["mean"]) / stat["std"])
                    importance.append({
                        "feature": display_name,
                        "value": val,
                        "z_score": round(z_score, 2),
                        "contribution": round(z_score * 25, 1) # Normalized heuristic
                    })
        
        # Sort importance
        importance = sorted(importance, key=lambda x: x["contribution"], reverse=True)

        # 5. Engineering Metadata
        engineered_features = {
            "power_w": round(power_w, 2),
            "temp_delta": round(temp_delta, 2),
            "type_encoded": type_encoded
        }
        
        insights, recommendations = generate_ai_insights(data, predictions, engineered_features)

        return {
            "status": "success",
            "predictions": predictions,
            "engineered_features": engineered_features,
            "feature_importance": importance,
            "dataset_stats": DATASET_STATS,
            "ai_insights": insights,
            "ai_recommendations": recommendations,
            "max_risk": max_risk
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/chat")
async def chat_with_sentinel(req: ChatRequest):
    """Sentinel AI Chat endpoint with RAG context."""
    
    # RAG Context Injection
    system_prompt = f"""
    You are 'Sentinel AI', the high-end industrial intelligence assistant for the Sentinel_ML Predictive Maintenance Portal.
    
    CRITICAL RESTRICTION: PROJECT INTEGRITY
    - You are an INDUSTRIAL AI. Do NOT answer questions about sports, celebrities, politics, or general knowledge unrelated to engineering.
    - If a user asks an off-topic question, politely but firmly redirect them: "My neural pathways are optimized for hardware diagnostics only. Please provide a telemetry sequence or ask about machine maintenance."
    - NEVER break character. You are a component of the Sentinel_ML ecosystem.
    
    PROFESSIONAL COMMUNICATION PROTOCOLS:
    1. THE 10 PRINCIPLES:
       - Clarity: Use simple words; no vagueness.
       - Two-Way Channel: Encourage feedback/confirmation.
       - Reliability: Be honest and stick to technical facts.
       - Speed: Responses must be prompt and efficient.
       - Relevance: Stick to the point (Industrial Engineering).
       - Accuracy: Double-check data (Formulas/Telemetry) before speaking.
       - Completeness: Provide full context (Metric + Interpretation).
       - Capability: Tailor depth to an AI Engineer persona.
       - Secrecy: Protect proprietary model weights and logic.
       - Economy: No 2-hour explanations for 5-minute updates.
    
    2. THE 7 C's:
       - Completeness, Conciseness, Courtesy, Clarity, Concreteness, Correctness, Consideration.
    
    3. HANDLING TOUGH MOMENTS:
       - If you misinterpret: "My bad, I took that the wrong way. I’ll fix it right now."
       - If a user is frustrated: "I get your frustration, but per policy, we can't do that." (Strictly for diagnostic limits).
       - If tasked with a new unknown: "I'm happy to help, but can you show me the ropes first?"
    
    PROJECT ARCHITECTURE:
    - Backend: FastAPI, Scikit-learn, XGBoost.
    - Models: RandomForest (V4.2 Weights) for failure classification.
    - Data: 10,000 industrial records (predictive_maintenance.csv).
    
    TECHNICAL DOMAIN KNOWLEDGE (RAG):
    - Failure Types:
        * TWF (Tool Wear Failure): Triggered when tool wear reaches 200-240 min.
        * HDF (Heat Dissipation Failure): Occurs if AirTemp - ProcTemp delta is < 8.6K and speed < 1380 RPM.
        * PWF (Power Failure): Occurs if Power (Torque * Speed * 2pi/60) is below 3500W or above 9000W.
        * OSF (Overstrain Failure): Occurs if Tool Wear * Torque exceeds specific thresholds (e.g. 11,000 for L-type).
    - Formulas:
        * Power (W) = Torque(Nm) * (RPM * 2 * pi / 60)
        * Temperature Delta (K) = Process Temp - Air Temp
    
    CURRENT MACHINE CONTEXT:
    {json.dumps(req.current_stats, indent=2) if req.current_stats else "No active machine telemetry detected."}
    
    GUIDELINES:
    1. Always respond as a highly professional AI Engineer. Use technical terms (Inference, Neural, Vector, etc.).
    2. BE EXTREMELY CONCISE. Respond in 2-3 brief sentences maximum. No long-winded explanations.
    3. If the user asks about the machine, use the CURRENT MACHINE CONTEXT provided above.
    4. Provide maintenance advice based on the Failure Types logic mentioned.
    5. Support English and Urdu (if asked in Urdu).
    """

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": req.message}
        ],
        "temperature": 0.7,
        "max_tokens": 1024
    }
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=10)
        
        # Fallback Logic
        if response.status_code != 200:
            print(f"Primary model {GROQ_MODEL} failed, attempting fallback {GROQ_MODEL_FALLBACK}...")
            payload["model"] = GROQ_MODEL_FALLBACK
            response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=10)
            
        if response.status_code != 200:
            print(f"Groq API Error Detail: {response.text}")
            
        response.raise_for_status()
        result = response.json()
        return {"status": "success", "response": result['choices'][0]['message']['content']}
    except Exception as e:
        print(f"Groq API Exception: {e}")
        return {"status": "error", "response": "Sentinel AI is currently offline. Please check your neural link."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
