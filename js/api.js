/* ==========================================================================
   SAINTIFIKS: API COMMUNICATOR (FETCH PROTOCOL)
   PERBAIKAN: Bug #6 (error handling) + Bug #14 (timeout 10 detik)
   ========================================================================== */

const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwqhhX9VYDptBG78FaTy_hMtB87qOyZRuE56EkLS7jHPLo4lcnc6XffEjb6VWYgOHQ9/exec";

const api = {
    /**
     * Protokol transmisi data ke Google Apps Script (Ubah data/Tulis)
     * Menggunakan Content-Type text/plain untuk mem-bypass restriksi preflight CORS
     * PERBAIKAN Bug #14: Ditambahkan AbortController agar request dibatalkan jika > 10 detik
     */
    post: async function(action, payload) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 detik

        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: action, data: payload }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.error(`[Saintifiks API] Timeout: aksi "${action}" melebihi 10 detik.`);
            } else {
                console.error(`[Saintifiks API] Kegagalan transmisi POST pada aksi: ${action}`, error);
            }
            throw error; // Tetap lempar error agar .catch() di luar bisa menangkap
        }
    },

    /**
     * Protokol penarikan data dari Google Apps Script (Baca)
     * PERBAIKAN Bug #6: Ditambahkan "throw error" agar error tidak tertelan diam-diam
     * PERBAIKAN Bug #14: Ditambahkan AbortController agar request dibatalkan jika > 10 detik
     */
    get: async function(action, params = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 detik

        try {
            const url = new URL(GAS_WEB_APP_URL);
            url.searchParams.append('action', action);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.error(`[Saintifiks API] Timeout: aksi "${action}" melebihi 10 detik.`);
            } else {
                console.error(`[Saintifiks API] Kegagalan transmisi GET pada aksi: ${action}`, error);
            }
            throw error; // PERBAIKAN Bug #6: Sekarang error dilempar, tidak ditelan diam-diam
        }
    }
};
