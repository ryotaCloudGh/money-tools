let chart = null;

const defaultEvents = [
    { name: "子供の大学費用", age: 48, amount: -300 },
    { name: "住宅リフォーム", age: 55, amount: -200 }
];

const verticalLinesPlugin = {
    id: 'verticalLines',
    afterDraw(chart, args, opts) {
        const { ctx, scales: { x, y } } = chart;
        opts.lines.forEach(line => {
            const xPos = x.getPixelForValue(line.value);
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash(line.dash || []);
            ctx.strokeStyle = line.color;
            ctx.lineWidth = line.width || 1;
            ctx.moveTo(xPos, y.top);
            ctx.lineTo(xPos, y.bottom);
            ctx.stroke();
            if (line.label) {
                ctx.fillStyle = line.color;
                ctx.font = `${line.bold ? 'bold ' : ''}11px Arial`;
                const textWidth = ctx.measureText(line.label).width;
                const xText = (xPos + 4 + textWidth > chart.chartArea.right) ? xPos - textWidth - 4 : xPos + 4;
                ctx.fillText(line.label, xText, y.top + 14 + (line.yOffset || 0));
            }
            ctx.restore();
        });
    }
};
Chart.register(verticalLinesPlugin);

window.onload = () => {
    loadSettings();
    runSimulation();
};

function addEventRow(data = { name: "", age: "", amount: "" }) {
    const tbody = document.getElementById('eventBody');
    const tr = document.createElement('tr');
    tr.className = 'event-row';
    tr.innerHTML = `
        <td><input type="text" class="ev-name" value="${data.name}" placeholder="例: 結婚"></td>
        <td><input type="number" class="ev-age" value="${data.age}" style="width:55px"></td>
        <td><input type="number" class="ev-amount" value="${data.amount}" style="width:70px"></td>
        <td><button class="btn btn-delete" onclick="this.closest('tr').remove()">×</button></td>
    `;
    tbody.appendChild(tr);
}

function getInputs() {
    const events = Array.from(document.querySelectorAll('.event-row')).map(row => ({
        name: row.querySelector('.ev-name').value,
        age: parseInt(row.querySelector('.ev-age').value),
        amount: parseFloat(row.querySelector('.ev-amount').value)
    })).filter(ev => !isNaN(ev.age) && !isNaN(ev.amount));

    return {
        currentAge: parseInt(document.getElementById('currentAge').value),
        fireAge: parseInt(document.getElementById('fireAge').value),
        endAge: parseInt(document.getElementById('endAge').value),
        initialAsset: parseFloat(document.getElementById('initialAsset').value),
        annualSavings: parseFloat(document.getElementById('annualSavings').value),
        postFireSpending: parseFloat(document.getElementById('postFireSpending').value),
        expectedReturn: parseFloat(document.getElementById('expectedReturn').value) / 100,
        returnStdDev: parseFloat(document.getElementById('returnStdDev').value) / 100,
        events
    };
}

function saveSettings() {
    localStorage.setItem('lifeevent_fire_settings', JSON.stringify(getInputs()));
}

function loadSettings() {
    const saved = localStorage.getItem('lifeevent_fire_settings');
    if (saved) {
        const data = JSON.parse(saved);
        document.getElementById('currentAge').value = data.currentAge;
        document.getElementById('fireAge').value = data.fireAge;
        document.getElementById('endAge').value = data.endAge;
        document.getElementById('initialAsset').value = data.initialAsset;
        document.getElementById('annualSavings').value = data.annualSavings;
        document.getElementById('postFireSpending').value = data.postFireSpending;
        document.getElementById('expectedReturn').value = (data.expectedReturn * 100).toFixed(1);
        document.getElementById('returnStdDev').value = (data.returnStdDev * 100).toFixed(1);
        (data.events || []).forEach(ev => addEventRow(ev));
    } else {
        defaultEvents.forEach(ev => addEventRow(ev));
    }
}

function nextGaussian(mean, stdDev) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stdDev + mean;
}

function generatePaths(inputs, iterations) {
    const years = inputs.endAge - inputs.currentAge;
    return Array.from({ length: iterations }, () =>
        Array.from({ length: years }, () =>
            nextGaussian(inputs.expectedReturn, inputs.returnStdDev)
        )
    );
}

function simulate(inputs, paths, events) {
    const yearsCount = inputs.endAge - inputs.currentAge + 1;
    const allHistories = [];
    let successCount = 0;

    for (let i = 0; i < paths.length; i++) {
        let asset = inputs.initialAsset;
        const history = [asset];
        let bankrupt = false;

        for (let y = 0; y < paths[i].length; y++) {
            const age = inputs.currentAge + 1 + y;
            if (bankrupt) { history.push(0); continue; }

            asset *= (1 + paths[i][y]);

            if (age <= inputs.fireAge) {
                asset += inputs.annualSavings;
            } else {
                asset -= inputs.postFireSpending;
            }

            events.forEach(ev => { if (ev.age === age) asset += ev.amount; });

            if (asset <= 0) { asset = 0; bankrupt = true; }
            history.push(asset);
        }

        if (!bankrupt) successCount++;
        allHistories.push(history);
    }

    return { allHistories, successCount, yearsCount };
}

