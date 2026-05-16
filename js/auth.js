/* ==========================================================================
   SAINTIFIKS: GOOGLE ONE TAP AUTHENTICATION MODULE
   PERBAIKAN: Bug #7 (cek kadaluarsa token) + Bug #15 (One Tap less aggressive)
   ========================================================================== */

const GOOGLE_CLIENT_ID = "217988776417-qkei6r1jaki7cviupgegaop1f4hgldi3.apps.googleusercontent.com";

// --------------------------------------------------------------------------
// PERBAIKAN Bug #7: Fungsi baru untuk mengecek apakah token sudah kadaluarsa
// Token Google hanya berlaku sekitar 1 jam. Setelah itu harus login ulang.
// --------------------------------------------------------------------------
function isTokenExpired(token) {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        // payload.exp berisi waktu kadaluarsa dalam satuan DETIK
        // Date.now() mengembalikan waktu saat ini dalam MILIDETIK
        // Maka payload.exp dikali 1000 untuk disamakan satuannya
        return (payload.exp * 1000) < Date.now();
    } catch(e) {
        return true; // Jika token tidak bisa dibaca, anggap sudah kadaluarsa
    }
}

// Utilitas Pembongkar JWT & Rendering Profil
function renderUserProfile() {
    const container = document.getElementById('user-profile-container');
    if (!container) return;

    const token = localStorage.getItem('saintifiks_token');

    // PERBAIKAN Bug #7: Cek juga apakah token sudah kadaluarsa
    if (token && !isTokenExpired(token)) {
        try {
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            const pictureUrl = payload.picture;
            const name = payload.name;

            container.innerHTML = `<img src="${pictureUrl}" alt="${name}" title="${name}" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--base-black); object-fit: cover;">`;
        } catch (e) {
            // Jika parsing gagal, hapus token yang rusak dan tampilkan tombol login
            localStorage.removeItem('saintifiks_token');
            renderLoginButton(container);
        }
    } else {
        // PERBAIKAN Bug #7: Jika token ada tapi sudah kadaluarsa, hapus dari memori
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
        cancel_on_tap_outside: true // PERBAIKAN Bug #15: Pengguna kini bisa menutup prompt dengan klik di luar
    });

    const existingToken = localStorage.getItem('saintifiks_token');

    // PERBAIKAN Bug #7: Tampilkan prompt login jika tidak ada token ATAU token sudah kadaluarsa
    if (!existingToken || isTokenExpired(existingToken)) {
        if (existingToken) localStorage.removeItem('saintifiks_token'); // Bersihkan token lama
        google.accounts.id.prompt();
    }
}

window.addEventListener('load', () => {
    initGoogleAuth();
    renderUserProfile();
});
