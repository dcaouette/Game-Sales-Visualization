/*
  Donald Caouette
  CIS 568
  Mario Vis Code

  Sources that I used to help with the development:
    https://developer.mozilla.org/en-US/docs/Games/Anatomy
    https://www.w3schools.com/graphics/tryit.asp?filename=trygame_controllers_keys_multiple
  
  Canvas references:
    https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
    https://www.w3schools.com/graphics/canvas_intro.asp


  Sprites:
    https://www.spriters-resource.com/nes/supermariobros/
  */


var dataScale = 1;

// Variables that contain the background layer of the main view
var canvasBG = document.getElementById('background');
var ctxBG = canvasBG.getContext('2d');

// Variables that contain the middle (action) layer of the main view
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');

// Variables that contain the UI (axis and key) layer of the main view
var canvasUI = document.getElementById('UI');
var ctxUI = canvasUI.getContext('2d');

// Variables that contain the middle (bars) layer of the extended view
var canvasExtended = document.getElementById('extendedGame');
var ctxExtended = canvasExtended.getContext('2d');

// Variables that contain the UI (selection tool and axis) layer of the extended view
var canvasExtendedUI = document.getElementById('extendedGameUI');
var ctxExtendedUI = canvasExtendedUI.getContext('2d');

// Variables that contain the UI (selection tool and axis) layer of the extended view
var flagView = document.getElementById('flagView');
var ctxFlagView = flagView.getContext('2d');

// vars regarding gravity for mario
const GRAVITY_MAX = 15;
const GRAVITY = 0.7;
const unit = 35;

// get genre data from main data set called 'videoGameData'
var genres = d3.map(videoGameData, function (d) {
  return d["Genre"];
}).keys();

var levelTracker = 0; // starts at 0

var clicked = 0; //flag - information about mousedown or mouseup
var clickedX = 0; //position X when mouse first goes down
var moveableX = 0; //position X of box when mouse first goes down

// add drag controls to the extended view
canvasExtendedUI.addEventListener("mousemove", function () {
  dragBox(event);
});

canvasExtendedUI.addEventListener("mouseup", function () {
  mouseUp();
});

canvasExtendedUI.addEventListener("mousedown", function () {
  mouseDown(event);
});
canvasExtendedUI.addEventListener("mouseout", function () {
  mouseUp();
});

// Animation objct
function Animation() {
  var count = 0;
  var frame = 0;
  this.time = 6;

  this.animationFrames = [];
  var loopSize = arguments.length;
  for (var i = 0; i < loopSize; i++) {
    this.animationFrames[i] = new Image();
    this.animationFrames[i].src = arguments[i];
  }

  this.getAnimationFrame = function () {
    if (this.animationFrames.length > 1) {
      if (count == this.time) {
        frame++;
        count = 0;

        if (frame == this.animationFrames.length)
          frame = 0;

      } else
        count++;
    }

    return this.animationFrames[frame];
  }
}

// The blocks mario stands on
function FloorBlock(l) {
  var temp = this;
  this.left = l;
  this.startLeft = this.left;
  this.top = canvas.height - unit;
  this.width = unit;
  this.height = unit;
  this.bgImage = new Image();
  this.bgImage.src = 'imgs/block.png';
  this.draw = function () {
    ctx.drawImage(this.bgImage, this.left, this.top);
  };
  this.update = function () {};
}

// variables and images for the flag view
var flagViewCount = 1;
var flagImage = new Image();
var flagBlock = new Image();
var flagFloorBlock = new Image();
var castle = new Image();
var flagHeights = [];
var flagWidths = [];
var getYearRange;

