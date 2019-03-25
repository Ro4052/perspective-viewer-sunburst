/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";

export function treeData(settings) {
    const children = [];
    settings.data.slice(1).forEach(d => {
        const groups = d.__ROW_PATH__;
        let currentLevel = children;
        groups.forEach((group, i) => {
            let element = currentLevel.find(e => e.name === group);
            if (!element) {
                element = {name: group, children: []};
                currentLevel.push(element);
            }
            if (i === groups.length - 1) {
                element.name = groups.slice(-1)[0];
                if (groups.length === settings.row_pivots.length) {
                    element.size = d[settings.aggregates[0].column];
                }
                if (settings.aggregates.length > 1) {
                    element.color = d[settings.aggregates[1].column];
                }
            }
            currentLevel = element.children;
        });
    });

    const tree = {children};
    const root = d3.hierarchy(tree).sum(d => d.size);
    const data = d3.partition().size([2 * Math.PI, root.height + 1])(root);

    return data;
}
