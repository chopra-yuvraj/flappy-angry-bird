import os
from flask import Flask, render_template

app = Flask(__name__, static_folder='static', static_url_path='/static')


@app.route('/')
def index():
    """Landing page."""
    return render_template('index.html')


@app.route('/play')
def play():
    """Game page — JS canvas game, no iframe or WASM."""
    return render_template('play.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
