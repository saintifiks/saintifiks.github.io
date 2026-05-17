/* ==========================================================================
   SAINTIFIKS: GOOGLE ONE TAP AUTHENTICATION MODULE
   VERSI REMEDIASI: F2 (sessionStorage, bukan localStorage) + F12 (hapus innerHTML)
   ========================================================================== */

const GOOGLE_CLIENT_ID = "217988776417-qkei6r1jaki7cviupgegaop1f4hgldi3.apps.googleusercontent.com";

// --------------------------------------------------------------------------
// Utilitas bersama untuk dekode JWT payload dengan padding yang benar.
// Didefinisikan sebagai global agar dapat dipakai oleh article.js.
// --------------------------------------------------------------------------
function decodeJwtPayload(token) {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '=='.substring(0, (4 - base64.length % 4) % 4);
        return JSON.parse(atob(padded));
    } catch (e) {
        return null;
    }
}

// --------------------------------------------------------------------------
// Cek kedaluwarsa token
// --------------------------------------------------------------------------
function isTokenExpired(token) {
    const payload = decodeJwtPayload(token);
    if (!payload) return true;
    return (payload.exp * 1000) < Date.now();
}

// --------------------------------------------------------------------------
// Render profil pengguna di header
// --------------------------------------------------------------------------
function renderUserProfile() {
    const container = document.getElementById('user-profile-container');
    if (!container) return;

    // DIPERBAIKI F2: Baca token dari sessionStorage, bukan localStorage.
    // sessionStorage tidak bertahan lintas tab atau setelah browser ditutup,
    // sehingga jendela eksploitasi menyempit drastis.
    const token = sessionStorage.getItem('saintifiks_token');

    if (token && !isTokenExpired(token)) {
        const payload = decodeJwtPayload(token);

        if (payload) {
            const pictureUrl = payload.picture || '';
            const name = payload.name || 'Pengguna';

            container.innerHTML = '';

            const img = document.createElement('img');
            img.src = pictureUrl;
            img.alt = name;
            img.title = name;
            img.style.cssText = 'width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--base-black); object-fit: cover;';

            img.onerror = () => {
                img.style.display = 'none';
                const fallback = document.createElement('span');
                fallback.textContent = name[0].toUpperCase();
                fallback.style.cssText = [
                    'width: 32px',
                    'height: 32px',
                    'border-radius: 50%',
                    'background: var(--base-black)',
                    'color: var(--base-white)',
                    'display: flex',
                    'align-items: center',
                    'justify-content: center',
                    'font-family: var(--font-tertiary)',
                    'font-weight: bold',
                    'font-size: 14px'
                ].join('; ');
                container.appendChild(fallback);
            };

            container.appendChild(img);

            const logoutBtn = document.createElement('button');
            logoutBtn.textContent = 'Keluar';
            logoutBtn.title = 'Keluar dari akun';
            logoutBtn.setAttribute('aria-label', 'Keluar dari akun Saintifiks');
            logoutBtn.style.cssText = [
                'margin-left: 8px',
                'background: transparent',
                'border: 1px solid var(--base-black)',
                'padding: 4px 8px',
                'font-family: var(--font-tertiary)',
                'font-size: 0.75rem',
                'font-weight: bold',
                'text-transform: uppercase',
                'cursor: pointer',
                'color: var(--base-black)',
                'line-height: 1'
            ].join('; ');
            logoutBtn.addEventListener('click', () => {
                // DIPERBAIKI F2: Hapus dari sessionStorage
                sessionStorage.removeItem('saintifiks_token');
                if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                    google.accounts.id.disableAutoSelect();
                }
                location.reload();
            });
            container.appendChild(logoutBtn);

        } else {
            // DIPERBAIKI F2: Hapus dari sessionStorage
            sessionStorage.removeItem('saintifiks_token');
            renderLoginButton(container);
        }
    } else {
        if (token) {
            // DIPERBAIKI F2: Hapus dari sessionStorage
            sessionStorage.removeItem('saintifiks_token');
            console.log("[Saintifiks Auth] Token kedaluwarsa, meminta login ulang.");
        }
        renderLoginButton(container);
    }
}

function renderLoginButton(container) {
    container.innerHTML = '';

    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.renderButton(
            container,
            { theme: "filled_black", size: "medium", shape: "rectangular", text: "signin" }
        );
    } else {
        // DIPERBAIKI F12: Gunakan DOM API, bukan innerHTML, untuk konsistensi konvensi keamanan.
        const span = document.createElement('span');
        span.textContent = 'Koneksi Google Terputus';
        span.style.cssText = 'font-family: var(--font-tertiary); font-size: 0.85rem; font-weight: bold; text-transform: uppercase; color: var(--base-black);';
        container.appendChild(span);
    }
}

function handleCredentialResponse(response) {
    console.log("[Saintifiks Auth] Token identitas diterima dari Google.");

    // DIPERBAIKI F2: Simpan ke sessionStorage, bukan localStorage.
    sessionStorage.setItem('saintifiks_token', response.credential);
    renderUserProfile();

    if (typeof api !== 'undefined') {
        api.post('verify_login', { token: response.credential })
           .then(() => console.log("[Saintifiks Auth] Transmisi token ke pangkalan data tereksekusi."))
           .catch(err => console.error("[Saintifiks Auth] Kegagalan transmisi ke GAS.", err));
    } else {
        console.error("[Saintifiks Auth] Error Struktural: Modul api.js gagal dimuat sebelum otentikasi berjalan.");
    }
}

function initGoogleAuth() {
    if (typeof google === 'undefined' || typeof google.accounts === 'undefined') {
        console.warn("[Saintifiks Auth] Pustaka Google Sign-In tidak ditemukan.");
        return;
    }

    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        cancel_on_tap_outside: true
    });

    // DIPERBAIKI F2: Cek sessionStorage
    const existingToken = sessionStorage.getItem('saintifiks_token');

    if (!existingToken || isTokenExpired(existingToken)) {
        if (existingToken) sessionStorage.removeItem('saintifiks_token');
        google.accounts.id.prompt();
    }
}

window.addEventListener('load', () => {
    initGoogleAuth();
    renderUserProfile();
});
