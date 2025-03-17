import hashlib
import os

import joblib
import numpy as np
from flask import Flask, jsonify, request

from malware_detector import predict_malware  # AI 모델 예측 함수

app = Flask(__name__)

# 파일 해시 계산 함수
def get_file_hash(file_path):
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

@app.route("/scan", methods=["POST"])
def scan_file():
    if "file" not in request.files:
        return jsonify({"error": "파일이 없음"}), 400

    uploaded_file = request.files["file"]
    file_path = os.path.join("uploads", uploaded_file.filename)
    uploaded_file.save(file_path)

    # 해시 값 확인
    file_hash = get_file_hash(file_path)

    # AI 모델로 분석
    prediction = predict_malware(file_path)

    # 결과 반환
    return jsonify({
        "filename": uploaded_file.filename,
        "file_hash": file_hash,
        "prediction": prediction
    })

@app.route("/scan_script", methods=["POST"])
def scan_script():
    data = request.json
    script_content = data.get("script", "")

    if not script_content:
        return jsonify({"error": "No script content provided"}), 400

    # AI 모델을 이용하여 스크립트 분석
    prediction = predict_malware(script_content)

    return jsonify({"prediction": prediction})

if __name__ == "__main__":
    os.makedirs("uploads", exist_ok=True)
    app.run(host="0.0.0.0", port=5000, debug=True)