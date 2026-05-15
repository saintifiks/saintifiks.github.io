/* ==========================================================================
   SAINTIFIKS: API COMMUNICATOR (FETCH PROTOCOL)
   ========================================================================== */

const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwqhhX9VYDptBG78FaTy_hMtB87qOyZRuE56EkLS7jHPLo4lcnc6XffEjb6VWYgOHQ9/exec";

const api = {
    /**
     * Protokol transmisi data ke Google Apps Script (Ubah data/Tulis)
     * Menggunakan Content-Type text/plain untuk mem-bypass restriksi preflight CORS
     */
    post: async function(action, payload) {
        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: action, data: payload })
            });
            return { status: "dispatched" }; 
        } catch (error) {
            console.error(`[Saintifiks API] Kegagalan transmisi POST pada aksi: ${action}`, error);
        }
    },

    /**
     * Protokol penarikan data dari Google Apps Script (Baca)
     */
    get: async function(action, params = {}) {
        try {
            const url = new URL(GAS_WEB_APP_URL);
            url.searchParams.append('action', action);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error(`[Saintifiks API] Kegagalan transmisi GET pada aksi: ${action}`, error);
        }
    }
};
