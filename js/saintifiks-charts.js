/* ==========================================================================
   SAINTIFIKS: KONFIGURASI VISUALISASI DATA (CHART.JS)
   PERBAIKAN: Bug #8 — fungsi sekarang dipanggil otomatis saat file dimuat
   ========================================================================== */

const SaintifiksTheme = {
    colors: {
        baseBlack: '#111111',
        baseWhite: '#FBFBF9',
        bluePositive: '#002EC7',
        redNegative: '#C90203',
        yellowSpeculative: 'rgba(223, 171, 0, 0.2)',
        gridLine: '#DDDDDD'
    },
    fonts: {
        data: "'IBM Plex Mono', monospace",
        ui: "'Helvetica', Arial, sans-serif"
    }
};

function initSaintifiksChartDefaults() {
    if (typeof Chart === 'undefined') {
        console.warn("Library Chart.js belum dimuat pada dokumen ini.");
        return;
    }

    Chart.defaults.color = SaintifiksTheme.colors.baseBlack;
    Chart.defaults.font.family = SaintifiksTheme.fonts.data;
    Chart.defaults.font.size = 12;

    Chart.defaults.scale.grid.color = SaintifiksTheme.colors.gridLine;
    Chart.defaults.scale.grid.borderColor = SaintifiksTheme.colors.baseBlack;
    Chart.defaults.scale.ticks.color = SaintifiksTheme.colors.baseBlack;

    Chart.defaults.plugins.tooltip.titleFont = { family: SaintifiksTheme.fonts.ui, size: 14, weight: 'bold' };
    Chart.defaults.plugins.tooltip.bodyFont = { family: SaintifiksTheme.fonts.data, size: 13 };
    Chart.defaults.plugins.tooltip.backgroundColor = SaintifiksTheme.colors.baseBlack;
    Chart.defaults.plugins.tooltip.titleColor = SaintifiksTheme.colors.baseWhite;
    Chart.defaults.plugins.tooltip.bodyColor = SaintifiksTheme.colors.baseWhite;
    Chart.defaults.plugins.tooltip.cornerRadius = 2;
    Chart.defaults.plugins.tooltip.padding = 10;

    Chart.defaults.elements.line.borderWidth = 2;
    Chart.defaults.elements.line.tension = 0.1;

    Chart.defaults.elements.point.radius = 0;
    Chart.defaults.elements.point.hoverRadius = 6;

    console.log("Konstitusi visual Saintifiks Chart.js telah diterapkan.");
}

// PERBAIKAN Bug #8: Fungsi sekarang dipanggil otomatis saat DOM selesai dimuat.
// Sebelumnya fungsi ini hanya "didefinisikan" tapi tidak pernah "dijalankan".
document.addEventListener('DOMContentLoaded', initSaintifiksChartDefaults);
