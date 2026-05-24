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
        
        const color = d3.interpolate("#fef08a", "#f97316")(i / numSegments);

        svg.append("path")
            .datum({ startAngle: sAngle, endAngle: eAngle })
            .attr("d", arcGenerator)
            .attr("fill", color)
            .attr("stroke", color)
            .attr("stroke-width", "1px");
    }

    // 8. Das Blitz-SVG-Icon für Strom
svg.append("path")
    .attr("d", "M 341.292 204.165 c -4 -6.696 -11.045 -10.694 -18.845 -10.694 h -77.81 L 267.31 16.624 c 0.917 -7.153 -3.238 -13.688 -10.104 -15.893 c -6.866 -2.202 -14.048 0.69 -17.467 7.039 L 117.97 233.915 c -3.698 6.868 -3.518 14.966 0.482 21.662 c 4 6.696 11.045 10.694 18.845 10.694 h 77.81 l -22.673 176.847 c -0.917 7.153 3.238 13.688 10.104 15.893 c 1.54 0.494 3.096 0.732 4.622 0.732 c 5.276 0 10.193 -2.847 12.845 -7.771 l 121.77 -226.145 C 345.472 218.96 345.291 210.862 341.292 204.165 Z M 328.567 218.716 L 207.502 443.538 l 23.566 -183.813 c 0.274 -2.138 -0.385 -4.29 -1.809 -5.908 s -3.475 -2.545 -5.63 -2.545 h -86.333 c -3.56 0 -5.359 -2.368 -5.967 -3.386 c -0.608 -1.018 -1.84 -3.725 -0.153 -6.859 L 252.242 16.202 l -23.566 183.815 c -0.274 2.138 0.385 4.29 1.809 5.908 s 3.475 2.545 5.63 2.545 h 86.333 c 3.56 0 5.359 2.368 5.967 3.386 C 329.022 212.875 330.254 215.582 328.567 218.716 Z")
    .style("fill", "none")
    .style("stroke", "#94a3b8") 
    .style("stroke-width", "22px") /* Etwas dicker, da der Pfad so groß ist */
    .style("stroke-linejoin", "round")
    .attr("transform", "scale(0.15) translate(-230, -230)");
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
        .text(d => `${(d.monthlyValue).toFixed(1)} kWh`);

    rows.append("div")
        .attr("class", "progress-bar-bg")
        .append("div")
        .attr("class", "progress-bar-fill")
        .style("width", d => `${Math.min((d.monthlyValue / (maxVal)) * 100, 100)}%`);
}

export function draw_graph(data) {
    const chartContainer = document.querySelector('.chart-card');
    const svg = d3.select("#electricity-chart");
    
    const width = chartContainer.clientWidth;
    const height = chartContainer.clientHeight - 60; 

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove(); 

    const computedStyles = window.getComputedStyle(chartContainer);

    const margin = {
        top: parseInt(computedStyles.getPropertyValue('--chart-margin-top')) || 20,
        right: parseInt(computedStyles.getPropertyValue('--chart-margin-right')) || 50,
        bottom: parseInt(computedStyles.getPropertyValue('--chart-margin-bottom')) || 50,
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
        .call(d3.axisLeft(y).ticks(5).tickSize(0).tickFormat(d => `${d} kWh`)); // Zeigt "kWh" an der Y-Achse

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
        .attr("stroke", "#f59e0b") // Warmes, gut lesbares Strom-Gelb
        .attr("stroke-width", 4)
        .attr("d", line);
};