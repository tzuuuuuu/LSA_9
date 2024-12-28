from flask import Flask, render_template, request, redirect, url_for, jsonify
import os

app = Flask(__name__)

# 設定音樂資料夾
MUSIC_FOLDER = 'static/music'
UPLOAD_FOLDER = 'static/uploads'

# 確保資料夾存在
os.makedirs(MUSIC_FOLDER, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        # 檢查是否有檔案上傳
        if "file" not in request.files:
            return "No file part", 400
        file = request.files["file"]
        if file.filename == "":
            return "No selected file", 400
        if file and file.filename.endswith(".mp3"):  # 檢查檔案是否為 MP3
            file_path = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(file_path)
            return redirect(url_for("index"))

    # 列出音樂資料夾和上傳資料夾中的 MP3 檔案
    music_files = [
                      os.path.join(MUSIC_FOLDER, f) for f in os.listdir(MUSIC_FOLDER) if f.endswith(".mp3")
                  ] + [
                      os.path.join(UPLOAD_FOLDER, f) for f in os.listdir(UPLOAD_FOLDER) if f.endswith(".mp3")
                  ]
    return render_template("index.html", music_files=music_files)


@app.route("/adjust_loop", methods=["POST"])
def adjust_loop():
    data = request.get_json()
    beat_value = data.get('beat_value', 1)  # Default to 1 beat if not specified

    # Validate beat value is within acceptable range (1/8 to 32)
    if isinstance(beat_value, (int, float)):
        if 0.125 <= float(beat_value) <= 32:
            return jsonify({
                'success': True,
                'beat_value': beat_value,
                'message': f'Loop adjusted to {beat_value} beats'
            })

    return jsonify({
        'success': False,
        'message': 'Invalid beat value. Must be between 1/8 and 32 beats'
    }), 400


if __name__ == "__main__":
    app.run(debug=True)
