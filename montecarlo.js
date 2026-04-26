const STORAGE_KEY = 'montecarlo_sim_input_data';
let myChart = null;

function randomNormal(mean, stdDev) {
    const u = 1 - Math.random();
    const v = 1 - Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * stdDev;
}

function saveInputs() {
    const inputs = {
        currentAsset: document.getElementById('currentAsset').value,
        annualSpending: document.getElementById('annualSpending').value,
        expectedReturn: document.getElementById('expectedReturn').value,
        risk: document.getElementById('risk').value,
        years: document.getElementById('years').value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
}

function loadInputs() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const data = JSON.parse(saved);
        Object.keys(data).forEach(key => {
            if (document.getElementById(key)) {
                document.getElementById(key).value = data[key];
            }
        });
    }
}

function runSimulation() {
    saveInputs();

    const initialAsset = parseFloat(document.getElementById('currentAsset').value);
    const spending = parseFloat(document.getElementById('annualSpending').value);
    const meanReturn = parseFloat(document.getElementById('expectedReturn').value) / 100;
    const stdDev = parseFloat(document.getElementById('risk').value) / 100;
    const years = parseInt(document.getElementById('years').value);
    const iterations = 1000;

    let allResults = [];
    let successCount = 0;

    for (let i = 0; i < iterations; i++) {
        let history = [initialAsset];
        let currentAsset = initialAsset;

        for (let y = 1; y <= years; y++) {
            const yearlyReturn = randomNormal(meanReturn, stdDev);
            currentAsset = currentAsset * (1 + yearlyReturn) - spending;
            if (currentAsset < 0) currentAsset = 0;
            history.push(currentAsset);
        }

        if (currentAsset > 0) successCount++;
        allResults.push(history);
    }

    const successRate = ((successCount / iterations) * 100).toFixed(1);
    document.getElementById('successRateDisplay').textContent = `${successRate} %`;
    document.getElementById('successCountDisplay').textContent = `${successCount} / ${iterations} 回成功`;

    const labels = Array.from({length: years + 1}, (_, i) => `${i}年目`);
    const percentiles = [10, 50, 90].map(p => {
        return labels.map((_, yearIdx) => {
            const valuesAtYear = allResults.map(h => h[yearIdx]).sort((a, b) => a - b);
            const index = Math.floor(p / 100 * iterations);
            return valuesAtYear[index];
        });
    });

    updateChart(labels, percentiles);

    [0, 1, 2].forEach(i => {
        const cb = document.getElementById(`cb${i}`);
        if (cb && !cb.checked) {
            myChart.getDatasetMeta(i).hidden = true;
        }
    });
    myChart.update();
}

function updateChart(labels, percentileData) {
    const ctx = document.getElementById('fireChart').getContext('2d');
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: '好調シナリオ（10%の確率でこの水準以上）', data: percentileData[2], borderColor: '#10b981', backgroundColor: 'transparent', borderDash: [5, 5], borderWidth: 2, pointRadius: 0 },
                { label: '中央値（50%の確率でこの水準）', data: percentileData[1], borderColor: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.1)', fill: true, borderWidth: 3, pointRadius: 0 },
                { label: '不調シナリオ（10%の確率でこの水準以下）', data: percentileData[0], borderColor: '#ef4444', backgroundColor: 'transparent', borderDash: [2, 2], borderWidth: 2, pointRadius: 0 },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            scales: { y: { beginAtZero: true, title: { display: true, text: '資産額 (万円)' } } },
            plugins: { legend: { display: false } }
        }
    });
}

function toggleDataset(index) {
    if (!myChart) return;
    const meta = myChart.getDatasetMeta(index);
    meta.hidden = !meta.hidden;
    myChart.update();
}

document.getElementById('runBtn').addEventListener('click', runSimulation);

window.onload = () => {
    loadInputs();
    runSimulation();
};
