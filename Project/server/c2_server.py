# server/c2_server.py

import socket

HOST = '0.0.0.0'  # 모든 인터페이스에서 수신
PORT = 5050

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind((HOST, PORT))
server.listen(1)
print(f"[+] C2 서버 대기 중... (포트 {PORT})")

client, addr = server.accept()
print(f"[+] 연결됨: {addr}")

while True:
    data = client.recv(4096).decode('utf-8')
    if not data:
        break
    print(f"[+] C2 알림 수신: {data}")

client.close()
server.close()