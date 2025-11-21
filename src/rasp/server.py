from flask import Flask, send_file, request, jsonify
from pathlib import Path
from game import ColorGame
import threading
import time
import os
import socket

app = Flask(__name__, static_folder="../webapp", static_url_path="/")

# Initialize the game
game = ColorGame(initial_lives=7, initial_time=30.0)

# Time tracking
game_active = False
time_thread = None

# absolute or relative path to your HTML file
html_path = Path("../webapp/index.html")

@app.route("/")
def home():
    return send_file(os.path.join(app.static_folder, "index.html"))


@app.route("/api/start", methods=["POST"])
def start_game():
    """Start a new game"""
    global game_active, time_thread
    
    if game.hasGameStarted():
        game.resetGame()
    game.startGame()
    
    return jsonify({
        "success": True
    })


@app.route("/api/inputted_colors")
def get_inputted_colors():
    """Get the current colors for this round"""
    if game._round == 0:
        return jsonify({"error": "Game not started"}), 400
    
    return jsonify({
        # Only provide the already correctly guessed colors to the client
        "colors": game._correctColors[:game._correctInputCount],
        "correct_count": game._correctInputCount,
        "total": len(game._correctColors)
    })


@app.route("/api/input", methods=["POST"])
def input_color():
    """Submit color input"""
    # Get data from JSON body
    data = request.get_json()
    if not data or "color" not in data:
        return jsonify({"error": "No color provided"}), 400
    
    # Check if game has started
    if game._round == 0:
        return jsonify({"error": "Game not started"}), 400
    
    # Check if game is over
    if game.isGameOver():
        return jsonify({"error": "Game is over"}), 400
    
    # Get selected color
    selected_color = data["color"]
    
    # Input into the color game 
    game.colorInput(selected_color)

    return jsonify({
        "feedback": "success" # success, wrong, input_disabled
    })


@app.route("/api/status")
def get_status():
    """Get current game status"""
    data = game.getData()

    return jsonify({
        "round": data["round"],
        "lives": data["lives"],
        "game_started": game.hasGameStarted(),
        "is_game_over": game.isGameOver(),
        "is_round_complete": game.isRoundComplete()
    })


@app.route("/api/time_remaining")
def get_time_remaining():
    data = game.getData()
    return jsonify({
        "time_remaining": data["time_remaining"]
    })


if __name__ == "__main__":
    # Reduce Flask/Werkzeug verbosity in console while still showing warnings/errors
    import logging
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    logging.getLogger('flask.app').setLevel(logging.ERROR)

    # Try to auto-detect a usable local IP address to bind to. This opens
    # a UDP socket to a public address (no packets sent) to learn the
    # outbound interface address. Fall back to 0.0.0.0 if detection fails.
    def detect_local_ip(fallback="0.0.0.0"):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                # This does not send data but forces the OS to populate the
                # socket with the preferred outbound IP.
                s.connect(("8.8.8.8", 80))
                return s.getsockname()[0]
        except Exception:
            return fallback

    host_ip = detect_local_ip()
    print(f"Starting server on http://{host_ip}:5000 (binding to detected IP)")

    # Run without debug and without the reloader to avoid duplicate output
    app.run(host=host_ip, port=5000, debug=False, use_reloader=False)