// draws the flag view and calcualates the percentages that each genre makes up for a year span
function drawFlag(x, y) {
  var data = aggregateBarData();
  var heights = getHeights(data[1]);
  var widths = getWidths(data[1]);

  //draws bg and flag
  ctxFlagView.fillStyle = "#5D94FB";
  ctxFlagView.fillRect(0, 0, flagView.width, flagView.height);
  ctxFlagView.drawImage(flagImage, x, y);
  flagFloorBlock.onload();
  castle.onload();

  for (var i = 0; i < data[1].length; i++) {
    if (flagWidths.length != data[1].length) {
      flagHeights.push(0);
      flagWidths.push(68);
    }
    if (flagHeights[i] > Math.round(heights[i])) {
      flagHeights[i]--;
    }
    if (flagHeights[i] < Math.round(heights[i])) {
      flagHeights[i]++;
    }

    if (flagWidths[i] > Math.round(widths[i])) {
      flagWidths[i]--;
    }
    if (flagWidths[i] < Math.round(widths[i])) {
      flagWidths[i]++;
    }
  }


  ctxFlagView.fillStyle = "black";
  ctxFlagView.fillRect(x + 67, y + 30, 10, flagImage.height - 10);
  var nextHeight = 0;
  for (var i = 0; i < data[1].length; i++)
    nextHeight += drawOnFlag(ctxFlagView, x + 67, y + 30 + nextHeight, flagWidths[(data[1].length-1)-i], flagHeights[(data[1].length-1)-i], data[1][data[1].length-1-i], determineColor(i+1));

  getYearRange = function () {
    return [data[2], data[3]];
  };

  // display the year span
  var message = data[2] + " - " + data[3];
  ctxFlagView.fillStyle = 'black';
  ctxFlagView.font = '900 24px serif';
  var textWidth = ctxFlagView.measureText(message).width;
  ctxFlagView.fillText(message, (flagView.width / 2) - textWidth / 2, 30);
  ctxFlagView.drawImage(flagBlock, x + 52, y + 400);
}

// function to draw on flag pole
function drawOnFlag(context, x, y, width, height, data, color) {
  context.fillStyle = color;
  context.strokeStyle = color;
  context.fillRect(x, y, 10, height);

  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + width, y + (height / 2));
  context.stroke();

  context.fillStyle = color;
  context.font = '900 16px serif';
  context.fillText((100 * data).toFixed(2) + "%", x + width + 20, y + (height / 2));

  context.beginPath();
  context.moveTo(x, y + height);
  context.lineTo(x + width, y + (height / 2));
  context.stroke();

  return height;

}

// returns an array of heights for each genre displayed on the flag pole
function getHeights(data) {
  var total = flagImage.height - 27;
  var heights = [];

  for (var i = 0; i < data.length; i++) {
    heights.push(data[i] * total);
  }
  return heights;
}

// returns an array of widths for each genre displayed on the flag pole
function getWidths(data) {
  var total = flagView.width - flagImage.x;
  var heights = [];

  for (var i = 0; i < data.length; i++) {
    heights.push(data[i] * total);
  }

  return heights;
}

// initializes the flag view
function initFlag(x, y) {
  flagImage.src = 'imgs/flag.png';

  flagImage.onload = function () {
    ctxFlagView.fillStyle = "#5D94FB";
    ctxFlagView.fillRect(0, 0, flagView.width, flagView.height);
    ctxFlagView.drawImage(flagImage, x, y);
  };

  flagBlock.src = 'imgs/flagBlock.png';
  flagBlock.onload = function () {
    ctxFlagView.drawImage(flagBlock, x + 52, y + 400);
  };

  flagFloorBlock.src = 'imgs/block.png';
  flagFloorBlock.onload = function () {
    for (var i = 0; i < flagView.width; i = i + 40)
      ctxFlagView.drawImage(flagFloorBlock, i, flagView.height - 40, 40, 40);
  };

  castle.src = 'imgs/castle.png';
  castle.onload = function () {
    ctxFlagView.drawImage(castle, flagView.width - castle.width / 2, 220, 240, 240);
  };

//returns a rendering method to be used in the main game loop
  return function () {
    drawFlag(x, y);
    flagViewCount = 0;
  };
}

var renderFlag = initFlag(68, 20);

// create floor blocks
var floorBlocks = []; 
{
  var temp = -(unit * 2);
  while (temp < canvas.width + (2 * unit)) {
    floorBlocks.push(new FloorBlock(temp));
    temp += unit;
  }
}

// camera for extended view
var extendedCam = {
  left: 0,
  width: 0,
  scaleX: 1,
  speed: 0

};


