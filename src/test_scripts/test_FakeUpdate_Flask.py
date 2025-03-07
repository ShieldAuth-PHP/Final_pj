from flask import Flask, send_file

app = Flask(__name__)

# FakeUpdates 악성 페이지 서빙
@app.route('/')
def fake_update_page():
    return '''
    <html>
    <head>
        <title>Fake Browser Update</title>
        <script>
            function fakeUpdate() {
                alert("Your browser is out of date! Please update now.");
                window.location.href = "/malware.exe";
            }
            setTimeout(fakeUpdate, 2000);
        </script>
    </head>
    <body>
        <h1>Welcome to Safe Browsing</h1>
        <p>Your browser is up-to-date.</p>
    </body>
    </html>
    '''

# 악성코드 파일 다운로드 (실제 실행 안 되도록 빈 파일 제공)
@app.route('/malware.exe')
def fake_malware():
    return send_file("malware.exe", as_attachment=True)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
