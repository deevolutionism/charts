// config settings
// chart dimentions
const config = {
    max_x: 6,
    max_y: 5,
    scale: 100,
    padding: 10,
    el: "performance-chart",
    target: {
      fill: "#002036",
      points: [
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        { x: 2, y: 3},
        { x: 3, y: 3 },
        { x: 4, y: 4 },
        { x: 5, y: 1 }
      ]
    },
    actual: {
      fill: "#002036",
      points: [
        { x: 0, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 3, y: 1 },
        { x: 4, y: 2 },
        { x: 5, y: 1 }
      ]
    }
  };
  
  const utils = {
    LatencyPlot: function(val) {
      // 100.0 - 1.0
      return 5 - 2 * Math.log10(val);
    },
    ULBWPlot: function(val) {
      // 0.1 - 1000.0
      return Math.log10(val * 100);
    },
    DLBWPlot: function(val) {
      // 0.1 - 1000.0
      return Math.log10(val * 100);
    },
    ReliabilityPlot: function(val) {
      // 2.0 - 6.0
      return val - 1;
    },
    ScalePlot: function(val) {
      // 1 - 10,000
      return Math.log10(val * 10);
    },
    SecurityPlot: function(val) {
      return val;
    },
    randomInt: function(min, max) {
      return Math.floor( Math.random() * (max - min)) + min
    },
    randomFloat: function(min, max) {
      return Math.random() * (max - min) + min
    }
  };
  
  class PerformanceChart {
    constructor(config) {
      this.config = config;
    }
  
    get_x_coord(x) {
      // return plottable coordinate
      return x * this.unit;
    }
    get_y_coord(y) {
      // return plottable coordinate
      return this.h - (y * this.y_interval);
    }
    
    normalizePoints(p) {
      // take original KPI data points
      // convert them to scale of 1-5 for plotting
      const gen = [
        {func: utils.LatencyPlot},
        {func: utils.ULBWPlot },
        {func: utils.DLBWPlot},
        {func: utils.ReliabilityPlot},
        {func: utils.ScalePlot},
        {func: utils.SecurityPlot},
      ]
      
      let np = gen.map( (item, index) => {
        let { func } = item
        return {y: func(p[index].y), x: index}
      })
      
      return np
    }
  
    parsePoints(points) {
      // let np = this.normalizePoints(points) // normalize the points
      let np = points
      let plot_coords = [];
      for (let i = 0; i < np.length; i++) {
        plot_coords.push(
          ...[this.get_x_coord(np[i].x), this.get_y_coord(np[i].y)]
        );
      }
      console.log(plot_coords);
      return [0, this.h, ...plot_coords, this.w, this.h];
    }
  
    init() {
      const { target, actual, scale, padding, el, max_x, max_y } = this.config;
      this.w = scale * max_x;
      this.h = scale * max_y;
      this.draw = SVG(el).size("100%", "100%");
      this.chart_group = this.draw.nested();
      this.chart = this.chart_group
        .rect(this.w, this.h)
        .attr({ stroke: "#fff", weight: 2 });
  
      
      // calculate interval w / max_x
      this.x_interval = this.w / max_x;
      this.y_interval = this.h / max_y;
      this.unit = this.x_interval;
  
      // draw polygons
      this.polyTarget = this.draw
        .polygon(this.parsePoints(target.points))
        .attr({ stroke: '#aaa', fill: "none" });
      this.polyActual = this.draw
        .polygon(this.parsePoints(actual.points))
        .attr({ stroke: '#fff', fill: "none" });
      
      // draw points
      // must normalize data before you can plot it
      this.pointsArr = actual.points.map( (point, index) => {
        return new PCPoint(
          this.get_x_coord(point.x), 
          this.get_y_coord(point.y),
          point.x,
          point.y,
          this.chart_group
        )
      })
      this.pointsArr.forEach( point => {
        point.draw()
      })
  
      // draw grid
      for (let x = 0; x < max_x; x++) {
        for (let y = 0; y < max_y; y++) {
          // this.draw.rect(1,10).fill('#fff')
          let box = this.chart_group
          .rect(this.x_interval, this.x_interval)
          .attr({ stroke: "#06c", weight: 1, fill: "none" })
          .move(x * this.x_interval, y * this.y_interval);
          // crosshairs
          this.chart_group
            .rect(2, 20)
            .attr({ fill: "#fff" })
            .move(x * this.x_interval, y * this.y_interval - 9);
          this.chart_group
            .rect(20, 2)
            .attr({ fill: "#fff" })
            .move(x * this.x_interval - 9, y * this.y_interval);
  
          this.chart_group
            .rect(2, 20)
            .attr({ fill: "#fff" })
            .move(
            x * this.x_interval + this.x_interval,
            y * this.y_interval - 9 + this.y_interval
          );
          this.chart_group
            .rect(20, 2)
            .attr({ fill: "#fff" })
            .move(
            x * this.x_interval - 9 + this.x_interval,
            y * this.y_interval + this.y_interval
          );
        }
       }
    }
  
    setValues(points) {
      // animate line
      this.polyActual
        .animate(500)
        .plot(this.parsePoints(points));
      
      // animate points
      points.forEach( (point, index) => {
        this.pointsArr[index]
          .updatePos(this.get_x_coord(point.x), this.get_y_coord(point.y))
      })
    }
  
    setTargetValues(p1, p2, p3) {
      this.polyTarget
        .animate(500)
        .plot([
          [0, 500],
          [200, 500],
          [this.points[2].x, 500 - p3],
          [this.points[1].x, 500 - p2],
          [this.points[0].x, 500 - p1],
          [0, 500]
        ]);
    }
  
    animateOut() {
      this.poly
        .animate(500)
        .plot([
          [0, 500],
          [200, 500],
          [this.points[2].x, 500],
          [this.points[1].x, 500],
          [this.points[0].x, 500],
          [0, 500]
        ]);
      this.polyTarget
        .animate(500)
        .plot([
          [0, 500],
          [200, 500],
          [this.points[2].x, 500],
          [this.points[1].x, 500],
          [this.points[0].x, 500],
          [0, 500]
        ]);
    }
  }
  
  class PCPoint {
    constructor(x, y, ix, iy, chart) {
      this.x = x // computed grid coord
      this.y = y
      this.ix = ix // original value
      this.iy = iy
      this.chart = chart
      this.min_threshold = 0.5;
      this.max_threshold = 4.0;
      this.size = 20
      this.adur = 500
      this.offset = this.size/2
    }
    draw() {
      // if above threshold, draw full
      this.point = this.chart
          .circle(this.size)
          .attr({fill: '#000', stroke: '#fff', 'stroke-width': 5})
          .move(this.x - this.size/2, this.y - this.size/2)
      this.updateType(this.threshold())
      // if below threadhold, draw red
      // if normal, draw outlined
    }
    threshold() {
      if ( this.iy >= this.max_threshold ) {
        return 'max'
      } else if ( this.iy <= this.min_threshold ) {
        return 'min'
      } else {
        return ''
      }
    }
    updateType(type){
      switch( type ) {
        case 'max':
          this.point.animate(this.adur).attr({fill:'#00f', stroke: '#00f'})
          break;
        case 'min':
          this.point.animate(this.adur).attr({fill:'#f00'})
          break;
        default:
          this.point.animate(this.adur).attr({fill:'#000'})
      }
    }
    updatePos(x, y){
      this.point.animate(this.adur).move(x - this.offset,y - this.offset)
      this.updateType(this.threshold())
    }
  }
  