function getPercentileLine(allHistories, yearsCount, p) {
    return Array.from({ length: yearsCount }, (_, t) => {
        const vals = allHistories.map(h => h[t]).sort((a, b) => a - b);
        return vals[Math.floor(p * (vals.length - 1))];
    });
}

function runSimulation() {
    const inputs = getInputs();
    saveSettings();

    const ITER = 1000;
    const paths = generatePaths(inputs, ITER);

    const simWith    = simulate(inputs, paths, inputs.events);
    const simWithout = simulate(inputs, paths, []);

    const labels = Array.from({ length: simWith.yearsCount }, (_, i) => inputs.currentAge + i);
    const p10 = getPercentileLine(simWith.allHistories, simWith.yearsCount, 0.1);
    const p50 = getPercentileLine(simWith.allHistories, simWith.yearsCount, 0.5);
    const p90 = getPercentileLine(simWith.allHistories, simWith.yearsCount, 0.9);

    const rateWith    = simWith.successCount    / ITER * 100;
    const rateWithout = simWithout.successCount / ITER * 100;

    function successColor(rate) {
        if (rate >= 80) return '#dcfce7';
        if (rate >= 50) return '#fef9c3';
        return '#fee2e2';
    }

    document.getElementById('probWithEvents').textContent     = `${rateWith.toFixed(1)}%`;
    document.getElementById('countWithEvents').textContent    = `(${ITER}回中${simWith.successCount}回成功)`;
    document.getElementById('probWithoutEvents').textContent  = `${rateWithout.toFixed(1)}%`;
    document.getElementById('countWithoutEvents').textContent = `(${ITER}回中${simWithout.successCount}回成功)`;

    document.getElementById('probWithEvents').closest('.stat-box').style.background    = successColor(rateWith);
    document.getElementById('probWithoutEvents').closest('.stat-box').style.background = successColor(rateWithout);

    updateChart(labels, p10, p50, p90, inputs);
    updateImpactSummary(inputs, paths, simWith.successCount);
    setShareText('ライフイベント込みのFIRE成功確率は' + rateWith.toFixed(1) + '%！Money Dashで検証してみた🎯 #FIRE #資産形成');
}

function updateImpactSummary(inputs, paths, baseSuccessCount) {
    const container = document.getElementById('impactSummary');
    if (inputs.events.length === 0) {
        container.innerHTML = "設定されたライフイベントはありません。";
        return;
    }

    container.innerHTML = "";
    inputs.events.forEach(ev => {
        const eventsMinusOne = inputs.events.filter(e => e !== ev);
        const simTest = simulate(inputs, paths, eventsMinusOne);
        const diff = ((baseSuccessCount - simTest.successCount) / 10).toFixed(1);
        const sign = diff >= 0 ? '+' : '';
        const color = diff >= 0 ? 'var(--danger-color)' : 'var(--success-color)';
        const div = document.createElement('div');
        const safeName = document.createElement('strong');
        safeName.textContent = ev.name;
        const impact = document.createElement('strong');
        impact.style.color = color;
        impact.textContent = `${sign}${diff}%`;
        div.appendChild(document.createTextNode('・ '));
        div.appendChild(safeName);
        div.appendChild(document.createTextNode(`（${ev.age}歳 / ${ev.amount > 0 ? '+' : ''}${ev.amount}万円）: 成功率への影響 `));
        div.appendChild(impact);
        container.appendChild(div);
    });
}

function updateChart(labels, p10, p50, p90, inputs) {
    const ctx = document.getElementById('fireChart').getContext('2d');
    if (chart) chart.destroy();

    const toIdx = age => age - inputs.currentAge;
    const verticalLines = [
        { value: toIdx(inputs.fireAge), color: '#0D1B2A', width: 2, dash: [6, 4], label: `FIRE（${inputs.fireAge}歳）`, bold: true },
        ...inputs.events.map((ev, i) => ({
            value: toIdx(ev.age),
            color: '#888',
            width: 1,
            dash: [3, 3],
            label: `${ev.name}（${ev.amount > 0 ? '+' : ''}${ev.amount}万）`,
            yOffset: i * 16
        }))
    ];

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: '好調シナリオ（10%の確率でこの水準以上）', data: p90, borderColor: '#3A86FF', fill: false, tension: 0.2, pointRadius: 0 },
                { label: '中央値（50%の確率でこの水準）',           data: p50, borderColor: '#2D6A4F', fill: false, tension: 0.2, pointRadius: 0, borderWidth: 2 },
                { label: '不調シナリオ（10%の確率でこの水準以下）', data: p10, borderColor: '#AE2012', fill: false, tension: 0.2, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: { title: { display: true, text: '年齢（歳）' } },
                y: { title: { display: true, text: '資産額（万円）' }, beginAtZero: true }
            },
            plugins: {
                legend: { position: 'bottom' },
                verticalLines: { lines: verticalLines }
            }
        }
    });
}
