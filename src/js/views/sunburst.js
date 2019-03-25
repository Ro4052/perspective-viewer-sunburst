/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {treeData, treeColor} from "../data/treeData";

function sunburst(container, settings) {
    const {width: containerWidth, height: containerHeight} = container.getBoundingClientRect();
    const padding = 30;
    const radius = (Math.min(containerWidth, containerHeight) - padding) / 6;

    const data = treeData(settings);
    const color = treeColor(settings);
    data.each(d => (d.current = d));

    const sunburstSvg = d3
        .select(container)
        .append("svg")
        .style("width", "100%")
        .style("height", "100%")
        .append("g")
        .attr("transform", `translate(${containerWidth / 2}, ${containerHeight / 2})`);

    const sunburstPath = sunburstSvg
        .append("g")
        .selectAll("path")
        .data(data.descendants().slice(1))
        .join("path")
        .attr("fill", d => color(d.data.color))
        .attr("d", arc(radius));
    sunburstPath.filter(d => d.children).style("cursor", "pointer");

    sunburstSvg
        .append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
        .selectAll("text")
        .data(data.descendants().slice(1))
        .join("text")
        .attr("dy", "0.35em")
        .attr("fill-opacity", d => labelVisible(d.current))
        .attr("transform", d => labelTransform(d.current, radius));

    sunburstSvg
        .append("circle")
        .datum(data)
        .attr("r", radius)
        .attr("fill", "none")
        .attr("pointer-events", "all");

    console.log(container);
}

const arc = radius =>
    d3
        .arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius)
        .innerRadius(d => d.y0 * radius)
        .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

const labelVisible = d => d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;

function labelTransform(d, radius) {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    const y = ((d.y0 + d.y1) / 2) * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
}

sunburst.plugin = {
    type: "d3_sunburst",
    name: "[D3] Sunburst",
    max_size: 25000,
    initial: {
        type: "number",
        count: 2
    }
};

export default sunburst;
