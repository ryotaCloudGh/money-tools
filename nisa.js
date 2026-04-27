const LIFETIME_LIMIT = 18000000;
const TAX_RATE = 0.20315;
const FRAME_LIMITS = { tsumitate: 100000, growth: 200000, both: 300000 };

let myChart = null;

function formatYen(num) {
    const abs = Math.abs(Math.round(num));
    if (abs >= 10000) {
        return Math.round(num / 10000).toLocaleString('ja-JP') + '万円';
    }
    return Math.round(num).toLocaleString('ja-JP') + '円';
}

function syncInput(sourceId, targetId, isLabel = false) {
    const source = document.getElementById(sourceId);
    const target = document.getElementById(targetId);
    if (isLabel) target.textContent = source.value;
    else target.value = source.value;
}

function updateInputConstraints() {
    const frame = document.getElementById('frame').value;
    const limit = FRAME_LIMITS[frame];
    const monthlyInput = document.getElementById('monthly');
    const monthlyRange = document.getElementById('monthly-range');

    monthlyInput.max = limit;
    monthlyRange.max = limit;

    if (parseInt(monthlyInput.value) > limit) {
        monthlyInput.value = limit;
        monthlyRange.value = limit;
    }
}

function calculate() {
    const monthly = parseFloat(document.getElementById('monthly').value) || 0;
    const frame = document.getElementById('frame').value;
    const years = parseInt(document.getElementById('years').value) || 1;
    const annualRate = parseFloat(document.getElementById('rate').value) / 100;

    const errorEl = document.getElementById('error-msg');
    const warningEl = document.getElementById('warning-msg');
    const frameLimit = FRAME_LIMITS[frame];

    const LIFETIME_TOTAL_LIMIT = 18000000;
    const LIFETIME_GROWTH_LIMIT = 12000000;

    if (monthly > frameLimit) {
        errorEl.textContent = `選択した枠の月額上限は ${formatYen(frameLimit)} です。`;
        errorEl.style.display = 'block';
        document.getElementById('stat-total').textContent = '—';
        document.getElementById('stat-principal').textContent = '—';
        document.getElementById('stat-profit').textContent = '—';
        document.getElementById('stat-tax-saved').textContent = '—';
        if (myChart) myChart.destroy();
        return;
    }
    errorEl.style.display = 'none';

    const monthlyRate = annualRate / 12;
    const totalMonths = years * 12;

    const labels = ['0年'];
    const principalArr = [0];
    const nisaArr = [0];
    const taxedArr = [0];
    const grossTaxableArr = [0];

    let nisaBalance = 0;
    let taxedBalance = 0;
    let nisaContributedTotal = 0;
    let nisaContributedGrowth = 0;

    let monthlyTsum = 0;
    let monthlyGrowth = 0;
    if (frame === 'tsumitate') {
        monthlyTsum = monthly;
    } else if (frame === 'growth') {
        monthlyGrowth = monthly;
    } else {
        monthlyTsum = Math.min(monthly, 100000);
        monthlyGrowth = monthly - monthlyTsum;
    }

    for (let m = 1; m <= totalMonths; m++) {
        let actualGrowth = Math.min(monthlyGrowth, LIFETIME_GROWTH_LIMIT - nisaContributedGrowth, LIFETIME_TOTAL_LIMIT - nisaContributedTotal);
        let actualTsum = Math.min(monthlyTsum, LIFETIME_TOTAL_LIMIT - (nisaContributedTotal + actualGrowth));

        let contrib = actualGrowth + actualTsum;
        nisaContributedTotal += contrib;
        nisaContributedGrowth += actualGrowth;

        nisaBalance = nisaBalance * (1 + monthlyRate) + contrib;
        taxedBalance = taxedBalance * (1 + monthlyRate) + contrib;

        if (m % 12 === 0) {
            const yr = m / 12;
            labels.push(yr + '年');
            principalArr.push(Math.round(nisaContributedTotal));
            nisaArr.push(Math.round(nisaBalance));
            grossTaxableArr.push(Math.round(taxedBalance));

            const currentProfit = Math.max(0, taxedBalance - nisaContributedTotal);
            taxedArr.push(Math.round(nisaContributedTotal + currentProfit * (1 - TAX_RATE)));
        }
    }

    const finalNisa = nisaArr[nisaArr.length - 1];
    const finalPrincipal = Math.round(nisaContributedTotal);
    const finalProfit = finalNisa - finalPrincipal;
    const finalTaxed = taxedArr[taxedArr.length - 1];
    const benefit = finalNisa - finalTaxed;

    document.getElementById('stat-total').textContent = formatYen(finalNisa);
    document.getElementById('stat-principal').textContent = formatYen(finalPrincipal);
    document.getElementById('stat-profit').textContent = formatYen(Math.max(0, finalProfit));
    document.getElementById('stat-tax-saved').textContent = formatYen(Math.max(0, benefit));

    const totalInvest = monthly * 12 * years;
    const relevantLimit = (frame === 'growth') ? LIFETIME_GROWTH_LIMIT : LIFETIME_TOTAL_LIMIT;
    if (totalInvest > relevantLimit) {
        warningEl.textContent = `総投資予定額（${formatYen(totalInvest)}）が非課税限度額（${formatYen(relevantLimit)}）を超えます。超過分はNISA口座に入らず、運用のみ継続される計算です。`;
        warningEl.style.display = 'block';
    } else {
        warningEl.style.display = 'none';
    }

    updateChart(labels, principalArr, nisaArr, taxedArr, grossTaxableArr);
    setShareText('新NISAを' + years + '年間運用シミュレーション！Money Dashで計算してみた💰 #新NISA #資産形成');
}

