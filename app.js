import {draw_circle, draw_history} from "./scripts/water.js";

d3.json("data/water_usage.json").then(data => {

    data.forEach(d => {
        d.date = new Date(d.date);
        d.value = +d.value;
    });

    const historyData = data.slice(0, 4).map((d, i) => {
        // Wenn wir am Ende angekommen sind, können wir nicht mehr rechnen
        if (i >= data.length - 1) return null;

        return {
            date: d.date,
            // Aktueller Wert (d) - Wert vom Vormonat (data[i+1])
            value: d.value - data[i + 1].value 
        };
    }).filter(item => item !== null).reverse();

    const lastThree = historyData.slice(0, 3);
    const max = 0.82; // Beispielwert, passe diesen an deine Daten an
    const latestData = data[0];
    const current = latestData.value - data[1].value;
    const displayValue = current.toFixed(3);

    const formattedDate = latestData.date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    // 5. DOM-Updates
    d3.select("#date").text(`Datum: ${formattedDate}`);
    d3.select("#water-value").text(`${displayValue} m³`);

    draw_circle(current, max);
    draw_history(lastThree, max);

    // ===== LINE CHART =====
    const chartSvg = d3.select("#water-chart");

    const width = 1600;
    const height = 400;

    chartSvg.attr("viewBox", `0 0 ${width} ${height}`);

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range([height - margin.bottom, margin.top]);

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.value));

    chartSvg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    chartSvg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y));

    chartSvg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#38bdf8")
        .attr("stroke-width", 3)
        .attr("d", line);

});