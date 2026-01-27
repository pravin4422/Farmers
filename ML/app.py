from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)  

model = joblib.load("crop_model.pkl")
state_encoder = joblib.load("state_encoder.pkl")
district_encoder = joblib.load("district_encoder.pkl")
season_encoder = joblib.load("season_encoder.pkl")
crop_encoder = joblib.load("crop_encoder.pkl")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        state = state_encoder.transform([data["state"].strip().upper()])[0]
        district = district_encoder.transform([data["district"].strip().upper()])[0]
        season = season_encoder.transform([data["season"].strip().upper()])[0]
        year = int(data["year"])
        area = float(data["area"])

        input_df = pd.DataFrame([{
            "State": state,
            "District": district,
            "Season": season,
            "Year": year,
            "Area": area
        }])

        prediction = model.predict(input_df)[0]
        crop = crop_encoder.inverse_transform([prediction])[0]

        return jsonify({
            "status": "success",
            "recommended_crop": crop
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
