let myChart = null;
const inputs = document.querySelectorAll('input');

function saveToLocal() {
    const data = {};
    inputs.forEach(el => { data[el.id] = el.type === 'checkbox' ? el.checked : el.value; });
    localStorage.setItem('fire_sim_data', JSON.stringify(data));
}

function loadFromLocal() {
    const saved = localStorage.getItem('fire_sim_data');
    if (saved) {
        const data = JSON.parse(saved);
        inputs.forEach(el => {
            if (data[el.id] !== undefined) {
                if (el.type === 'checkbox') el.checked = data[el.id];
                else el.value = data[el.id];
            }
        });
    }
}

function update() {
    saveToLocal();

    const ageNow = parseInt(document.getElementById('age_now').value) || 0;
    const ageFire = Math.max(ageNow, parseInt(document.getElementById('age_fire').value) || 0);
    const initialAssets = parseFloat(document.getElementById('assets').value) || 0;
    const annualRate = (parseFloat(document.getElementById('ret').value) || 0) / 100;
    const investMonthly = parseFloat(document.getElementById('invest').value) || 0;
    const spendMonthly = parseFloat(document.getElementById('spend').value) || 0;

    const taxEnabled = document.getElementById('tax_enabled').checked;
    const taxRateInput = document.getElementById('tax_rate');
    taxRateInput.disabled = !taxEnabled;
    const taxRate = (parseFloat(taxRateInput.value) || 0) / 100;

    const infEnabled = document.getElementById('inf_enabled').checked;
    const infRateInput = document.getElementById('inf_rate');
    infRateInput.disabled = !infEnabled;
    const inflationRate = (parseFloat(infRateInput.value) || 0) / 100;

    let currentAssets = initialAssets;
    let totalCostBasis = initialAssets;
    let historyAssets = [initialAssets];
    let historyRatio = [];
    let historyTax = [0];
    let historyProfitRatio = [0];
    let historySpendWithInf = [spendMonthly * 12];
    let labels = [ageNow + '歳'];
    let assetsAtFire = 0;

    const baseAnnualSpend = spendMonthly * 12;
    historyRatio.push(baseAnnualSpend > 0 ? (initialAssets / baseAnnualSpend).toFixed(1) : 0);

    for (let y = 1; y <= (100 - ageNow); y++) {
        let yearlyTax = 0;
        let currentAnnualSpend = baseAnnualSpend;
        if (infEnabled && y > (ageFire - ageNow)) {
            currentAnnualSpend = baseAnnualSpend * Math.pow(1 + inflationRate, y - (ageFire - ageNow));
        }

        for (let m = 0; m < 12; m++) {
            currentAssets *= (1 + annualRate / 12);
            if (y <= (ageFire - ageNow)) {
                currentAssets += investMonthly;
                totalCostBasis += investMonthly;
            } else {
                let monthlyOut = currentAnnualSpend / 12;
                let profitRatio = currentAssets > totalCostBasis ? (currentAssets - totalCostBasis) / currentAssets : 0;
                let tax = taxEnabled ? (monthlyOut * profitRatio * taxRate) : 0;
                yearlyTax += tax;
                totalCostBasis -= (monthlyOut + tax) * (1 - profitRatio);
                totalCostBasis = Math.max(0, totalCostBasis);
                currentAssets -= (monthlyOut + tax);
            }
        }
        currentAssets = Math.max(0, currentAssets);
        historyAssets.push(Math.round(currentAssets));
        historyRatio.push(currentAnnualSpend > 0 ? (currentAssets / currentAnnualSpend).toFixed(1) : 0);
        historyTax.push(yearlyTax);
        historyProfitRatio.push(currentAssets > totalCostBasis ? (currentAssets - totalCostBasis) / currentAssets : 0);
        historySpendWithInf.push(currentAnnualSpend);
        labels.push((ageNow + y) + '歳');
        if (y === (ageFire - ageNow)) assetsAtFire = currentAssets;
    }

    if (myChart) myChart.destroy();
    myChart = new Chart(document.getElementById('fireChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: '資産総額(万円)', data: historyAssets, borderColor: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.1)', fill: true, tension: 0.3, yAxisID: 'y' },
                { label: '資産寿命倍率(倍)', data: historyRatio, borderColor: '#f59e0b', borderDash: [5, 5], tension: 0.3, pointRadius: 0, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: { type: 'linear', display: true, position: 'left', ticks: { callback: v => v >= 10000 ? (v/10000).toFixed(1) + '億' : v + '万' } },
                y1: { type: 'linear', display: true, position: 'right', min: 0, max: 50, grid: { drawOnChartArea: false }, ticks: { callback: v => v + '倍' } }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        footer: (items) => {
                            const i = items[0].dataIndex;
                            let lines = ['', '--- 推計詳細 ---'];
                            lines.push(`年支出: ${Math.round(historySpendWithInf[i]).toLocaleString()}万円`);
                            if (i > (ageFire - ageNow) && taxEnabled) {
                                lines.push(`想定税額: 約 ${Math.round(historyTax[i])} 万円`);
                            }
                            return lines.join('\n');
                        }
                    }
                }
            }
        }
    });

    document.getElementById('res-target').innerText = Math.round(baseAnnualSpend * 25).toLocaleString() + '万';
    document.getElementById('res-proj').innerText = Math.round(assetsAtFire).toLocaleString() + '万';
    document.getElementById('res-rate').innerText = ((assetsAtFire / (baseAnnualSpend * 25)) * 100).toFixed(1) + '%';
}

loadFromLocal();
inputs.forEach(el => el.addEventListener('input', update));
update();
