/* ==========================================================================
   SAINTIFIKS: GOOGLE ONE TAP AUTHENTICATION MODULE
   PERBAIKAN: #4 (innerHTML XSS) + #5 (JWT padding + shared utility) +
              #9 (onerror avatar) + #17 (logout) + #18 (CLS min-width)
   ========================================================================== */

const GOOGLE_CLIENT_ID = "217988776417-qkei6r1jaki7cviupgegaop1f4hgldi3.apps.googleusercontent.com";

// --------------------------------------------------------------------------
// FIXED #5: Utilitas bersama untuk dekode JWT payload dengan padding yang benar.
// Sebelumnya logika ini disalin di 4 lokasi berbeda tanpa padding — atob()
// gagal diam-diam pada token yang panjang base64-nya tidak kelipatan 4.
// Didefinisikan sebagai global agar dapat dipakai oleh template.html.
// --------------------------------------------------------------------------
function decodeJwtPayload(token) {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        // FIXED #5: tambahkan padding '=' yang hilang sebelum atob()
        const padded = base64 + '=='.substring(0, (4 - base64.length % 4) % 4);
        return JSON.parse(atob(padded));
    } catch (e) {
        return null; // token tidak dapat dibaca — perlakukan sebagai tidak valid
    }
}

// --------------------------------------------------------------------------
// Cek kadaluarsa token — sekarang menggunakan utilitas bersama (FIXED #5)
// --------------------------------------------------------------------------
function isTokenExpired(token) {
    const payload = decodeJwtPayload(token);
    if (!payload) return true;
    // payload.exp dalam detik, Date.now() dalam milidetik
    return (payload.exp * 1000) < Date.now();
}

// --------------------------------------------------------------------------
// Render profil pengguna di header
// --------------------------------------------------------------------------
function renderUserProfile() {
    const container = document.getElementById('user-profile-container');
    if (!container) return;

    const token = localStorage.getItem('saintifiks_token');

    if (token && !isTokenExpired(token)) {
        const payload = decodeJwtPayload(token); // FIXED #5: gunakan utilitas bersama

        if (payload) {
            const pictureUrl = payload.picture || '';
            const name = payload.name || 'Pengguna';

            // FIXED #4: Gunakan DOM API (createElement/setAttribute) bukan innerHTML
            // Ini mencegah karakter " < > di dalam name/pictureUrl memecah HTML atau
            // memungkinkan injeksi skrip.
            container.innerHTML = '';

            const img = document.createElement('img');
            img.src = pictureUrl;
            img.alt = name;       // setAttribute tidak diperlukan — DOM API aman secara otomatis
            img.title = name;
            img.style.cssText = 'width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--base-black); object-fit: cover;';

            // FIXED #9: Tangani gambar profil yang gagal dimuat (URL dicabut atau CDN mati)
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

            // FIXED #17: Tambahkan tombol logout agar pengguna bisa keluar secara eksplisit
            // (penting untuk perangkat bersama)
            const logoutBtn = document.createElement('button');
            logoutBtn.textContent = 'Keluar';
            logoutBtn.title = 'Keluar dari akun';
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
                localStorage.removeItem('saintifiks_token');
                if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                    google.accounts.id.disableAutoSelect();
                }
                location.reload();
            });
            container.appendChild(logoutBtn);

        } else {
            // Payload tidak bisa didekode — hapus token rusak
            localStorage.removeItem('saintifiks_token');
            renderLoginButton(container);
        }
    } else {
        // FIXED #7 (original): Hapus token kadaluarsa dari memori
        if (token) {
            localStorage.removeItem('saintifiks_token');
            console.log("[Saintifiks Auth] Token kadaluarsa, meminta login ulang.");
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
        container.innerHTML = `<span style="font-family: var(--font-tertiary); font-size: 0.85rem; font-weight: bold; text-transform: uppercase; color: var(--base-black);">Koneksi Google Terputus</span>`;
    }
}

function handleCredentialResponse(response) {
    console.log("[Saintifiks Auth] Token identitas diterima dari Google.");

    localStorage.setItem('saintifiks_token', response.credential);
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
        console.warn("[Saintifiks Auth] Pustaka injeksi Google Sign-In eksternal tidak ditemukan di dokumen HTML.");
        return;
    }

    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        cancel_on_tap_outside: true
    });

    const existingToken = localStorage.getItem('saintifiks_token');

    if (!existingToken || isTokenExpired(existingToken)) {
        if (existingToken) localStorage.removeItem('saintifiks_token');
        google.accounts.id.prompt();
    }
}

window.addEventListener('load', () => {
    initGoogleAuth();
    renderUserProfile();
});
