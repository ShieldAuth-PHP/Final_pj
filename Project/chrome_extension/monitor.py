#!/usr/bin/env python3
import json
import sys
import time


def send_message(message):
    """ Chrome에 JSON 형식으로 메시지 전송 """
    message_json = json.dumps(message)
    sys.stdout.write(message_json + "\n")
    sys.stdout.flush()

def read_message():
    """ Chrome으로부터 메시지 읽기 """
    message_length = sys.stdin.read(4)  # 메시지 길이 읽기 (첫 4바이트)
    if not message_length:
        return None
    message_length = int.from_bytes(message_length.encode(), byteorder="little")
    message_data = sys.stdin.read(message_length)  # 메시지 읽기
    return json.loads(message_data)

if __name__ == "__main__":
    send_message({"status": "ready"})  # Chrome 확장 프로그램에 시작 알림
    while True:
        message = read_message()
        if message is None:
            break
        if message.get("action") == "start":
            send_message({"status": "running"})
        time.sleep(1)