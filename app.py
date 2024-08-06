from flask import Flask, request, jsonify, render_template
import requests
import os

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max-limit

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    api_key = request.form.get('api_key')
    if not api_key:
        return jsonify({'error': 'נדרש מפתח API'}), 400

    if 'file' not in request.files:
        return jsonify({'error': 'לא נמצא קובץ בבקשה'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'לא נבחר קובץ'}), 400
    
    filename = file.filename
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        with open(filepath, 'rb') as audio_file:
            files = {'file': (filename, audio_file)}
            headers = {'Authorization': f'Bearer {api_key}'}
            response = requests.post(
                'https://api.groq.com/openai/v1/audio/transcriptions',
                headers=headers,
                files=files,
                data={'model': 'whisper-large-v3', 'language': 'he'}
            )
        
        print(f"Groq API response: {response.status_code} - {response.text}")
        
        if response.status_code != 200:
            return jsonify({'error': f'שגיאה בתמלול: {response.text}'}), response.status_code

        transcription = response.json()['text']
        return jsonify({'transcription': transcription}), 200

    except Exception as e:
        print(f"Exception: {str(e)}")
        return jsonify({'error': f'שגיאה: {str(e)}'}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

if __name__ == '__main__':
    app.run(debug=True, port=5002)