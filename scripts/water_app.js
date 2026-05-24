import { draw_circle, draw_history, draw_graph } from "./include/water.js";
const max = 820; // 0,82 m³ in Litern

d3.json("assets/data/water_usage.json").then(data => {
    data.forEach(d => {
        d.date = new Date(d.date);
        d.value = +d.value;
    });

    const latestData = data[0];
    const chronologicalData = [...data].sort((a, b) => a.date - b.date);
    const monthlyGroups = chronologicalData.reduce((acc, d) => {
        const monthKey = `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, '0')}`;
    
        if (!acc[monthKey]) {
            acc[monthKey] = [];
        }
        acc[monthKey].push(d);
        return acc;
    }, {});
    
    const sortedMonthlyData = Object.keys(monthlyGroups)
        .sort()
        .map(key => ({
            month: key,
            entries: monthlyGroups[key]
        }));

    const detailedDiffs = [];
    const cumulative = [];
    for (let i = 0; i < sortedMonthlyData.length; i++) {
        const currentMonthData = sortedMonthlyData[i];
        let runningTotal = 0;

        for (let n = 0; n < currentMonthData.entries.length; n++) {
            const currentEntry = currentMonthData.entries[n];
            let weeklyDiff = 0;

            if (n === 0) {
                if (i > 0) {
                    const previousMonthData = sortedMonthlyData[i - 1];
                    const lastEntryOfPreviousMonth = previousMonthData.entries[previousMonthData.entries.length - 1];
                
                    weeklyDiff = currentEntry.value - lastEntryOfPreviousMonth.value;
                } else {
                    weeklyDiff = 0;
                }
            } else {
                const previousEntry = currentMonthData.entries[n - 1];
                weeklyDiff = currentEntry.value - previousEntry.value;
            }

            runningTotal += weeklyDiff;
            console.log(`Monat: ${currentMonthData.month}, Datum: ${currentEntry.date.toLocaleDateString('de-DE')}, Wöchentliche Differenz: ${weeklyDiff.toFixed(3)} m³, Kumulativ: ${runningTotal.toFixed(3)} m³`);
            detailedDiffs.push({
                month: currentMonthData.month,
                date: currentEntry.date,
                weeklyDiff: weeklyDiff,
                cumulativeMonthly: runningTotal
            });
        }

        cumulative.push({
            month: currentMonthData.month,
            date: new Date(currentMonthData.month + "-01"),
            monthlyValue: runningTotal
        });
    }

    const current = cumulative[cumulative.length - 1].monthlyValue * 1000; // in Litern
    const last4Moths = cumulative.slice(-5, -1).reverse();

    console.log(cumulative.monthlyValue);
    
    d3.select("#date").text(`Datum: ${latestData.date.toLocaleDateString('de-DE')}`);
    d3.select(".counter-reading").text(`Zählerstand: ${latestData.value.toFixed(3).replace('.', ',')} m³`);
    d3.select("#water-value").text(`${current.toFixed(0)} l`);

    draw_circle(current, max);
    draw_history(last4Moths, max);
    draw_graph(detailedDiffs);
    window.addEventListener('resize', () => {
        draw_graph(detailedDiffs);
    });

}).catch(err => console.error("Datenfehler:", err));