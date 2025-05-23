// Login form submission
document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch("http://rotmp-back.cluster-ig3.igpolytech.fr/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    console.log(result);
    console.log(response);

    if (response.ok == true && result.redirectTo) {
      console.log("Redirecting to", result.redirectTo);
      window.location.assign(result.redirectTo);
        } else {
      alert(result.error || 'Login failed');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    alert('An error occurred');
  }

  event.target.reset();
});

// Registration form submission
document.getElementById('registration-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Check if passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

        const response = await fetch('http://rotmp-back.cluster-ig3.igpolytech.fr/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            username: username,
            password: password
        })
    });


    event.target.reset();
});
