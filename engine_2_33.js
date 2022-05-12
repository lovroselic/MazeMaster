"use strict";
//////////////////engine.js/////////////////////////
//                                                //
//       ENGINE version 2.33  by LS               //
//                                                //
////////////////////////////////////////////////////
/*  

Assumptions on external Classes:
  GAME:
    GAME.level point to level
  MAP:
    points to MAP object
  HERO: 
    point to protagonist

TODO:
    
*/
////////////////////////////////////////////////////

//vector definitions
var UP = new Vector(0, -1);
var DOWN = new Vector(0, 1);
var LEFT = new Vector(-1, 0);
var RIGHT = new Vector(1, 0);
var UpRight = new Vector(1, -1);
var UpLeft = new Vector(-1, -1);
var DownRight = new Vector(1, 1);
var DownLeft = new Vector(-1, 1);
//
var ENGINE = {
  VERSION: "2.33.dev",
  CSS: "color: #0FA",
  INI: {
    ANIMATION_INTERVAL: 17,
    SPRITESHEET_HEIGHT: 48,
    SPRITESHEET_DEFAULT_WIDTH: 48,
    SPRITESHEET_DEFAULT_HEIGHT: 48,
    sprite_maxW: 300,
    sprite_maxH: 100,
    GRIDPIX: 48,
    FADE_FRAMES: 50,
    COLLISION_SAFE: 48,
    //PATH_ROUNDS: 999,
    PATH_ROUNDS: 1999,
    MAX_PATH: 999,
    MOUSE_IDLE: 3000
  },
  readyCall: null,
  start: null,
  SOURCE: "https://www.c00lsch00l.eu/Games/AA/",
  WASM_SOURCE: "https://www.c00lsch00l.eu/WASM/",
  AUDIO_SOURCE: "https://www.c00lsch00l.eu/Mp3/",
  FONT_SOURCE: "https://www.c00lsch00l.eu/Fonts/",
  checkIntersection: false, //use linear intersection collision method after pixelperfect collision; set to false to exclude
  checkProximity: true, //check proximity before pixel perfect evaluation of collision to background
  pixelPerfectCollision: false, //false by default
  LOAD_W: 160,
  LOAD_H: 22,
  autostart: false,
  gameWindowId: "#game",
  gameWIDTH: 960,
  gameHEIGHT: 768,
  sideWIDTH: 960,
  sideHEIGHT: 768,
  titleHEIGHT: 120,
  titleWIDTH: 960,
  bottomHEIGHT: 40,
  bottomWIDTH: 960,
  mapWIDTH: 512,
  statusWIDTH: 312,
  currentTOP: 0,
  currentLEFT: 0,
  directions: [LEFT, UP, RIGHT, DOWN],
  corners: [UpLeft, UpRight, DownLeft, DownRight],
  circle: [UP, UpRight, RIGHT, DownRight, DOWN, DownLeft, LEFT, UpLeft],
  dirCircle: [UP, RIGHT, DOWN, LEFT],
  layersToClear: new Set(),
  disableKey: function(key) {
    $(document).keydown(function(event) {
      if (event.which === ENGINE.KEY.map[key]) {
        event.preventDefault();
      }
    });
    $(document).keyup(function(event) {
      if (event.which === ENGINE.KEY.map[key]) {
        event.preventDefault();
      }
    });
    $(document).keypress(function(event) {
      if (event.which === ENGINE.KEY.map[key]) {
        event.preventDefault();
      }
    });
  },
  hideMouse: function() {
    $("#game").css("cursor", "none");
    $("#game").on("mousemove", ENGINE.waitThenHideMouse);
  },
  waitThenHideMouse: function() {
    $("#game").css("cursor", "default");
    $("#game").off("mousemove", ENGINE.waitThenHideMouse);
    setTimeout(ENGINE.hideMouse, ENGINE.INI.MOUSE_IDLE);
  },
  showMouse: function() {
    $("#game").off("mousemove", ENGINE.waitThenHideMouse);
    $("#game").css("cursor", "default");
  },
  disableArrows: function() {
    ENGINE.disableKey("up");
    ENGINE.disableKey("down");
  },
  init: function() {
    console.log(`%cInitializing ENGINE V${String(ENGINE.VERSION)}`, ENGINE.CSS);

    $("#temp").append(
      "<canvas id ='temp_canvas' width='" +
        ENGINE.INI.sprite_maxW +
        "' height='" +
        ENGINE.INI.sprite_maxH +
        "'></canvas>"
    );
    $("#temp2").append(
      "<canvas id ='temp_canvas2' width='" +
        ENGINE.INI.sprite_maxW +
        "' height='" +
        ENGINE.INI.sprite_maxH +
        "'></canvas>"
    );
    LAYER.temp = $("#temp_canvas")[0].getContext("2d");
    LAYER.temp2 = $("#temp_canvas2")[0].getContext("2d");
    VIEW.init();
  },
  fill: function(ctx, pattern) {
    let CTX = ctx;
    let pat = CTX.createPattern(pattern, "repeat");
    CTX.fillStyle = pat;
    CTX.fillRect(0, 0, CTX.canvas.width, CTX.canvas.height);
  },
  clearLayer: function(layer) {
    let CTX = LAYER[layer];
    CTX.clearRect(0, 0, CTX.canvas.width, CTX.canvas.height);
  },
  clearLayerStack: function() {
    let CLR = ENGINE.layersToClear.length;
    if (CLR === 0) return;
    ENGINE.layersToClear.forEach(ENGINE.clearLayer);
    ENGINE.layersToClear.clear();
  },
  fillLayer: function(layer, colour) {
    let CTX = LAYER[layer];
    CTX.fillStyle = colour;
    CTX.fillRect(0, 0, CTX.canvas.width, CTX.canvas.height);
  },
  resizeBOX: function(id, width, height) {
    width = width || ENGINE.gameWIDTH;
    height = height || ENGINE.gameHEIGHT;
    let box = $("#" + id).children();
    for (let a = 0; a < box.length; a++) {
      box[a].width = width;
      box[a].height = height;
    }
  },
  addBOX: function(id, width, height, alias, type) {
    //types null, side, fside
    if (id === null) return;
    if (width === null) return;
    if (height === null) return;
    let layers = alias.length;
    $(ENGINE.gameWindowId).append(
      `<div id ='${id}' style='position: relative'></div>`
    );
    if (type === "side" || type === "fside") {
      $(`#${id}`).addClass("gw"); //adds gw class: side by side windows
    } else {
      $(`#${id}`).addClass("gh"); //adds gh class: windows below
    }
    let prop;
    let canvasElement;
    for (let x = 0; x < layers; x++) {
      canvasElement = `<canvas class='layer' id='${id}_canvas_${x}' width='${width}' height='${height}' style='z-index:${x}; top:${ENGINE.currentTOP}px; left:${ENGINE.currentLEFT}px'></canvas>`;

      $(`#${id}`).append(canvasElement);
      prop = alias.shift();
      LAYER[prop] = $(`#${id}_canvas_${x}`)[0].getContext("2d");
    }
    if (type === "side") {
      ENGINE.currentLEFT += width;
    } else if (type === "fside") {
      ENGINE.currentTOP += height;
      ENGINE.currentLEFT = 0;
    } else {
      ENGINE.currentTOP += height;
      ENGINE.currentLEFT = 0;
    }
  },
  addCanvas: function(id, w, h) {
    //adds canvas to div
    let canvas = `<canvas id="c_${id}" width="${w}" height="${h}"></canvas>`;
    $(`#${id}`).append(canvas);
    LAYER[id] = $(`#c_${id}`)[0].getContext("2d");
  },
  copyLayer: function(copyFrom, copyTo, orX, orY, orW, orH) {
    let CTX = LAYER[copyTo];
    CTX.drawImage(LAYER[copyFrom].canvas, orX, orY, orW, orH, 0, 0, orW, orH);
  },
  flattenLayers: function(src, dest) {
    let W = LAYER[dest].canvas.width;
    let H = LAYER[dest].canvas.height;
    ENGINE.copyLayer(src, dest, 0, 0, W, H, 0, 0, W, H);
  },
  spriteDraw: function(layer, X, Y, image) {
    let CX = Math.floor(X - image.width / 2);
    let CY = Math.floor(Y - image.height / 2);
    let CTX = LAYER[layer];
    CTX.drawImage(image, CX, CY);
  },
  drawToGrid: function(layer, grid, image) {
    let p = GRID.gridToCoord(grid);
    ENGINE.draw(layer, p.x, p.y, image);
  },
  spriteToGrid: function(layer, grid, image) {
    let p = GRID.gridToCenterPX(grid);
    ENGINE.spriteDraw(layer, p.x, p.y, image);
  },
  draw: function(layer, X, Y, image) {
    let CTX = LAYER[layer];
    CTX.drawImage(image, X, Y);
  },
  drawPart: function(layer, X, Y, image, line) {
    let CTX = LAYER[layer];
    CTX.drawImage(
      image,
      0,
      line,
      image.width,
      image.height - line,
      X,
      Y,
      image.width,
      image.height - line
    );
  },
  drawPool: function(layer, pool, sprite) {
    let CTX = LAYER[layer];
    let PL = pool.length;
    if (PL === 0) return;
    for (let i = 0; i < PL; i++) {
      ENGINE.spriteDraw(layer, pool[i].x, pool[i].y, sprite);
    }
  },
  trimCanvas: function(data) {
    var top = 0,
      bottom = data.height,
      left = 0,
      right = data.width;
    var width = data.width;
    while (top < bottom && rowBlank(data, width, top)) ++top;
    while (bottom - 1 > top && rowBlank(data, width, bottom - 1)) --bottom;
    while (left < right && columnBlank(data, width, left, top, bottom)) ++left;
    while (right - 1 > left && columnBlank(data, width, right - 1, top, bottom))
      --right;

    return { left: left, top: top, right: right, bottom: bottom };

    function rowBlank(data, width, y) {
      for (let x = 0; x < width; ++x) {
        if (data.data[y * width * 4 + x * 4 + 3] !== 0) return false;
      }
      return true;
    }

    function columnBlank(data, width, x, top, bottom) {
      for (let y = top; y < bottom; ++y) {
        if (data.data[y * width * 4 + x * 4 + 3] !== 0) return false;
      }
      return true;
    }
  },
  rotateImage: function(image, degree, newName) {
    let CTX = LAYER.temp;
    let CW = image.width;
    let CH = image.height;
    let max = Math.max(CW, CH);
    let min = Math.max(CW, CH);
    CTX.canvas.width = max * 2;
    CTX.canvas.height = max * 2;
    CTX.save();
    CTX.translate(max, max);
    CTX.rotate((degree * Math.PI) / 180);
    CTX.drawImage(image, -min / 2, -min / 2);
    CTX.restore();
    let imgDATA = CTX.getImageData(0, 0, CTX.canvas.width, CTX.canvas.height);
    let TRIM = ENGINE.trimCanvas(imgDATA);
    let trimmed = CTX.getImageData(
      TRIM.left,
      TRIM.top,
      TRIM.right - TRIM.left,
      TRIM.bottom - TRIM.top
    );
    CTX.canvas.width = TRIM.right - TRIM.left;
    CTX.canvas.height = TRIM.bottom - TRIM.top;
    CTX.putImageData(trimmed, 0, 0);
    SPRITE[newName] = new Image();
    SPRITE[newName].onload = ENGINE.creationSpriteCount;
    SPRITE[newName].crossOrigin = "Anonymous";
    SPRITE[newName].src = CTX.canvas.toDataURL("image/png");
    SPRITE[newName].width = CTX.canvas.width;
    SPRITE[newName].height = CTX.canvas.height;
  },
  setCollisionsafe: function(safe) {
    if (safe !== undefined) {
      ENGINE.INI.COLLISION_SAFE = safe;
    } else {
      for (let sprite in SPRITE) {
        if (SPRITE[sprite].width > ENGINE.INI.COLLISION_SAFE) {
          ENGINE.INI.COLLISION_SAFE = SPRITE[sprite].width;
        }
        if (SPRITE[sprite].height > ENGINE.INI.COLLISION_SAFE) {
          ENGINE.INI.COLLISION_SAFE = SPRITE[sprite].height;
        }
      }
      ENGINE.INI.COLLISION_SAFE++;
    }
    console.log(
      `%cENGINE.INI.COLLISION_SAFE set to: ${ENGINE.INI.COLLISION_SAFE}`,
      ENGINE.CSS
    );
  },
  ready: function() {
    ENGINE.setCollisionsafe();
    console.log("%cENGINE ready!", ENGINE.CSS);
    $("#buttons").prepend("<input type='button' id='startGame' value='START'>");
    $("#load").addClass("hidden");
    $("#startGame").on("click", PRG.start);
    ENGINE.readyCall.call();
    if (ENGINE.autostart) {
      if (ENGINE.start !== null) ENGINE.start();
    }
  },
  intersectionCollision: function(actor1, actor2) {
    if (actor1.class !== "bullet" && actor2.class !== "bullet") return;
    if (actor1.prevX === null || actor2.prevX === null) return;

    let AL = arguments.length;
    let line1 = {};
    let line2 = {};
    for (let q = 0; q < AL; q++) {
      switch (arguments[q].class) {
        case "bullet":
          // for 5px*5px bullet
          line1.x1 = arguments[q].prevX;
          line1.y1 = arguments[q].prevY + 3;
          line1.x2 = arguments[q].x;
          line1.y2 = arguments[q].y - 3;
          break;
        default:
          //linear representation of object, angle not considered
          line2.x1 = parseInt(
            (arguments[q].prevX + arguments[q].x) / 2 + arguments[q].width / 2,
            10
          );
          line2.y1 = parseInt((arguments[q].prevY + arguments[q].y) / 2, 10);
          line2.x2 = parseInt(
            (arguments[q].prevX + arguments[q].x) / 2 - arguments[q].width / 2,
            10
          );
          line2.y2 = line2.y1;
          break;
      }
    }
    return ENGINE.lineIntersects(
      line1.x1,
      line1.y1,
      line1.x2,
      line1.y2,
      line2.x1,
      line2.y1,
      line2.x2,
      line2.y2
    );
  },
  lineIntersects: function(a, b, c, d, p, q, r, s) {
    //https://stackoverflow.com/a/24392281/4154250
    var det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) {
      return false;
    } else {
      lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
      gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
      return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1;
    }
  },
  pixPerfectCollision: function(actor1, actor2) {
    var w1 = parseInt(actor1.width / 2, 10);
    var w2 = parseInt(actor2.width / 2, 10);
    var h1 = parseInt(actor1.height / 2, 10);
    var h2 = parseInt(actor2.height / 2, 10);
    var act1 = new Vector(actor1.x, actor1.y);
    var act2 = new Vector(actor2.x, actor2.y);
    var SQ1 = new Square(act1.x - w1, act1.y - h1, w1 * 2, h1 * 2);
    var SQ2 = new Square(act2.x - w2, act2.y - h2, w2 * 2, h2 * 2);
    var x = parseInt(Math.max(SQ1.x, SQ2.x), 10) - 1;
    var y = parseInt(Math.max(SQ1.y, SQ2.y), 10) - 1;
    var w = parseInt(Math.min(SQ1.x + SQ1.w - x, SQ2.x + SQ2.w - x), 10) + 1;
    var h = parseInt(Math.min(SQ1.y + SQ1.h - y, SQ2.y + SQ2.h - y), 10) + 1;
    if (w === 0 || h === 0) return false;
    var area = new Square(x, y, w, h);
    var area1 = new Square(area.x - SQ1.x, area.y - SQ1.y, area.w, area.h);
    var area2 = new Square(area.x - SQ2.x, area.y - SQ2.y, area.w, area.h);
    var CTX1 = LAYER.temp;
    var CTX2 = LAYER.temp2;
    CTX1.canvas.width = ENGINE.INI.sprite_maxW;
    CTX1.canvas.height = ENGINE.INI.sprite_maxH;
    CTX2.canvas.width = ENGINE.INI.sprite_maxW;
    CTX2.canvas.height = ENGINE.INI.sprite_maxH;
    ENGINE.draw("temp", 0, 0, SPRITE[actor1.name]);
    ENGINE.draw("temp2", 0, 0, SPRITE[actor2.name]);
    var data1 = CTX1.getImageData(area1.x, area1.y, area1.w, area1.h);
    var data2 = CTX2.getImageData(area2.x, area2.y, area2.w, area2.h);
    var DL = data1.data.length;
    var index;
    for (index = 3; index < DL; index += 4) {
      if (data1.data[index] > 0 && data2.data[index] > 0) {
        return true;
      }
    }
    //intersectionCollision check
    if (ENGINE.checkIntersection) {
      return ENGINE.intersectionCollision(actor1, actor2);
    } else return false;
  },
  collision: function(actor1, actor2) {
    var X = Math.abs(actor1.x - actor2.x);
    var Y = Math.abs(actor1.y - actor2.y);
    if (Y >= ENGINE.INI.COLLISION_SAFE) return false;
    if (X >= ENGINE.INI.COLLISION_SAFE) return false;
    var w1 = parseInt(actor1.width / 2, 10);
    var w2 = parseInt(actor2.width / 2, 10);
    var h1 = parseInt(actor1.height / 2, 10);
    var h2 = parseInt(actor2.height / 2, 10);

    if (X >= w1 + w2 || Y >= h1 + h2) return false;
    if (ENGINE.pixelPerfectCollision) {
      return ENGINE.pixPerfectCollision(actor1, actor2);
    } else return true;
  },
  collisionToBackground: function(actor, layer) {
    var CTX = layer;
    var maxSq = Math.max(actor.width, actor.height);
    var R = Math.ceil(0.5 * Math.sqrt(2 * Math.pow(maxSq, 2)));
    var X = actor.x;
    var Y = actor.y;
    var proximity = false;
    if (ENGINE.checkProximity) {
      var imgDATA = CTX.getImageData(X - R, Y - R, 2 * R, 2 * R);
      var check = 1;
      var left, right, down, top;
      while (check < R) {
        left = imgDATA.data[toIndex(X - check, Y)];
        right = imgDATA.data[toIndex(X + check, Y)];
        down = imgDATA.data[toIndex(X, Y + check)];
        top = imgDATA.data[toIndex(X, Y - check)];
        if (left || right || down || top) {
          proximity = true;
          break;
        }
        check++;
      }
    } else proximity = true;
    if (!proximity) {
      return false;
    } else {
      var CX = Math.floor(X - actor.width / 2);
      var CY = Math.floor(Y - actor.height / 2);
      var CTX1 = LAYER.temp;
      CTX1.canvas.width = actor.width;
      CTX1.canvas.height = actor.height;
      ENGINE.draw("temp", 0, 0, SPRITE[actor.name]);
      var data1 = CTX1.getImageData(0, 0, actor.width, actor.height); //actor data
      var data2 = CTX.getImageData(CX, CY, actor.width, actor.height); //layer data
      var DL = data1.data.length;
      var index;
      for (index = 3; index < DL; index += 4) {
        if (data1.data[index] > 0 && data2.data[index] > 0) {
          return true;
        }
      }
      return false;
    }

    function toIndex(x, y) {
      var index = (y - Y) * 4 * (2 * R) + (x - (X - R)) * 4 + 3;
      return index;
    }
  },
  drawLoadingGraph: function(counter) {
    var count = ENGINE.LOAD[counter];
    var HMI = ENGINE.LOAD["HM" + counter];
    var text = counter;
    var percent = Math.floor((count / HMI) * 100);
    var CTX = LAYER.PRELOAD[counter];
    CTX.clearRect(0, 0, ENGINE.LOAD_W, ENGINE.LOAD_H);
    CTX.beginPath();
    CTX.lineWidth = "1";
    CTX.strokeStyle = "black";
    CTX.rect(0, 0, ENGINE.LOAD_W, ENGINE.LOAD_H);
    CTX.closePath();
    CTX.stroke();
    CTX.fillStyle = "#999";
    CTX.fillRect(
      1,
      1,
      Math.floor((ENGINE.LOAD_W - 2) * (percent / 100)),
      ENGINE.LOAD_H - 2
    );
    CTX.fillStyle = "black";
    CTX.font = "10px Verdana";
    CTX.fillText(
      text + ": " + percent + "%",
      ENGINE.LOAD_W * 0.1,
      ENGINE.LOAD_H * 0.62
    );
    return;
  },
  statusBar: function(CTX, x, y, w, h, value, max, color) {
    CTX.save();
    ENGINE.resetShadow(CTX);
    let fs = h / 2;
    CTX.font = `${fs}px Verdana`;
    CTX.strokeStyle = color;
    CTX.fillStyle = color;
    CTX.beginPath();
    CTX.lineWidth = "1";
    CTX.rect(x, y, w, h);
    CTX.closePath();
    CTX.stroke();
    let fraction = value / max;
    CTX.fillRect(x, y, Math.round(fraction * w), h);
    CTX.fillStyle = "#FFF";
    CTX.textAlign = "center";
    let tx = x + w / 2 + fs / 2;
    let ty = y + h / 2 + fs / 2;
    CTX.fillText(`${value}/${max}`, tx, ty);
    CTX.restore();
  },
  resetShadow: function(CTX) {
    CTX.shadowColor = "#000";
    CTX.shadowOffsetX = 0;
    CTX.shadowOffsetY = 0;
    CTX.shadowBlur = 0;
  },
  spriteDump: function(layer, spriteList) {
    console.log("%c********* SPRITE DUMP *********", ENGINE.CSS);
    console.log(SPRITE);
    var x = 0;
    var y = 0;
    var dy = 0;

    if (spriteList === undefined) {
      var keys = Object.keys(SPRITE);
      spriteList = keys.map(x => SPRITE[x]);
    }

    spriteList.forEach(function(q) {
      ENGINE.draw(layer, x, y, q);
      x += q.width;
      if (q.height > dy) dy = q.height;
      if (x > LAYER[layer].canvas.width - 64) {
        y += dy;
        x = 0;
      }
    });
  },
  window: function(
    width = ENGINE.gameWIDTH / 2,
    height = ENGINE.gameHEIGHT / 2,
    CTX = LAYER.text,
    x = Math.floor((ENGINE.gameWIDTH - width) / 2),
    y = Math.floor((ENGINE.gameHEIGHT - height) / 2)
  ) {
    CTX.save();
    CTX.fillStyle = "#000";
    CTX.shadowColor = "#000";
    CTX.shadowOffsetX = 0;
    CTX.shadowOffsetY = 0;
    CTX.shadowBlur = 0;
    CTX.globalAlpha = 0.8;
    CTX.roundRect(
      x,
      y,
      width,
      height,
      {
        upperLeft: 15,
        upperRight: 15,
        lowerLeft: 15,
        lowerRight: 15
      },
      true,
      true
    );
    CTX.restore();
    return new Point(x, y);
  },
  mouseOverOK: function(event, cname) {
    var canvasOffset = $(cname).offset();
    var offsetX = canvasOffset.left;
    var offsetY = canvasOffset.top;
    var mouseX = parseInt(event.pageX - offsetX - ENGINE.alertButton.okX, 10);
    var mouseY = parseInt(event.pageY - offsetY - ENGINE.alertButton.okY, 10);
    if (
      mouseX >= 0 &&
      mouseX < ENGINE.alertButton.width &&
      mouseY >= 0 &&
      mouseY < ENGINE.alertButton.heigth
    ) {
      $(cname).css("cursor", "pointer");
    } else {
      $(cname).css("cursor", "auto");
    }
  },
  mouseOver: function(event, cname) {
    $(cname).css("cursor", "pointer");
  },
  mouseClick: function(event, cname, func) {
    var canvasOffset = $(cname).offset();
    var offsetX = canvasOffset.left;
    var offsetY = canvasOffset.top;
    var mouseX = parseInt(event.pageX - offsetX, 10);
    var mouseY = parseInt(event.pageY - offsetY, 10);
    ENGINE.mouseX = mouseX;
    ENGINE.mouseY = mouseY;
    func.call();
    return;
  },
  mouseClickOK: function(event, cname) {
    var canvasOffset = $(cname).offset();
    var offsetX = canvasOffset.left;
    var offsetY = canvasOffset.top;
    var mouseX = parseInt(event.pageX - offsetX - ENGINE.alertButton.okX, 10);
    var mouseY = parseInt(event.pageY - offsetY - ENGINE.alertButton.okY, 10);
    if (
      mouseX >= 0 &&
      mouseX < ENGINE.alertButton.width &&
      mouseY >= 0 &&
      mouseY < ENGINE.alertButton.heigth
    ) {
      $(cname).css("cursor", "auto");
      $(cname).off();
      ENGINE.alertMode = false;
      ENGINE.clearLayer("alert");
      $(document).keydown(ENGINE.GAME.checkKey);
      $(document).keyup(ENGINE.GAME.clearKey);
      GAME.continue(); //not DECOUPLED!!
    }
  },
  getCanvasNumber: function(id) {
    var cnv = $("#" + id + " .layer");
    return cnv.length;
  },
  getCanvasName: function(id) {
    var CL = ENGINE.getCanvasNumber("ROOM");
    var cname = "#ROOM_canvas_" + --CL;
    return cname;
  },
  cutGrid: function(layer, point) {
    var CTX = layer;
    CTX.clearRect(point.x, point.y, ENGINE.INI.GRIDPIX, ENGINE.INI.GRIDPIX);
    return;
  },
  cutManyGrids: function(layer, point, N) {
    var CTX = layer;
    CTX.clearRect(
      point.x,
      point.y,
      N * ENGINE.INI.GRIDPIX,
      N * ENGINE.INI.GRIDPIX
    );
    return;
  },
  spreadAroundCenter: function(toDo, x, delta) {
    var xS = [];
    var odd = toDo % 2;
    var n = 2;
    if (odd) {
      xS.push(x);
      toDo--;
      while (toDo > 0) {
        xS.push(x + (n - 1) * delta);
        xS.push(x - (n - 1) * delta);
        toDo -= 2;
        n++;
      }
    } else {
      while (toDo > 0) {
        xS.push(x + ((n - 1) * delta) / 2);
        xS.push(x - ((n - 1) * delta) / 2);
        toDo -= 2;
        n += 2;
      }
    }
    xS.sort((a, b) => a - b);
    return xS;
  },
  grayScaleImg(img, name) {
    const MIN = 0x44;
    const MAX = 0xdd;
    var NTX = LAYER.temp2;
    NTX.canvas.width = img.width;
    NTX.canvas.height = img.height;
    NTX.clearRect(0, 0, NTX.canvas.width, NTX.canvas.height);
    NTX.drawImage(img, 0, 0);
    let imgData = NTX.getImageData(0, 0, NTX.canvas.width, NTX.canvas.height);
    let data = imgData.data;
    for (let i = 0, LN = data.length; i < LN; i += 4) {
      let R = data[i];
      let G = data[i + 1];
      let B = data[i + 2];
      let A = data[i + 3];
      if (A > 0) {
        let selection = Math.min(R, G, B);
        if (selection < MIN) selection = MIN;
        if (selection > MAX) selection = MAX;
        //R, G, B, A
        data[i] = selection;
        data[i + 1] = selection;
        data[i + 2] = selection;
        data[i + 3] = Math.floor(A * 0.9);
      }
    }
    NTX.putImageData(imgData, 0, 0);
    return ENGINE.contextToSprite(name, NTX);
  },
  imgToTexture: function(obj) {
    TEXTURE[obj.name] = obj.img;
  },
  imgToSprite: function(obj) {
    SPRITE[obj.name] = obj.img;
    SPRITE[obj.name].crossOrigin = "Anonymous";
    SPRITE[obj.name].width = obj.img.width;
    SPRITE[obj.name].height = obj.img.height;
  },
  imgToCanvas: function(img) {
    LAYER.temp.canvas.width = img.width;
    LAYER.temp.canvas.height = img.height;
    LAYER.temp.drawImage(img, 0, 0);
    return LAYER.temp.canvas;
  },
  extractImg: function(x, y, CTX) {
    var data, imgDATA;
    var NTX = LAYER.temp2;
    data = CTX.getImageData(
      x,
      y,
      ENGINE.INI.SPRITESHEET_DEFAULT_WIDTH,
      ENGINE.INI.SPRITESHEET_DEFAULT_HEIGHT
    );
    NTX.canvas.width = ENGINE.INI.SPRITESHEET_DEFAULT_WIDTH;
    NTX.canvas.height = ENGINE.INI.SPRITESHEET_DEFAULT_HEIGHT;
    NTX.putImageData(data, 0, 0);
    imgDATA = NTX.getImageData(
      0,
      0,
      ENGINE.INI.SPRITESHEET_DEFAULT_WIDTH,
      ENGINE.INI.SPRITESHEET_DEFAULT_HEIGHT
    );
    var TRIM = ENGINE.trimCanvas(imgDATA);
    var trimmed = NTX.getImageData(
      TRIM.left,
      TRIM.top,
      TRIM.right - TRIM.left,
      TRIM.bottom - TRIM.top
    );
    NTX.canvas.width = TRIM.right - TRIM.left;
    NTX.canvas.height = TRIM.bottom - TRIM.top;
    NTX.putImageData(trimmed, 0, 0);
    return NTX;
  },
  drawSheet: function(spriteSheet) {
    var CTX = LAYER.temp;
    CTX.canvas.width = spriteSheet.width;
    CTX.canvas.height = spriteSheet.height;
    ENGINE.draw("temp", 0, 0, spriteSheet);
    return CTX;
  },
  contextToSprite: function(newName, NTX) {
    SPRITE[newName] = new Image();
    SPRITE[newName].crossOrigin = "Anonymous";
    SPRITE[newName].src = NTX.canvas.toDataURL("image/png");
    SPRITE[newName].width = NTX.canvas.width;
    SPRITE[newName].height = NTX.canvas.height;
    return SPRITE[newName];
  },
  packToSprite: function(obj) {
    var tag = ["left", "right", "front", "back"];
    var CTX = ENGINE.drawSheet(obj.img);
    let x, y;
    let newName;
    for (var W = 0, LN = tag.length; W < LN; W++) {
      for (var q = 0; q < obj.count; q++) {
        x = q * ENGINE.INI.SPRITESHEET_DEFAULT_WIDTH;
        y = W * ENGINE.INI.SPRITESHEET_DEFAULT_HEIGHT;
        let NTX = ENGINE.extractImg(x, y, CTX);
        newName = obj.name + "_" + tag[W] + "_" + q;
        ASSET[obj.name][tag[W]].push(ENGINE.contextToSprite(newName, NTX));
      }
    }
  },
  seqToSprite: function(obj) {
    var CTX = ENGINE.drawSheet(obj.img);
    let x;
    let newName;
    for (var q = 0; q < obj.count; q++) {
      x = q * ENGINE.INI.SPRITESHEET_DEFAULT_WIDTH;
      let NTX = ENGINE.extractImg(x, 0, CTX);
      newName = obj.name + "_" + q.toString().padStart(2, "0");
      ASSET[obj.name].linear.push(ENGINE.contextToSprite(newName, NTX));
    }
  },
  sheetToSprite: function(obj) {
    var CTX = ENGINE.drawSheet(obj.img);
    let x;
    let newName;
    for (var q = 0; q < obj.count; q++) {
      x = q * ENGINE.INI.SPRITESHEET_DEFAULT_WIDTH;
      let NTX = ENGINE.extractImg(x, 0, CTX);
      newName = obj.name + "_" + q;
      ASSET[obj.parent][obj.tag].push(ENGINE.contextToSprite(newName, NTX));
    }
  },
  audioToAudio: function(obj) {
    AUDIO[obj.name] = obj.audio;
  },
  linkToWasm: function(obj) {
    var bin = obj.exports;
    for (var fn in bin) {
      if (typeof bin[fn] === "function") {
        WASM[fn] = bin[fn];
      }
    }
  },
  KEY: {
    on: function() {
      $(document).keydown(ENGINE.GAME.checkKey);
      $(document).keyup(ENGINE.GAME.clearKey);
    },
    off: function() {
      $(document).off("keyup", ENGINE.GAME.clearKey);
      $(document).off("keydown", ENGINE.GAME.checkKey);
    },
    map: {
      ctrl: 17,
      back: 8,
      tab: 9,
      alt: 18,
      left: 37,
      up: 38,
      right: 39,
      down: 40,
      space: 32,
      enter: 13,
      F2: 113,
      F4: 115,
      F9: 120,
      F8: 119,
      F7: 118,
      A: 65,
      D: 68,
      C: 67,
      H: 72,
      M: 77
    },
    waitFor: function(func, key = "enter") {
      if (ENGINE.GAME.stopAnimation) return;
      let map = ENGINE.GAME.keymap;
      if (map[ENGINE.KEY.map[key]]) {
        ENGINE.GAME.ANIMATION.stop();
        func.call();
        ENGINE.GAME.keymap[ENGINE.KEY.map[key]] = false;
        return;
      }
    }
  },
  GAME: {
    running: false,
    keymap: {
      17: false, //CTRL
      37: false, //LEFT
      38: false, //UP
      39: false, //RIGHT
      40: false, //Down
      32: false, //SPACE
      13: false, //ENTER
      113: false, //F2
      115: false, //F4
      120: false, //F9
      119: false, //F8
      118: false, //F7
      65: false, //A
      68: false, //D
      67: false, //C
      8: false, //back
      9: false, //tab
      72: false, //h
      77: false //m
    },
    clearAllKeys: function() {
      for (var key in ENGINE.GAME.keymap) {
        ENGINE.GAME.keymap[key] = false;
      }
    },
    clearKey: function(e) {
      e = e || window.event;
      if (e.keyCode in ENGINE.GAME.keymap) {
        ENGINE.GAME.keymap[e.keyCode] = false;
      }
    },
    checkKey: function(e) {
      e = e || window.event;
      if (e.keyCode in ENGINE.GAME.keymap) {
        ENGINE.GAME.keymap[e.keyCode] = true;
        e.preventDefault();
      }
    },
    run: function(func, nextFunct) {
      ENGINE.GAME.running = true;
      if (!ENGINE.GAME.frame.start) ENGINE.GAME.frame.start = performance.now();
      ENGINE.GAME.frame.delta = performance.now() - ENGINE.GAME.frame.start;
      if (ENGINE.GAME.frame.delta >= ENGINE.INI.ANIMATION_INTERVAL) {
        if (ENGINE.GAME.stopAnimation) {
          if (nextFunct) nextFunct.call();
          console.log(
            `%cAnimation stopped BEFORE execution ${func.name}`,
            "color: #f00"
          );
          ENGINE.GAME.running = false;
          return;
        }
        func.call();
        ENGINE.GAME.frame.start = null;
      }
      if (!ENGINE.GAME.stopAnimation) {
        requestAnimationFrame(ENGINE.GAME.run.bind(null, func, nextFunct));
      } else {
        if (nextFunct) nextFunct.call();
        console.log(
          `%cAnimation stopped AFTER execution ${func.name}`,
          "color: #f00"
        );
        ENGINE.GAME.running = false;
        return;
      }
    },
    start: function() {
      $("#DOWN")[0].scrollIntoView();
      ENGINE.GAME.stopAnimation = false;
      ENGINE.GAME.started = Date.now();
      ENGINE.GAME.frame = {};
      ENGINE.GAME.frame.start = null;
    },
    ANIMATION: {
      start: function(wrapper) {
        console.log(
          `%cENGINE.GAME.ANIMATION.start --> ${wrapper.name}`,
          "color: #0F0"
        );
        ENGINE.GAME.stopAnimation = false;
        ENGINE.GAME.run(wrapper, ENGINE.GAME.ANIMATION.queue);
      },
      stop: function() {
        ENGINE.GAME.stopAnimation = true;
      },
      next: function(functionPointer) {
        if (ENGINE.GAME.running) {
          ENGINE.GAME.ANIMATION.addToQueue(functionPointer);
          ENGINE.GAME.ANIMATION.stop();
        } else {
          ENGINE.GAME.ANIMATION.start(functionPointer);
        }
      },
      addToQueue: function(functionPointer) {
        ENGINE.GAME.ANIMATION.STACK.push(functionPointer);
      },
      queue: function() {
        ENGINE.GAME.ANIMATION.stop();
        setTimeout(() => {
          console.log(`%cGame running? ${ENGINE.GAME.running}`, ENGINE.CSS);
          if (ENGINE.GAME.ANIMATION.STACK.length > 0) {
            let next = ENGINE.GAME.ANIMATION.STACK.shift();
            console.log(`%c..... animation queue: ${next.name}`, ENGINE.CSS);
            ENGINE.GAME.ANIMATION.start(next);
          } else {
            console.log(
              "%cAnimation STACK EMPTY! Game stopped running.",
              ENGINE.CSS
            );
          }
        }, ENGINE.INI.ANIMATION_INTERVAL);
      },
      waitThen: function(func, n = 1) {
        setTimeout(func, ENGINE.INI.ANIMATION_INTERVAL * n);
      },
      STACK: []
    }
  },
  VIEWPORT: {
    max: {
      x: 0,
      y: 0
    },
    setMax: function(max) {
      ENGINE.VIEWPORT.max.x = max.x;
      ENGINE.VIEWPORT.max.y = max.y;
    },
    changed: false,
    reset: function() {
      ENGINE.VIEWPORT.vx = 0;
      ENGINE.VIEWPORT.vy = 0;
    },
    vx: 0,
    vy: 0,
    change: function(from, to) {
      ENGINE.copyLayer(
        from,
        to,
        ENGINE.VIEWPORT.vx,
        ENGINE.VIEWPORT.vy,
        ENGINE.gameWIDTH,
        ENGINE.gameHEIGHT
      );
    },
    check: function(actor, max = ENGINE.VIEWPORT.max) {
      var vx = actor.x - ENGINE.gameWIDTH / 2;
      var vy = actor.y - ENGINE.gameHEIGHT / 2;
      if (vx < 0) vx = 0;
      if (vy < 0) vy = 0;
      if (vx > max.x - ENGINE.gameWIDTH) vx = max.x - ENGINE.gameWIDTH;
      if (vy > max.y - ENGINE.gameHEIGHT) vy = max.y - ENGINE.gameHEIGHT;
      if (vx != ENGINE.VIEWPORT.vx || vy != ENGINE.VIEWPORT.vy) {
        ENGINE.VIEWPORT.vx = vx;
        ENGINE.VIEWPORT.vy = vy;
        ENGINE.VIEWPORT.changed = true;
      }
    },
    alignTo: function(actor) {
      actor.vx = actor.x - ENGINE.VIEWPORT.vx;
      actor.vy = actor.y - ENGINE.VIEWPORT.vy;
    }
  },
  TEXT: {
    font: "Arcade",
    fs: "40",
    setFS: function(fs) {
      if (isNaN(fs)) fs = 40;
      ENGINE.TEXT.fs = fs.toString();
    },
    text: function(
      text,
      x,
      y,
      layer = "text",
      fs = ENGINE.TEXT.fs,
      font = ENGINE.TEXT.font
    ) {
      var CTX = LAYER[layer];
      CTX.fillStyle = "#FFF";
      CTX.font = fs + "px " + font;
      CTX.shadowColor = "#333333";
      CTX.shadowOffsetX = 3;
      CTX.shadowOffsetY = 3;
      CTX.shadowBlur = 3;
      CTX.textAlign = "center";
      CTX.fillText(text, x, y);
    },
    centeredText: function(
      text,
      y,
      layer = "text",
      fs = ENGINE.TEXT.fs,
      font = ENGINE.TEXT.font
    ) {
      var x = ENGINE.gameWIDTH / 2;
      ENGINE.TEXT.text(text, x, y, layer, fs, font);
    }
  },
  LOAD: {
    Textures: 0,
    Sprites: 0,
    Sequences: 0,
    Sheets: 0,
    Rotated: 0,
    WASM: 0,
    Sounds: 0,
    Fonts: 0,
    Packs: 0,
    SheetSequences: 0,
    HMSheetSequences: null,
    HMFonts: null,
    HMSequences: null,
    HMTextures: null,
    HMSprites: null,
    HMSheets: null,
    HMRotated: null,
    HMWASM: null,
    HMSounds: null,
    HMPacks: null,
    preload: function() {
      console.log("%cPreloading ...", ENGINE.CSS);
      var AllLoaded = Promise.all([
        loadTextures(),
        loadSprites(),
        loadSequences(),
        loadSheets(),
        loadPacks(),
        loadSheetSequences(),
        loadRotated(),
        loadingSounds(),
        loadWASM(),
        loadAllFonts()
      ]).then(function() {
        console.log("%cAll assets loaded and ready!", ENGINE.CSS);
        console.log("%c****************************", ENGINE.CSS);
        //console.log("SPRITE", SPRITE);
        ENGINE.ready();
      });

      return;

      function appendCanvas(name) {
        let id = "preload_" + name;
        $("#load").append(
          "<canvas id ='" +
            id +
            "' width='" +
            ENGINE.LOAD_W +
            "' height='" +
            ENGINE.LOAD_H +
            "'></canvas>"
        );
        LAYER.PRELOAD[name] = $("#" + id)[0].getContext("2d");
      }
      function loadTextures(arrPath = LoadTextures) {
        console.log(`%c ...loading ${arrPath.length} textures`, ENGINE.CSS);
        ENGINE.LOAD.HMTextures = arrPath.length;
        if (ENGINE.LOAD.HMTextures) appendCanvas("Textures");

        const temp = Promise.all(
          arrPath.map(img => loadImage(img, "Textures"))
        ).then(function(obj) {
          obj.forEach(function(el) {
            ENGINE.imgToTexture(el);
          });
        });
        return temp;
      }
      function loadSprites(arrPath = LoadSprites) {
        console.log(`%c ...loading ${arrPath.length} sprites`, ENGINE.CSS);
        ENGINE.LOAD.HMSprites = arrPath.length;
        if (ENGINE.LOAD.HMSprites) appendCanvas("Sprites");

        const temp = Promise.all(
          arrPath.map(img => loadImage(img, "Sprites"))
        ).then(function(obj) {
          obj.forEach(function(el) {
            ENGINE.imgToSprite(el);
          });
        });
        return temp;
      }
      function loadSequences(arrPath = LoadSequences) {
        console.log(`%c ...loading ${arrPath.length} sequences`, ENGINE.CSS);
        var toLoad = [];

        arrPath.forEach(function(el) {
          for (let i = 1; i <= el.count; i++) {
            toLoad.push({
              srcName:
                el.srcName +
                "_" +
                i.toString().padStart(2, "0") +
                "." +
                el.type,
              name: el.name + (i - 1).toString().padStart(2, "0")
            });
          }
        });

        ENGINE.LOAD.HMSequences = toLoad.length;
        if (ENGINE.LOAD.HMSequences) appendCanvas("Sequences");

        const temp = Promise.all(
          toLoad.map(img => loadImage(img, "Sequences"))
        ).then(function(obj) {
          obj.forEach(function(el) {
            ENGINE.imgToSprite(el);
          });
        });
        return temp;
      }
      function loadPacks(arrPath = LoadPacks) {
        console.log(`%c ...loading ${arrPath.length} packs`, ENGINE.CSS);
        var toLoad = [];
        arrPath.forEach(function(el) {
          ASSET[el.name] = new LiveSPRITE("4D", [], [], [], []);
          toLoad.push({
            srcName: el.srcName,
            name: el.name,
            count: el.count
          });
        });
        ENGINE.LOAD.HMPacks = toLoad.length;
        if (ENGINE.LOAD.HMPacks) appendCanvas("Packs");
        const temp = Promise.all(
          toLoad.map(img => loadImage(img, "Packs"))
        ).then(function(obj) {
          obj.forEach(function(el) {
            ENGINE.packToSprite(el);
          });
        });
        return temp;
      }
      function loadSheets(arrPath = LoadSheets, addTag = ExtendSheetTag) {
        console.log(`%c ...loading ${arrPath.length} sheets`, ENGINE.CSS);
        var toLoad = [];
        var tag = ["left", "right", "front", "back", ...addTag];
        arrPath.forEach(function(el) {
          ASSET[el.name] = new LiveSPRITE("4D", [], [], [], []);
          for (let q = 0, TL = tag.length; q < TL; q++) {
            toLoad.push({
              srcName: el.srcName + "_" + tag[q] + "." + el.type,
              name: el.name + "_" + tag[q],
              count: el.count,
              tag: tag[q],
              parent: el.name
            });
          }
        });

        ENGINE.LOAD.HMSheets = toLoad.length;
        if (ENGINE.LOAD.HMSheets) appendCanvas("Sheets");
        const temp = Promise.all(
          toLoad.map(img => loadImage(img, "Sheets"))
        ).then(function(obj) {
          obj.forEach(function(el) {
            ENGINE.sheetToSprite(el);
          });
        });
        return temp;
      }
      function loadSheetSequences(arrPath = LoadSheetSequences) {
        console.log(
          `%c ...loading ${arrPath.length} sheet sequences`,
          ENGINE.CSS
        );
        var toLoad = [];
        arrPath.forEach(function(el) {
          ASSET[el.name] = new LiveSPRITE("1D", []);
          toLoad.push({
            srcName: el.srcName,
            name: el.name,
            count: el.count
          });
        });
        ENGINE.LOAD.HMSheetSequences = toLoad.length;
        if (ENGINE.LOAD.HMSheetSequences) appendCanvas("SheetSequences");
        const temp = Promise.all(
          toLoad.map(img => loadImage(img, "SheetSequences"))
        ).then(function(obj) {
          obj.forEach(function(el) {
            ENGINE.seqToSprite(el);
          });
        });
        return temp;
      }
      function loadRotated(arrPath = LoadRotated) {
        console.log(
          `%c ...loading ${arrPath.length} rotated sprites`,
          ENGINE.CSS
        );
        ENGINE.LOAD.HMRotated = arrPath.length;
        if (ENGINE.LOAD.HMRotated) appendCanvas("Rotated");

        const temp = Promise.all(
          arrPath.map(img => loadImage(img, "Rotated"))
        ).then(function(obj) {
          obj.forEach(function(el) {
            for (
              let q = el.rotate.first;
              q <= el.rotate.last;
              q += el.rotate.step
            ) {
              ENGINE.rotateImage(el.img, q, el.name + "_" + q);
            }
          });
        });
        return temp;
      }
      function loadWASM(arrPath = LoadExtWasm) {
        var LoadIntWasm = []; //internal hard coded ENGINE requirements
        var toLoad = [...arrPath, ...LoadIntWasm];
        console.log(`%c ...loading ${toLoad.length} WASM files`, ENGINE.CSS);
        ENGINE.LOAD.HMWASM = toLoad.length;
        if (ENGINE.LOAD.HMWASM) appendCanvas("WASM");
        const temp = Promise.all(
          toLoad.map(wasm => loadWebAssembly(wasm, "WASM"))
        ).then(instance => {
          instance.forEach(function(el) {
            ENGINE.linkToWasm(el);
          });
        });

        return temp;
      }
      function loadingSounds(arrPath = LoadAudio) {
        console.log(`%c ...loading ${arrPath.length} sounds`, ENGINE.CSS);
        ENGINE.LOAD.HMSounds = arrPath.length;
        if (ENGINE.LOAD.HMSounds) appendCanvas("Sounds");

        const temp = Promise.all(
          arrPath.map(audio => loadAudio(audio, "Sounds"))
        ).then(function(obj) {
          obj.forEach(function(el) {
            ENGINE.audioToAudio(el);
          });
        });
      }
      function loadAllFonts(arrPath = LoadFonts) {
        console.log(`%c ...loading ${arrPath.length} fonts`, ENGINE.CSS);
        ENGINE.LOAD.HMFonts = arrPath.length;
        if (ENGINE.LOAD.HMFonts) {
          appendCanvas("Fonts");
          const temp = Promise.all(arrPath.map(font => loadFont(font))).then(
            function(obj) {
              obj.map(x => document.fonts.add(x));
              ENGINE.LOAD.Fonts = ENGINE.LOAD.HMFonts;
              ENGINE.drawLoadingGraph("Fonts");
            }
          );
        }
      }

      function loadImage(srcData, counter, dir = ENGINE.SOURCE) {
        var srcName, name, count, tag, parent, rotate;
        switch (typeof srcData) {
          case "string":
            srcName = srcData;
            name = srcName.substr(0, srcName.indexOf("."));
            break;
          case "object":
            srcName = srcData.srcName;
            name = srcData.name;
            count = srcData.count || null;
            tag = srcData.tag || null;
            parent = srcData.parent || null;
            rotate = srcData.rotate || null;
            break;
          default:
            console.error(`ENGINE: loadImage srcData ERROR: ${typeof srcData}`);
        }

        var src = dir + srcName;
        return new Promise((resolve, reject) => {
          const img = new Image();
          var obj = {
            img: img,
            name: name,
            count: count,
            tag: tag,
            parent: parent,
            rotate: rotate
          };
          img.onload = function() {
            ENGINE.LOAD[counter]++;
            ENGINE.drawLoadingGraph(counter);
            resolve(obj);
          };
          img.onerror = err => resolve(err);
          img.crossOrigin = "Anonymous";
          img.src = src;
        });
      }
      function loadAudio(srcData, counter, dir = ENGINE.AUDIO_SOURCE) {
        var srcName, name;
        switch (typeof srcData) {
          case "string":
            srcName = srcData;
            name = srcName.substr(0, srcName.indexOf("."));
            break;
          case "object":
            srcName = srcData.srcName;
            name = srcData.name;

            break;
          default:
            console.error(`ENGINE: loadAudio srcData ERROR: ${typeof srcData}`);
        }

        var src = dir + srcName;
        return new Promise((resolve, reject) => {
          const audio = new Audio();
          var obj = {
            audio: audio,
            name: name
          };
          audio.oncanplaythrough = function() {
            ENGINE.LOAD[counter]++;
            ENGINE.drawLoadingGraph(counter);
            resolve(obj);
          };
          audio.onerror = err => resolve(err);
          audio.src = src;
          audio.load();
        });
      }
      function loadWebAssembly(fileName, counter) {
        fileName = ENGINE.WASM_SOURCE + fileName;
        return fetch(fileName)
          .then(response => response.arrayBuffer())
          .then(bits => WebAssembly.compile(bits))
          .then(module => {
            ENGINE.LOAD[counter]++;
            ENGINE.drawLoadingGraph(counter);
            return new WebAssembly.Instance(module);
          });
      }
      function loadFont(srcData, dir = ENGINE.FONT_SOURCE) {
        const fontSource = dir + srcData.srcName;
        const url = `url(${fontSource})`;
        const temp = new FontFace(srcData.name, url);
        return temp.load();
      }
    }
  },
  TIMERS: {
    STACK: [],
    remove: function(timerID) {
      for (let i = ENGINE.TIMERS.STACK.length - 1; i >= 0; i--) {
        if (ENGINE.TIMERS.STACK[i].id === timerID) {
          ENGINE.TIMERS.STACK.splice(i, 1);
          break;
        }
      }
    },
    index: function(timerID) {
      for (let i = ENGINE.TIMERS.STACK.length - 1; i >= 0; i--) {
        if (ENGINE.TIMERS.STACK[i].id === timerID) {
          return i;
        }
      }
      return -1;
    },
    exists: function(timerID) {
      if (ENGINE.TIMERS.index(timerID) >= 0) {
        return true;
      } else return false;
    },
    stop: function() {
      ENGINE.TIMERS.STACK.forEach(timer => timer.stop());
    },
    start: function() {
      ENGINE.TIMERS.STACK.forEach(timer => timer.continue());
    },
    update: function() {
      ENGINE.TIMERS.STACK.forEach(timer => timer.update());
    },
    display: function() {
      console.table(ENGINE.TIMERS.STACK, [
        "id",
        "delta",
        "now",
        "kwargs",
        "func",
        "value"
      ]);
    }
  },
  PACGRID: {
    draw: function(pacgrid, corr) {
      let sizeX = pacgrid.width;
      let sizeY = pacgrid.height;
      let CTX = ENGINE.PACGRID.layer;
      ENGINE.clearLayer(ENGINE.PACGRID.layerString);
      if (ENGINE.PACGRID.background) {
        ENGINE.fillLayer(ENGINE.PACGRID.layerString, ENGINE.PACGRID.background);
      }
      if (ENGINE.PACGRID.shadowColor) {
        CTX.shadowColor = ENGINE.PACGRID.shadowColor;
        CTX.shadowOffsetX = 1;
        CTX.shadowOffsetY = 1;
        CTX.shadowBlur = 1;
      }
      CTX.strokeStyle = ENGINE.PACGRID.color;
      CTX.lineWidth = ENGINE.PACGRID.lineWidth;
      for (let x = 0; x < sizeX; x++) {
        for (let y = 0; y < sizeY; y++) {
          let index = y * sizeX + x;
          let data = pacgrid.map[index];
          if (data === 0) {
            if (corr){
              CTX.save();
              CTX.setLineDash([1,2]);
              CTX.lineWidth = 1;
              CTX.globalAlpha = 0.5;
              dashRect(x,y);
              CTX.restore();
              continue;
            } else continue;
          }
          CTX.setLineDash([]);
          if (data === 1) {
            rect(x, y);
            continue;
          }
          if (data > 1) {
            let px = x * ENGINE.INI.GRIDPIX;
            let py = y * ENGINE.INI.GRIDPIX;
            let x1 = ENGINE.INI.GRIDPIX / 2 + px;
            let y1 = ENGINE.INI.GRIDPIX / 2 + py;
            let x2, y2;
            if (data & 4) {
              //up
              x2 = ENGINE.INI.GRIDPIX / 2 + px;
              y2 = 0 + py;
              line(x1, y1, x2, y2);
            }
            if (data & 8) {
              //right
              x2 = ENGINE.INI.GRIDPIX + px;
              y2 = ENGINE.INI.GRIDPIX / 2 + py;
              line(x1, y1, x2, y2);
            }
            if (data & 16) {
              //down
              x2 = ENGINE.INI.GRIDPIX / 2 + px;
              y2 = ENGINE.INI.GRIDPIX + py;
              line(x1, y1, x2, y2);
            }
            if (data & 32) {
              //left
              x2 = 0 + px;
              y2 = ENGINE.INI.GRIDPIX / 2 + py;
              line(x1, y1, x2, y2);
            }
            continue;
          }
        }
      }

      function dashRect(x,y){
        let px = x * ENGINE.INI.GRIDPIX;
        let py = y * ENGINE.INI.GRIDPIX;
        CTX.strokeRect(px, py, ENGINE.INI.GRIDPIX, ENGINE.INI.GRIDPIX);
      }
      function rect(x, y) {
        let px = x * ENGINE.INI.GRIDPIX + ENGINE.INI.GRIDPIX / 4;
        let py = y * ENGINE.INI.GRIDPIX + ENGINE.INI.GRIDPIX / 4;
        const round = ENGINE.PACGRID.round;
        CTX.roundRect(
          px,
          py,
          ENGINE.INI.GRIDPIX / 2,
          ENGINE.INI.GRIDPIX / 2,
          {
            upperLeft: round,
            upperRight: round,
            lowerLeft: round,
            lowerRight: round
          },
          false,
          true
        );
      }
      function line(x1, y1, x2, y2) {
        CTX.beginPath();
        CTX.moveTo(x1, y1);
        CTX.lineTo(x2, y2);
        CTX.closePath();
        CTX.stroke();
      }
    },
    shadowColor: null,
    setShadow(color) {
      ENGINE.PACGRID.shadowColor = color;
    },
    round: 4,
    layer: null,
    layerString: null,
    setLayer: function(layer) {
      ENGINE.PACGRID.layerString = layer;
      ENGINE.PACGRID.layer = LAYER[layer];
    },
    color: null,
    setColor: function(color) {
      ENGINE.PACGRID.color = color;
    },
    lineWidth: 2,
    setLineWidth: function(w) {
      if (w <= 0 || w > 4) return;
      ENGINE.PACGRID.lineWidth = w;
    },
    background: null,
    setBackground: function(back) {
      ENGINE.PACGRID.background = back;
    },
    configure: function(width, layer, background, color, shadow = null) {
      ENGINE.PACGRID.setLayer(layer);
      ENGINE.PACGRID.setLineWidth(width, layer);
      ENGINE.PACGRID.setColor(color);
      ENGINE.PACGRID.setBackground(background);
      ENGINE.PACGRID.setShadow(shadow);
    }
  },
  BLOCKGRID: {
    draw: function(maze, corr) {
      var CTX = ENGINE.BLOCKGRID.layer;
      ENGINE.clearLayer(ENGINE.BLOCKGRID.layerString);
      let sizeX = parseInt(maze.width, 10);
      let sizeY = parseInt(maze.height, 10);
      for (let x = 0; x < sizeX; x++) {
        for (let y = 0; y < sizeY; y++) {
          if (maze.grid[y].charAt(x) === "1") {
            ENGINE.BLOCKGRID.wall(x, y, CTX);
          } else {
            ENGINE.BLOCKGRID.corr(x, y, CTX, corr);
          }
        }
      }
    },
    wall: function(x, y, CTX) {
      CTX.fillStyle = "#999";
      let px = x * ENGINE.INI.GRIDPIX;
      let py = y * ENGINE.INI.GRIDPIX;
      CTX.fillRect(px, py, ENGINE.INI.GRIDPIX, ENGINE.INI.GRIDPIX);
    },
    corr: function(x, y, CTX, corr) {
      CTX.fillStyle = "#FFF";
      let px = x * ENGINE.INI.GRIDPIX;
      let py = y * ENGINE.INI.GRIDPIX;
      CTX.fillRect(px, py, ENGINE.INI.GRIDPIX, ENGINE.INI.GRIDPIX);
      if (corr){
        CTX.setLineDash([1,1]);
        CTX.strokeStyle = "#000";
        CTX.strokeRect(px, py, ENGINE.INI.GRIDPIX, ENGINE.INI.GRIDPIX);
      }
    },
    layer: null,
    layerString: null,
    setLayer: function(layer) {
      ENGINE.BLOCKGRID.layerString = layer;
      ENGINE.BLOCKGRID.layer = LAYER[layer];
    },
    color: null,
    setColor: function(color) {
      ENGINE.BLOCKGRID.color = color;
    },
    background: null,
    setBackground: function(back) {
      ENGINE.BLOCKGRID.background = back;
    },
    configure: function(layer, background, color) {
      ENGINE.BLOCKGRID.setLayer(layer);
      ENGINE.BLOCKGRID.setColor(color);
      ENGINE.BLOCKGRID.setBackground(background);
    }
  }
};
var TEXTURE = {};
var LAYER = {
  PRELOAD: {}
};
var SPRITE = {};
var AUDIO = {};
var ASSET = {};
var WASM = {};
var PATTERN = {
  create: function(which) {
    var image = TEXTURE[which];
    var CTX = LAYER.temp;
    PATTERN[which] = CTX.createPattern(image, "repeat");
  }
};
var AnimationSPRITE = function(x, y, type, howmany) {
  this.x = x;
  this.y = y;
  this.pool = [];
  for (var i = 0; i < howmany; i++) {
    this.pool.push(type + i.toString().padStart(2, "0"));
  }
};
class TextSprite {
  constructor(text, point, color, frame) {
    this.text = text;
    this.point = point;
    this.color = color || "#FFF";
    this.frame = frame || ENGINE.INI.FADE_FRAMES; //magic number
  }
}
var TEXTPOOL = {
  pool: [],
  draw: function(layer) {
    var TPL = TEXTPOOL.pool.length;
    if (TPL === 0) return;
    ENGINE.layersToClear.add(layer);
    var CTX = LAYER[layer];
    CTX.font = "10px Consolas";
    CTX.textAlign = "center";
    var vx, vy;
    for (let q = TPL - 1; q >= 0; q--) {
      CTX.fillStyle = TEXTPOOL.pool[q].color;
      vx =
        TEXTPOOL.pool[q].point.x - ENGINE.VIEWPORT.vx + ENGINE.INI.GRIDPIX / 2;
      vy =
        TEXTPOOL.pool[q].point.y - ENGINE.VIEWPORT.vy + ENGINE.INI.GRIDPIX / 2;
      CTX.save();
      CTX.globalAlpha =
        (1000 -
          (ENGINE.INI.FADE_FRAMES - TEXTPOOL.pool[q].frame) *
            (1000 / ENGINE.INI.FADE_FRAMES)) /
        1000;
      CTX.fillText(TEXTPOOL.pool[q].text, vx, vy);
      CTX.restore();
      TEXTPOOL.pool[q].frame--;
      if (TEXTPOOL.pool[q].frame <= 0) {
        TEXTPOOL.pool.splice(q, 1);
      }
    }
  }
};
class PartSprite {
  constructor(point, sprite, line, speed) {
    this.point = point;
    this.sprite = sprite;
    this.line = line;
    this.speed = speed;
  }
}
var SpritePOOL = {
  pool: [],
  draw: function(layer) {
    var SPL = SpritePOOL.pool.length;
    if (SPL === 0) return;
    ENGINE.layersToClear.add(layer);
    var vx, vy, line;
    for (var q = SPL - 1; q >= 0; q--) {
      vx = SpritePOOL.pool[q].point.x - ENGINE.VIEWPORT.vx;
      vy = SpritePOOL.pool[q].point.y - ENGINE.VIEWPORT.vy;
      line = SpritePOOL.pool[q].sprite.height - SpritePOOL.pool[q].line;
      ENGINE.drawPart(layer, vx, vy, SpritePOOL.pool[q].sprite, line);
      SpritePOOL.pool[q].line--;
      if (SpritePOOL.pool[q].line <= 0) {
        SpritePOOL.pool.splice(q, 1);
      }
    }
  }
};
var EXPLOSIONS = {
  pool: [],
  draw: function(layer) {
    // draws AnimationSPRITE(x, y, type, howmany) from EXPLOSIONS.pool
    // example new AnimationSPRITE(actor.x, actor.y, "AlienExp", 6)
    layer = layer || "explosion";
    var PL = EXPLOSIONS.pool.length;
    if (PL === 0) return;
    ENGINE.layersToClear.add(layer);
    for (var instance = PL - 1; instance >= 0; instance--) {
      var sprite = EXPLOSIONS.pool[instance].pool.shift();
      ENGINE.spriteDraw(
        layer,
        EXPLOSIONS.pool[instance].x - ENGINE.VIEWPORT.vx,
        EXPLOSIONS.pool[instance].y - ENGINE.VIEWPORT.vy,
        SPRITE[sprite]
      );
      if (EXPLOSIONS.pool[instance].pool.length === 0) {
        EXPLOSIONS.pool.splice(instance, 1);
      }
    }
  }
};
class LiveSPRITE {
  constructor(type, left, right, front, back) {
    this.type = type || null;
    switch (type) {
      case "1D":
        this.linear = left;
        break;
      case "4D":
        this.left = left || null;
        this.right = right || null;
        this.front = front || null;
        this.back = back || null;
        break;
      default:
        throw "LiveSPRITE type ERROR";
      //break;
    }
  }
}
class ACTOR {
  constructor(sprite_class, x, y, orientation, asset) {
    this.class = sprite_class;
    this.x = x || 0;
    this.y = y || 0;
    this.orientation = orientation || null;
    this.asset = asset || null;
    this.vx = 0;
    this.vy = 0;
    this.resetIndexes();
    if (this.class !== null) this.refresh();
  }
  simplify(name) {
    this.class = name;
    this.orientation = null;
    this.refresh();
  }
  resetIndexes() {
    this.left_index = 0;
    this.right_index = 0;
    this.front_index = 0;
    this.back_index = 0;
    this.linear_index = 0;
  }
  refresh() {
    if (this.orientation === null) {
      this.name = this.class;
      return;
    }
    switch (this.asset.type) {
      case "4D":
        this.name = `${this.class}_${this.orientation}_${
          this[this.orientation + "_index"]
        }`;
        break;
      case "1D":
        this.name = `${this.class}_${this.linear_index
          .toString()
          .padStart(2, "0")}`;
        break;
      default:
        throw "actor.refresh asset type ERRoR";
    }

    this.width = SPRITE[this.name].width;
    this.height = SPRITE[this.name].height;
  }
  sprite() {
    return SPRITE[this.name];
  }
  getOrientation(dir) {
    var orientation;
    if (this.asset.type === "1D") {
      orientation = "linear";
      return orientation;
    }
    switch (dir.x) {
      case 1:
        orientation = "right";
        break;
      case -1:
        orientation = "left";
        break;
      case 0:
        switch (dir.y) {
          case 1:
            orientation = "front";
            break;
          case -1:
            orientation = "back";
            break;
          case 0:
            orientation = "front";
            break;
        }
        break;
    }
    return orientation;
  }
  animateMove(orientation) {
    this[orientation + "_index"]++;
    if (this[orientation + "_index"] >= this.asset[orientation].length)
      this[orientation + "_index"] = 0;
    this.refresh();
  }
  static gridToClass(grid, sprite_class) {
    var p = GRID.gridToCenterPX(grid);
    return new ACTOR(sprite_class, p.x, p.y);
  }
}
var GRID = {
  collision: function(actor, grid) {
    let actorGrid = actor.MoveState.homeGrid;
    return GRID.same(actorGrid, grid);
  },
  spriteToSpriteCollision: function(actor1, actor2) {
    return GRID.same(actor1.MoveState.homeGrid, actor2.MoveState.homeGrid);
  },
  gridToCenterPX: function(grid) {
    var x = grid.x * ENGINE.INI.GRIDPIX + ENGINE.INI.GRIDPIX / 2;
    var y = grid.y * ENGINE.INI.GRIDPIX + ENGINE.INI.GRIDPIX / 2;
    return new Point(x, y);
  },
  gridToSprite: function(grid, actor) {
    GRID.coordToSprite(GRID.gridToCoord(grid), actor);
  },
  coordToSprite: function(coord, actor) {
    actor.x = coord.x + ENGINE.INI.GRIDPIX / 2;
    actor.y = coord.y + ENGINE.INI.GRIDPIX / 2;
  },
  gridToCoord: function(grid) {
    var x = grid.x * ENGINE.INI.GRIDPIX;
    var y = grid.y * ENGINE.INI.GRIDPIX;
    return new Point(x, y);
  },
  coordToGrid: function(x, y) {
    var tx = Math.floor(x / ENGINE.INI.GRIDPIX);
    var ty = Math.floor(y / ENGINE.INI.GRIDPIX);
    return new Grid(tx, ty);
  },
  create: function(x, y) {
    var temp = [];
    var string = "1".repeat(x);
    for (var iy = 0; iy < y; iy++) {
      temp.push(string);
    }
    return temp;
  },
  grid: function() {
    var CTX = LAYER.grid;
    var x = 0;
    var y = 0;
    CTX.strokeStyle = "#FFF";
    //horizonal lines
    do {
      y += ENGINE.INI.GRIDPIX;
      CTX.beginPath();
      CTX.setLineDash([1, 3]);
      CTX.moveTo(x, y);
      CTX.lineTo(CTX.canvas.width, y);
      CTX.closePath();
      CTX.stroke();
    } while (y <= CTX.canvas.height);
    //vertical lines
    y = 0;
    do {
      x += ENGINE.INI.GRIDPIX;
      CTX.beginPath();
      CTX.setLineDash([1, 3]);
      CTX.moveTo(x, y);
      CTX.lineTo(x, CTX.canvas.height);
      CTX.closePath();
      CTX.stroke();
    } while (x <= CTX.canvas.width);
  },
  paintText: function(point, text, layer, color = "#FFF") {
    var CTX = LAYER[layer];
    CTX.font = "10px Consolas";
    var y = point.y + ENGINE.INI.GRIDPIX / 2;
    var x = point.x + ENGINE.INI.GRIDPIX / 2;
    CTX.fillStyle = color;
    CTX.textAlign = "center";
    CTX.fillText(text, x, y);
  },
  paint: function(
    grid,
    floorIMG,
    wallIMG,
    floorLayer = "floor",
    wallLayer = "wall",
    drawGrid = false
  ) {
    ENGINE.clearLayer(floorLayer);
    ENGINE.clearLayer(wallLayer);
    ENGINE.fill(LAYER[floorLayer], floorIMG);
    ENGINE.fill(LAYER[wallLayer], wallIMG);

    if (drawGrid) {
      ENGINE.clearLayer("grid");
      GRID.grid();
    }
  },
  repaint: function(
    grid,
    floorIMG,
    wallIMG,
    floorLayer = "floor",
    wallLayer = "wall",
    drawGrid = false
  ) {
    GRID.paint(grid, floorIMG, wallIMG, floorLayer, wallLayer, drawGrid);
    const height = grid.length;
    const width = grid[0].length;
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        if (grid[y].charAt(x) === "0") {
          let point = GRID.gridToCoord({ x: x, y: y });
          ENGINE.cutGrid(LAYER[wallLayer], point);
        }
      }
    }
  },
  map: {
    pack: function(grid) {
      var RL = grid.length;
      var converted = [];
      for (var i = 0; i < RL; i++) {
        converted.push(parseInt(grid[i], 2));
      }
      return converted;
    },
    unpack: function(map) {
      var h = map.height;
      var w = map.width;
      if (h != map.grid.length) {
        throw "Map corrupted: height:" + h + " grid.length: " + map.grid.length;
      }
      var binary = [];
      for (var i = 0; i < h; i++) {
        let binTemp = float64ToInt64Binary(map.grid[i]).padStart(w, "0");
        binary.push(binTemp);
      }
      return binary;
    }
  },
  isBlock: function(x, y, map = MAP[GAME.level]) {
    if (x < 0 || y < 0) return true;
    if (x >= map.width || y >= map.height) return true;
    var block = map.grid[y].charAt(x);
    if (block === "1") {
      return true;
    } else return false;
  },
  gridIsBlock: function(grid, map = MAP[GAME.level]) {
    return GRID.isBlock(grid.x, grid.y, map);
  },
  trueToGrid: function(actor) {
    var TX = actor.x - ENGINE.INI.GRIDPIX / 2;
    var TY = actor.y - ENGINE.INI.GRIDPIX / 2;
    var GX = TX / ENGINE.INI.GRIDPIX;
    var GY = TY / ENGINE.INI.GRIDPIX;
    var MX = TX % ENGINE.INI.GRIDPIX;
    var MY = TY % ENGINE.INI.GRIDPIX;
    if (MX || MY) {
      return null;
    } else return { x: GX, y: GY };
  },
  same: function(grid1, grid2) {
    if (grid1 === null || grid2 === null) return false;
    if (grid1.x === grid2.x && grid1.y === grid2.y) {
      return true;
    } else return false;
  },
  isGridIn: function(grid, gridArray) {
    for (var q = 0; q < gridArray.length; q++) {
      if (grid.x === gridArray[q].x && grid.y === gridArray[q].y) {
        return q;
      }
    }
    return -1;
  },
  getDirections: function(grid, obstacles = []) {
    var directions = [];
    for (let D = 0; D < ENGINE.directions.length; D++) {
      let newGrid = grid.add(ENGINE.directions[D]);
      if (!GRID.gridIsBlock(newGrid) && newGrid.isInAt(obstacles) === -1) {
        directions.push(ENGINE.directions[D]);
      }
    }
    return directions;
  },
  getDirectionsFromNodeMap(grid, nodeMap) {
    var directions = [];
    for (let D = 0; D < ENGINE.directions.length; D++) {
      let newGrid = grid.add(ENGINE.directions[D]);
      if (nodeMap[newGrid.x][newGrid.y]) {
        directions.push(ENGINE.directions[D]);
      }
    }
    return directions;
  },
  findCrossroad: function(start, dir) {
    let directions = GRID.getDirections(start);
    let back = dir.mirror();
    let BI = back.isInAt(directions);
    if (BI !== -1) directions.splice(BI, 1);
    while (directions.length < 2) {
      dir = directions[0];
      start = start.add(dir);
      directions = GRID.getDirections(start);
      back = dir.mirror();
      BI = back.isInAt(directions);
      if (BI !== -1) directions.splice(BI, 1);
    }
    return start;
  },
  findCrossroadAndLastDir: function(start, dir) {
    let directions = GRID.getDirections(start);
    let back = dir.mirror();
    let BI = back.isInAt(directions);
    if (BI !== -1) directions.splice(BI, 1);
    while (directions.length < 2) {
      dir = directions[0];
      start = start.add(dir);
      directions = GRID.getDirections(start);
      back = dir.mirror();
      BI = back.isInAt(directions);
      if (BI !== -1) directions.splice(BI, 1);
    }
    return { finish: start, dir: dir };
  },
  pathToCrossroad: function(start, dir, obst = []) {
    let path = [];
    path.push(dir);
    start = start.add(dir);
    let directions = GRID.getDirections(start, obst);
    if (directions.length === 1) return path;
    let back = dir.mirror();
    let BI = back.isInAt(directions);
    if (BI !== -1) directions.splice(BI, 1);
    while (directions.length === 1) {
      dir = directions[0];
      path.push(dir);
      start = start.add(dir);
      directions = GRID.getDirections(start);
      if (directions.length === 1) return path;
      back = dir.mirror();
      BI = back.isInAt(directions);
      if (BI !== -1) directions.splice(BI, 1);
    }
    return path;
  },
  findLengthToCrossroad: function(start, stack) {
    if (stack === null) return;
    var q = 0;
    do {
      if (stack[q] === undefined) return null;
      start = start.add(stack[q]);
      q++;
    } while (GRID.getDirections(start).length < 3);
    return q;
  },
  translateMove: function(entity, changeView = false, onFinish = null) {
    entity.actor.x += entity.MoveState.dir.x * entity.speed;
    entity.actor.y += entity.MoveState.dir.y * entity.speed;
    entity.actor.orientation = entity.actor.getOrientation(
      entity.MoveState.dir
    );
    entity.actor.animateMove(entity.actor.orientation);
    entity.MoveState.homeGrid = GRID.coordToGrid(
      entity.actor.x,
      entity.actor.y
    );

    if (changeView) {
      ENGINE.VIEWPORT.check(entity.actor);
    }

    ENGINE.VIEWPORT.alignTo(entity.actor);
    if (GRID.same(entity.MoveState.endGrid, GRID.trueToGrid(entity.actor))) {
      entity.MoveState.moving = false;
      entity.MoveState.startGrid = entity.MoveState.endGrid;
      entity.MoveState.homeGrid = entity.MoveState.endGrid;

      if (onFinish) onFinish.call();
    }
    return;
  },
  blockMove: function(entity, changeView = false) {
    let newGrid = entity.MoveState.startGrid.add(entity.MoveState.dir);
    entity.MoveState.reset(newGrid);
    GRID.gridToSprite(newGrid, entity.actor);
    entity.actor.orientation = entity.actor.getOrientation(
      entity.MoveState.dir
    );
    entity.actor.animateMove(entity.actor.orientation);

    if (changeView) {
      ENGINE.VIEWPORT.check(entity.actor);
    }
    ENGINE.VIEWPORT.alignTo(entity.actor);
  },
  teleportToGrid: function(entity, grid, changeView = false) {
    entity.MoveState.reset(grid);
    GRID.gridToSprite(grid, entity.actor);
    if (changeView) {
      ENGINE.VIEWPORT.check(entity.actor);
    }
    ENGINE.VIEWPORT.alignTo(entity.actor);
  },
  findPath: function(
    start,
    finish,
    dungeon,
    limit = ENGINE.INI.MAX_PATH,
    firstDir = new Vector(0, 0)
  ) {
    //A*
    var Q = new NodeQ("distance");
    let NodeMap = dungeon.setNodeMap("tempNodeMap");
    //let NodeMap = dungeon.setNodeMap(); //debug, set this to paint path in level editor!
    Q.list.push(new Node(start, finish, [firstDir]));
    if (Q.list[0].dist === 0) return null;
    NodeMap[start.x][start.y].distance = 0;
    var selected;
    var round = 0;
    while (Q.list.length > 0) {
      round++;
      selected = Q.list.shift();
      if (selected.path > limit) {
        selected.status = "Excess";
        selected.stack.splice(0, 1);
        return selected;
      }
      let dirs = GRID.getDirectionsFromNodeMap(selected.grid, NodeMap);
      for (let q = 0; q < dirs.length; q++) {
        let HG = selected.grid.add(dirs[q]);
        let history = [].concat(selected.history);
        history.push(HG);
        let I_stack = [].concat(selected.stack);
        I_stack.push(dirs[q]);
        let fork = new Node(
          HG,
          finish,
          I_stack,
          selected.path + 1,
          history,
          round
        );
        if (fork.dist === 0) {
          fork.stack.splice(0, 1);
          fork.status = "Found";
          return fork;
        }
        let node = NodeMap[fork.grid.x][fork.grid.y];
        if (fork.path < node.distance) {
          node.distance = fork.path;
          Q.queue(fork);
        }
      }
      if (round > ENGINE.INI.PATH_ROUNDS) {
        break;
      }
    }
    //no solution was found in ENGINE.INI.PATH_ROUNDS iterations
    if (Q.list.length > 0) {
      Q.list[0].stack.splice(0, 1);
      Q.list[0].status = "Abandoned";
      return Q.list[0];
    } else {
      selected.status = "NoSolution";
      selected.stack.splice(0, 1);
      return selected;
    }
  },

  findPathToFirstCrossroad: function(
    start,
    finish,
    firstDir = new Vector(0, 0)
  ) {
    //this legacy code will from 2.29 on, correct (function arguments)
    let path = GRID.findPath(start, finish, firstDir);
    let len = GRID.findLengthToCrossroad(start, path);
    if (len > 0) path.splice(len);
    return path;
  },
  paintGridPath: function(layer, color, path, start) {
    if (path === null) return;
    var CTX = LAYER[layer];
    ENGINE.clearLayer(layer);
    CTX.strokeStyle = color;
    var point = GRID.gridToCenterPX(start);
    point.toViewport();
    var PL = path.length;
    CTX.beginPath();
    CTX.moveTo(point.x, point.y);
    for (let q = 0; q < PL; q++) {
      point = GRID.gridToCenterPX(path[q]);
      CTX.lineTo(point.x, point.y);
      CTX.stroke();
    }
  },
  paintPath: function(layer, color, path, start, z = 0) {
    if (path === null) return;
    var CTX = LAYER[layer];
    ENGINE.clearLayer(layer);
    CTX.strokeStyle = color;
    var point = GRID.gridToCenterPX(start);
    point.toViewport();
    var PL = path.length;
    CTX.beginPath();
    CTX.moveTo(point.x + z, point.y + z);
    for (let q = 0; q < PL; q++) {
      point = point.translate(path[q]);
      CTX.lineTo(point.x + z, point.y + z);
      CTX.stroke();
    }
  },
  AI: {
    // assumes HERO is hunted entity; please refactor this!
    advancer: {
      hunt: function() {
        let next = GRID.findCrossroadAndLastDir(
          HERO.MoveState.startGrid,
          HERO.MoveState.dir
        );
        let nextCR = next.finish;
        let directions = GRID.getDirections(nextCR);
        let back = next.dir.mirror();
        let BI = back.isInAt(directions);
        if (BI !== -1) directions.splice(BI, 1);
        if (HERO.MoveState.dir.isInAt(directions) !== -1) {
          return {
            type: "grid",
            return: GRID.findCrossroad(
              nextCR.add(HERO.MoveState.dir),
              HERO.MoveState.dir
            )
          };
        } else {
          let LNs = [];
          let CRs = [];
          for (let q = 0; q < directions.length; q++) {
            CRs.push(
              GRID.findCrossroad(nextCR.add(directions[q]), directions[q])
            );
            LNs.push(CRs[q].distance(HERO.MoveState.startGrid));
          }
          let qq = LNs.indexOf(Math.min(...LNs));
          return { type: "grid", return: CRs[qq] };
        }
      }
    },
    default: {
      hunt: function() {
        return {
          type: "grid",
          return: GRID.findCrossroad(
            HERO.MoveState.startGrid,
            HERO.MoveState.dir
          )
        };
      }
    },
    shadower: {
      hunt: function(MS, tolerance) {
        let solutions = MS.endGrid.directionSolutions(HERO.MoveState.homeGrid);
        let directions = GRID.getDirections(MS.endGrid);
        let back = MS.dir.mirror();
        let BI = back.isInAt(directions);
        if (BI !== -1) directions.splice(BI, 1);
        let selected;
        if (directions.length === 1) {
          selected = directions[0];
        } else {
          if (
            MS.goingAway(HERO.MoveState) ||
            !MS.towards(HERO.MoveState, tolerance)
          ) {
            if (HERO.MoveState.dir.isInAt(directions) !== -1) {
              selected = HERO.MoveState.dir;
            } else selected = solve();
          } else {
            let contra = HERO.MoveState.dir.mirror();
            if (contra.isInAt(directions) !== -1) {
              selected = contra;
            } else selected = solve();
          }
        }
        if (!selected) {
          selected = directions.chooseRandom();
        }
        let path = GRID.pathToCrossroad(MS.endGrid, selected);
        return { type: "path", return: path };

        function solve() {
          for (let q = 0; q < 2; q++) {
            if (solutions[q].dir.isInAt(directions) !== -1)
              return solutions[q].dir;
          }
          return null;
        }
      }
    },
    follower: {
      hunt: function() {
        return {
          type: "grid",
          return: GRID.findCrossroad(
            HERO.MoveState.startGrid,
            HERO.MoveState.dir.mirror()
          )
        };
      }
    },
    wanderer: {
      hunt: function(MS, obst = []) {
        let directions = GRID.getDirections(MS.endGrid, obst);
        if (directions.length > 1) {
          let back = MS.dir.mirror();
          let BI = back.isInAt(directions);
          if (BI !== -1) directions.splice(BI, 1);
        }
        let selected = directions.chooseRandom();
        let path = GRID.pathToCrossroad(MS.endGrid, selected, obst);
        return { type: "path", return: path };
      }
    },
    keepTheDistance: {
      hunt: function(MS, reference, setDistance) {
        let directions = GRID.getDirections(
          MS.endGrid,
          MAP[GAME.level].DUNGEON.obstacles
        );
        let possible = [];
        let max = [];
        let curMax = 0;
        for (let i = 0; i < directions.length; i++) {
          let test = MS.endGrid.add(directions[i]);
          let distance = test.distanceDiagonal(reference);
          if (distance === setDistance) possible.push(directions[i]);
          if (distance > curMax) {
            max.clear();
            curMax = distance;
            max.push(directions[i]);
          } else if (distance === curMax) max.push(directions[i]);
        }
        let path;
        if (possible.length > 0) {
          path = [possible.chooseRandom()];
        } else if (max.length > 0) {
          path = [max.chooseRandom()];
        } else path = [];
        return { type: "path", return: path };
      }
    },
    circle: {
      hunt: function(MS, reference) {
        const rs = randomSign();
        const initial = MS.endGrid.direction(reference).mirror();
        let start = MS.endGrid;
        let index = initial.isInAt(ENGINE.circle);
        let path = [];
        do {
          index += rs;
          if (index >= ENGINE.circle.length) index = 0;
          if (index < 0) index = ENGINE.circle.length - 1;
          let next = reference.add(ENGINE.circle[index]);
          path.push(start.direction(next));
          start = next;
        } while (!GRID.same(start, MS.endGrid));
        return { type: "path", return: path };
      }
    }
  },
  gridToIndex: function(grid) {
    return grid.x + grid.y * MAP[GAME.level].width;
  },
  indexToGrid: function(index) {
    let x = index % MAP[GAME.level].width;
    let y = Math.floor(index / MAP[GAME.level].width);
    return new Grid(x, y);
  },
  vision: function(startGrid, endGrid) {
    if (GRID.same(startGrid, endGrid)) return true;
    let path = GRID.raycasting(startGrid, endGrid);
    return GRID.pathClear(path);
  },
  raycasting: function(startGrid, endGrid) {
    let normDir = startGrid.direction(endGrid);
    let path = [];
    path.push(Grid.toClass(startGrid));
    let x = startGrid.x;
    let y = startGrid.y;
    let dx = Math.abs(endGrid.x - x);
    let dy = -Math.abs(endGrid.y - y);
    let Err = dx + dy;
    let E2, node;
    do {
      E2 = Err * 2;
      if (E2 >= dy) {
        Err += dy;
        x += normDir.x;
      }
      if (E2 <= dx) {
        Err += dx;
        y += normDir.y;
      }
      node = new Grid(x, y);
      path.push(node);
    } while (!GRID.same(node, endGrid));
    return path;
  },
  pathClear: function(path) {
    if (path.length === 0) return true;
    for (let q = 0; q < path.length; q++) {
      if (GRID.gridIsBlock(path[q])) return false;
    }
    return true;
  },
  calcDistancesBFS_BH: function(start, dungeon) {
    dungeon.setNodeMap();
    let BH = new BinHeap("distance");
    dungeon.nodeMap[start.x][start.y].distance = 0;
    BH.insert(dungeon.nodeMap[start.x][start.y]);
    while (BH.size() > 0) {
      let node = BH.extractMax();
      for (let D = 0; D < ENGINE.directions.length; D++) {
        let nextNode =
          dungeon.nodeMap[node.grid.x + ENGINE.directions[D].x][
            node.grid.y + ENGINE.directions[D].y
          ];
        if (nextNode) {
          if (nextNode.distance > node.distance + 1) {
            nextNode.distance = node.distance + 1;
            nextNode.prev = node.grid;
            BH.insert(nextNode);
          }
        }
      }
    }
  },
  calcDistancesBFS_A: function(start, dungeon) {
    dungeon.setNodeMap();
    let Q = new NodeQ("distance");
    dungeon.nodeMap[start.x][start.y].distance = 0;
    Q.queueSimple(dungeon.nodeMap[start.x][start.y]);
    while (Q.size() > 0) {
      let node = Q.dequeue();
      for (let D = 0; D < ENGINE.directions.length; D++) {
        let nextNode =
          dungeon.nodeMap[node.grid.x + ENGINE.directions[D].x][
            node.grid.y + ENGINE.directions[D].y
          ];
        if (nextNode) {
          if (nextNode.distance > node.distance + 1) {
            nextNode.distance = node.distance + 1;
            nextNode.prev = node.grid;
            Q.queueSimple(nextNode);
          }
        }
      }
    }
  },
  pathFromNodeMap: function(origin, dungeon) {
    //origin type Grid
    let path = [];
    let prev = dungeon.nodeMap[origin.x][origin.y].prev;
    while (prev) {
      path.push(prev);
      prev = dungeon.nodeMap[prev.x][prev.y].prev;
    }
    return path;
  }
};
class Node {
  constructor(HG, goal, stack, path, history, iterations) {
    this.grid = HG;
    this.stack = stack;
    this.history = history || [HG];
    this.path = path || 0;
    this.dist = this.grid.distance(goal);
    this.priority = this.path + this.dist;
    this.status = "Progress";
    this.iterations = iterations || 0;
  }
  append(node, goal) {
    let stack = this.stack.concat(node.stack);
    let history = this.history.concat(node.history.slice(1));
    let path = this.path + node.path;
    return new Node(node.grid, goal, stack, path, history);
  }
}
class NodeQ {
  constructor(prop) {
    this.list = [];
    this.sort = prop;
  }
  dequeue() {
    return this.list.shift();
  }
  size() {
    return this.list.length;
  }
  queueSimple(node) {
    var included = false;
    for (let q = 0; q < this.list.length; q++) {
      if (node[this.sort] < this.list[q][this.sort]) {
        this.list.splice(q, 0, node);
        included = true;
        break;
      }
    }
    if (!included) this.list.push(node);
  }
  queue(node) {
    var included = false;
    for (let q = 0; q < this.list.length; q++) {
      if (node.priority < this.list[q].priority) {
        this.list.splice(q, 0, node);
        included = true;
        break;
      } else if (
        node.priority === this.list[q].priority &&
        node.dist < this.list[q].dist
      ) {
        this.list.splice(q, 0, node);
        included = true;
        break;
      }
    }
    if (!included) this.list.push(node);
  }
}
class BinHeap {
  constructor(prop) {
    this.HEAP = [];
    this.sort = prop;
  }
  size() {
    return this.HEAP.length;
  }
  parent(i) {
    return Math.floor((i - 1) / 2);
  }
  leftChild(i) {
    return 2 * i + 1;
  }
  rightChild(i) {
    return 2 * i + 2;
  }
  siftUp(i) {
    while (
      i > 0 &&
      this.HEAP[this.parent(i)][this.sort] > this.HEAP[i][this.sort]
    ) {
      this.HEAP.swap(this.parent(i), i);
      i = this.parent(i);
    }
  }
  siftDown(i) {
    let maxIndex = i;
    let L = this.leftChild(i);
    if (
      L <= this.size() - 1 &&
      this.HEAP[L][this.sort] < this.HEAP[maxIndex][this.sort]
    ) {
      maxIndex = L;
    }
    let R = this.rightChild(i);
    if (
      R <= this.size() - 1 &&
      this.HEAP[R][this.sort] < this.HEAP[maxIndex][this.sort]
    ) {
      maxIndex = R;
    }
    if (i !== maxIndex) {
      this.HEAP.swap(i, maxIndex);
      this.siftDown(maxIndex);
    }
  }
  insert(node) {
    this.HEAP.push(node);
    this.siftUp(this.size() - 1);
  }
  extractMax() {
    let result = this.HEAP[0];
    this.HEAP[0] = this.HEAP[this.size() - 1];
    this.HEAP.pop();
    this.siftDown(0);
    return result;
  }
  display() {
    while (this.size() > 0) {
      console.log(this.extractMax());
    }
  }
}
class MoveState {
  constructor(startGrid, dir) {
    this.startGrid = Grid.toClass(startGrid);
    this.dir = dir || null;
    this.homeGrid = Grid.toClass(startGrid);
    this.endGrid = Grid.toClass(startGrid);
    this.moving = false;
  }
  setEnd() {
    if (this.dir !== null) {
      this.endGrid = this.startGrid.add(this.dir);
      this.moving = true;
    }
  }
  next(dir) {
    if (dir !== null) {
      this.startGrid = this.endGrid;
      this.dir = dir;
      this.setEnd();
    }
  }
  flip() {
    this.homeGrid = this.startGrid;
    this.startGrid = this.endGrid;
    this.endGrid = this.homeGrid;
  }
  reverse() {
    this.dir = this.dir.mirror();
    this.flip();
  }
  goingAway(MS) {
    let oldDistance = this.homeGrid.distance(MS.startGrid);
    let newDistance = this.homeGrid.distance(MS.startGrid.add(MS.dir));
    return newDistance > oldDistance;
  }
  towards(MS, tolerance = 5) {
    let oldDistance = this.homeGrid.distance(MS.startGrid);
    let newDistance = this.homeGrid.distance(MS.startGrid.add(MS.dir));
    return newDistance < oldDistance && newDistance < tolerance;
  }
  closerGrid(MS) {
    if (
      this.startGrid.distance(MS.homeGrid) < this.endGrid.distance(MS.homeGrid)
    ) {
      return this.startGrid;
    } else {
      return this.endGrid;
    }
  }
  reset(grid) {
    this.startGrid = Grid.toClass(grid);
    this.homeGrid = Grid.toClass(grid);
    this.endGrid = Grid.toClass(grid);
    this.moving = false;
  }
}
var VIEW = {
  init: function() {
    VIEW.x = 0;
    VIEW.y = 0;
    VIEW.speed = 1;
    VIEW.actor = new ACTOR(null, 0, 0);
  },
  move: function(dir) {
    VIEW.actor.x += VIEW.speed * ENGINE.INI.GRIDPIX * dir.x;
    VIEW.actor.y += VIEW.speed * ENGINE.INI.GRIDPIX * dir.y;
    if (VIEW.actor.x < 0) VIEW.actor.x = 0;
    if (VIEW.actor.y < 0) VIEW.actor.y = 0;
    if (VIEW.actor.x > ENGINE.VIEWPORT.max.x)
      VIEW.actor.x = ENGINE.VIEWPORT.max.x;
    if (VIEW.actor.y > ENGINE.VIEWPORT.max.y)
      VIEW.actor.y = ENGINE.VIEWPORT.max.y;
    ENGINE.VIEWPORT.check(VIEW.actor);
    ENGINE.VIEWPORT.alignTo(VIEW.actor);
  }
};
var FORM = {
  INI: {
    DIV: "#ROOM"
  }
};
class Form {
  constructor(name, x, y, w, h, wedge) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    $(FORM.INI.DIV).append(
      `<div id = 'FORM' class = 'form'><h1>${this.name}</h1><hr></div>`
    );
    $("#FORM").css({
      top: this.y,
      left: this.x,
      width: this.w,
      height: this.h
    });
    $("#FORM").append(wedge);
    ENGINE.showMouse();
  }
}
class Inventory {
  constructor() {
    this.list = [];
  }
  add(element) {
    for (let q = 0, QL = this.list.length; q < QL; q++) {
      let item = this.list[q].object;
      if (element.id === item.id) {
        this.list[q].count++;
        return;
      }
    }
    this.list.push(new Item(element, 1));
  }
  remove(index) {
    let element = this.list[index].object;
    this.list[index].count--;
    if (this.list[index].count === 0) this.list.splice(index, 1);
    return element;
  }
  size() {
    return this.list.length;
  }
  info(index, prop) {
    return this.list[index].object[prop];
  }
  find(prop, value) {
    for (let q = 0, QL = this.list.length; q < QL; q++) {
      let item = this.list[q].object;
      if (item[prop] === value) return q;
    }
    return null;
  }
  getCount(prop, value) {
    let index = this.find(prop, value);
    if (index !== null) {
      return this.list[index].count;
    } else return 0;
  }
  display() {
    console.table("Inventory:", this.list);
  }
  stringify() {
    let list = [];
    this.list.forEach(item => {
      list.push([
        item.count,
        item.object.class,
        item.object.name,
        item.object.type,
        item.object.use
      ]);
    });
    let str = JSON.stringify(list);
    return str;
  }
  objectify(str) {
    const list = JSON.parse(str);
    list.forEach(item => {
      let className = item[2];
      let obj = eval(className);
      obj = new obj(new Grid(0, 0), item[3], item[4]);
      let count = item[1];
      do {
        this.add(obj);
        count--;
      } while (count > 0);
    });
  }
}
class Item {
  constructor(object, count) {
    this.object = object;
    this.count = count;
  }
}
class Timer {
  constructor(id) {
    this.id = id;
    this.start = Date.now();
    this.end = null;
    this.delta = 0;
    this.now = 0;
    this.runs = true;
    this.register();
    this.class = this.constructor.name;
  }
  load(template) {
    this.delta = template.delta;
  }
  update() {
    this.now = Math.round((this.delta + (Date.now() - this.start)) / 1000);
    if (this.constructor.name === "CountDown") {
      if (this.now >= this.value) this.quit();
    }
  }
  time(time) {
    if (this.runs) {
      time = (time || this.delta + (Date.now() - this.start)) / 1000;
    } else time = this.delta / 1000;
    let hours = Math.floor(time / 3600);
    let min = Math.floor((time % 3600) / 60);
    let sec = Math.floor((time % 3600) % 60);
    return {
      h: hours,
      m: min,
      s: sec
    };
  }
  timeString() {
    let time = this.time();
    let str = time.h.toString().padStart(2, "0") + ":";
    str += time.m.toString().padStart(2, "0") + ":";
    str += time.s.toString().padStart(2, "0");
    return str;
  }
  stop() {
    this.runs = false;
    this.end = Date.now();
    this.delta += this.end - this.start;
    this.start = this.end;
  }
  continue() {
    this.runs = true;
    this.start = Date.now();
    this.end = null;
  }
  register() {
    ENGINE.TIMERS.STACK.push(this);
  }
  unregister() {
    ENGINE.TIMERS.remove(this.id);
  }
}
class CountDown extends Timer {
  constructor(id, seconds, func, kwargs) {
    super(id);
    this.value = seconds;
    this.func = func;
    this.kwargs = kwargs || null;
  }
  extend(value) {
    this.value += value;
  }
  quit() {
    this.unregister();
    this.func.call(this);
  }
}
var CONSOLE = {
  id: "Console",
  set: function(id) {
    CONSOLE.id = id;
  },
  print: function(text) {
    $(`#${CONSOLE.id}`).append(`<p>${text}</p>`);
    $(`#${CONSOLE.id}`)
      .children()
      .last()[0]
      .scrollIntoView();
  }
};
class RenderData {
  constructor(font, fontSize, color, layer) {
    this.layerName = layer;
    this.layer = LAYER[layer];
    this.layer.font = `${fontSize}px ${font}`;
    this.layer.fillStyle = color;
    this.layer.textAlign = "left";
    ENGINE.resetShadow(this.layer);
    //margins
  }
}
class MovingText {
  constructor(text, speed, renderData, area) {
    this.text = text;
    this.length = this.text.length;
    this.speed = speed;
    this.RD = renderData;
    this.AREA = area;
    this.nodes = this.measureNodes();
    this.visible = null;
    this.y = Math.floor(this.AREA.h / 2) + this.AREA.x;
    this.left = this.AREA.x;
    this.right = this.AREA.x + this.AREA.w - 1;
    this.reset();
  }
  reset() {
    this.first = 0;
    this.last = 0;
    this.cursor = this.AREA.x + this.AREA.w - 1;
  }
  measureNodes() {
    let temp = [];
    let LN = this.text.length;
    let start = 0;
    for (let i = 0; i < LN; i++) {
      let char = this.text[i];
      let width = Math.ceil(this.RD.layer.measureText(char).width);
      temp.push({ char: char, offset: start, width: width });
      start += width;
    }
    return temp;
  }
  process() {
    this.visible = this.text.substr(this.first, this.last - this.first + 1);
    this.cursor -= this.speed;
    while (this.cursor + this.nodes[this.first].width <= this.left) {
      this.cursor += this.nodes[this.first].width;
      this.first++;
      if (this.first === this.length) {
        this.reset();
        return;
      }
    }
    if (this.last < this.length - 1) {
      while (
        this.cursor +
          (this.nodes[this.last].offset - this.nodes[this.first].offset) +
          this.nodes[this.last].width <
        this.right
      ) {
        this.last++;
      }
    }
    return;
  }
  draw() {
    ENGINE.clearLayer(this.RD.layerName);
    this.drawWithWidth();
  }
  drawWithWidth() {
    let x = this.cursor;
    let now = this.first;
    while (now <= this.last) {
      this.RD.layer.fillText(this.nodes[now].char, x, this.y);
      x += this.nodes[now].width;
      now++;
    }
  }
}
//END
console.log(`%cENGINE ${ENGINE.VERSION} loaded.`, ENGINE.CSS);