// camera controls for main view: panPositive, panNegative, panTo
// As mentioned in the header comment, keyboard controls method: https://www.w3schools.com/graphics/tryit.asp?filename=trygame_controllers_keys_multiple
var camera = {
  on: false,
  lastPressed: -1,
  start: function () {
    ctxBG.fillStyle = "#5D94FB";
    ctxBG.fillRect(0, 0, canvas.width, canvas.height);

    document.addEventListener('keydown', function (event) {
      camera.keys = (camera.keys || []);
      camera.keys[event.keyCode] = true;
    });

    document.addEventListener('keyup', function (event) {
      if (camera.keys[event.keyCode] === true) {
        camera.keys[event.keyCode] = false;
      }
    });
  },
  stop: function () {
    this.on = false;
  },
  panCameraPositive: function (amount) {
    var size = blocks.length;
    for (var i = 0; i < size; i++) {
      blocks[i].left -= amount;
    }
    size = floorBlocks.length;
    for (var i = 0; i < size; i++) {
      var tempI = -1;
      floorBlocks[i].left -= amount;
      if (floorBlocks[i].left < -unit * 2) {
        tempI = i;
      }

      if (tempI != -1) {
        floorBlocks[tempI].left = floorBlocks[size - 1].left + unit;
        floorBlocks.push(floorBlocks[tempI]);
        floorBlocks.splice(tempI, 1);
      }
    }
    extendedCam.left += extendedCam.speed;
    levelTracker += 5;
  },
  panCameraNegative: function (amount) {
    var size = blocks.length;
    for (var i = 0; i < size; i++) {
      blocks[i].left += amount;
    }
    size = floorBlocks.length;
    for (var i = 0; i < size; i++) {
      var tempI = -1;
      floorBlocks[i].left += amount;
      if (floorBlocks[i].left > canvas.width + unit * 2) {
        tempI = i;
      }

      if (tempI != -1) {
        floorBlocks[tempI].left = floorBlocks[0].left - (unit);
        floorBlocks.unshift(floorBlocks[tempI]);
        floorBlocks.splice(tempI + 1, 1)
      }
    }
    extendedCam.left -= extendedCam.speed;
    levelTracker -= 5;
  },
  panCameraTo: function (amount) {
    var size = blocks.length;
    for (var i = 0; i < size; i++) {
      blocks[i].left = blocks[i].startLeft - amount;
    }

    size = floorBlocks.length;
  },
  update: function () {


    if (clicked == 0) {
      if (this.keys && this.keys[37]) {
        this.lastPressed = 37;
        if (!this.on) {
          realPlayer.left -= 5;
        } else {
          this.panCameraNegative(5);
          if (realPlayer.ySpeed == 0)
            playersCurrentAnimation = realPlayer.runLeftAnimation;
          else
            playersCurrentAnimation = realPlayer.jumpLeftAnimation;
        }
      }
      if (this.keys && this.keys[39]) {
        this.lastPressed = 39;
        if (!this.on) {
          realPlayer.left += 5;
        } else {
          this.panCameraPositive(5);
          if (realPlayer.ySpeed == 0)
            playersCurrentAnimation = realPlayer.runAnimation;
          else
            playersCurrentAnimation = realPlayer.jumpAnimation;
        }
      }

      if (this.keys && !this.keys[39] && !this.keys[38] && !this.keys[37]) {
        if (realPlayer.isGrounded)
          if (this.lastPressed == 37)
            playersCurrentAnimation = realPlayer.idleLeftAnimation;
          else
            playersCurrentAnimation = realPlayer.idleAnimation;
        else
        if (this.lastPressed == 37)
          playersCurrentAnimation = realPlayer.jumpLeftAnimation;
        else
          playersCurrentAnimation = realPlayer.jumpAnimation;
      }

      if (realPlayer.isGrounded === true) {
        if (this.keys && this.keys[38]) {
          // if(ySpeed <)
          realPlayer.top -= 1;
          realPlayer.ySpeed = -GRAVITY_MAX;
          realPlayer.isGrounded = false;
          if (this.lastPressed == 37)
            playersCurrentAnimation = realPlayer.jumpLeftAnimation;
          else
            playersCurrentAnimation = realPlayer.jumpAnimation;
        }
      }

      if (this.keys && this.keys[39] && this.keys[37]) {
        if (realPlayer.isGrounded)
          if (this.lastPressed == 39)
            playersCurrentAnimation = realPlayer.idleLeftAnimation;
          else
            playersCurrentAnimation = realPlayer.idleAnimation;
      }
    }
  }
};


// System for annotations (all blocks have an attribute reserved for annotations)
function Annotation(text) {
  this.message = text;
  this.visible = false;
  this.setVisible = function (bool) {
    this.visible = bool;
  };
  this.display = function (x, y) {

    //ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.font = '16px serif';
    ctx.fillText(this.message, x, y);

  };

  this.update = function (x, y) {
    //console.log("test");
    if (this.visible) {
      this.display(x, y - 10);
    }
  };
}