function updateChart(labels, principal, nisa, taxed, grossTaxable) {
    const ctx = document.getElementById('chart').getContext('2d');
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'NISA資産（非課税手残り）',
                    data: nisa,
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5,150,105,0.08)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    borderWidth: 2,
                },
                {
                    label: '課税口座（売却時の手残り）',
                    data: taxed,
                    borderColor: '#1e40af',
                    borderDash: [5, 4],
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0,
                    borderWidth: 2,
                },
                {
                    label: '元本',
                    data: principal,
                    borderColor: '#94a3b8',
                    borderDash: [3, 3],
                    fill: false,
                    tension: 0,
                    pointRadius: 0,
                    borderWidth: 1.5,
                },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 14, font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            let val = ctx.raw;
                            let label = ` ${ctx.dataset.label}: ${formatYen(val)}`;

                            if (ctx.dataset.label.includes('課税口座')) {
                                const idx = ctx.dataIndex;
                                if (grossTaxable[idx] && principal[idx]) {
                                    const profit = Math.max(0, grossTaxable[idx] - principal[idx]);
                                    const tax = profit * TAX_RATE;
                                    if (tax > 0) {
                                        label += ` (課税額: ${formatYen(tax)})`;
                                    }
                                }
                            } else if (ctx.dataset.label.includes('NISA')) {
                                label += ` (課税額: 0円)`;
                            }
                            return label;
                        },
                        footer: () => '※ 課税口座は、その年に解約・売却したと仮定した場合の税引後の金額を表示しています。'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: v => Math.round(v / 10000) + '万',
                        font: { size: 11 }
                    }
                },
                x: { ticks: { font: { size: 11 } } }
            }
        }
    });
}

const monthlyInputEl = document.getElementById('monthly');
const monthlyRangeEl = document.getElementById('monthly-range');

const inputPairs = [
    { src: 'monthly', tgt: 'monthly-range' },
    { src: 'monthly-range', tgt: 'monthly' },
    { src: 'years', tgt: 'years-label', isLabel: true },
    { src: 'rate', tgt: 'rate-label', isLabel: true }
];

inputPairs.forEach(pair => {
    document.getElementById(pair.src).addEventListener('input', () => {
        syncInput(pair.src, pair.tgt, pair.isLabel);
        calculate();
    });
});

document.getElementById('frame').addEventListener('change', () => {
    updateInputConstraints();
    calculate();
});

updateInputConstraints();
calculate();
