const p5 = require("p5");

// Model URL
// If you make your own model, this is where you'd link to it. This is a model
// that I trained on drawings of circles and squares. It should be able to distinguish
// those two at least
const imageModelURL = 'https://teachablemachine.withgoogle.com/models/lsn8thtI1/';

// Whether or not you want to flip the video horizontally. If you trained your model
// using your webcam, then you'll want to enable this
const flipVideo = true;

let size = 0;

const p5draw = (p) => {
    const width = p.windowWidth-10;
    const height = p.windowHeight-10;
    let classifier;
    let drawingCanvas;
    let label = "";
    let submittedLabel = '';
    let lastX = -1;
    let lastY = -1;
    let startNewShape = false;
    const shapeArray = ['Circle', 'Triangle', 'Rectangle', 'Spiral'];
    let shapeIndex = 0;
    let win = false;
    let startText="";
    let startTextPos = height;

	p.setup = () => {
		p.createCanvas(width, height);
		p.background(0);
        startText = "Welcome back to your home galaxy, cadet. I don't need to tell you what we're up against, but I just wanted to express how pleased we are to have you aboard. \n\nNow then, our mission is to sneak into the Empire's military spacefields. Our ship can spoof the Empire fleet's gravitational field shapes to gain entry to their military zones, but we can't detect the target pattern. \n\nYou are the only member of the rebel forces who can see the shape prompts. Draw the shape you see to help us get through the Empire's defences. \n\nOK, here we go. Draw this next shape. Press enter to initiate the controls.";
        // We want the drawing to persist between calls to draw,
        // so we make a graphics context into which we can draw
        drawingCanvas = p.createGraphics(width, height);
        //drawingCanvas.background(0);
        classifier = ml5.imageClassifier(imageModelURL + 'model.json', classifyImage);
	};

	p.draw = () => {
        // Draw a line under the mouse
        if (p.mouseIsPressed) {
            
            drawingCanvas.strokeWeight(1);
            drawingCanvas.stroke(255);
            if(lastX>=0) {
                drawingCanvas.line(lastX, lastY, p.mouseX, p.mouseY);
            }
            lastX = p.mouseX; 
            lastY = p.mouseY;
        }
        else{
            lastX = -1;
            lastY = -1;
        }

        // To draw what we see, first erase
        p.background(0);

        // Draw the drawing canvas
        p.image(drawingCanvas, 0, 0, width, height);

        //if we have started the game, and the shape size has not overtaken the screen's width draw the shape and user submission, and check for winning shape 
        if(startNewShape && size<width) {
            
            let shape = shapeArray[shapeIndex];
            console.log(shapeIndex + ' ' + shape);
            p.noFill();
            p.stroke(255);
            if(shape==='Circle'){
                for ( var i = 0 ; i < 250 ; i++ ){
                    p.ellipse(width/2, height/2, size/i);
                }
                
            }
            else if(shape==='Rectangle')
            {
                for ( var i = 0 ; i < 250 ; i++ ){
                    p.rect(width/2-size/1.25/i, height/2-size/2/i, size*1.61803398875/i, size/i);
                }
            }
            else if(shape==='Triangle') {
                for ( var i = 0 ; i < 250 ; i++ ){
                    p.triangle(width/2, size/i, width/2 + size*p.sin(135)/i, height/2 + size*p.cos(135)/i, width/2 + size*p.sin(225)/i,  height/2 + size*p.cos(225)/i);
                }
            }
            //adapting spiral code from https://editor.p5js.org/kll/sketches/H1PwR089m
            else if(shape==='Spiral') { 
                let r1 = 0,r2 = 0, step=size/1000,spiralwidth=size,dw=spiralwidth/250;
                p.push();
                p.translate(width/2, height/2);
                p.beginShape(p.TRIANGLE_STRIP);
                for ( var i = 0 ; i < 250 ; i++ ){
                    r1 += step;
                    spiralwidth -= dw;
                    r2 = r1 + spiralwidth;
                    var ang = p.PI/30;
                    var r1x = r1*p.sin(ang*i);
                    var r1y = r1*p.cos(ang*i);
                    var r2x = r2*p.sin(ang*i);
                    var r2y = r2*p.cos(ang*i);
                    p.vertex(r1x,r1y);
                    p.vertex(r2x,r2y);
                    }
                p.endShape();
                p.pop();
            }
            size+=5;
            // Draw the label
            let textToDraw = label === "" ? "Draw! Space to clear, s to save." : label + " so far. Release mouse to submit.";
            p.fill(255);
            p.textSize(16);
            p.textAlign(p.CENTER);
            p.text(textToDraw, width / 2, height - 20);

            //don't check label until this flag is set
            if(submittedLabel===shape) {
                win = true;
                startNewShape=false;
            }
            else{
                win=false;
            }
        }
        else {
            p.fill(255);
            p.textSize(16);
            p.textAlign(p.CENTER);
            startNewShape=false;
            size=0;
            if(startText.length>0){
                textToDraw = startText;
                p.textSize(24);
                p.textAlign(p.LEFT);
                p.text(textToDraw, width / 2 - 200, startTextPos, 500, height);
                startTextPos -= 1;
            }
            else if(win){
                textToDraw = "You did it! Press enter to try the next one.";
                p.text(textToDraw, width / 2, height - 20);
            }
            else{
                textToDraw = "Argh, no cigar. We're taking damage here! Try again. Press enter to start";
                p.text(textToDraw, width / 2, height - 20);
            }
            
            
        }
        
    };

    p.keyPressed = () => {
        if (p.key === " ") {
            label = "";
            drawingCanvas.background(0);
        } else if (p.key === "s") {
            p.saveCanvas(drawingCanvas);
        }
        else if (p.keyCode === p.ENTER || p.keyCode === p.RETURN) {
            startText = '';
            drawingCanvas.background(0);
            startNewShape = true;
            shapeIndex = Math.floor(p.random(3.9999));
            submittedLabel="";
        }
    }
    //flag for actually checking label against our model
    p.mouseReleased = () => {
        submittedLabel=label;
    }
      // Get a prediction for the current video frame
    function classifyImage() {
        classifier.classify(drawingCanvas, gotResult);
    }
    
    function gotResult(error, results) {
        if (error) {
            console.error(error);
            return;
        }

        // results is an array, sorted by confidence. Each
        // result will look like { label: "category label" confidence: 0.453 }
        // or something like this
        if (results[0].confidence > 0.75)
            label = results[0].label;
        classifyImage();
    }
}

module.exports = function setup() {
	const myp5 = new p5(p5draw, "main");
}

