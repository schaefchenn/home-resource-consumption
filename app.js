import { draw_circle, draw_history } from "./scripts/water.js";

d3.json("data/water_usage.json").then(data => {
    // 1. Daten kurz bereinigen (nur Konvertierung, keine Sortierung!)
    data.forEach(d => {
        d.date = new Date(d.date);
        d.value = +d.value;
    });

    // 2. Aktuellen Verbrauch (aktuellster - vorletzter)
    const latestData = data[0];
    const previousData = data[1];
    const current = (latestData.value - previousData.value) * 1000; // in Litern
    const max = 820; // 0,82 m³ in Litern

    const chronologicalData = [...data].sort((a, b) => a.date - b.date);

    // 2. Gruppieren nach Jahr und Monat
    const monthlyGroups = chronologicalData.reduce((acc, d) => {
        // Erzeugt einen Schlüssel wie "2026-05"
        const monthKey = `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, '0')}`;
    
        if (!acc[monthKey]) {
            acc[monthKey] = [];
        }
        acc[monthKey].push(d);
        return acc;
    }, {});


    const sortedMonthlyData = Object.keys(monthlyGroups)
        .sort() // Sortiert nach Datum ("2026-01", "2026-02", ...)
        .map(key => ({
            month: key,
            entries: monthlyGroups[key]
    }));

    const detailedDiffs = [];

for (let i = 0; i < sortedMonthlyData.length; i++) {
    const currentMonthData = sortedMonthlyData[i];
    
    // Wir starten bei 0 für jeden Monat
    let runningTotal = 0; 

    // Gehe jeden Eintrag (n) dieses Monats durch
    for (let n = 0; n < currentMonthData.entries.length; n++) {
        const currentEntry = currentMonthData.entries[n];
        
        // Wenn es der erste Eintrag im Monat ist, ist die Differenz zum Vormonat 
        // (oder zu Beginn) noch nicht definiert, wir starten mit 0
        if (n === 0) {
            runningTotal = 0;
        } else {
            // Differenz zum direkten Vorgänger (der Vorwoche im gleichen Monat)
            const previousEntry = currentMonthData.entries[n - 1];
            const weeklyDiff = currentEntry.value - previousEntry.value;
            runningTotal += weeklyDiff;
        }
            
        detailedDiffs.push({
            monat: currentMonthData.month,
            datum: currentEntry.date.toLocaleDateString('de-DE'),
            wert: currentEntry.value,
            // Hier summieren wir die Wochen-Differenzen auf
            kumulierterMonatsverbrauch: (runningTotal * 1000).toFixed(0) + " l"
        });
    }
}

console.table(detailedDiffs);

console.table(detailedDiffs);

    // 3. Historie: Differenzen berechnen
    const diff = data.map((d, i, arr) => {
        if (i >= arr.length - 1) return null;
    
        return {
            date: d.date,
            value: d.value - arr[i + 1].value, // Wert - nächster Wert in der Liste
        };
    }).filter(d => d !== null); // null-Werte rausfiltern  

    console.log("Differenzen:", diff);  

    const diffLiter = diff.map(d => ({ date: d.date, value: d.value * 1000 })); // in Liter umrechnen
    const historyData = diff.slice(1, 4); // Nur die ersten 3 Monate für die Historie

    // 4. Anzeige-Updates
    d3.select("#date").text(`Datum: ${latestData.date.toLocaleDateString('de-DE')}`);
    d3.select(".counter-reading").text(`Zählerstand: ${latestData.value.toFixed(3).replace('.', ',')} m³`);
    d3.select("#water-value").text(`${current.toFixed(0)} l`);

    draw_circle(current, max);
    draw_history(historyData, max);

    // 5. RESPONSIVE LINE CHART
const drawChart = () => {
    const chartContainer = document.querySelector('.chart-card');
    const svg = d3.select("#water-chart");
    
    // 1. Messen: Was ist die tatsächliche Größe des Containers?
    // Wir ziehen Padding/Margin ab, damit es bündig ist
    const width = chartContainer.clientWidth;
    const height = chartContainer.clientHeight - 60; // 60px Platz für den Titel "Jahresverlauf"
    
    // 2. SVG viewBox auf diese exakten Pixel setzen
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    
    svg.selectAll("*").remove(); 

    const margin = { top: 20, right: 50, bottom: 50, left: 50 };

    // 3. Skalen direkt auf die gemessenen Pixelmaße anpassen
    const x = d3.scaleTime()
        .domain(d3.extent(diffLiter, d => d.date))
        .range([margin.left, width - margin.right]);

    const minValue = d3.min(diffLiter, d => d.value);
    const maxValue = d3.max(diffLiter, d => d.value);

    // Berechne einen Puffer (z.B. 20% des Wertebereichs)
    const padding = (maxValue - minValue) * 0.2; 

    const y = d3.scaleLinear()
        .domain([minValue - padding, maxValue + padding]) // Fügt oben und unten Platz hinzu
        .range([height - margin.bottom, margin.top]);

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

    // 4. Zeichnen
    svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y)
        .ticks(5)
        .tickSize(-(width - margin.left - margin.right)) // Erstreckt sich über die Breite
        .tickFormat("") // Keine Zahlen, nur die Linien
    );

    svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x)
        .ticks(5)
        .tickSize(-(height - margin.top - margin.bottom)) // Erstreckt sich über die Höhe
        .tickFormat("") // Keine Zahlen
    );

    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`) 
        .call(d3.axisBottom(x).ticks(5).tickSize(0));

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y).ticks(5).tickSize(0));

    svg.selectAll(".bar")
        .data(diffLiter) // Deine monatlichen/wöchentlichen Differenzen
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.date) - 10) // Zentriert unter dem Punkt
        .attr("y", d => y(d.value))
        .attr("width", 20)
        .attr("height", d => height - margin.bottom - y(d.value))
        .attr("fill", "#1e293b") // Dunklere Farbe, damit sie nicht stören
        .attr("opacity", 0.5);

    svg.append("path")
        .datum(diffLiter)
        .attr("fill", "none")
        .attr("stroke", "#38bdf8")
        .attr("stroke-width", 4)
        .attr("d", line);
};

    drawChart();
    window.addEventListener("resize", drawChart);

}).catch(err => console.error("Datenfehler:", err));