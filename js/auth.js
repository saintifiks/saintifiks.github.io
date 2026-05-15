/* ==========================================================================
   SAINTIFIKS: GOOGLE ONE TAP AUTHENTICATION MODULE
   ========================================================================== */

const GOOGLE_CLIENT_ID = "217988776417-qkei6r1jaki7cviupgegaop1f4hgldi3.apps.googleusercontent.com";

function handleCredentialResponse(response) {
    console.log("[Saintifiks Auth] Token identitas diterima dari Google.");
    
    if (typeof api !== 'undefined') {
        // Meneruskan token kriptografis ke backend (GAS) untuk dekripsi dan verifikasi
        api.post('verify_login', { token: response.credential })
           .then(() => console.log("[Saintifiks Auth] Transmisi token ke pangkalan data tereksekusi."))
           .catch(err => console.error("[Saintifiks Auth] Kegagalan transmisi ke GAS.", err));
    } else {
        console.error("[Saintifiks Auth] Error Struktural: Modul api.js gagal dimuat sebelum otentikasi berjalan.");
    }
}

function handleCredentialResponse(response) {
    console.log("[Saintifiks Auth] Token identitas diterima dari Google.");
    
    // Simpan token secara statis di memori lokal klien
    localStorage.setItem('saintifiks_token', response.credential);
    
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

    // Inisialisasi parameter login
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        cancel_on_tap_outside: false
    });

    // Otomatis menampilkan pop-up One Tap di kanan atas layar tanpa distraksi halaman penuh
    google.accounts.id.prompt();
}

// Menjalankan modul ketika Document Object Model (DOM) sudah termuat sepenuhnya
window.addEventListener('load', initGoogleAuth);