//brick image
var brick = new Image();
brick.src = "imgs/brick.png";


// brick objects
function Block(l, h, y) {
  this.left = l;
  this.value = h;
  this.startLeft = this.left;
  this.top = 400;
  this.width = 35;
  if (y != undefined)
    this.year = y;
  else
    this.year = undefined;

  this.height = h;
  this.blockGroup = undefined;
  this.annotation = undefined;
  this.color = '#000000';
  this.setYear = function (y) {
    this.year = y
  };
  this.setAnnotation = function (ann) {
    this.annotation = ann;
  };
  this.draw = function (canv, canvContext, scaleX, scaleY) {

    if (canvContext == undefined || canv == undefined) {
      canv = canvas;
      canvContext = ctx;
    }

    if (scaleX == undefined)
      scaleX = 1;

    if (scaleY == undefined)
      scaleY = 1;

    if ((this.left * scaleX < canv.width + 50 && (this.left * scaleX) + (this.width * scaleX) + (this.blockGroup.block.length / 2 * unit) >= -50) && (this.top * scaleY < canv.height + 1 && (this.top * scaleY) + (this.height * scaleY) >= -1)) {

      for (var i = 0; i < this.height; i = i + (unit * scaleY)) {
        canvContext.drawImage(brick, this.left * scaleX, (canv.height - unit * 2) - i, this.width * scaleX, unit * scaleY);
      }

      canvContext.fillStyle = "#5D94FB";
      canvContext.fillRect(this.left * scaleX, (this.top * scaleY) - (unit * scaleY), this.width * scaleX, unit * scaleY);

      canvContext.fillStyle = this.color;
      canvContext.fillRect(this.left * scaleX, this.top * scaleY, this.width * scaleX, this.height * scaleY);
      if (this.year != undefined) {
        if (canvContext == ctxExtended) {
          var fsize = (12 * scaleX);
          if (fsize > 16)
            fsize = 16;
          canvContext.fillStyle = 'rgb(0, 0, 0)';
          canvContext.font = '900 ' + (fsize) + 'px Courier New';
          canvContext.textAlign = "center";
          canvContext.fillText(this.year, (this.left + (this.blockGroup.block.length / 2 * unit) - unit) * scaleX, (this.top + this.height + (unit / 2)) * scaleY);
        } else {
          canvContext.fillStyle = 'rgb(255, 255, 255)';
          canvContext.font = '900 16px Courier New';
          canvContext.textAlign = "center";
          var textSize = canvContext.measureText(this.year).width + unit;
          canvContext.fillRect((this.left + (this.blockGroup.block.length / 2 * unit) - unit) - textSize / 2, this.top + this.height + 2, textSize, 20);
          canvContext.fillStyle = 'rgb(0, 0, 0)';
          canvContext.fillText(this.year, (this.left + (this.blockGroup.block.length / 2 * unit) - unit), this.top + this.height + (unit / 2));
        }

      }
    }

    if (this.annotation != undefined) {
      this.annotation.update(this.left, this.top);
    }
  };
  this.update = function () {};
  this.collisionWithTop = function (obj) {
    if ((this.left + this.width >= obj.left) && (this.left <= (obj.left + obj.width)) && (obj.top + obj.height >= this.top) && (obj.top <= (this.top + GRAVITY_MAX))) {
      if (this.annotation != undefined) this.annotation.setVisible(true);
      return true;
    }
  };

  this.collisionWithLeft = function (obj) {
    if ((this.left + (this.width / 2) - 1 >= obj.left + obj.width) && (this.left <= obj.left + obj.width) && (obj.top + obj.height >= this.top + GRAVITY_MAX) && (obj.top <= (this.top + this.height))) {
      return true;
    }
  };

  this.collisionWithRight = function (obj) {
    if ((this.left + this.width - (1 + this.width / 2) <= obj.left) && (this.left + this.width >= obj.left) && (obj.top + obj.height >= this.top + GRAVITY_MAX) && (obj.top <= (this.top + this.height))) {
      return true;
    }
  };

  this.collisionWithBottom = function (obj) {
    if ((this.left + this.width >= obj.left) && (this.left <= (obj.left + obj.width)) && (obj.top <= this.top + this.height) && (obj.top >= (this.top + this.height - GRAVITY_MAX))) {
      return true;
    }
  }

}

