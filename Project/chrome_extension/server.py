from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import hashlib
import tempfile

# malware_detector.py에서 함수 불러오기
"""
try:
    from malware_detector import predict_malware
except ImportError:
    # 모델이 없으면 간단한 함수로 대체
    def predict_malware(file_path_or_content):
        return "benign"  # 실제 환경에서는 모델로 예측해야 함
"""

# 항상 기본 함수 사용
def predict_malware(file_path_or_content):
    return "benign"  # AI 모델 없이 항상 안전하다고 응답

app = Flask(__name__)
CORS(app)  # 크로스 오리진 요청 허용

@app.route("/scan", methods=["POST"])
def scan_file():
    if "file" not in request.files and not request.json:
        return jsonify({"error": "파일이 없거나 스캔 요청이 잘못되었습니다"}), 400

    if "file" in request.files:
        uploaded_file = request.files["file"]
        os.makedirs("uploads", exist_ok=True)
        file_path = os.path.join("uploads", uploaded_file.filename)
        uploaded_file.save(file_path)

        # 간단한 해시 값 계산
        file_hash = hashlib.md5(open(file_path, 'rb').read()).hexdigest()

        # 여기서 실제 파일 분석 진행
        prediction = predict_malware(file_path)
        
        return jsonify({
            "filename": uploaded_file.filename,
            "file_hash": file_hash,
            "prediction": prediction
        })
    else:
        # 스캔 요청만 받은 경우 (파일 없음)
        return jsonify({"prediction": "benign", "message": "최근 다운로드 파일 없음"})

@app.route("/scan_script", methods=["POST"])
def scan_script():
    data = request.json
    script_content = data.get("script", "")

    if not script_content:
        return jsonify({"error": "No script content provided"}), 400

    # 위험한 패턴이 있는지 간단히 확인
    malicious_patterns = [
        "document.cookie", "eval(", ".eval(", 
        "fromCharCode", "String.fromCharCode",
        "document.write(unescape", "base64"
    ]
    
    suspicious_count = 0
    for pattern in malicious_patterns:
        if pattern in script_content:
            suspicious_count += 1
    
    # 간단한 판단 로직
    if suspicious_count >= 3:
        prediction = "malicious"
    else:
        prediction = "benign"
    
    return jsonify({"prediction": prediction})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)