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
        .append("svg")
        .attr("width", width)
        .attr("height", height)
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

    const dataRow = rows.append("div")
        .attr("class", "history-data"); 

    dataRow.append("span")
        .attr("class", "history-month")
        .text(d => d.date.toLocaleString('de-DE', { month: 'short' }));

    dataRow.append("span")
        .attr("class", "history-value")
        .text(d => `${(d.monthlyValue * 1000).toFixed(0)} l`);

    rows.append("div")
        .attr("class", "progress-bar-bg")
        .append("div")
        .attr("class", "progress-bar-fill")
        .style("width", d => `${Math.min((d.monthlyValue / (maxVal / 1000)) * 100, 100)}%`);
}

export function draw_graph(data) {
    const chartContainer = document.querySelector('.chart-card');
    const svg = d3.select("#water-chart");
    
    const width = chartContainer.clientWidth;
    const height = chartContainer.clientHeight - 60; 

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove(); 

    const margin = { top: 20, right: 50, bottom: 50, left: 50 };

    // X-Skala (Zeit)
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([margin.left, width - margin.right]);

    // Werte in Liter umrechnen für die Y-Achse
    const minValue = d3.min(data, d => d.weeklyDiff * 1000);
    const maxValue = d3.max(data, d => d.weeklyDiff * 1000);
    const padding = (maxValue - minValue) * 0.2; 

    const y = d3.scaleLinear()
        .domain([Math.max(0, minValue - padding), maxValue + padding]) // Mindestens 0 als Untergrenze
        .range([height - margin.bottom, margin.top]);

    // Linie definieren
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.weeklyDiff * 1000))
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
        .call(d3.axisLeft(y).ticks(5).tickSize(0).tickFormat(d => `${d} l`)); // Zeigt "l" an der Y-Achse

    // Balken zeichnen
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.date) - 10) 
        .attr("y", d => y(d.weeklyDiff * 1000))
        .attr("width", 20)
        .attr("height", d => Math.max(0, height - margin.bottom - y(d.weeklyDiff * 1000)))
        .attr("fill", "#1e293b") 
        .attr("opacity", 0.3);

    // Linie zeichnen
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#38bdf8")
        .attr("stroke-width", 4)
        .attr("d", line);
};