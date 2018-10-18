const config = {
    el: 'line-chart',
    scale: 100,
    max_w: 5,
    max_h: 4,
}

const utils = {
    randomInt: function(min,max) {
        return Math.floor(Math.random() * (max - min)) + min
    },
    genCoords: function(coordA, coordB) {
        return { line1: coordA, line2: coordB }
    },
    delta: function(a,b) {
        return a - b
    },
    deltaP: function(a, b) {
        return ( a / b ) * 100
    }
}



class LineChart {
    constructor(config) {
        this.config = config
    }

    init() {
        const { el, max_h, max_w, max_y, scale } = this.config
        this.w = scale * max_w
        this.h = scale * max_h
        this.draw = SVG(el).size('100%', '100%')
        this.chart_group = this.draw.nested()
        this.bar_group = this.draw.group()
        this.background_group = this.draw.group()
        this.point_group = this.draw.group()

        
        this.y_unit = this.h / max_h
        this.x_margin = this.y_unit * 1.5
        
        
        
        
        
        // init bar
        this.bar_gradient = this.draw.gradient('linear', function(stop) {
            stop.at(0, '#4c545e')
            stop.at(1, '#000')
        })
        this.bar_gradient.from(0,0).to(0,1)
        this.bar = this.draw
            .rect(this.y_unit, this.y_unit * max_h)
            .attr({fill: this.bar_gradient})
            .move(this.w - this.x_margin)
        
        

        // draw grid
        for(let y = 0; y < max_h; y++) {
            let h_line = this.chart_group
            .line(
                0, y * this.y_unit,
                this.w, y * this.y_unit
            )
            .attr({stroke: '#333'})
            this.background_group.add(h_line)
        }
        
        
        // init lines
        // var coords = [
        //     0,this.h, 
        //     this.w - this.y_unit,this.h, 
        //     this.w - this.y_unit,300,
        //     0,300
        // ]
        var coords = [
            [this.w - this.y_unit, this.h], // bottom right
            [0,this.h], // bottom left
            

            // [this.w - this.y_unit, 300],
            // [this.w - this.y_unit, 300],
            // [this.w - this.y_unit, 300],
            // [this.w - this.y_unit, 300],
            // [this.w - this.y_unit, 300],
            // [this.w - this.y_unit, 300],
            // [this.w - this.y_unit, 300], 
            
        ]
        this.line1 = new Line(this.draw, coords, '#b7df48', this.w, this.h, this.y_unit)
        this.line1.init()
        // this.line2 = new Line(this.draw, coords, '#03d0ff', this.w,)
        // this.line2.init()
    }
    
    nextValue(points){
        // create new line
        this.line1.update(points.line1)
        // insert new point to end of line

        // recalculate coordinates for each point on the line
        // calculate delta as well as line1 and 2 values
        // animate each point to new coordinate

    }
    
}


class PlotPoint extends LineChart{
    constructor(config,coord) {
        super(config);
        this.coord = coord
    }
}

class Line {
    constructor(draw, coords, fill, w,h, unit) {
        this.draw = draw
        this.coords = coords
        this.fill = fill
        this.w = w
        this.unit = unit
        
        this.unassigned_points = 7;
    }
    init() {
        // draw initial line at 0,0
        this.bl_coords = this.coords.slice(0,1)
        this.br_coords = this.coords.slice(1)
        // this.plot_coords = this.coords.slice(2)
        this.plot_coords = []
        this.polygon = this.draw.polygon(this.coords).attr({stroke: this.fill, fill: 'none'})
    }
    update() {
        
    }
    calcX(x, x_interval, index) {
       return this.x_interval * index
    }
    calcY() {

    }
    findMaxY(coords) {
        return coords.reduce( (prev, curr) => {
            if ( curr > prev ) { return curr } else { return prev }
        })
    }
    x_interval(width, n_points){
        return width / (n_points)
    }
    update(point){
        // console.log(point)
        // a new point is recieved
        // update all points to account for new coordinate
        // return a new coordinate array for animating
        // this.x_interval = this.x_interval(this.w, this.n_points + 1)
        // console.log(this.x_interval)
        // this.y_axis = this.findMaxY()
        if( this.unassigned_points ) {
            this.plot_coords.push([ this.w, point.y ])
            
            
            this.unassigned_points--
        }   


        this.x_interval = ( this.w - this.unit) / this.plot_coords.length 
        for( let x = 0; x < this.plot_coords.length; x++ ) {
            this.plot_coords[x][0] = this.x_interval * (x+1)
            
        }

        function swap(a, b) {
            return [...b, ...a]
        }

        
        // for( let i = 1; i < this.plot_coords.length; i++) {
        //     this.plot_coords[i-1] = this.plot_coords[i]
        // }

        

        

        // for ( let i = 0; i < this.plot_coords.length; i++) {
        //     if ( i < this.unassigned_points) {
        //         this.new_coords.push([this.plot_coords[i][0], point.y])
        //     }
        // }

        // 
       



        // console.log(this.plot_coords)
        this.polygon.animate().plot([
            ...this.bl_coords,
            ...this.br_coords,
            ...this.plot_coords
        ])
        
    }
}

var LC = new LineChart(config)
LC.init()



function doTest() {
    var min = 0;
    var max = 400;
    var p =  utils.genCoords(
        { y: utils.randomInt(min, max)},
        { y: utils.randomInt(min, max)},
        )
    console.log(Math.floor(Math.random() * (max - min)) + min)
    LC.nextValue(p)
}