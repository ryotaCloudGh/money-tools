let myChart = null;

function calculate() {
    const monthlySpend = parseFloat(document.getElementById('monthly_spend').value) || 0;
    const duration = parseInt(document.getElementById('duration').value) || 0;
    const eduCost = parseFloat(document.getElementById('edu_cost').value) || 0;
    const extraCost = parseFloat(document.getElementById('extra_cost').value) || 0;
    const savings = parseFloat(document.getElementById('savings').value) || 0;
    const mortgage = parseFloat(document.getElementById('mortgage').value) || 0;
    const partnerIncome = parseFloat(document.getElementById('partner_income').value) || 0;
    const pensionAnnual = parseFloat(document.getElementById('pension_type').value) || 0;

    const labels = [];
    const coverageData = [];

    let initialNeeded = 0;
    let totalExp = 0;

    for (let y = 0; y <= duration; y++) {
        labels.push(y + '年目');

        const remainingLifeCost = monthlySpend * 12 * (duration - y);
        const remainingEdu = Math.max(0, eduCost * (1 - y / duration));
        const exp = remainingLifeCost + remainingEdu + (y === 0 ? extraCost + mortgage : 0);
        const inc = (pensionAnnual + partnerIncome) * (duration - y);
        const needed = Math.max(0, exp - (inc + savings));

        coverageData.push(Math.round(needed));

        if (y === 0) {
            initialNeeded = needed;
            totalExp = exp;
        }
    }

    document.getElementById('res_total').innerText = Math.round(initialNeeded).toLocaleString() + ' 万円';
    document.getElementById('res_exp').innerText = Math.round(totalExp).toLocaleString() + ' 万円';

    updateChart(labels, coverageData);
    setShareText('必要保障額を' + duration + '年分シミュレーション！保険を見直してみた🛡️ #生命保険 #家計管理');
}

function updateChart(labels, data) {
    const ctx = document.getElementById('neededChart').getContext('2d');
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '必要保障額（万円）',
                data: data,
                borderColor: '#1e40af',
                backgroundColor: 'rgba(30, 64, 175, 0.1)',
                fill: true,
                tension: 0.1,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => ` 必要保障額: ${ctx.raw.toLocaleString()} 万円` } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: '万円' },
                    ticks: { callback: (v) => v.toLocaleString() }
                }
            }
        }
    });
}

const inputIds = ['monthly_spend', 'duration', 'edu_cost', 'extra_cost', 'savings', 'mortgage', 'partner_income', 'pension_type'];
inputIds.forEach(id => document.getElementById(id).addEventListener('input', calculate));

window.onload = calculate;