// Not a game object, a container for all of the bars in a single year
function BlockGroup(year, array) {

  this.year = year;
  this.block = array.slice();
  // console.log(arguments[0]);
  this.left = this.block[0].left;
  this.right = this.block[this.block.length - 1].left + this.block[this.block.length - 1].width;

  for (var i = 0; i < array.length; i++)
    array[i].blockGroup = this;

}

// arbitrary values picked for bar charts. Just a prototype of what it could look like
const category1 = 1;
const category2 = 2;
const category3 = 3;
var blocks = [];
var blockGroups = [];
var lastLeftOff = 0;

//function that creates a block
function createBar(value, type, annotation) {
  var temp = new Block(lastLeftOff + unit, value * dataScale);
  temp.color = determineColor(type);
  temp.top = canvas.height - temp.height - unit;
  blocks.push(temp);
  lastLeftOff += unit;

  return temp;
}

//method that creates bar group
// params: year, block1, block2, block3...
// params: year, [bars]
function createBarGroup() {
  var temp = new BlockGroup(arguments[0], arguments[1]);
  var counter = 0;
  for (var i = 0; i < arguments[1].length; i++) {
    arguments[1][i].BlockGroup = temp;
  }
  counter = arguments[1].length - 1;

  blockGroups.push(temp);
  lastLeftOff += unit;
}

// function that calcualtes the percentages of each genre over the span of years
function aggregateBarData() {
  var aggregate = [];
  var percentages = [];
  var total = 0;
  var yearStart = 5000;
  var yearEnd = -1;

  for (var i = 0; i < genres.length; i++) {
    aggregate.push(0);
    percentages.push(0);
  }

  for (var i = 0; i < blockGroups.length; i++) {
    var midpoint = (blockGroups[i].block[blockGroups[i].block.length - 1].left + blockGroups[i].block[0].left + unit - 8) / 2;
    if (midpoint < canvas.width && midpoint > 0) {

      for (var j = 0; j < blockGroups[i].block.length; j++) {
        //if (blockGroups[i].block[j] == undefined)
          //console.log(i + " " + j);
        aggregate[j] += blockGroups[i].block[j].value;
      }

      if (blockGroups[i].year < yearStart)
        yearStart = blockGroups[i].year;

      if (blockGroups[i].year > yearEnd)
        yearEnd = blockGroups[i].year;


    }
  }

  for (var k = 0; k < genres.length; k++) {
    total += aggregate[k];
  }

  for (var x = 0; x < genres.length; x++) {
    percentages[x] = aggregate[x] / total;
  }

  //console.log(percentages);

  return [aggregate, percentages, yearStart, yearEnd];
}

// decides color based on the value passed in (category)
function determineColor(value) {
  var retVal;
  switch (value % 13) {
    case category1:
      retVal = "rgba(180, 74, 0, 0.80)";
      break;
    case category2:
      retVal = "rgba(173, 173, 173, 0.80)";
      break;
    case category3:
      retVal = "rgba(0, 123, 139, 0.80)";
      break;
    case 4:
      retVal = "rgba(0, 87, 199, 0.80)";
      break;
    case 5:
      retVal = "rgba(255, 255, 255, 0.80)";
      break;
    case 6:
      retVal = "rgba(223, 40, 29, 0.80)";
      break;
    case 7:
      retVal = "rgba(96, 44, 24, 0.80)";
      break;
    case 8:
      retVal = "rgba(75, 75, 75, 0.80)";
      break;
    case 9:
      retVal = "rgba(67, 176, 71, 0.80)";
      break;
    case 10:
      retVal = "rgba(251, 208, 0, 0.80)";
      break;
    case 11:
      retVal = "rgba(70, 39, 89, 0.80)";
      break;
    case 12:
      retVal = "rgba(255, 118, 0, 0.80)";
      break;
  }
  return retVal;
}

// renders bars
function drawBars(data, keys) {
  var year = data[0].year;
  var bars = [];
  for (var i = 0; i < data.length; i++) {
    var mod = i % keys.length;
    var bar = createBar(data[i].sales, (mod + 1));

    if (mod == 1)
      bar.setYear(year++);

    if (i % keys.length == keys.length - 1) {
      for (var j = 0; j < keys.length; j++)
        bars[j] = blocks[blocks.length - 1 - j];
      createBarGroup(year - 1, bars);
    }
  }
}

