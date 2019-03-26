/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {extentLinear} from "d3fc-extent";

export function treeData(settings) {
    const sets = {};
    settings.data.slice(1).forEach(d => {
        const groups = d.__ROW_PATH__;
        const splits = getSplitNames(d);
        splits.forEach(split => {
            let currentLevel;
            if (!sets[split]) {
                sets[split] = [];
            }
            currentLevel = sets[split];
            groups.forEach((group, i) => {
                let element = currentLevel.find(e => e.name === group);
                if (!element) {
                    element = {name: group, children: []};
                    currentLevel.push(element);
                }
                if (i === groups.length - 1) {
                    element.name = groups.slice(-1)[0];
                    if (groups.length === settings.row_pivots.length) {
                        element.size = getDataValue(d, settings.aggregates[0], split);
                    }
                    if (settings.aggregates.length > 1) {
                        element.color = getDataValue(d, settings.aggregates[1], split);
                    }
                }
                currentLevel = element.children;
            });
        });
    });

    const data = Object.entries(sets).map(set => {
        const tree = {name: "root", children: set[1]};
        const root = d3.hierarchy(tree).sum(d => d.size);
        const color = treeColor(settings, set[0]);
        return {split: set[0], data: d3.partition().size([2 * Math.PI, root.height + 1])(root), color};
    });

    return data;
}

const getDataValue = (d, aggregate, split) => (split.length ? d[`${split}|${aggregate.column}`] : d[aggregate.column]);

function getSplitNames(d) {
    const splits = [];
    Object.keys(d).forEach(key => {
        if (key !== "__ROW_PATH__") {
            const splitValue = key
                .split("|")
                .slice(0, -1)
                .join("|");
            if (!splits.includes(splitValue)) {
                splits.push(splitValue);
            }
        }
    });
    return splits;
}

function treeColor(settings, split) {
    if (settings.aggregates.length > 1) {
        const colorDomain = extentLinear().accessors([d => getDataValue(d, settings.aggregates[1], split)])(settings.data);
        return d3.scaleSequential(d3.interpolateRainbow).domain(colorDomain);
    }
    return () => "rgb(31, 119, 180)";
}
