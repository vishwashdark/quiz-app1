let questionsData = [];
let mediaRecorder;
let recordedChunks = [];

// Fetch questions and start the camera recording
window.onload = function () {
    // Fetch quiz questions
    fetchQuestions();

    // Start camera recording if the student is logged in
    if (localStorage.getItem('studentId')) {
        startCamera(); // Start camera on successful login
    } else {
        window.location.href = 'login.html'; // Redirect if not logged in
    }
};

// Fetch quiz questions from the backend
async function fetchQuestions() {
    try {
        const response = await fetch('/questions');
        const data = await response.json();

        // Check if the response is empty or has issues
        if (data.length === 0) {
            console.log('No questions found');
            return;
        }

        questionsData = data; // Save the fetched data globally
        console.log('Questions fetched successfully', questionsData);  // Debugging

        const questionsDiv = document.getElementById('questions');
        questionsDiv.innerHTML = ''; // Clear any existing questions (if any)

        data.forEach((question, index) => {
            const questionElement = document.createElement('div');
            questionElement.classList.add('question');
            
            // Create question text
            const questionText = document.createElement('p');
            questionText.textContent = `${index + 1}. ${question.Question}`;
            questionElement.appendChild(questionText);

            // Create answer options (A, B, C, D)
            ['A', 'B', 'C', 'D'].forEach(option => {
                const label = document.createElement('label');
                label.textContent = `${option}. ${question[option]}`;
                
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = `question${index}`;
                input.value = option;
                
                label.appendChild(input);
                questionElement.appendChild(label);
            });

            questionsDiv.appendChild(questionElement);
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
    }
}

// Start the camera recording
async function startCamera() {
    try {
        // Access the webcam
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoElement = document.getElementById('video');
        videoElement.srcObject = stream;

        // Initialize the MediaRecorder
        mediaRecorder = new MediaRecorder(stream);

        // When data is available, push it into the recordedChunks array
        mediaRecorder.ondataavailable = event => {
            recordedChunks.push(event.data);
        };

        // When the recording stops, save the video
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(blob);
            
            // You can save or display the video URL as per your need
            // For example, we can offer the video for download:
            const a = document.createElement('a');
            a.href = videoUrl;
            a.download = 'quiz-recording.webm';
            a.click();
        };

        // Start recording
        mediaRecorder.start();
    } catch (error) {
        console.error('Error accessing webcam: ', error);
    }
}

// Handle form submission
document.getElementById('quiz-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    let score = 0;

    questionsData.forEach((question, index) => {
        const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);

        if (selectedOption && selectedOption.value === question['Correct Option']) {
            score++;
        }
    });

    const resultDiv = document.getElementById('result');
    resultDiv.textContent = `Your score: ${score} / ${questionsData.length}`;

    const studentId = localStorage.getItem('studentId'); // Get StudentId from localStorage

    if (studentId) {
        // Send the score to the backend for updating
        await fetch('/update-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, score }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Your score has been updated!');
            } else {
                alert('Failed to update the score.');
            }
        })
        .catch(error => {
            console.error('Error updating score:', error);
            alert('An error occurred while updating your score.');
        });
    } else {
        alert('Student ID not found!');
    }

    // Stop recording when submitting the quiz
    if (mediaRecorder) {
        mediaRecorder.stop();
    }
});
