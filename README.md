# 🛡️ SENTINEL_ML: Industrial Predictive Maintenance Portal

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Python](https://img.shields.io/badge/python-v3.10+-blue.svg) ![React](https://img.shields.io/badge/react-v18.2-blue.svg) ![FastAPI](https://img.shields.io/badge/FastAPI-v0.95+-green.svg)

**Sentinel_ML** is a next-generation industrial intelligence platform designed to predict machine failures before they happen. Powered by ensemble machine learning models and an LLM-driven diagnostic assistant, it bridges the gap between raw hardware telemetry and actionable engineering insights.

---

## 🚀 Features

### 🧠 Advanced AI Diagnostics
- **Real-Time Inference**: Instant failure probability scoring using `RandomForest` and `XGBoost`.
- **Sentinel AI Assistant**: A RAG-powered (Retrieval-Augmented Generation) chatbot that interprets machine stats using the **Groq API** (`llama-3.3-70b`).
- **Explainable Metrics**: Visualizes feature contribution (Z-Scores) to understand *why* a machine is at risk.

### 🏭 Industrial-Grade Interface
- **3D Telemetry Visualization**: Interactive hardware models with live sensor mapping.
- **Glassmorphic Design**: A premium, dark-mode aesthetic tailored for modern control rooms.
- **Mobile-Responsive**: Fully optimized for tablets and handheld diagnostic tools.

### 🛡️ Professional Communication Protocols
- **Business Logic Integration**: The AI adheres to the "10 Principles of Communication" and "7 C's" for elite professional interaction.
- **Tough Moment Handlers**: Specialized logic to handle technical disputes and policy enforcement.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TailwindCSS, Framer Motion, Recharts, Lucide Icons.
- **Backend**: Python (FastAPI), Pandas, Scikit-learn, Joblib.
- **LLM/AI**: Groq API (Llama-3.3-70b/Mixtral-8x7b) combined with vector-based context injection.

---

## ⚡ Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 16+
- Git

### 2. Installation

 Clone the repository
```bash
git clone https://github.com/muhaddasgujjar/SENTINEL_ML.git
cd SENTINEL_ML
```

### 3. Backend Setup
```bash
# Install dependencies
pip install fastapi uvicorn pandas scikit-learn joblib requests

# Start the API server
python server.py
```
*Server runs on `http://localhost:8000`*

### 4. Frontend Setup
```bash
cd frontend
# Install dependencies
npm install

# Start the dashboard
npm run dev
```
*Dashboard accessible at `http://localhost:5173`*

---

## 📂 Project Structure

```
SENTINEL_ML/
├── server.py                 # FastAPI Backend & RAG Logic
├── machine_failure_model.pkl # Trained ML Model
├── predictive_maintenance.csv # Dataset
├── deploy_to_github.bat      # Deployment Script
└── frontend/                 # React Application
    ├── src/
    │   ├── App.jsx           # Main Dashboard Component
    │   └── ...
    └── ...
```

---

## 🔧 AI Configuration
To modify the **Sentinel AI** persona, edit the `system_prompt` in `server.py`. The current logic includes strict industrial constraints and business communication guidelines.

---

## 📜 License
This project is licensed under the MIT License - see the LICENSE file for details.

---

*Engineered by Muhaddas Gujjar*
