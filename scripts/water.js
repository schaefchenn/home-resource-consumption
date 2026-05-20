import * as d3 from "https://cdn.skypack.dev/d3@7";

export function draw_circle(current, max) {
    const height = 140;
    const width = 140;
    const thickness = 4; // Etwas dicker für bessere Sichtbarkeit
    const radius = Math.min(width, height) / 2;

    const percentage = current / max;
    
    const startAngle = 0;
    const endAngle = percentage * 2 * Math.PI; 

    // 3. SVG-Container erstellen
    const svg = d3.select("#progress-circle")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Hintergrund-Ring (grau, der immer zu sehen ist)
    const backgroundArc = d3.arc()
        .innerRadius(radius - thickness)
        .outerRadius(radius)
        .startAngle(0)
        .endAngle(2 * Math.PI);

    // 4. Fortschritts-Ring als viele kleine Segmente für den perfekten Verlauf
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
        
        // Interpolation von Hell-Graublau zu Indigo-Blau
        const color = d3.interpolate("#cbd5e1", "#6366f1")(i / numSegments);

        svg.append("path")
            .datum({ startAngle: sAngle, endAngle: eAngle })
            .attr("d", arcGenerator)
            .attr("fill", color)
            .attr("stroke", color)
            .attr("stroke-width", "1px");
    }

    // 8. Das Wassertropfen-SVG-Icon
    svg.append("path")
        .attr("d", "M 50 5 C 65 30, 80 55, 80 75 A 30 30 0 1 1 20 75 C 20 55, 35 30, 50 5 Z")
        .style("fill", "none")
        .style("stroke", "#94a3b8") 
        .style("stroke-width", "6px")
        .style("stroke-linejoin", "round")
        .attr("transform", "translate(-20, -20) scale(0.4)");
}

export function draw_history(data, maxVal) {
    const container = d3.select("#history-list").html("");

    const rows = container.selectAll(".history-row")
        .data(data)
        .enter()
        .append("div")
        .attr("class", "history-row");

    const dataLabels = rows.append("div")
        .attr("class", "history-data");

    dataLabels.append("span")
        .attr("class", "history-month")
        .text(d => d.date.toLocaleString('en-US', { month: 'short' }));

    dataLabels.append("span")
        .attr("class", "history-value")
        .text(d => `${d.value.toFixed(3)} m³`);

    const barBg = rows.append("div")
        .attr("class", "progress-bar-bg");

    barBg.append("div")
        .attr("class", "progress-bar-fill")
        .style("width", d => {
            const percentage = Math.min((d.value / maxVal) * 100, 100);
            return `${percentage}%`;
        });
}