var PC1;
  window.addEventListener('load', () => {
     PC1 = new PerformanceChart(config);
    PC1.init();
  })

  
  
  
  function doTest() {
    
    const gen = [
      {func: utils.LatencyPlot, rand: utils.randomFloat, min: 1, max: 100},
      {func: utils.ULBWPlot, rand: utils.randomFloat, min: 0.1, max: 1000 },
      {func: utils.DLBWPlot, rand: utils.randomFloat, min: 0.1, max: 1000},
      {func: utils.ReliabilityPlot, rand: utils.randomFloat, min: 2.0, max: 6.0},
      {func: utils.ScalePlot, rand: utils.randomInt, min: 1, max: 10000},
      {func: utils.SecurityPlot, rand: utils.randomInt, min: 1, max: 5},
    ]
  
    let points = gen.map( (item, index) => {
      let { func, rand, min, max } = item
      console.log(min)
      return {y: func(rand(min, max)), x: index}
    })
    
    console.log(points)
    PC1.setValues(points)
  }
  
  //window.PerformanceChart = PerformanceChart;
  
  //
  
  window.testInit = function() {
    PerformanceChart.setTargetValues(400, 425, 375);
    PerformanceChart.setValues(200, 75, 125);
  };
  
  window.testValues = function() {
    PerformanceChart.setValues(
      100 + Math.random() * 300,
      100 + Math.random() * 300,
      100 + Math.random() * 300
    );
  };
  
  window.testAnimateOut = function() {
    PerformanceChart.animateOut();
  };
  