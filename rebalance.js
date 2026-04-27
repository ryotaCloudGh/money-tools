const PRESETS = [
    {
        name: 'GPIF',
        assets: [
            { name: '国内株式',   ratio: 25 },
            { name: '外国株式',   ratio: 25 },
            { name: '国内債券',   ratio: 25 },
            { name: '外国債券',   ratio: 25 },
        ]
    },
    {
        name: 'バフェット推奨',
        assets: [
            { name: '米国株式（S&P500）', ratio: 90 },
            { name: '短期米国債',         ratio: 10 },
        ]
    },
    {
        name: 'オールウェザー（ダリオ）',
        assets: [
            { name: '米国株式',     ratio: 30 },
            { name: '長期米国債',   ratio: 40 },
            { name: '中期米国債',   ratio: 15 },
            { name: 'ゴールド',     ratio: 7.5 },
            { name: 'コモディティ', ratio: 7.5 },
        ]
    },
    {
        name: 'パーマネント（ブラウン）',
        assets: [
            { name: '株式',     ratio: 25 },
            { name: '長期国債', ratio: 25 },
            { name: '現金',     ratio: 25 },
            { name: 'ゴールド', ratio: 25 },
        ]
    },
];

function loadPreset(i) {
    assets = PRESETS[i].assets.map(a => ({ ...a, value: 0 }));
    renderInputs();
    calculate();
}

const PALETTE = [
    '#3b82f6', '#f59e0b', '#10b981', '#f43f5e',
    '#8b5cf6', '#06b6d4', '#84cc16', '#fb923c'
];

let assets = [
    { name: '国内株式',   ratio: 50, value: 500000 },
    { name: '先進国株式', ratio: 30, value: 250000 },
    { name: '国内債券',   ratio: 10, value: 120000 },
    { name: '現金',       ratio: 10, value: 130000 }
];

let chartAsis = null;
let chartTobe = null;

function fmt(n) { return Math.round(n).toLocaleString() + '円'; }

function colors(n) { return Array.from({ length: n }, (_, i) => PALETTE[i % PALETTE.length]); }

function updateCharts(totalValue) {
    const labels   = assets.map(a => a.name);
    const bgColors = colors(assets.length);

    const asisData = assets.map(a =>
        totalValue > 0 ? parseFloat((a.value / totalValue * 100).toFixed(2)) : 0
    );
    const tobeData = assets.map(a => a.ratio);

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => ` ${ctx.label}: ${ctx.parsed.toFixed(1)}%`
                }
            }
        }
    };

    if (chartAsis) {
        chartAsis.data.labels = labels;
        chartAsis.data.datasets[0].data = asisData;
        chartAsis.data.datasets[0].backgroundColor = bgColors;
        chartAsis.update();
    } else {
        chartAsis = new Chart(document.getElementById('chart-asis'), {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{ data: asisData, backgroundColor: bgColors, borderWidth: 2, borderColor: '#fff' }]
            },
            options: commonOptions
        });
    }

    if (chartTobe) {
        chartTobe.data.labels = labels;
        chartTobe.data.datasets[0].data = tobeData;
        chartTobe.data.datasets[0].backgroundColor = bgColors;
        chartTobe.update();
    } else {
        chartTobe = new Chart(document.getElementById('chart-tobe'), {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{ data: tobeData, backgroundColor: bgColors, borderWidth: 2, borderColor: '#fff' }]
            },
            options: commonOptions
        });
    }

    const legendEl = document.getElementById('chart-legend');
    legendEl.innerHTML = labels.map((l, i) => `
        <div class="legend-item">
            <div class="legend-dot" style="background:${bgColors[i]}"></div>
            <span>${l}</span>
        </div>
    `).join('');
}

