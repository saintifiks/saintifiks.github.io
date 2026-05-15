/* ==========================================================================
   SAINTIFIKS: GOOGLE ONE TAP AUTHENTICATION MODULE
   ========================================================================== */

const GOOGLE_CLIENT_ID = "217988776417-qkei6r1jaki7cviupgegaop1f4hgldi3.apps.googleusercontent.com";

// Utilitas Pembongkar JWT & Rendering Profil
function renderUserProfile() {
    const container = document.getElementById('user-profile-container');
    if (!container) return;

    const token = localStorage.getItem('saintifiks_token');
    if (token) {
        try {
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            const pictureUrl = payload.picture;
            const name = payload.name;

            // Merender foto profil Google bentuk bundar
            container.innerHTML = `<img src="${pictureUrl}" alt="${name}" title="${name}" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--base-black); object-fit: cover;">`;
        } catch (e) {
            renderLoginButton(container);
        }
    } else {
        renderLoginButton(container);
    }
}

function renderLoginButton(container) {
    container.innerHTML = ''; // Mengosongkan kontainer
    
    // Merender tombol resmi Google untuk bypass restriksi Incognito
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
    
    // Simpan token secara statis di memori lokal klien
    localStorage.setItem('saintifiks_token', response.credential);
    
    // Perbarui UI Header secara instan tanpa memuat ulang halaman
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
        cancel_on_tap_outside: false
    });

    const existingToken = localStorage.getItem('saintifiks_token');
    if (!existingToken) {
        google.accounts.id.prompt();
    }
}

// Menjalankan modul & merender profil setelah DOM termuat
window.addEventListener('load', () => {
    initGoogleAuth();
    renderUserProfile();
});
