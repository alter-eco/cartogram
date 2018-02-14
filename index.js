var Cartogram;

var Choropleth = require('@alter-eco/choropleth');
var eventablejs = require('eventablejs');

module.exports = Cartogram = {
  create: function() {
    var instance = Object.assign({}, eventablejs, this.prototype);

    Object.keys(this.prototype).forEach(function(methodName) {
      var placeholder = instance[methodName];

      var methodNameCaps = methodName.charAt(0).toUpperCase() + methodName.slice(1);

      instance[methodName] = function() {
        instance.trigger('before' + methodNameCaps);

        var result = placeholder.apply(instance, arguments);

        instance.trigger('after' + methodNameCaps, result);

        return result;
      };
    }.bind(instance));

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
    fill: function(datum) {
      if (datum.properties) {
        var geoKey = datum.properties[this.geoIdKey];

        if (this.dataById.hasOwnProperty(geoKey)) {
          return this.scale(this.dataById[geoKey][this.valueColumn]);
        }
      }

      return this.config.neutralColor;
    },

    draw: function() {
      var projection = d3.geoMercator()
        .center([2.2, 46.2])
        .scale(1500)
        .translate([this.drawWidth / 2, this.drawHeight / 2]);

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
        .attr('id', function(datum) {
          return datum.geometry.properties.nom;
        })
        .attr('fill', this.fill.bind(this))
        .on('mouseover', function(datum) {
          if (!this.tooltip || !datum.properties) {
            return false;
          }

          var tooltipData = this.dataById[datum.properties[this.geoIdKey]];

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
