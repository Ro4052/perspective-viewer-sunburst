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

    const sunburstElement = d3
        .select(container)
        .append("svg")
        .style("width", "100%")
        .style("height", containerHeight - padding / 2)
        .append("g")
        .attr("transform", `translate(${containerWidth / 2}, ${containerHeight / 2})`);

    const path = sunburstElement
        .append("g")
        .selectAll("path")
        .data(data.descendants().slice(1))
        .join("path")
        .attr("fill", d => color(d.data.color))
        .attr("fill-opacity", d => (arcVisible(d.current) ? (d.children ? 1 : 0.5) : 0))
        .attr("d", d => arc(radius)(d.current));
    path.append("title").text(
        d =>
            `${d
                .ancestors()
                .map(d => d.data.name)
                .reverse()
                .join("/")}\n${d3.format(",d")(d.value)}`
    );

    const label = sunburstElement
        .append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
        .selectAll("text")
        .data(data.descendants().slice(1))
        .join("text")
        .attr("dy", "0.35em")
        .attr("fill-opacity", d => +labelVisible(d.current))
        .attr("transform", d => labelTransform(d.current, radius))
        .text(d => d.data.name);

    const parentTitle = sunburstElement.append("text").attr("text-anchor", "middle");
    const parent = sunburstElement
        .append("circle")
        .attr("r", radius)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .datum(data)
        .on("click", d => clicked(d, data, sunburstElement, parent, parentTitle, path, label, radius));

    path.filter(d => d.children)
        .style("cursor", "pointer")
        .on("click", d => clicked(d, data, sunburstElement, parent, parentTitle, path, label, radius));
}

function clicked(p, data, g, parent, parentTitle, path, label, radius) {
    parent.datum(p.parent || data);
    parentTitle.text(p.parent ? p.parent.data.name : "");
    data.each(
        d =>
            (d.target = {
                x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                y0: Math.max(0, d.y0 - p.depth),
                y1: Math.max(0, d.y1 - p.depth)
            })
    );

    const t = g.transition().duration(750);
    path.transition(t)
        .tween("data", d => {
            const i = d3.interpolate(d.current, d.target);
            return t => (d.current = i(t));
        })
        .filter(function(d) {
            return +this.getAttribute("fill-opacity") || arcVisible(d.target);
        })
        .attr("fill-opacity", d => (arcVisible(d.target) ? (d.children ? 1 : 0.5) : 0))
        .attrTween("d", d => () => arc(radius)(d.current));

    label
        .filter(function(d) {
            return +this.getAttribute("fill-opacity") || labelVisible(d.target);
        })
        .transition(t)
        .attr("fill-opacity", d => +labelVisible(d.target))
        .attrTween("transform", d => () => labelTransform(d.current, radius));
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

const arcVisible = d => d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;

const labelVisible = d => d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.05;

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
