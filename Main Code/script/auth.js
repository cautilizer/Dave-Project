// Simple client-side auth module (DEMO ONLY)
// WARNING: This is purely client-side and not secure. For production use a real server-side auth system.

const _users = [
  { username: 'staff1', password: 'staffpass', role: 'staff' },
  { username: 'manager', password: 'managerpass', role: 'management' },
  { username: 'mami', password: 'mamipass', role: 'mami' },
  { username: 'pr', password: 'prpass', role: 'pr' }
];

function login(username, password) {
  const u = _users.find(x => x.username === username && x.password === password);
  if (!u) return false;
  const payload = { username: u.username, role: u.role, issued: Date.now() };
  localStorage.setItem('ncs_user', JSON.stringify(payload));
  return true;
}

function logout() {
  localStorage.removeItem('ncs_user');
  // Redirect to login page
  location.href = 'login.html';
}

function getCurrentUser() {
  try {
    const item = localStorage.getItem('ncs_user');
    if (!item) return null;
    return JSON.parse(item);
  } catch (e) {
    return null;
  }
}

// Enforce page-level auth; allowedRoles is optional array of allowed role strings
function requireAuth(allowedRoles) {
  const user = getCurrentUser();
  if (!user) {
    // not logged in
    location.href = 'login.html';
    return false;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Not authorized for this page
    alert('You do not have permission to view this page.');
    location.href = 'index.html';
    return false;
  }
  return true;
}

// Toggle visibility for elements that declare data-role-visible="role1,role2"
function initAuthUI() {
  const user = getCurrentUser();
  // Update nav user display if present
  const userEl = document.getElementById('currentUser');
  if (userEl) {
    userEl.textContent = user ? `${user.username} (${user.role})` : '';
  }

  // Show/hide based on data-role-visible
  document.querySelectorAll('[data-role-visible]').forEach(el => {
    const allowed = el.getAttribute('data-role-visible').split(',').map(s => s.trim()).filter(Boolean);
    if (!user) {
      el.style.display = 'none';
      return;
    }
    if (allowed.length === 0) {
      // if empty, show to logged in users
      el.style.display = '';
      return;
    }
    el.style.display = allowed.includes(user.role) ? '' : 'none';
  });

  // For role-guarded actions: add disabled attribute if not allowed
  document.querySelectorAll('[data-role-action]').forEach(btn => {
    const allowed = btn.getAttribute('data-role-action').split(',').map(s => s.trim()).filter(Boolean);
    if (!user) {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      return;
    }
    if (allowed.length === 0) return; // no rule
    const allowedFlag = allowed.includes(user.role);
    if (!allowedFlag) {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  });
}

// Utility to check authorization for a given action at runtime
function canPerform(rolesAllowed) {
  const user = getCurrentUser();
  if (!user) return false;
  if (!rolesAllowed || rolesAllowed.length === 0) return true;
  return rolesAllowed.includes(user.role);
}

// Expose functions globally
window.authModule = {
  login, logout, getCurrentUser, requireAuth, initAuthUI, canPerform
};
// For convenience expose top-level names used in inline scripts
window.login = login;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.initAuthUI = initAuthUI;
window.canPerform = canPerform;
