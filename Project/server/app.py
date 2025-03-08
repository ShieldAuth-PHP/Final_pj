# server/app.py

import datetime
import os
import socket

import yara
from flask import Flask, jsonify, request

app = Flask(__name__)

# YARA 룰 파일 경로 (combined_rules.yar가 같은 디렉토리에 있어야 함)
RULES_FILEPATH = os.path.join(os.path.dirname(__file__), 'combined_rules.yar')
rules = yara.compile(filepath=RULES_FILEPATH)

# 로컬 C2 서버 설정 (127.0.0.1:5050)
C2_HOST = '127.0.0.1'
C2_PORT = 5050

def send_to_c2(message):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect((C2_HOST, C2_PORT))
            s.sendall(message.encode('utf-8'))
    except Exception as e:
        print("C2 전송 실패:", e)

@app.route('/scan', methods=['POST'])
def scan_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    uploaded_file = request.files['file']
    filename = uploaded_file.filename
    data = uploaded_file.read()

    # YARA 룰 매칭
    matches = rules.match(data=data)
    is_malicious = (len(matches) > 0)

    # 검사 결과 구성
    result = {
        'result': 'malicious' if is_malicious else 'clean',
        'matches': [m.rule for m in matches]
    }

    # 간단 로그 기록 (scan.log)
    log_line = f"{datetime.datetime.now()} - Scanned {filename} : {result['result']}\n"
    with open(os.path.join(os.path.dirname(__file__), 'scan.log'), 'a', encoding='utf-8') as logf:
        logf.write(log_line)

    # 악성 판정 시 C2 서버로 경고 메시지 전송
    if is_malicious:
        alert_message = f"Alert: {filename} detected as malicious. Matches: {', '.join(result['matches'])}"
        send_to_c2(alert_message)

    return jsonify(result)

if __name__ == "__main__":
    # Flask 서버 실행 (127.0.0.1:5000)
    app.run(host="127.0.0.1", port=5000, debug=True)