function renderInputs() {
    const container = document.getElementById('asset-inputs');
    container.innerHTML = '';
    assets.forEach((asset, i) => {
        const row = document.createElement('div');
        row.className = 'input-row';
        row.innerHTML = `
            <div class="col-name">
                ${i === 0 ? '<label>資産名</label>' : ''}
                <input type="text" value="${asset.name}" oninput="updateData(${i},'name',this.value)">
            </div>
            <div>
                ${i === 0 ? '<label>目標比率(%)</label>' : ''}
                <input type="number" value="${asset.ratio}" min="0" max="100"
                       oninput="updateData(${i},'ratio',this.value)">
            </div>
            <div>
                ${i === 0 ? '<label>現在評価額(円)</label>' : ''}
                <input type="number" value="${asset.value}" min="0"
                       oninput="updateData(${i},'value',this.value)">
            </div>
            <div class="col-del">
                <button class="btn-del" onclick="removeAssetRow(${i})" title="削除">✕</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function addAssetRow() {
    assets.push({ name: '新しい資産', ratio: 0, value: 0 });
    renderInputs();
    calculate();
}

function removeAssetRow(i) {
    if (assets.length <= 1) return;
    assets.splice(i, 1);
    renderInputs();
    calculate();
}

function updateData(i, field, value) {
    assets[i][field] = field === 'name' ? value : Math.max(0, parseFloat(value) || 0);
    calculate();
}

function calculate() {
    const investment = Math.max(0, parseFloat(document.getElementById('investment-amount').value) || 0);
    const totalValue = assets.reduce((s, a) => s + a.value, 0);
    const totalRatio = assets.reduce((s, a) => s + a.ratio, 0);
    const newTotal   = totalValue + investment;
    const ratioOk    = Math.abs(totalRatio - 100) < 0.01;

    const badge = document.getElementById('ratio-badge');
    badge.textContent = totalRatio.toFixed(1).replace('.0', '') + '%';
    badge.className = 'ratio-badge ' + (ratioOk ? 'ok' : 'warn');
    document.getElementById('ratio-warning-text').style.display = ratioOk ? 'none' : 'inline';

    document.getElementById('results').style.display = 'block';
    document.getElementById('total-val-display').textContent = fmt(totalValue);
    document.getElementById('ratio-mismatch-warning').style.display = ratioOk ? 'none' : 'block';

    updateCharts(totalValue);

    const tbody = document.getElementById('comparison-table');
    tbody.innerHTML = '';
    assets.forEach((a, i) => {
        const cur  = totalValue > 0 ? (a.value / totalValue) * 100 : 0;
        const diff = cur - a.ratio;
        let diffClass = 'diff-neutral';
        if (diff > 0.05)  diffClass = 'diff-plus';
        if (diff < -0.05) diffClass = 'diff-minus';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span style="display:inline-block;width:10px;height:10px;border-radius:2px;
                             background:${PALETTE[i % PALETTE.length]};margin-right:6px;vertical-align:middle;"></span>
                ${a.name}
            </td>
            <td>${fmt(a.value)}</td>
            <td>${cur.toFixed(1)}%</td>
            <td>${a.ratio}%</td>
            <td class="${diffClass}">${diff > 0.05 ? '+' : ''}${diff.toFixed(1)}%</td>
        `;
        tbody.appendChild(tr);
    });

    const fullEl = document.getElementById('full-rebalance-actions');
    fullEl.innerHTML = '';
    let hasAction = false;
    assets.forEach(a => {
        const ideal = newTotal * (a.ratio / 100);
        const diff  = ideal - a.value;
        if (Math.abs(diff) < 1) return;
        hasAction = true;
        const item = document.createElement('div');
        item.className = 'action-item';
        const cls  = diff > 0 ? 'action-buy' : 'action-sell';
        const verb = diff > 0 ? '購入' : '売却';
        item.innerHTML = `
            <div>
                <div class="action-name">${a.name}</div>
                <div class="action-sub">目標額: ${fmt(ideal)}</div>
            </div>
            <span class="${cls}">${verb} ${fmt(Math.abs(diff))}</span>
        `;
        fullEl.appendChild(item);
    });
    if (!hasAction) {
        fullEl.innerHTML = '<p class="empty-msg">すでに目標比率に達しています。売買不要です。</p>';
    }

    const noSellEl = document.getElementById('no-sell-actions');
    noSellEl.innerHTML = '';

    if (investment <= 0) {
        noSellEl.innerHTML = '<p class="empty-msg">追加投資額を入力すると配分案を表示します。</p>';
        return;
    }

    const deficits = assets
        .map((a, i) => ({ i, name: a.name, gap: newTotal * (a.ratio / 100) - a.value, value: a.value }))
        .filter(d => d.gap > 1);

    if (deficits.length === 0) {
        noSellEl.innerHTML = '<p class="empty-msg">全資産が目標比率を超えています。完全調整案をご確認ください。</p>';
        return;
    }

    const totalDeficit = deficits.reduce((s, d) => s + d.gap, 0);
    const allocatable  = Math.min(investment, totalDeficit);
    const unallocated  = investment - allocatable;

    deficits.forEach(d => {
        const amount    = Math.round(allocatable * (d.gap / totalDeficit));
        if (amount <= 0) return;
        const postRatio = newTotal > 0 ? ((d.value + amount) / newTotal) * 100 : 0;
        const item = document.createElement('div');
        item.className = 'action-item';
        item.innerHTML = `
            <div>
                <div class="action-name">${d.name}</div>
                <div class="action-sub">追加後比率: ${postRatio.toFixed(1)}%（目標: ${assets[d.i].ratio}%）</div>
            </div>
            <span class="action-add">追加 ${fmt(amount)}</span>
        `;
        noSellEl.appendChild(item);
    });

    if (unallocated > 1) {
        const note = document.createElement('p');
        note.className = 'empty-msg';
        note.style.marginTop = '8px';
        note.textContent = `残り ${fmt(unallocated)} は全資産が目標比率を超えるため自動配分できません。完全調整案をご参照ください。`;
        noSellEl.appendChild(note);
    }

    setShareText('ポートフォリオのリバランスをシミュレーション！資産配分を最適化してみた⚖️ #資産配分 #投資');
}

renderInputs();
calculate();