// object that contains important data information
function GameTotal(genre, year) {
  this.genre = genre;
  this.year = year;
  this.sales = 0.0;
}

var largest = 0;

// returns an array of genre data
function getGenreData(data, keys, yearStart, yearEnd) {

  var years = [];

  for (var i = 0; i <= yearEnd - yearStart; i++) {
    for (var j = 0; j < keys.length; j++)
      years.push(new GameTotal(keys[j], yearStart + i));
  }

  for (var i = 0; i < data.length; i++) {
    if (data[i].Year >= yearStart) {
      if (data[i].Year >= yearEnd)
        break;
      for (var j = 0; j < keys.length; j++) {
        if (data[i].Genre === keys[j])
          break;
      }

      if (((+data[i].Year - yearStart) * (keys.length)) + j > largest)
        largest = ((+data[i].Year - yearStart) * (keys.length)) + j;

      years[((+data[i].Year - yearStart) * (keys.length)) + j].sales += parseFloat(data[i].Global_Sales);
    }
  }

  return years;

}

// unfinished check box and pause menu system
var checkBoxOn = new Image();
checkBoxOn.src = "imgs/on.png";

var checkBoxOff = new Image();
checkBoxOff.src = "imgs/off.png";

function CheckBox(text, x, y, actionOn, actionOff) {
  this.x = x;
  this.y=y;
  this.text = text;
  this.on = false;
  this.draw = function(){
          ctxUI.fillStyle = 'rgb(0, 0, 0)';
          ctxUI.font = '900 18px Courier New';
          ctxUI.fillText(this.text, x+checkBoxOff.width+20,y+checkBoxOff.height/2+9);
          if(this.on)
            ctxUI.drawImage(checkBoxOn, x, y);
          else
            ctxUI.drawImage(checkBoxOff, x, y);
  };
  this.actionOn = actionOn;
  this.actionOff = actionOff;

}

// unfinished pause menu system
function pause() {
  ctxUI.fillStyle = 'rgb(255, 255, 255)';
  ctxUI.fillRect(0,0, canvasUI.width, canvasUI.height);
  var cb = [];

  for(var i = 0; i < genres.length; i++)
  {
    cb.push(new CheckBox(genres[i], 20 + (i%2)*400, 20 + ((i+1)%2)*20 + (i*checkBoxOff.height*.75), undefined, undefined));
    cb[i].draw();
  }

  canvasUI.addEventListener("onclick", function()
  {
    for(var i = 0; i < genres.length; i++)
    {
      if(event.pageX > cb[i].x && event.pageX < cb[i].x + checkBoxOff.width && event.pageY > cb[i].y && event.pageY < cb[i].y + checkBoxOff.height)
      {
        alert(cb[i].text);
      }
    }
  });

}

// creates the legend 
function generateKey()
{
  ctxUI.fillStyle = 'rgb(255, 255, 255)';
  ctxUI.fillRect(canvasUI.width-10, 10, -150, 300);

  for(var i = 0; i<genres.length; i++)
  {
    ctxUI.fillStyle = determineColor(i+1);
    ctxUI.strokeStyle = "black";
    ctxUI.fillRect(canvasUI.width-150,  12+(i*25), 40, 20);
    ctxUI.rect(canvasUI.width-150,  12+(i*25), 40, 20);
    ctxUI.stroke();
    ctxUI.font = '900 12px Courier New';
    if(i == 4)
      ctxUI.fillStyle = "black";
    ctxUI.fillText(genres[i], canvasUI.width-100, 26 + (i*25));
  }
}


var TEST = getGenreData(videoGameData, genres, 1985, 2017);
dataScale = getScale(canvas, TEST);

// function used for testing
// function createRandomData(value) {
//   var temp = [];

//   for (var i = 0; i < value; i++) {
//     temp.push(Math.floor(Math.random() * (6)) + 1);
//   }

//   return temp;
// }

var dSet = TEST; //createRandomData(144);
drawBars(dSet, genres);

//reverse the order of bars so annotations don't get drawn over
blocks = blocks.reverse();

