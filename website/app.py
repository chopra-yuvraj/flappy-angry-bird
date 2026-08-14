import os
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')


@app.route('/')
def index():
    """Serve landing page."""
    return send_from_directory('.', 'index.html')


@app.route('/play')
def play():
    """Serve game arcade page."""
    return send_from_directory('.', 'play.html')


@app.route('/<path:path>')
def static_proxy(path):
    """Serve static assets."""
    return send_from_directory('.', path)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
