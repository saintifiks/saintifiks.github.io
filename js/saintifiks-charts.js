/* ==========================================================================
   SAINTIFIKS: KONFIGURASI VISUALISASI DATA (CHART.JS)
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
        data: "'IBM Plex Mono', monospace", // Untuk angka dan sumbu grafik
        ui: "'Helvetica', Arial, sans-serif" // Untuk tooltip/antarmuka
    }
};

// Fungsi ini akan dipanggil di setiap artikel yang memiliki visualisasi data
function initSaintifiksChartDefaults() {
    if (typeof Chart === 'undefined') {
        console.warn("Library Chart.js belum dimuat pada dokumen ini.");
        return;
    }

    // Setelan Global
    Chart.defaults.color = SaintifiksTheme.colors.baseBlack;
    Chart.defaults.font.family = SaintifiksTheme.fonts.data;
    Chart.defaults.font.size = 12;

    // Setelan Skala & Sumbu (Grid)
    Chart.defaults.scale.grid.color = SaintifiksTheme.colors.gridLine;
    Chart.defaults.scale.grid.borderColor = SaintifiksTheme.colors.baseBlack;
    Chart.defaults.scale.ticks.color = SaintifiksTheme.colors.baseBlack;

    // Setelan Tooltip (Kotak info saat kursor mengarah ke data)
    Chart.defaults.plugins.tooltip.titleFont = { family: SaintifiksTheme.fonts.ui, size: 14, weight: 'bold' };
    Chart.defaults.plugins.tooltip.bodyFont = { family: SaintifiksTheme.fonts.data, size: 13 };
    Chart.defaults.plugins.tooltip.backgroundColor = SaintifiksTheme.colors.baseBlack;
    Chart.defaults.plugins.tooltip.titleColor = SaintifiksTheme.colors.baseWhite;
    Chart.defaults.plugins.tooltip.bodyColor = SaintifiksTheme.colors.baseWhite;
    Chart.defaults.plugins.tooltip.cornerRadius = 2; // Sudut tajam, bukan membulat
    Chart.defaults.plugins.tooltip.padding = 10;

    // Setelan Garis (Ketegasan Analitis)
    Chart.defaults.elements.line.borderWidth = 2;
    Chart.defaults.elements.line.tension = 0.1; // Garis agak kaku, menghindari kurva berlebihan
    
    // Setelan Titik Data
    Chart.defaults.elements.point.radius = 0; // Titik tersembunyi agar grafik bersih
    Chart.defaults.elements.point.hoverRadius = 6; // Titik hanya muncul saat kursor mendekat

    console.log("Konstitusi visual Saintifiks Chart.js telah diterapkan.");
}