// mario!
var realPlayer = {
  left: 250,
  top: 0,
  isGrounded: false,
  width: 35,
  height: 35,
  xSpeed: 0,
  ySpeed: 0,
  idleAnimation: new Animation("mario/idle.png"),
  idleLeftAnimation: new Animation("mario/idle_l.png"),
  runAnimation: new Animation("mario/run1.png", "mario/run2.png", "mario/run3.png", "mario/run2.png"),
  runLeftAnimation: new Animation("mario/run1_l.png", "mario/run2_l.png", "mario/run3_l.png", "mario/run2_l.png"),
  jumpAnimation: new Animation("mario/jump.png"),
  jumpLeftAnimation: new Animation("mario/jump_l.png"),
  color: '#CC4B09',
  draw: function () {
    ctx.drawImage(playersCurrentAnimation.getAnimationFrame(), this.left, this.top);
  },
  update: function () {

    this.top += this.ySpeed;
    this.left += this.xSpeed;

    if (this.isGrounded === false) {
      if (this.ySpeed < GRAVITY_MAX) {
        this.ySpeed = this.ySpeed + GRAVITY;
      }
    } else {
      this.ySpeed = 0;
    }

    var test = false;
    var collList = blocksCollisionDetectList(this, blocks);
    if (collList.length != 0) {
      for (var i = 0; i < collList.length; i++) {

        test = collList[i];

        if (test.collisionWithLeft(this)) {
          camera.panCameraNegative(5);
          this.left = test.left - (this.width + 1);
        } else if (test.collisionWithRight(this)) {
          camera.panCameraPositive(5);
          this.left = test.left + test.width + 1;
        } else if (test.collisionWithBottom(this)) {
          if (test.top + test.height + this.height < canvas.height) {
            this.top = test.top + test.height + 1 - this.ySpeed;
            this.ySpeed = 1;
          }

        }
        if (test.collisionWithTop(this) && this.ySpeed >= 0) {
          if (!this.isGrounded) {
            this.isGrounded = true;
            this.ySpeed = 0;
            this.top = test.top - this.height;
          }
        }
      }
    }
    if (test === false) {
      if ((this.top + this.height) >= canvas.height - unit) {
        if (!this.isGrounded) {
          this.isGrounded = true;
          this.ySpeed = 0;
          this.top = canvas.height - unit - this.height;
        }
      } else
      if (this.isGrounded) {
        this.isGrounded = false;
      }
    }

    if (clicked == 1)
      this.top = -unit;
  }

};
// shared mem for changing marios animation
var playersCurrentAnimation = realPlayer.idleAnimation;

// various tested collision detection methods
function collisionDetect(obj1, obj2) {
  if ((obj1.left + obj1.width >= obj2.left) && (obj1.left <= (obj2.left + obj2.width)) && (obj1.top + obj1.height >= obj2.top) && (obj1.top <= (obj2.top + obj2.height))) {
    return true;
  }

  return false;
}

function blocksCollisionDetectList(obj, array) {

  var retArray = [];
  var retCount = 0;

  for (var i = 0; i < array.length; i++) {
    if (collisionDetect(obj, array[i])) {
      retArray[retCount++] = array[i];
    }
  }
  return retArray;
}

function collisionDetectList(obj, array) {
  for (var i = 0; i < array.length; i++) {
    if (collisionDetect(obj, array[i])) {
      return true;
    }
  }
  return false;
}

//get max data in value

function getMax(data, category) {
  var max = -1;
  for (var i = 0; i < data.length; i++) {
    if (data[i][category] > max)
      max = data[i][category];
  }
  return max;
}

// get min value in data
function getMin(data, category) {
  var min = Infinity;
  for (var i = 0; i < data.length; i++) {
    if (data[i][category] < min)
      min = data[i][category];
  }
  return min;
}

//get data scalue
function getScale(canv, data) {
  var max = getMax(data, "sales");

  return findLength(1, canv.height * 0.75) / max;

}

//find the length of the axis
function findLength(scale, height) {
  var length = 0;

  while (length < height) {
    length += scale * unit;
  }

  return length;
}

//draws axis
function drawAxis(canv, context, yScale, offset) {

  if (offset == undefined)
    offset = 5;

  var length = findLength(yScale, canv.height * 0.75);
  var startingY = canv.height - (unit * yScale);
  var height = startingY - length;

  if (canv == canvasExtendedUI)
    context.strokeStyle = "black";
  else
    context.strokeStyle = "white";
  context.beginPath();
  context.moveTo(offset, startingY);
  context.lineTo(offset, height); //change this for max!!!!
  context.stroke();

  var axisLineWidth = startingY;
  for (var i = 0; i <= length; i += (unit * yScale)) {
    context.beginPath();
    context.moveTo(offset, axisLineWidth - i);
    context.lineTo(offset + (20 * yScale), axisLineWidth - i); //change this for max!!!!
    context.stroke();

    if(canv == canvasUI)
    {
    context.fillStyle = 'black';
    context.font = '14px serif';
    var increment = ((getMax(TEST,"sales"))/11)*(i/(unit * yScale));
    context.fillText(increment.toFixed(2), offset + (20 * yScale)-5, axisLineWidth - i-5);
    context.fillText("Units sold (millions)",5,35);
    }
  }
}

