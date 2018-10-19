const config = {
    el: 'line-chart',
    scale: 100,
    max_w: 5,
    max_h: 4,
    plot1: {
        fill: '#03d0ff'
    },
    plot2: {
        fill: '#b7df48'
    }

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
        console.log(`a: ${a}, b: ${b}`)
        return Math.floor((( a - b ) / a) * 100)
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
            [0 - this.y_unit,this.h], // bottom left
            [0 - this.y_unit,this.h], // top left
            [this.w - this.y_unit, this.h], // bottom right
            [this.w - this.y_unit, this.h] // pre-loaded plot point
        ]
        // this.line1 = new Line(this.draw, coords, '#03d0ff', this.w, this.h, this.y_unit)
        // this.line2 = new Line(this.draw, coords, '#b7df48', this.w, this.h, this.y_unit)
        
        // this.line1.init()
        // this.line2.init()

        
        this.chain1 = new Chain({
            draw: this.draw,
            coord: [this.w - this.y_unit, 300],
            max: 6,
            unit: this.y_unit,
            w: this.w
        })
        this.chain1.init()

        
        // this.line2 = new Line(this.draw, coords, '#03d0ff', this.w,)
        // this.line2.init()

        // init delta chart
        this.delta_group = this.draw.group().move(this.w - this.y_unit, 300)
        this.delta_box = this.delta_group.rect(this.y_unit, 50).attr({fill: 'none', stroke: '#fff'})
        this.delta_value = this.delta_group.text('26%').attr({fill: '#FFF'}).move(this.y_unit / 2, 25)

    }

    
    
    nextValue(points){
        // create new line
        // this.line1.update(points.line1)
        // this.line2.update(points.line2)

        this.chain1.addLink(points.line1.y)
        
        this.boxy = points.line1.y
        this.delta = utils.deltaP(points.line2.y, points.line1.y)
        this.delta_value.text(`${this.delta}%`)
        this.delta_value.animate().move(null, (points.line2.y - points.line1.y)/2)
        this.delta_group.animate().move(null, this.boxy)
        this.delta_box.animate().size(this.y_unit, points.line2.y - points.line1.y)
        // insert new point to end of line

        // recalculate coordinates for each point on the line
        // calculate delta as well as line1 and 2 values
        // animate each point to new coordinate

    }
    
}


/*
|-o--o
|     \
|-o--o-o 
|______|_
*/


class PlotPoint {
    constructor({draw, coord, interval}) {
        this.draw = draw
        this.coord = coord
        this.ox = coord[0]
        this.size = 20;
        this.interval = interval
        this.genesis = true
    }
    init() {
        this.point = this.draw.circle(20).move(this.coord[0],this.coord[1]).fill('#fff')
        this.line = this.draw.line(this.coord[0], this.coord[1], this.coord[0], this.coord[1]).attr({stroke: '#fff'});
    }

    coord() {
        return this.coord
    }

    get_x() {
        // needed for virgin points
        // they are supposed to remain at the original x
        // until they have been animated to the next y position
        if(this.lock_x) {
            return this.ox
        } else {
            this.lock_x = false
            // shift x value by 1 unit to the left
            return -this.unit
        }
    }

    
    
    nextValue(new_y, shouldMoveX) {
        // update coord
        // if(this.genesis === true) {
        //     this.coord[1] = new_y
        //     this.genesis = false
        // } else {
        //     this.coord[0] -= this.interval
        // }
        this.coord[0] -= this.interval
        // this.coord[1] = new_y
        this.point.animate().move(this.coord[0], this.coord[1])
        // connect the line to the other point
        // this.line.animate().move(this.get_x, this.coord[1], other_coord[0], other_coord[1])
    }
    

}



class Chain {
    constructor({ draw, coord, max, unit, w }) {
        this.draw = draw
        this.coord = coord
        this.max = max
        this.unit = unit
        this.interval = (w - unit) / max
    }
    init() {
        // place to store points
        this.link = []
        // add initial point
        this.link.push(new PlotPoint({
            draw: this.draw, 
            coord: this.coord, 
            interval: this.interval
        }))
        this.link[0].init() // init point
    }
    getLastLinkCoord(){
        return this.link[this.link.length-1].coord
    }
    addLink(y) {
        // add a new point, initalize its position so it sits on top of the previous.
        this.lastLinkCoord = this.getLastLinkCoord()
         // add new point
        this.link.push(new PlotPoint({
            draw: this.draw, 
            coord: [this.w - this.unit, this.lastLinkCoord[1]], 
            interval: this.interval
        }))
        this.link[this.link.length-1].init() // draw it to screen
        console.log(this.link)
        // then, run the animation sequence
        this.updateLink(y)
    }
    updateLink(y) {
        // loop through each point and animate
        // to next position
        // shift each point left - except for the last point
        // provide updated value for the link
        
        for( let i = 0; i < this.link.length; i++) {
            this.link[i].nextValue(y)
        }
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
        this.bl_coords = this.coords[0]
        this.bt_coords = this.coords[1]
        this.br_coords = this.coords[2]
        this.br_point = this.coords[3]
        // this.plot_coords = this.coords.slice(2)
        this.plot_coords = []
        this.gradient = this.draw.gradient('linear', stop => {
            stop.at(0.5,this.fill)
            stop.at(1,'#000c1f')
        }).from(0,0).to(0,1)
        this.polygon = this.draw.polygon(this.coords)
            .attr({stroke: this.fill, fill: this.gradient})

        this.polyline = this.draw.polyline(this.coords)
            .attr({stroke: this.fill, 'stroke-weight': 2, fill: 'none'})

        this.marker = this.draw.marker(10,10, (add) => {
            add.circle(10).fill(this.fill)
        })

        this.polyline.marker('start', this.marker)
        this.polyline.marker('mid', this.marker)
        this.polyline.marker('end', this.marker)
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
        // if( this.unassigned_points ) {
        this.plot_coords.push([ this.w, point.y ])
        this.br_point = [this.w - this.unit, point.y]
        
            
            // this.unassigned_points--
        // } 
        if( this.plot_coords.length >= 7) {
            
            this.plot_coords.shift()
            console.log(this.plot_coords.length)
        }


        this.x_interval = ( this.w - this.unit) / this.plot_coords.length 
        for( let x = 0; x < this.plot_coords.length; x++ ) {
            this.plot_coords[x][0] = this.x_interval * (x+1)
        }

        // for( let x = this.plot_coords.length-1; x >= 0; x-- ) {
        //     this.plot_coords[x][0] = this.x_interval * (x+1)
        // }

        console.log('updates')
        // console.log(this.bl_coords)
        // console.log(this.br_coords)
        // console.log(this.plot_coords)
        // console.log(this.br_coords)
        
        // this.plot_coords.reverse()

        function shift(a, b) {
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
       

        this.curr_coords = [this.bl_coords, this.br_coords, ...this.plot_coords]
            console.log(this.curr_coords)

        // console.log(this.plot_coords)
        this.polygon.animate().plot([
            this.bl_coords,
            this.bt_coords,
            
            this.br_point,
            ...this.plot_coords,
            this.br_coords,
        ])
        this.polyline.animate().plot([
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
        { y: utils.randomInt(min, 200)},
        { y: utils.randomInt(200, max)},
        )

    LC.nextValue(p)
}