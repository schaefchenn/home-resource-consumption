import * as d3 from "https://cdn.skypack.dev/d3@7";

export function draw_circle(current, max) {
    const height = 140;
    const width = 140;
    const thickness = 4;
    const radius = Math.min(width, height) / 2;

    const percentage = current / max;
    
    const startAngle = 0;
    const endAngle = percentage * 2 * Math.PI; 

    // 3. SVG-Container erstellen
    const svg = d3.select("#progress-circle")
        .html("") // Leert den Container vor dem Neuzeichnen
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%")
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const backgroundArc = d3.arc()
        .innerRadius(radius - thickness)
        .outerRadius(radius)
        .startAngle(0)
        .endAngle(2 * Math.PI);

    const numSegments = 60; 
    const arcGenerator = d3.arc()
        .innerRadius(radius - thickness)
        .outerRadius(radius)
        .startAngle(d => d.startAngle)
        .endAngle(d => d.endAngle);

    const segmentAngle = (endAngle - startAngle) / numSegments;

    for (let i = 0; i < numSegments; i++) {
        const sAngle = startAngle + (i * segmentAngle);
        const eAngle = startAngle + ((i + 1) * segmentAngle);
        
        const color = d3.interpolate("#ffedd5", "#dc2626")(i / numSegments);

        svg.append("path")
            .datum({ startAngle: sAngle, endAngle: eAngle })
            .attr("d", arcGenerator)
            .attr("fill", color)
            .attr("stroke", color)
            .attr("stroke-width", "1px");
    }

    // 8. Das Blitz-SVG-Icon für Strom
svg.append("path")
    .attr("d", "M 200.09 233.52 c 22.42 -22.41 61.34 -68.33 47.39 -105.52 c 0 0 50.87 52.71 36.45 120.47 c 0 0 31.72 -24 33.4 -63.44 c 25.13 29.08 26.36 97.07 25 112.46 C 338.1 345.08 303.59 384 255.82 384 a 86.51 86.51 0 0 1 -86.51 -86.51 a 63.38 63.38 0 0 1 2.52 -15.8 A 108.42 108.42 0 0 1 200.09 233.52 Z")
    .style("fill", "none")
    .style("stroke", "#94a3b8") 
    .style("stroke-width", "22px") /* Etwas dicker, da der Pfad so groß ist */
    .style("stroke-linejoin", "round")
    .attr("transform", "scale(0.22) translate(-255, -255)");
}


export function draw_history(data, maxVal) {
    const container = d3.select("#history-list").html("");

    const rows = container.selectAll(".history-row")
        .data(data)
        .enter()
        .append("div")
        .attr("class", "history-row");

    const dataRow = rows.append("div")
        .attr("class", "history-data"); 

    dataRow.append("span")
        .attr("class", "history-month")
        .text(d => d.date.toLocaleString('de-DE', { month: 'short' }));

    dataRow.append("span")
        .attr("class", "history-value")
        .text(d => `${(d.monthlyValue).toFixed(1)} m³`);

    rows.append("div")
        .attr("class", "progress-bar-bg")
        .append("div")
        .attr("class", "progress-bar-fill")
        .style("width", d => `${Math.min((d.monthlyValue / (maxVal)) * 100, 100)}%`);
}

export function draw_graph(data) {
    const chartContainer = document.querySelector('.chart-card');
    const svg = d3.select("#gas-chart");
    
    const width = chartContainer.clientWidth;
    const height = chartContainer.clientHeight - 60; 

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove(); 

    const computedStyles = window.getComputedStyle(chartContainer);

    const margin = {
        top: parseInt(computedStyles.getPropertyValue('--chart-margin-top')) || 10,
        right: parseInt(computedStyles.getPropertyValue('--chart-margin-right')) || 50,
        bottom: parseInt(computedStyles.getPropertyValue('--chart-margin-bottom')) || 10,
        left: parseInt(computedStyles.getPropertyValue('--chart-margin-left')) || 75
    };

    // X-Skala (Zeit)
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([margin.left, width - margin.right]);

    // Werte in Liter umrechnen für die Y-Achse
    const minValue = d3.min(data, d => d.weeklyDiff);
    const maxValue = d3.max(data, d => d.weeklyDiff);
    const padding = (maxValue - minValue) * 0.2; 

    const y = d3.scaleLinear()
        .domain([Math.max(0, minValue - padding), maxValue + padding]) // Mindestens 0 als Untergrenze
        .range([height - margin.bottom, margin.top]);

    // Linie definieren
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.weeklyDiff))
        .curve(d3.curveMonotoneX);

    // Rasterlinien (Hintergrund)
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""));

    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickSize(-(height - margin.top - margin.bottom)).tickFormat(""));

    // Achsen beschriften
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`) 
        .call(d3.axisBottom(x).ticks(5).tickSize(0));

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y).ticks(5).tickSize(0).tickFormat(d => `${d} m³`)); // Zeigt "m³" an der Y-Achse

    // Balken zeichnen
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.date) - 10) 
        .attr("y", d => y(d.weeklyDiff))
        .attr("width", 20)
        .attr("height", d => Math.max(0, height - margin.bottom - y(d.weeklyDiff)))
        .attr("fill", "#1e293b") 
        .attr("opacity", 0.3);

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#dc2626")
        .attr("stroke-width", 4)
        .attr("d", line);
};