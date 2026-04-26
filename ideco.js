const elIncome = document.getElementById('input-income');
const elType = document.getElementById('select-type');
const elMonthly = document.getElementById('input-monthly');
const elYears = document.getElementById('input-years');

let myChart;

function getEmploymentIncomeDeduction(income) {
    if (income <= 1625000) return 550000;
    if (income <= 1800000) return income * 0.4 - 100000;
    if (income <= 3600000) return income * 0.3 + 80000;
    if (income <= 6600000) return income * 0.2 + 440000;
    if (income <= 8500000) return income * 0.1 + 1100000;
    return 1950000;
}

function getSocialInsurance(income, isSelfEmployed) {
    if (isSelfEmployed) return 35000 * 12;
    return income * 0.145;
}

function getIncomeTax(taxableIncome) {
    if (taxableIncome <= 0) return 0;
    let rate = 0;
    let deduct = 0;
    if (taxableIncome <= 1950000) { rate = 0.05; deduct = 0; }
    else if (taxableIncome <= 3300000) { rate = 0.10; deduct = 97500; }
    else if (taxableIncome <= 6950000) { rate = 0.20; deduct = 427500; }
    else if (taxableIncome <= 9000000) { rate = 0.23; deduct = 636000; }
    else if (taxableIncome <= 18000000) { rate = 0.33; deduct = 1536000; }
    else if (taxableIncome <= 40000000) { rate = 0.40; deduct = 2796000; }
    else { rate = 0.45; deduct = 4796000; }
    let tax = taxableIncome * rate - deduct;
    if (tax < 0) tax = 0;
    return Math.floor(tax * 1.021);
}

function calculate() {
    const income = parseInt(elIncome.value) * 10000;
    const typeLimit = parseInt(elType.value);
    const monthly = parseInt(elMonthly.value);
    const years = parseInt(elYears.value);
    const isSelfEmployed = (elType.options[elType.selectedIndex].text.includes('自営業'));

    document.getElementById('val-income').innerText = elIncome.value;
    document.getElementById('val-monthly').innerText = monthly.toLocaleString();
    document.getElementById('val-years').innerText = years;

    elMonthly.max = typeLimit;
    if (monthly > typeLimit) {
        elMonthly.value = typeLimit;
    }

    const empDeduction = getEmploymentIncomeDeduction(income);
    const socialIns = getSocialInsurance(income, isSelfEmployed);
    const basicDeduction = 480000;

    const taxableBase = Math.max(0, income - empDeduction - socialIns - basicDeduction);

    const taxWithoutIncome = getIncomeTax(taxableBase);
    const taxWithoutRes = Math.floor(taxableBase * 0.1);
    const totalTaxWithout = taxWithoutIncome + taxWithoutRes;

    const yearlyIdec = monthly * 12;
    const taxableWithIdec = Math.max(0, taxableBase - yearlyIdec);
    const taxWithIncome = getIncomeTax(taxableWithIdec);
    const taxWithRes = Math.floor(taxableWithIdec * 0.1);
    const totalTaxWith = taxWithIncome + taxWithRes;

    const annualSavings = totalTaxWithout - totalTaxWith;

    document.getElementById('res-annual-tax').innerText = annualSavings.toLocaleString() + '円';
    document.getElementById('res-total-tax').innerText = (annualSavings * years).toLocaleString() + '円';
    document.getElementById('res-total-contrib').innerText = (yearlyIdec * years).toLocaleString() + '円';

    const monthlyActual = Math.round(monthly - annualSavings / 12);
    document.getElementById('res-monthly-actual').innerText = monthlyActual.toLocaleString();

    updateChart(years, yearlyIdec, annualSavings);
}

function updateChart(years, yearlyContrib, yearlySavings) {
    const labels = [];
    const contribData = [];
    const costData = [];

    for (let i = 0; i <= years; i++) {
        labels.push(i + '年');
        contribData.push(yearlyContrib * i);
        costData.push((yearlyContrib - yearlySavings) * i);
    }

    if (myChart) {
        myChart.data.labels = labels;
        myChart.data.datasets[0].data = contribData;
        myChart.data.datasets[1].data = costData;
        myChart.update();
    } else {
        const ctx = document.getElementById('myChart').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: '累計拠出額', data: contribData, borderColor: '#1e40af', backgroundColor: 'rgba(30, 64, 175, 0.1)', fill: true },
                    { label: '累計手出し額（節税後）', data: costData, borderColor: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.1)', fill: true }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });
    }
}

[elIncome, elType, elMonthly, elYears].forEach(el => {
    el.addEventListener('input', calculate);
});

calculate();
