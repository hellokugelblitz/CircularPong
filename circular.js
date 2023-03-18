const program_dimension = 700;

//Global game variables
const DEBUG_MODE = false;
let GRAVITY_MODE = false;
let DISPLAY_TEXT_SCORE = false;
let RAINBOW_MODE = false;
let rainbow_mode_toggle = true;
const gravity = 0.3;

//Game variables
let middle_x = program_dimension/2 + 50;
let middle_y = program_dimension/2;
let starting_rotation_radius = 230;
let rotation_radius = starting_rotation_radius;
let score = 0;
let spring = 0.02;

//Color variables
let color_lerp_amount = 0;
let colors = [5];
let new_colors = [5];

//Paddle variables
let rect_x = 0;
let rect_y = 0;
let rect_height = 20;
let rect_width = 100;
let angle = 0;
let speed = 5;
var poly = []; //We need to initilize the vector array here

//Ball variables
let ball_x = middle_x;
let ball_y = middle_y;
let ball_size = 30;
var ball; //We need to initialize the ball here


/*Functions for buttons */
function rainbow_mode(){
    if(RAINBOW_MODE){
        RAINBOW_MODE = false;
    } else {
        RAINBOW_MODE = true;
    }
}

function gravity_mode(){
    if(GRAVITY_MODE){
        GRAVITY_MODE = false;
    } else {
        GRAVITY_MODE = true;
    }
}

function text_score(){
    if(DISPLAY_TEXT_SCORE){
        DISPLAY_TEXT_SCORE = false;
    } else {
        DISPLAY_TEXT_SCORE = true;
    }
}

function reset_colors(){
    new_colors[0] = color(236, 228, 183);
    new_colors[1] = color(127, 176, 105);
    new_colors[2] = color(107,156,85);
    new_colors[3] = color(81, 91, 76);
    new_colors[4] = color(211, 97, 53);
    new_colors[5] = color(54, 80, 42);
}

class Ball {
    constructor(xin, yin, din, pad) {
        this.x = xin;
        this.y = yin;
        this.randomize_velocity();
        this.start_diameter = din;
        this.diameter = din;
        this.paddle = pad;
    }
    
    //Handles collisions, there is also a fun to play with GRAVITY MODE, which can be enabled up top.
    collide(paddle_x,paddle_y) {
        if(GRAVITY_MODE){
            this.vy += gravity;
            spring = 30;
        }

        if (collisionDetection(this.x, this.y, this.diameter, this.paddle)) {
          let ax = (paddle_x - middle_x) * spring;
          let ay = (paddle_y - middle_y) * spring;
          score += 1;
          this.vx -= ax;
          this.vy -= ay;
          rotation_radius += 1;
        }
    }
    
    move() {
        this.speed_cap(4);
        this.x += this.vx;
        this.y += this.vy;

        if(GRAVITY_MODE){
            this.y += gravity;
        }

        //This shrinks the ball, once it is outside of the rotation radius.
        if(dist(this.x, this.y, middle_x, middle_y) > rotation_radius + 25){
            if(this.diameter > 0){
                this.diameter -= 0.8;
            }
            
            //This is resposible for restarting the game.
            if(this.diameter <= 0){
                this.reset();
            }
        }
    }

    //This function is used to randomize the balls direction and velocity when it spawns
    randomize_velocity(){
        //Basically a random bool
        var x_neg = Math.floor(Math.random() * 2);
        var y_neg = Math.floor(Math.random() * 2);

        //Set random speed
        this.vx = Math.floor(Math.random() * 4) + 2;
        this.vy = Math.floor(Math.random() * 4) + 2;

        //Invert if negative = true
        if(y_neg > 0) this.vx = -this.vx;
        if(x_neg > 0) this.vy = -this.vy;
    }

    //Is used to reset the ball to its starting location.
    reset() {
        score = 0;
        rotation_radius = 230;
        this.diameter = this.start_diameter;
        this.x = middle_x;
        this.y = middle_y;
        this.randomize_velocity();
    }

    //This function is used to cap the speed of the ball at a specific point
    speed_cap(cap){
        if(this.vx > cap){
            this.vx = cap - 1;
          }
          if(this.vx < -cap){
            this.vx = -cap + 1;
          }
          if(this.vy > cap){
            this.vy = cap - 1;
          }
          if(this.vy < -cap){
            this.vy = -cap + 1;
          }
    }
  
    display() {
        ellipse(this.x, this.y, this.diameter, this.diameter);
    }

    //Setters:
    updatePoly(pad){
        this.paddle = pad;
    }

    updateDiameter(new_diameter){
        this.diameter = new_diameter;
    }
  }

function randInt(min,max){
    return Math.floor(Math.random() * (max+1)) + min;
}

