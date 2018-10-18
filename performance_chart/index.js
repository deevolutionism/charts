// config settings
// chart dimentions
const config = {
    max_x: 5,
    max_y: 4,
    scale: 100,
    padding: 10,
    min_t: 0.5, // min threashold
    max_t: 4.0, // max threashold for 
    el: "performance-chart",
    target: {
      fill: "#001f35",
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
      fill: "#017699",
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
      return this.h - ((y-1) * this.y_interval);
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
      return [0, this.h, ...plot_coords, this.w, this.h];
    }
    
    parsePointsPure(points) {
      let np = points
      let plot_coords = [];
      for (let i = 0; i < np.length; i++) {
        plot_coords.push(
          ...[this.get_x_coord(np[i].x), this.get_y_coord(np[i].y)]
        );
      }
      return plot_coords
    }
  
    init() {
      const { target, actual, scale, padding, el, max_x, max_y, min_t, max_t } = this.config;
      this.w = scale * max_x;
      this.h = scale * max_y;
      this.draw = SVG(el).size("100%", "100%");
      this.chart_group = this.draw.nested();
      this.background_group = this.draw.group();
      this.point_group = this.draw.group()
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
        .attr({ stroke: '#aaa', fill: target.fill});
      
      
      this.chart_group.add(this.polyTarget)
      
      this.polyActualGradient = this.draw.gradient('linear', stop => {
        stop.at(0, actual.fill)
        stop.at(1,'#003c57')
      }).from(0,0).to(0,1)
      this.polyActual = this.draw
        .polygon(this.parsePoints(actual.points))
        .attr({ stroke: '#fff', fill: this.polyActualGradient });
      this.chart_group.add(this.polyActual)
      
      
      
      
      
      
      // draw points
      // must normalize data before you can plot it
      this.pointsArr = actual.points.map( (point, index) => {
        return new PCPoint(
          this.get_x_coord(point.x), 
          this.get_y_coord(point.y),
          point.x,
          point.y,
          this.point_group
        )
      })
      this.pointsArr.forEach( point => {
        point.draw()
      })
  
      // draw grid
      for (let x = 0; x < max_x; x++) {
        for (let y = 0; y < max_y; y++) {
          // this.draw.rect(1,10).fill('#fff')
          let box = this.draw
          .rect(this.x_interval, this.x_interval)
          .attr({ stroke: "#06c", weight: 1, fill: "none" })
          .move(x * this.x_interval, y * this.y_interval);
  
          this.background_group.add(box)
        }
       }
      
      // draw crosshairs
      for (let x = 0; x < max_x+1; x++) {
        for (let y = 0; y < max_y+1; y++) {
          let c1 = this.draw
            .rect(2, 20)
            .attr({ fill: "#fff" })
            .move(x * this.x_interval, y * this.y_interval - 9);
          let c2 = this.draw
            .rect(20, 2)
            .attr({ fill: "#fff" })
            .move(x * this.x_interval - 9, y * this.y_interval);
          this.background_group.add(c1)
          this.background_group.add(c2)
        }
      }
      this.background_group.move(10,10)
      this.chart_group.move(10,10)
      this.point_group.move(10,10)
      
      // draw min threshold
      this.dashed_pattern = this.draw.pattern(10,10, add => {
        add.rect(6,2).fill('#f06')
      })
      this.min_t_line = this.draw
        .rect(this.w, 10)
        .move(0,this.get_y_coord(min_t) - this.unit)
        .attr({fill: this.dashed_pattern})
      this.chart_group.add(this.min_t_line)
    }
  
    setValues(points) {
      // animate line
      this.polyActual
        .animate(500, '>')
        .plot(this.parsePoints(points));
      
      // animate points
      points.forEach( (point, index) => {
        this.pointsArr[index]
          .updatePos(
            this.get_x_coord(point.x), this.get_y_coord(point.y), 
            point.x, point.y
        )
        
      })
    }
  
  }
  
  class PCPoint {
    constructor(x, y, ix, iy, chart, min_t, max_t) {
      this.x = x // computed grid coord
      this.y = y
      this.ix = ix // original value
      this.iy = iy
      this.chart = chart
      this.min_threshold = min_t;
      this.max_threshold = max_t;
      this.size = 16
      this.adur = 500
      this.offset = this.size/2
    }
    draw() {
      // if above threshold, draw full
      this.point = this.chart
          .circle(this.size)
          .attr({fill: '#000', stroke: '#03d0ff', 'stroke-width': 5})
          .move(this.x - this.size/2, this.y - this.size/2)
      this.updateType(this.threshold(this.iy))
      this.chart.add(this.point)
      // if below threadhold, draw red
      // if normal, draw outlined
    }
    threshold(val) {
      console.log(val)
      if ( val >= this.max_threshold ) {
        return 'max'
      } else if ( val - 1 <= this.min_threshold ) {
        return 'min'
      } else {
        return ''
      }
    }
    updateType(type){
      switch( type ) {
        case 'max':
          return { fill: '#03d0ff', stroke: '#03d0ff' }
          break;
        case 'min':
          return { fill: '#f00' }
          break;
        default:
          return { fill: '#000' }
      }
    }
    updatePos(x, y, ix, iy){
      this.iy = iy // normalized value
      this.point
        .animate(this.adur, '>')
        .move(x - this.offset,y - this.offset)
        .attr(this.updateType(this.threshold(iy)))
    }
  }
  
  var PC1 = new PerformanceChart(config);
  PC1.init();
  
  
  
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
      return {y: func(rand(min, max)), x: index}
    })
    
    // console.log(points)
    PC1.setValues(points)
  }