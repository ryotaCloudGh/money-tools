let chart = null;

function formatComma(input) {
    const pos = input.selectionStart;
    const before = input.value.length;
    const raw = input.value.replace(/[^0-9]/g, '');
    if (raw === '') { input.value = ''; return; }
    input.value = parseInt(raw, 10).toLocaleString('ja-JP');
    const diff = input.value.length - before;
    input.setSelectionRange(pos + diff, pos + diff);
}

function parseComma(value) {
    return parseFloat(String(value).replace(/,/g, '')) || 0;
}

window.onload = () => {
    addStockRow();
};

function addStockRow() {
    const container = document.getElementById('stock-list');
    const div = document.createElement('div');
    div.className = 'stock-row';
    div.innerHTML = `
        <input type="text" name="name" placeholder="銘柄名" oninput="calculate()">
        <input type="text" name="amount" placeholder="投資額(円)" class="amount-input" oninput="formatComma(this); calculate()">
        <input type="number" name="yield" placeholder="利回り(%)" class="yield-input" step="0.1" oninput="calculate()">
        <button class="btn btn-del" onclick="removeRow(this)">削除</button>
    `;
    container.appendChild(div);
    calculate();
}

function removeRow(btn) {
    const rows = document.querySelectorAll('.stock-row');
    if (rows.length > 1) {
        btn.parentElement.remove();
        calculate();
    }
}

function calculate() {
    const rows = document.querySelectorAll('.stock-row');
    let totalAnnual = 0;
    let totalInvestment = 0;
    let labels = [];
    let dataValues = [];

    rows.forEach(row => {
        const name = row.querySelector('input[name="name"]').value || '未設定';
        const amount = parseComma(row.querySelector('input[name="amount"]').value);
        const yieldVal = parseFloat(row.querySelector('input[name="yield"]').value) || 0;

        const annualDividend = amount * (yieldVal / 100);
        totalAnnual += annualDividend;
        totalInvestment += amount;

        if (annualDividend > 0) {
            labels.push(name);
            dataValues.push(Math.round(annualDividend));
        }
    });

    document.getElementById('year-total').innerText = Math.round(totalAnnual).toLocaleString() + ' 円';
    document.getElementById('month-total').innerText = Math.round(totalAnnual / 12).toLocaleString() + ' 円';

    const avgYield = totalInvestment > 0 ? (totalAnnual / totalInvestment) * 100 : 0;
    document.getElementById('avg-yield').innerText = avgYield.toFixed(2) + ' %';

    const targetMonthly = parseComma(document.getElementById('target-monthly').value);
    const targetAnnual = targetMonthly * 12;
    const gap = targetAnnual - totalAnnual;

    let neededAmount = 0;
    if (gap > 0 && avgYield > 0) {
        neededAmount = gap / (avgYield / 100);
    }
    document.getElementById('needed-investment').innerText = Math.max(0, Math.round(neededAmount)).toLocaleString() + ' 円';

    updateChart(labels, dataValues);
}

function updateChart(labels, data) {
    const ctx = document.getElementById('dividendChart').getContext('2d');
    if (chart) chart.destroy();
    if (data.length === 0) return;

    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a',
                    '#0891b2', '#4f46e5', '#9333ea', '#c026d3', '#e11d48'
                ],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) label += ': ';
                            label += context.parsed.toLocaleString() + ' 円';
                            return label;
                        }
                    }
                }
            }
        }
    });
}
