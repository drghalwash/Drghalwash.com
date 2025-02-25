
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const imageId = document.getElementById('imageId').value;
  const password = e.target.password.value;

  try {
    const response = await fetch('/galleries/validate-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId, password })
    });
    
    const data = await response.json();
    if (data.success) {
      window.location.href = data.redirectUrl;
    } else {
      alert('Invalid password');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred');
  }
});
