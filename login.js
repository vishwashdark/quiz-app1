document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
        localStorage.setItem('studentId', data.studentId);
        window.location.href = 'index.html'; // Redirect to quiz page
    } else {
        alert(data.message || 'Login failed');
    }
});
