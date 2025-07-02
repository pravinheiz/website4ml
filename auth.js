// Profile Management
function openProfileModal() {
  if (!currentUser) return;
  document.getElementById('profile-email').value = currentUser.email;
  document.getElementById('profile-modal').style.display = 'flex';
}

function closeProfileModal() {
  document.getElementById('profile-modal').style.display = 'none';
}

document.getElementById('profile-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const newEmail = document.getElementById('profile-email').value;
  
  try {
    const response = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ email: newEmail })
    });

    const data = await response.json();
    
    if (response.ok) {
      currentUser.email = newEmail;
      updateAuthUI();
      alert('Profile updated successfully');
      closeProfileModal();
    } else {
      alert(data.error || 'Profile update failed');
    }
  } catch (error) {
    alert('Error updating profile');
  }
});

// Password Reset Flow
function showPasswordResetModal() {
  closeProfileModal();
  document.getElementById('reset-request-modal').style.display = 'flex';
}

function closeResetRequestModal() {
  document.getElementById('reset-request-modal').style.display = 'none';
}

async function requestPasswordReset() {
  const email = document.getElementById('reset-email').value;
  
  try {
    const response = await fetch(`${API_BASE}/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    alert(data.message || 'Reset link sent if email exists');
    closeResetRequestModal();
  } catch (error) {
    alert('Error requesting password reset');
  }
}

// Handle password reset from URL token
function checkPasswordResetToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    document.getElementById('reset-token').value = token;
    document.getElementById('reset-complete-modal').style.display = 'flex';
    history.replaceState(null, '', window.location.pathname);
  }
}

function closeResetCompleteModal() {
  document.getElementById('reset-complete-modal').style.display = 'none';
}

async function completePasswordReset() {
  const token = document.getElementById('reset-token').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  if (newPassword !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }
  
  if (newPassword.length < 8) {
    alert('Password must be at least 8 characters');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });

    const data = await response.json();
    
    if (response.ok) {
      alert(data.message || 'Password updated successfully');
      closeResetCompleteModal();
      openAuthModal(); // Redirect to login
    } else {
      alert(data.error || 'Password reset failed');
    }
  } catch (error) {
    alert('Error resetting password');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  checkPasswordResetToken();
  setupOrderButtons();
});
