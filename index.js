var Cartogram;

var Choropleth = require('@alter-eco/choropleth');

module.exports = Cartogram = {
  create: function() {
    var instance = Object.assign({}, this.prototype);

    this.init.apply(instance, arguments);

    return instance;
  },

  init: function(config) {
    Choropleth.init.call(this, config);

    this.topojson = config.topojson;
    this.geometries = this.topojson.objects[config.topoKey].geometries;

    this.valueColumn = config.valueColumn;
    this.geoIdKey = config.geoIdKey;
  },

  prototype: Object.assign(Choropleth.prototype, {
    draw: function() {
      var projection = d3.geoMercator()
        .center([2.2, 46.2])
        .scale(1500)
        .translate([this.width / 2, this.height / 2]);

      var path = d3.geoPath()
        .projection(projection);

      var carto = d3.cartogram()
        .projection(projection)
        .properties(function(d) {
          return this.dataById[d.properties[this.geoIdKey]];
        }.bind(this))

      this.features = carto.features(this.topojson, this.geometries);

      var sorted = this.data.map(function(d) {
        return d[this.valueColumn];
      }.bind(this)).sort(d3.ascending);

      var scale = d3.scaleLinear()
        .domain([ sorted[0], sorted[sorted.length - 1] ])
        .range([1, 1000]);

      carto.value(function(d) {
        if (d.properties) {
          return scale(d.properties[this.valueColumn]);
        }
        else {
          return scale(sorted[0]);
        }
      }.bind(this));

      this.features = carto(this.topojson, this.geometries).features;

      this.layerSelect = this.layer
        .selectAll('path')
        .data(this.features);

      // enter
      this.layerSelect
        .enter()
        .append('path')
        .attr('d', carto.path)
        .attr('class', 'region')
        .attr('id', function(d) {
          return d.geometry.properties.nom;
        })
        .attr('fill', this.fill.bind(this))
        .on('mouseover', function(d) {
          if (!this.tooltip) {
            return false;
          }

          var tooltipData = this.dataById[d.properties[this.geoIdKey]];

          if (!tooltipData || tooltipData[this.selected] === '') {
            return false;
          } else {
            this.showTooltip(tooltipData);
          }
        }.bind(this))
        .on('mouseout', function() {
          if (!this.tooltip) {
            return false;
          }

          this.hideTooltip();
        }.bind(this))

      this.updateLegend();
    }
  })
};
