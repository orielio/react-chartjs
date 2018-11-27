var React = require('react');
var ReactDOM = require('react-dom');

module.exports = {
  createClass: function(chartType, methodNames, dataKey) {
    var excludedProps = ['data', 'options', 'redraw'];
    var classData = {
      displayName: chartType + 'Chart',
      getInitialState: function() { return {}; },
      render: function() {
        var _props = {
          ref: 'canvass'
        };
        for (var name in this.props) {
          if (excludedProps.indexOf(name) === -1) {
            if (name !== 'data' && name !== 'options') {
              _props[name] = this.props[name];
            }
          }
        }
        return React.createElement('canvas', _props);
      }
    };

    var extras = ['clear', 'stop', 'resize', 'toBase64Image', 'generateLegend', 'update', 'addData', 'removeData'];
    function extra(type) {
      classData[type] = function() {
        return this.state.chart[type].apply(this.state.chart, arguments);
      };
    }

    classData.componentDidMount = function() {
      this.initializeChart(this.props);
    };

    classData.componentWillUnmount = function() {
      var chart = this.state.chart;
      chart.destroy();
    };

    classData.componentWillReceiveProps = function(nextProps) {
      var chart = this.state.chart;
      if (nextProps.redraw) {
        chart.destroy();
        this.initializeChart(nextProps);
      } else {
        chart.data = nextProps.data;
        chart.update();
      }
    };

    classData.initializeChart = function(nextProps) {
      var Chart = require('chart.js');

      Chart.pluginService.register({
        beforeDraw: function (chart) {
          // plugin for doughnut charts only
          if (chart.config.type !== 'doughnut') {
            return;
          }

          var displayLabel = function(chart, config, idx, total) {
            var ctx = chart.chart.ctx;

            //Get label options
            var fontStyle = config.fontStyle || 'Arial';
            var txt = config.text;
            var color = config.color || '#000';
            var sidePadding = config.sidePadding || 20;
            var sidePaddingCalculated = (sidePadding/100) * (chart.innerRadius * 2);
            //Start with a base font of 30px
            ctx.font = "30px " + fontStyle;

            //Get the width of the string and also the width of the element minus 10 to give it 5px side padding
            var stringWidth = ctx.measureText(txt).width;
            var elementWidth = (chart.innerRadius * 1.6) - sidePaddingCalculated;

            // Find out how much the font can grow in width.
            var widthRatio = elementWidth / stringWidth;
            var newFontSize = Math.floor(30 * widthRatio);
            var elementHeight = (chart.innerRadius * 1.3);

            // Pick a new font size so it will not be larger than the height of label.
            var fontSizeToUse = Math.min(newFontSize, elementHeight);

            //Set font settings to draw it correctly.
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
            var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);

            ctx.font = fontSizeToUse+"px " + fontStyle;
            ctx.fillStyle = color;

            if (idx === 0 && total > 1) {
              centerY -= fontSizeToUse / 4;
            }

            if (idx === 1 && total > 1) {
              centerY += fontSizeToUse;
              ctx.font = (fontSizeToUse * 0.8)+"px " + fontStyle;
            }

            //Draw text in center
            ctx.fillText(txt, centerX, centerY);
          }

          for (var i = 0; i < chart.config.options.elements.labels.length; i++) {
            var labelConfig = chart.config.options.elements.labels[i];
            displayLabel(chart, labelConfig, i, chart.config.options.elements.labels.length);
          }
        }
      });

      var el = ReactDOM.findDOMNode(this);
      var ctx = el.getContext("2d");
      var chart = new Chart(ctx, {type: chartType.toLowerCase(), data: nextProps.data, options: nextProps.options});
      this.state.chart = chart;
    };

    // return the chartjs instance
    classData.getChart = function() {
      return this.state.chart;
    };

    // return the canvass element that contains the chart
    classData.getCanvass = function() {
      return this.refs.canvass;
    };

    classData.getCanvas = classData.getCanvass;

    var i;
    for (i=0; i<extras.length; i++) {
      extra(extras[i]);
    }
    for (i=0; i<methodNames.length; i++) {
      extra(methodNames[i]);
    }

    return React.createClass(classData);
  }
};
