let charts = [null, null, null];

const lineOpts = (yLabel) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: { y: { title: { display: true, text: yLabel }, ticks: { callback: v => v.toLocaleString() } } },
    plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: c => c.dataset.label + ': ' + c.parsed.y.toLocaleString() + ' 万円' } }
    }
});

function calculate() {
    const price          = parseFloat(document.getElementById('price').value) || 0;
    const downPayment    = parseFloat(document.getElementById('downPayment').value) || 0;
    const loanYears      = parseFloat(document.getElementById('loanYears').value) || 0;
    const interestRate   = parseFloat(document.getElementById('interestRate').value) / 100 / 12 || 0;
    const maintenance    = parseFloat(document.getElementById('maintenance').value) || 0;
    const tax            = parseFloat(document.getElementById('tax').value) || 0;
    const salePrice      = parseFloat(document.getElementById('salePrice').value) || 0;
    const rent           = parseFloat(document.getElementById('rent').value) || 0;
    const rentIncrease   = parseFloat(document.getElementById('rentIncrease').value) / 100 || 0;
    const residenceYears = parseFloat(document.getElementById('residenceYears').value) || 1;
    const investRate     = parseFloat(document.getElementById('investRate').value) / 100 || 0;

    const loanAmount = Math.max(0, price - downPayment);
    const months = loanYears * 12;
    let monthlyRepayment = 0;
    if (interestRate > 0) {
        monthlyRepayment = (loanAmount * interestRate * Math.pow(1 + interestRate, months)) / (Math.pow(1 + interestRate, months) - 1);
    } else if (months > 0) {
        monthlyRepayment = loanAmount / months;
    }

    const cumulativeBuyData  = [];
    const cumulativeRentData = [];
    const annualDiffData     = [];
    const buyInvestData      = [];
    const rentInvestData     = [];
    const labels             = [];

    let cumulativeBuy  = 0;
    let cumulativeRent = 0;
    let buyInvest  = 0;
    let rentInvest = 0;
    let breakEvenYear = null;

    for (let year = 1; year <= residenceYears; year++) {
        labels.push(year + '年');

        const monthlyRepay  = year <= loanYears ? monthlyRepayment : 0;
        const rentInflation = Math.pow(1 + rentIncrease, year - 1);

        const buyAnnual  = (year === 1 ? downPayment : 0)
                         + monthlyRepay * 12
                         + maintenance * 12
                         + (year >= 2 ? tax : 0);
        const rentAnnual = rent * 12 * rentInflation;

        cumulativeBuy  += buyAnnual;
        cumulativeRent += rentAnnual;

        const diff = buyAnnual - rentAnnual;
        rentInvest = rentInvest * (1 + investRate) + (diff > 0 ? diff : 0);
        buyInvest  = buyInvest  * (1 + investRate) + (diff < 0 ? -diff : 0);

        cumulativeBuyData.push(Math.round(cumulativeBuy  - (year === residenceYears ? salePrice : 0)));
        cumulativeRentData.push(Math.round(cumulativeRent));
        annualDiffData.push(Math.round(diff));
        buyInvestData.push(Math.round(buyInvest));
        rentInvestData.push(Math.round(rentInvest));

        if (breakEvenYear === null && cumulativeRent >= cumulativeBuy) {
            breakEvenYear = year;
        }
    }

    const finalBuyCost  = cumulativeBuy  - buyInvest  - salePrice;
    const finalRentCost = cumulativeRent - rentInvest;

    document.getElementById('buyCumCost').innerText  = Math.round(cumulativeBuy - salePrice).toLocaleString() + ' 万円';
    document.getElementById('rentCumCost').innerText = Math.round(cumulativeRent).toLocaleString() + ' 万円';
    document.getElementById('buyInvestNote').innerText  = Math.round(buyInvest).toLocaleString() + ' 万円';
    document.getElementById('rentInvestNote').innerText = Math.round(rentInvest).toLocaleString() + ' 万円';
    document.getElementById('buyTotal').innerText  = Math.round(finalBuyCost).toLocaleString() + ' 万円';
    document.getElementById('rentTotal').innerText = Math.round(finalRentCost).toLocaleString() + ' 万円';

    const verdictEl = document.getElementById('verdict');
    const gap = Math.abs(Math.round(finalBuyCost - finalRentCost));
    if (finalBuyCost < finalRentCost) {
        verdictEl.style.display = 'block';
        verdictEl.style.background = '#2563eb';
        verdictEl.innerText = '購入の方が ' + gap.toLocaleString() + ' 万円お得（運用・売却考慮後）';
    } else if (finalRentCost < finalBuyCost) {
        verdictEl.style.display = 'block';
        verdictEl.style.background = '#dc2626';
        verdictEl.innerText = '賃貸の方が ' + gap.toLocaleString() + ' 万円お得（運用・売却考慮後）';
    } else {
        verdictEl.style.display = 'none';
    }

    document.getElementById('breakEvenPoint').innerText = breakEvenYear
        ? '損益分岐点: 約 ' + breakEvenYear + ' 年目'
        : '損益分岐点: 到達なし';

    updateCharts(labels, cumulativeBuyData, cumulativeRentData, annualDiffData, buyInvestData, rentInvestData);
}

function updateCharts(labels, cumBuy, cumRent, annualDiff, buyInvest, rentInvest) {
    charts.forEach(c => c && c.destroy());

    charts[0] = new Chart(document.getElementById('chart1'), {
        type: 'line',
        data: { labels, datasets: [
            { label: '購入', data: cumBuy,  borderColor: '#2563eb', fill: false, tension: 0.1 },
            { label: '賃貸', data: cumRent, borderColor: '#dc2626', fill: false, tension: 0.1 }
        ]},
        options: lineOpts('万円')
    });

    charts[1] = new Chart(document.getElementById('chart2'), {
        type: 'bar',
        data: { labels, datasets: [{
            label: '購入 − 賃貸（年間）',
            data: annualDiff,
            backgroundColor: annualDiff.map(v => v > 0 ? 'rgba(220,38,38,0.6)' : 'rgba(37,99,235,0.6)')
        }]},
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { title: { display: true, text: '万円' }, ticks: { callback: v => v.toLocaleString() } } },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: {
                    label: c => {
                        const v = c.parsed.y;
                        return v > 0
                            ? '賃貸が ' + v.toLocaleString() + ' 万円有利'
                            : '購入が ' + Math.abs(v).toLocaleString() + ' 万円有利';
                    }
                }}
            }
        }
    });

    charts[2] = new Chart(document.getElementById('chart3'), {
        type: 'line',
        data: { labels, datasets: [
            { label: '購入側の運用益', data: buyInvest,  borderColor: '#2563eb', fill: false, tension: 0.1 },
            { label: '賃貸側の運用益', data: rentInvest, borderColor: '#dc2626', fill: false, tension: 0.1 }
        ]},
        options: lineOpts('万円')
    });
}

window.onload = calculate;
