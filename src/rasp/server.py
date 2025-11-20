from flask import Flask, send_file
from pathlib import Path
import request, jsonify

app = Flask(__name__)

correctColor: str = ""

# absolute or relative path to your HTML file
html_path = Path("../webapp/index.html")

@app.route("/")
def home():
    return send_file(html_path)

@app.route("/api/input")
def input_color():
    # Get data
    data = request.args.get("data")  # e.g., /api/input?data=red
    if not data:
        return jsonify({"error": "No color provided"}), 400
    
    # Check if the correct color
    if correctColor == "":
        print("Color is not defined!")
    if correctColor == data.color:
        

    # Return status
    return jsonify({"received": data})

if __name__ == "__main__":
    app.run(debug=True)
