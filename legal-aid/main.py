import threading
import webview
from app import app, init_db, seed_data


def start_server():
    app.run(host='127.0.0.1', port=5000, use_reloader=False, debug=False)


if __name__ == '__main__':
    init_db()
    seed_data()

    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    window = webview.create_window(
        '法律援助中心管理系统',
        'http://127.0.0.1:5000',
        width=1280,
        height=800,
        min_size=(960, 600)
    )
    webview.start()