//update function for main game loop
function update() {
  // could this be the fix to the performace related bug?
  if (camera.on == false)
    camera.start();

  if (realPlayer.left >= 50 && !camera.on) {
    camera.on = true;
  }
  camera.update();
  realPlayer.update();
  blocks.forEach(function (a) {
    a.update();
  });
}

//render function for main game loop
function render() {
  redraw();
  var size = floorBlocks.length;
  for (var i = 0; i < size; i++) {
    floorBlocks[i].draw();
  }
  blocks.forEach(function (a) {
    a.draw();
  });
  realPlayer.draw();
  renderFlag();
  drawAxis(canvasUI, ctxUI, 1);
}

function redraw(canv, canvContext) {
  if (canvContext == undefined) {
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  } else {
    canvContext.fillStyle = 'rgba(255, 255, 255, 1)';
    canvContext.clearRect(0, 0, canv.width, canv.height);
    return;
  }

}

const extendedScaleX = canvasExtended.width / lastLeftOff;

function initExtended(scaleX, scaleY) {
  ctxExtended.fillStyle = "#5D94FB";
  ctxExtended.fillRect(0, 0, canvasExtended.width, canvasExtended.height);

  extendedCam.speed = (5 * extendedScaleX);
  extendedCam.width = (canvas.width * extendedScaleX);

  blocks.forEach(function (a) {
    a.draw(canvasExtended, ctxExtended, scaleX, scaleY);
  });
}


function drawExtended(yScale) {
  redraw(canvasExtendedUI, ctxExtendedUI);
  ctxExtendedUI.fillStyle = "rgba(255, 255, 255, .5)";
  ctxExtendedUI.fillRect(extendedCam.left, 0, extendedCam.width, canvasExtendedUI.height);
  if (clicked == 1) {
    var data = getYearRange();
    var message = data[0] + " - " + data[1];
    ctxExtendedUI.fillStyle = 'black';
    ctxExtendedUI.font = '900 24px serif';
    var textWidth = ctxExtendedUI.measureText(message).width;
    ctxExtendedUI.fillText(message, extendedCam.left + (extendedCam.width / 2) - textWidth / 2, 30);
  }
  drawAxis(canvasExtendedUI, ctxExtendedUI, yScale, extendedCam.left + (5 * yScale));
}



var countHalf = true;
initExtended((extendedScaleX), 0.5);

//on mouse down change 'clicked' flag to one and store information about click position
function mouseDown(event) {
  clickedX = event.pageX;
  moveableX = extendedCam.left;
  if (clickedX >= extendedCam.left && clickedX <= (extendedCam.left + extendedCam.width))
    clicked = 1;
}

//reset all vars
function mouseUp() {
  clicked = 0;
  clickedX = 0;
  moveableX = 0;
}

function dragBox(event) {
  if (clicked == 1) {
    //coords
    var cX = event.pageX;

    //finds the difference of user click pos and start pos
    var differenceX = Math.abs(clickedX - moveableX);

    //if mouse is down, move box to cursor

    extendedCam.left = (cX - differenceX);
    camera.panCameraTo(extendedCam.left / extendedScaleX);
    if (realPlayer.ySpeed != 0)
      realPlayer.ySpeed = 0;
  }

}


generateKey();


// As mention in the header comment: https://developer.mozilla.org/en-US/docs/Games/Anatomy
var MyGame = {
  stopMain: ''
};

var fps = 80;   // frame rate cap
var currentTime;  // current time
var lastTime = Date.now();  
var interval = 1000 / fps;
var delta;

// main game loop
;(function () {
  function main() {
    MyGame.stopMain = window.requestAnimationFrame(main);
    currentTime = Date.now();
    delta = currentTime - lastTime;
    update();


    if (delta > interval) {
      render();
      if (countHalf)
        drawExtended(.5);
      lastTime = currentTime - (delta % interval);
      countHalf = !countHalf;
    }

  }
  main();
})();