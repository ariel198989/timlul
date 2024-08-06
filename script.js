let mediaRecorder;
let audioChunks = [];

const apiKeyInput = document.getElementById('apiKey');
const audioFileInput = document.getElementById('audioFile');
const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');
const transcribeButton = document.getElementById('transcribeButton');
const transcriptionDiv = document.getElementById('transcription');
const processingIndicator = document.getElementById('processingIndicator');

recordButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);
transcribeButton.addEventListener('click', transcribeAudio);

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        audioChunks = []; // Clear previous recordings
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.start();
        recordButton.classList.add('hidden');
        stopButton.classList.remove('hidden');
    } catch (error) {
        console.error('שגיאה בהתחלת ההקלטה:', error);
        alert('לא ניתן להתחיל הקלטה. אנא ודא שיש לך מיקרופון מחובר ושנתת הרשאה לשימוש בו.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        recordButton.classList.remove('hidden');
        stopButton.classList.add('hidden');
    }
}

async function transcribeAudio() {
    const apiKey = apiKeyInput.value;
    if (!apiKey) {
        alert('אנא הכנס את מפתח ה-API של Groq');
        return;
    }

    let audioFile;
    if (audioFileInput.files.length > 0) {
        audioFile = audioFileInput.files[0];
    } else if (audioChunks.length > 0) {
        audioFile = new Blob(audioChunks, { type: 'audio/wav' });
    } else {
        alert('אנא העלה קובץ אודיו או הקלט אודיו');
        return;
    }

    const formData = new FormData();
    formData.append('file', audioFile, 'recording.wav');
    formData.append('api_key', apiKey);

    processingIndicator.classList.remove('hidden');
    transcriptionDiv.classList.add('hidden');

    try {
        const response = await fetch('/transcribe', {
            method: 'POST',
            body: formData
        });

        const responseText = await response.text();
        console.log('Server response:', responseText);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
        }

        const data = JSON.parse(responseText);
        transcriptionDiv.textContent = data.transcription;
        transcriptionDiv.classList.remove('hidden');
    } catch (error) {
        console.error('שגיאה:', error);
        alert('אירעה שגיאה בעת תמלול האודיו: ' + error.message);
    } finally {
        processingIndicator.classList.add('hidden');
    }
}