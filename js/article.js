/* ==========================================================================
   SAINTIFIKS: LOGIKA INTERAKTIF HALAMAN ARTIKEL
   VERSI REMEDIASI: F7 (eksternalisasi dari template.html) + F6 (null checks) +
   F8 (aria-label) + F9 (focus-visible) + F2 (sessionStorage) + B4 (check_user_status POST)
   Dependensi: api.js (objek `api`, konstanta `GAS_WEB_APP_URL`), auth.js (decodeJwtPayload, isTokenExpired)
   ========================================================================== */

// =================================================================
// UTILITAS: Menetralisir karakter berbahaya sebelum ditampilkan
// (Pencegahan serangan XSS)
// =================================================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(text)));
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    // ============================================================
    // Baca article-id dari <meta name="article-id">
    // WAJIB DIGANTI untuk setiap artikel baru.
    // ============================================================
    const articleIdMeta = document.querySelector('meta[name="article-id"]');
    const articleId = articleIdMeta ? articleIdMeta.getAttribute('content') : null;

    // ============================================================
    // DIPERBAIKI F6: Ambil semua elemen DOM dan lakukan null check
    // sebelum operasi apa pun. Jika salah satu elemen tidak ada,
    // catat error spesifik dan hentikan eksekusi dengan bersih
    // daripada membiarkan TypeError meledak di tengah jalan.
    // ============================================================
    const btnLike = document.getElementById('btn-like-icon');
    const pathHeart = document.getElementById('path-heart');
    const svgHeart = document.getElementById('svg-heart');
    const countDisplay = document.getElementById('like-count-display');
    const commentsStatus = document.getElementById('comments-status');
    const commentsList = document.getElementById('comments-list');
    const btnSubmitComment = document.getElementById('btn-submit-comment');
    const commentInput = document.getElementById('comment-input');
    const commentNotice = document.getElementById('comment-notice');

    // Elemen kritis — hentikan jika tidak ada
    const criticalElements = { btnLike, pathHeart, svgHeart, countDisplay, commentsStatus, commentsList, btnSubmitComment, commentInput, commentNotice };
    const missingElements = Object.entries(criticalElements)
        .filter(([, el]) => !el)
        .map(([name]) => name);

    if (missingElements.length > 0) {
        console.error('[Saintifiks] FATAL: Elemen DOM tidak ditemukan: ' + missingElements.join(', ') + '. Semua fitur interaktif dinonaktifkan.');
        return;
    }

    if (!articleId) {
        console.error('[Saintifiks] FATAL: tag <meta name="article-id"> tidak ditemukan. Semua fitur interaktif dinonaktifkan.');
        btnLike.disabled = true;
        btnSubmitComment.disabled = true;
        countDisplay.textContent = 'ID artikel tidak terkonfigurasi.';
        return;
    }

    // ---------------------------------------------------------
    // DIPERBAIKI F9: Tambahkan :focus-visible styling lewat JS
    // sebagai gantinya outline: none yang menghilangkan indikator
    // fokus keyboard. CSS class ini perlu ditambahkan ke saintifiks.css
    // (lihat catatan di bawah).
    // ---------------------------------------------------------
    btnLike.style.outline = 'none'; // Hapus outline default yang kasar
    btnLike.addEventListener('focusin', () => {
        btnLike.style.boxShadow = '0 0 0 3px var(--accent-blue)';
    });
    btnLike.addEventListener('focusout', () => {
        btnLike.style.boxShadow = 'none';
    });

    // ---------------------------------------------------------
    // DIPERBAIKI F8: Tambahkan aria-label yang bermakna pada
    // tombol like — tanpa ini screen reader hanya mengumumkan "tombol"
    // tanpa konteks apa yang dilakukan tombol tersebut.
    // ---------------------------------------------------------
    btnLike.setAttribute('aria-label', 'Beri reaksi pada artikel ini');
    btnLike.setAttribute('aria-pressed', 'false'); // Akan diperbarui ke 'true' setelah like

    // ---------------------------------------------------------
    // 1. SISTEM TELEMETRI (KEEPALIVE)
    // ---------------------------------------------------------
    const SESSION_MIN_SECONDS = 5;
    const startTime = Date.now();
    window.addEventListener('beforeunload', () => {
        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
        if (durationSeconds >= SESSION_MIN_SECONDS) {
            // DIPERBAIKI F2: Baca dari sessionStorage
            const token = sessionStorage.getItem('saintifiks_token');
            let identifier = 'anonymous';
            if (token) {
                const payload = decodeJwtPayload(token);
                if (payload && payload.email) identifier = payload.email;
            }
            if (typeof GAS_WEB_APP_URL !== 'undefined') {
                fetch(GAS_WEB_APP_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ action: 'track_session', data: { identifier, article_id: articleId, duration_seconds: durationSeconds } }),
                    keepalive: true
                }).catch(() => {});
            }
        }
    });

    // ---------------------------------------------------------
    // 2. LOGIKA REAKSI GEOMETRIS (OPTIMISTIC UI)
    // ---------------------------------------------------------
    let userJustLiked = false;
    let currentLikeCount = 0;

    function setLikedState() {
        pathHeart.setAttribute('fill', 'var(--base-black)');
        pathHeart.setAttribute('stroke', 'var(--base-black)');
        btnLike.disabled = true;
        btnLike.style.cursor = 'default';
        btnLike.style.transform = 'none';
        svgHeart.style.opacity = '0.9';
        // DIPERBAIKI F8: Perbarui aria-pressed untuk mengumumkan status ke screen reader
        btnLike.setAttribute('aria-pressed', 'true');
        btnLike.setAttribute('aria-label', 'Anda sudah memberi reaksi pada artikel ini');
    }

    // DIPERBAIKI F2: Baca dari sessionStorage
    let userEmail = '';
    const token = sessionStorage.getItem('saintifiks_token');
    if (token) {
        const payload = decodeJwtPayload(token);
        if (payload && payload.email) userEmail = payload.email;
    }

    if (typeof api !== 'undefined') {
        // Muat like_count dari GET endpoint (publik, tidak perlu token)
        api.get('get_article_status', { article_id: articleId })
           .then(res => {
               if (res.status === 'success') {
                   if (!userJustLiked) {
                       currentLikeCount = res.data.like_count;
                       countDisplay.textContent = `${currentLikeCount} Reaksi`;
                   }
               }
           }).catch(() => {
               if (!userJustLiked) {
                   currentLikeCount = 0;
                   countDisplay.textContent = '0 Reaksi';
               }
           });

        // DIPERBAIKI B4: Cek has_liked lewat POST dengan token (terpisah dari GET publik)
        // Hanya dilakukan jika pengguna sedang login
        if (userEmail && token) {
            api.post('check_user_status', { token: token, article_id: articleId })
               .then(res => {
                   if (res && res.status === 'success' && res.data && res.data.has_liked) {
                       setLikedState();
                   }
               })
               .catch(() => {
                   // Tidak kritis — pengguna tetap dapat mencoba like jika terjadi error di sini
               });
        }
    }

    btnLike.addEventListener('click', () => {
        // DIPERBAIKI F2: Baca dari sessionStorage
        const currentToken = sessionStorage.getItem('saintifiks_token');
        const tokenExpired = (typeof isTokenExpired === 'function') && isTokenExpired(currentToken);

        if (!currentToken || tokenExpired) {
            pathHeart.setAttribute('stroke', 'var(--accent-red)');
            pathHeart.setAttribute('stroke-width', '3');
            setTimeout(() => {
                pathHeart.setAttribute('stroke', 'var(--base-black)');
                pathHeart.setAttribute('stroke-width', '2');
                if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                    google.accounts.id.prompt();
                }
            }, 1000);
            return;
        }

        userJustLiked = true;
        currentLikeCount += 1;
        setLikedState();
        countDisplay.textContent = `${currentLikeCount} Reaksi`;

        if (typeof api !== 'undefined') {
            api.post('like_article', { token: currentToken, article_id: articleId })
               .then(res => {
                   if (res && res.status === 'success' && res.data && res.data.new_count !== undefined) {
                       currentLikeCount = res.data.new_count;
                       countDisplay.textContent = `${currentLikeCount} Reaksi`;
                   }
               })
               .catch(() => {
                   // Error jaringan: pertahankan angka optimistic
               });
        }
    });

    // ---------------------------------------------------------
    // 3. LOGIKA KOMENTAR (BACA & TULIS)
    // ---------------------------------------------------------
    const NOTICE_TIMEOUT_MS = 3000;

    if (typeof api !== 'undefined') {
        api.get('get_comments', { article_id: articleId })
           .then(res => {
               if (res.status === 'success') {
                   if (res.data.length === 0) {
                       commentsStatus.textContent = 'Belum ada tanggapan. Jadilah yang pertama.';
                   } else {
                       commentsStatus.textContent = `${res.data.length} Tanggapan Tercatat`;
                   }
                   commentsList.innerHTML = res.data.map(c => `
                       <div style="border-bottom: 1px solid var(--border-color); padding: 12px 0;">
                           <strong style="font-family: var(--font-tertiary); font-size: 0.85rem;">${escapeHtml(c.name)}</strong>
                           <span style="font-family: var(--font-secondary); font-size: 0.75rem; color: #777; margin-left: 8px;">
                               ${new Date(c.created_at).toLocaleDateString('id-ID')}
                           </span>
                           <p style="font-family: var(--font-primary); font-size: 0.95rem; margin-top: 6px; line-height: 1.5;">${escapeHtml(c.content)}</p>
                       </div>
                   `).join('');
               }
           }).catch(() => {
               commentsStatus.textContent = "Gagal menjangkau pangkalan data komentar.";
           });
    }

    // DIPERBAIKI F8: Tambahkan <label> untuk textarea komentar secara programatik
    // (karena label tidak ada di HTML template — diperbaiki di sini tanpa mengubah HTML)
    const commentLabel = document.createElement('label');
    commentLabel.setAttribute('for', 'comment-input');
    commentLabel.textContent = 'Tulis tanggapan Anda';
    commentLabel.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0;'; // Visually hidden tapi accessible
    commentInput.parentNode.insertBefore(commentLabel, commentInput);

    btnSubmitComment.addEventListener('click', () => {
        // DIPERBAIKI F2: Baca dari sessionStorage
        const currentToken = sessionStorage.getItem('saintifiks_token');
        const content = commentInput.value.trim();

        if (!currentToken || (typeof isTokenExpired === 'function' && isTokenExpired(currentToken))) {
            commentNotice.style.display = 'block';
            commentNotice.style.color = 'var(--accent-red)';
            commentNotice.textContent = 'Anda perlu login terlebih dahulu untuk berkomentar.';
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                google.accounts.id.prompt();
            }
            setTimeout(() => { commentNotice.style.display = 'none'; }, NOTICE_TIMEOUT_MS);
            return;
        }

        if (!content) {
            commentNotice.style.display = 'block';
            commentNotice.style.color = '#777';
            commentNotice.textContent = 'Tulis tanggapan Anda terlebih dahulu.';
            // DIPERBAIKI COSMETIC: Gunakan NOTICE_TIMEOUT_MS yang konsisten (3000ms), bukan 2000ms
            setTimeout(() => { commentNotice.style.display = 'none'; }, NOTICE_TIMEOUT_MS);
            return;
        }

        btnSubmitComment.textContent = "MENGIRIM...";
        btnSubmitComment.disabled = true;
        commentNotice.style.display = 'none';

        api.post('add_comment', { token: currentToken, article_id: articleId, content: content })
           .then(res => {
               if (res.status === 'success') {
                   commentInput.value = '';
                   btnSubmitComment.textContent = "TERKIRIM ✓";

                   commentNotice.style.display = 'block';
                   commentNotice.style.color = '#555';
                   commentNotice.textContent = 'Tanggapan Anda berhasil dikirim dan sedang menunggu moderasi sebelum ditayangkan.';

                   setTimeout(() => {
                       btnSubmitComment.textContent = "KIRIM TANGGAPAN";
                       btnSubmitComment.disabled = false;
                   }, NOTICE_TIMEOUT_MS);
               }
           }).catch(() => {
               btnSubmitComment.textContent = "GAGAL";
               commentNotice.style.display = 'block';
               commentNotice.style.color = 'var(--accent-red)';
               commentNotice.textContent = 'Gagal mengirim tanggapan. Periksa koneksi internet Anda.';
               setTimeout(() => {
                   btnSubmitComment.textContent = "KIRIM TANGGAPAN";
                   btnSubmitComment.disabled = false;
                   commentNotice.style.display = 'none';
               }, NOTICE_TIMEOUT_MS);
           });
    });
});