function setup() {
    //Create our window and set the angle type to degrees.
    createCanvas(program_dimension+100,program_dimension);
    angleMode(DEGREES);

    //Stylistic choices
    strokeWeight(0);
    textSize(54);
    textAlign(CENTER,CENTER);

    colors[0] = color(236, 228, 183);
    new_colors[0] = colors[0];
    colors[1] = color(127, 176, 105);
    new_colors[1] = colors[1];
    colors[2] = color(107,156,85);
    new_colors[2] = colors[2];
    colors[3] = color(81, 91, 76);
    new_colors[3] = colors[3];
    colors[4]= color(211, 97, 53);
    new_colors[4] = colors[4];
    colors[5] = color(54, 80, 42);
    new_colors[5] = colors[5];

    if(RAINBOW_MODE){
        for (let i = 0; i < colors.length; i++) {
            console.log(colors[i])
            colors[i] = color(randInt(100,255), randInt(100,255), randInt(100,255));
           
        }
    }

    //Randomizing the placement of the paddle on startup (-180,180)
    angle += Math.floor(Math.random() * 360) - 180;

    //Creating the rectangles initial position and initializing all of the points in the polygon.
    poly[0] = createVector(rect_x,rect_y);
    poly[1] = createVector(rect_x + rect_height,rect_y);
    poly[2] = createVector(rect_x+rect_height,rect_y+rect_width);
    poly[3] = createVector(rect_x, rect_y+rect_width);
    
    //Here is where we really initialize the ball.
    ball = new Ball(ball_x,ball_y,ball_size,poly);
}

// This is from a collision detection library for p5js, I needed to rework a few things so I brought it in here.
function collisionDetection(cx, cy, diameter, vertices, interior) {

    if (interior === undefined){
        interior = false;
    }

    // go through each of the vertices, plus the next vertex in the list
    var next = 0;
    for (var current=0; current<vertices.length-2; current++) {
        // get next vertex in list if we've hit the end, wrap around to 0
        next = current+1;
        if (next === vertices.length) next = 0;

        // get the PVectors at our current position this makes our if statement a little cleaner
        var vc = vertices[current];    
        var vn = vertices[next];       

        // check for collision between the circle and a line formed between the two vertices
        var collision = this.collideLineCircle(vc.x,vc.y, vn.x,vn.y, cx,cy,diameter);
        if (collision) return true;
    }

    // test if the center of the circle is inside the polygon
    if(interior === true){
        var centerInside = this.collidePointPoly(cx,cy, vertices);
        if (centerInside) return false;
    }

    // otherwise, after all that, return false
    return false;
}

//This function is used to rotate a list of vectors around a specific point.
function rotateVectors(vectors, angle, current_rect_x, current_rect_y) {
    let center = createVector(current_rect_x,current_rect_y)
    let rotatedVectors = [];

    for (let vector of vectors) {
        let x = vector.x - center.x;
        let y = vector.y - center.y;
        let rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
        let rotatedY = x * Math.sin(angle) + y * Math.cos(angle);
        rotatedVectors.push(createVector(rotatedX + center.x, rotatedY + center.y));
    }

    return rotatedVectors;
}
 
function draw() {

    if(RAINBOW_MODE){
        for (let i = 0; i < colors.length; i++) {
            colors[i] =  color(lerpColor(colors[i], new_colors[i], color_lerp_amount));
        }

        if(color_lerp_amount >= 1){
            color_lerp_amount = 0.0;
            for (let i = 0; i < colors.length; i++) {
                colors[i] =  new_colors[i];
                new_colors[i] = color(random(255),random(255),random(255));
            }
        }
        color_lerp_amount += 0.01;

    } else{
        reset_colors();
        for (let i = 0; i < colors.length; i++) {
            colors[i] =  color(lerpColor(colors[i], new_colors[i], color_lerp_amount));
        }
    }

    //Set background color
    background(colors[0]);

    //Change the background color of the actual site to match the background color of the bg
    document.body.style.background = colors[0];

    //Create play area circle
    fill(colors[1]);
    ellipse(middle_x,middle_y,rotation_radius*2);
    fill(colors[2]);
    ellipse(middle_x,middle_y,starting_rotation_radius*2);

    if(DISPLAY_TEXT_SCORE){
        fill(colors[1]);
        text(score , middle_x, middle_y);
    }

    //Keep track of middle location for where the paddle should be.
    let current_rect_x = (middle_x + cos(angle)*rotation_radius);
    let current_rect_y = (middle_y + sin(angle)*rotation_radius);

    //Here we are updating the vectors each frame
    poly[0] = createVector(current_rect_x-rect_height/2,current_rect_y);     // Top Left
    poly[1] = createVector(current_rect_x-rect_height/2 + rect_height,current_rect_y); // Top right
    poly[2] = createVector(current_rect_x-rect_height/2 + rect_height, current_rect_y + rect_width);
    poly[3] = createVector(current_rect_x-rect_height/2, current_rect_y+rect_width);

    //Calculating the angle that we want the rect to be rotating at depending on where it is around the center.
    var angleDeg = Math.atan2(middle_y - current_rect_y, middle_x - current_rect_x);

    //Finally we rotate all the vectors each frame. 
    poly = rotateVectors(poly, angleDeg-0.2, current_rect_x, current_rect_y);

    //Drawing the paddle, notice that I am not using the p5 js rotate(), because its dumb and I dont like it.
    beginShape();
    for(i=0; i < poly.length; i++){
        fill(colors[4])
        vertex(poly[i].x,poly[i].y);
    }
    endShape(CLOSE);

    //Thank you collision detection function!
    hit_ball = collisionDetection(ball_x, ball_y, ball_size, poly);

    //Draws game ball using ball class
    fill(colors[5]);
    ball.move();
    ball.updatePoly(poly);
    ball.collide(current_rect_x,current_rect_y);
    ball.display();

    //Handles movement for the paddle back and forth.
    if(keyIsDown(LEFT_ARROW)){
        angle -= speed;
    }
    if(keyIsDown(RIGHT_ARROW)){
        angle += speed;
    }
}