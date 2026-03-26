// =====================================================
//  Car Parking System - API Layer
//  All data now uses MongoDB via backend REST API
//  Backend: http://localhost:5000/api
// =====================================================

const API = 'http://localhost:5000/api';

// ─── openDB is a no-op now (kept so existing pages don't break) ───
function openDB() { return Promise.resolve(true); }

// ─── Helper: authenticated fetch ───
async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem('cp_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  try {
    const res = await fetch(API + path, { ...options, headers });
    return res.json();
  } catch {
    return { success: false, message: 'Cannot connect to server. Is the backend running on port 5000?' };
  }
}

// =====================================================
//  PUBLIC API - Authentication
// =====================================================

/**
 * Login: sends credentials to MongoDB backend
 * On success saves token + session, returns { success, role, user }
 */
async function login(loginId, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ loginId, password })
  });

  if (data.success) {
    // Persist JWT token and session info
    sessionStorage.setItem('cp_token', data.token);
    sessionStorage.setItem('cp_session', JSON.stringify({ ...data.user, role: data.role }));
  }
  return data;
}

// =====================================================
//  PUBLIC API - User Management
// =====================================================

async function registerUser(userData) {
  // Split full_name into first/last if needed
  const parts = (userData.full_name || '').trim().split(' ');
  const first_name = parts[0] || '';
  const last_name  = parts.slice(1).join(' ') || parts[0] || '';

  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username:       userData.username,
      password:       userData.password,
      first_name,
      last_name,
      full_name:      userData.full_name,
      email:          userData.email,
      phone:          userData.phone || '',
      vehicle_number: userData.vehicle_number,
      vehicle_type:   userData.vehicle_type || 'car'
    })
  });
}

async function registerOwnerApi(ownerData) {
  return apiFetch('/auth/register-owner', {
    method: 'POST',
    body: JSON.stringify(ownerData)
  });
}

async function getAllUsers() {
  const data = await apiFetch('/users');
  if (!data.success) return [];
  // Normalise field names to match existing table rendering
  return (data.users || []).map(u => ({
    ...u,
    user_id:    u._id,
    created_at: u.createdAt
  }));
}

async function toggleUserStatus(user_id) {
  return apiFetch(`/users/${user_id}/toggle-status`, { method: 'PATCH' });
}

async function deleteUser(user_id) {
  return apiFetch(`/users/${user_id}`, { method: 'DELETE' });
}

async function updateUser(user) {
  return { success: false, message: 'updateUser not implemented via API yet.' };
}

// =====================================================
//  PUBLIC API - Parking Owner Management
// =====================================================

async function getAllOwners() {
  const data = await apiFetch('/owners');
  if (!data.success) return [];
  return (data.owners || []).map(o => ({
    ...o,
    created_at: o.createdAt
  }));
}

async function addOwner(ownerData) {
  return apiFetch('/owners', {
    method: 'POST',
    body: JSON.stringify(ownerData)
  });
}

async function deleteOwner(owner_id_or_mongo_id) {
  // owner_id_or_mongo_id could be MongoDB _id string
  return apiFetch(`/owners/${owner_id_or_mongo_id}`, { method: 'DELETE' });
}

// =====================================================
//  PUBLIC API - Session Management (unchanged)
// =====================================================

function saveSession(user) {
  sessionStorage.setItem('cp_session', JSON.stringify(user));
}

function getSession() {
  const data = sessionStorage.getItem('cp_session');
  return data ? JSON.parse(data) : null;
}

function clearSession() {
  sessionStorage.removeItem('cp_session');
  sessionStorage.removeItem('cp_token');
}

/**
 * requireLogin(allowedRoles)
 * Checks sessionStorage for a valid session.
 * If missing or wrong role → redirects to Login page.
 * Returns the session object on success.
 */
function requireLogin(allowedRoles = []) {
  const session = getSession();
  if (!session) {
    window.location.href = 'Login page.html';
    return null;
  }
  if (allowedRoles.length && !allowedRoles.includes(session.role)) {
    alert('⛔ Access denied. You do not have permission to view this page.');
    window.location.href = 'Login page.html';
    return null;
  }
  return session;
}
