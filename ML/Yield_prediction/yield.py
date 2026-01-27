from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)  

model = joblib.load("yield_model.pkl")
label_encoders = joblib.load("yield_encoders.pkl")


@app.route("/predict_yield", methods=["POST"])
def predict_yield():
    try:
        data = request.json

        crop = data["crop"].strip()
        crop_year = int(data["crop_year"])
        season_input = data["season"].strip()
        state = data["state"].strip()
        area = float(data["area"])
        annual_rainfall = float(data["annual_rainfall"])
        
        available_seasons = label_encoders['Season'].classes_
        season = None
        for s in available_seasons:
            if s.strip().lower() == season_input.lower():
                season = s
                break
        
        if season is None:
            raise ValueError(f"Season '{season_input}' not found. Available: {[s.strip() for s in available_seasons]}")

        crop_encoded = label_encoders['Crop'].transform([crop])[0]
        season_encoded = label_encoders['Season'].transform([season])[0]
        state_encoded = label_encoders['State'].transform([state])[0]

        input_df = pd.DataFrame([{
            "Crop": crop_encoded,
            "Crop_Year": crop_year,
            "Season": season_encoded,
            "State": state_encoded,
            "Area": area,
            "Annual_Rainfall": annual_rainfall
        }])

        predicted_yield = model.predict(input_df)[0]

        return jsonify({
            "status": "success",
            "predicted_yield": round(predicted_yield, 2),
            "input_details": {
                "crop": crop,
                "year": crop_year,
                "season": season,
                "state": state,
                "area": area,
                "annual_rainfall": annual_rainfall
            }
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "message": "Yield Prediction API is running"
    })


@app.route("/get_options", methods=["GET"])
def get_options():
    """Get all valid options for categorical fields"""
    return jsonify({
        "status": "success",
        "options": {
            "crops": sorted(label_encoders['Crop'].classes_.tolist()),
            "seasons": sorted(label_encoders['Season'].classes_.tolist()),
            "states": sorted(label_encoders['State'].classes_.tolist())
        }
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5002, debug=True)