import { Choropleth } from '@alter-eco/choropleth';
import { cartogram } from 'd3-cartogram';

import * as d3 from './d3-custom.js';

export class Cartogram extends Choropleth {
  constructor(params) {
    super(params);

    this.config.sensibility = params.sensibility || 8;

    this.removeAllListeners('mouseover');

    this.on('mouseover', d => {
      if (!d.properties) {
        return false;
      }

      const tooltipData = this.dataById[d.properties[this.geoIdKey]];

      if (!tooltipData || tooltipData[this.selected] === '') {
        return false;
      } else {
        this.showTooltip(tooltipData);
      }
    });
  }

  fill(datum) {
    if (datum.properties) {
      var geoKey = datum.properties[this.geoIdKey];

      if (this.dataById.hasOwnProperty(geoKey)) {
        return this.scale(this.dataById[geoKey][this.valueColumn]);
      }
    }

    return this.config.neutralColor;
  }

  draw() {
    const projection = this.projection
      .fitExtent([
        [0, 0],
        [this.drawWidth, this.drawHeight]
      ], this.geojson);

    this.carto = cartogram()
      .projection(projection)
      .properties(d => {
        return this.dataById[d.properties[this.geoIdKey]];
      })
      .iterations(this.config.iterations);

    this.geometries = this.topojson.objects[Object.keys(this.topojson.objects)[0]].geometries;

    const sorted = this.data.map(d => d[this.valueColumn]).sort(d3.ascending);

    this.cartoScale = d3.scaleLinear()
      .domain([sorted[0], sorted[sorted.length - 1]])
      .range([1, 1000]);

    this.carto.value(d => {
      if (d.properties) {
        return this.cartoScale(d.properties[this.valueColumn]);
      } else {
        let avg = sorted.reduce((a, b) => a + b) / sorted.length;

        return this.cartoScale(avg);
      }
    });

    this.features = this.carto(this.topojson, this.geometries).features;

    this.layerSelect = this.layer
      .selectAll('path')
      .data(this.features);

    // enter
    this.layerSelect
      .enter()
      .append('path')
      .attr('d', this.carto.path)
      .attr('class', 'region')
      .attr('id', function(datum) {
        return datum.geometry.properties.nom;
      })
      .attr('fill', this.fill.bind(this))
      .on('mouseover', d => this.emit('mouseover', d))
      .on('mouseout', () => this.emit('mouseout'));

    this.emit('draw');
  }
}
