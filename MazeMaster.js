/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";
/////////////////////////////////////////////////
/*
 forked from: LevelEditor for Deep Down Into Darkness, v0.18.0
 ported to gen 3 ENGINE, GRID
      
 to do:
      
 known bugs: 

 */
////////////////////////////////////////////////////
var MAP = {
  level: {},
  DUNGEON: null,
  MAZE: null
};
var INI = {
  MAXINT: 96,
  MININT: 10,
  MAXGOLD: 99,
  MIN_BIAS: 1,
  MAX_GRID: 48,
  MIN_GRID: 8,
  FILENAME: "C00lSch00l-Maze-",
  MAXW: 794,
  MAXH: 1123,
  MAXWP: 595,
  MAXHP: 824,
  SPACE_X: 768,
  SPACE_Y: 1024
};
var PRG = {
  VERSION: "1.02.01",
  NAME: "MazeMaster",
  YEAR: "2020, 2022",
  CSS: "color: #239AFF;",
  INIT() {

    console.log("%c**************************************************************************************************************************************", PRG.CSS);
    console.log(`${PRG.NAME} ${PRG.VERSION} by Lovro Selic, (c) C00lSch00l ${PRG.YEAR} on ${navigator.userAgent}`);
    console.log("%c**************************************************************************************************************************************", PRG.CSS);
    $("#title").html(PRG.NAME);
    $("#version").html(`${PRG.NAME} V${PRG.VERSION} <span style='font-size:14px'>&copy</span> C00lSch00l ${PRG.YEAR}`);
    $("input#toggleAbout").val("About " + PRG.NAME);
    $("#about fieldset legend").append(" " + PRG.NAME + " ");

    ENGINE.autostart = true;
    ENGINE.start = PRG.start;
    ENGINE.readyCall = GAME.setup;
    ENGINE.init();
  },
  setup() {
    console.log("PRG.setup");
    $("#verticalGrid").change(GAME.updateWH);
    $("#horizontalGrid").change(GAME.updateWH);
    $("#gridsize").change(GAME.updateWH);
    $("input[name='centered']").change(function () {
      if (this.checked) {
        DUNGEON.SINGLE_CENTERED_ROOM = true;
        $("#limit_size").prop("disabled", true);
        DUNGEON.LIMIT_ROOMS = false;
        $("input[name='limit']")[0].checked = false;
      } else {
        DUNGEON.SINGLE_CENTERED_ROOM = false;
      }
    });
    $("input[name='singledoor']").change(function () {
      if (this.checked) {
        DUNGEON.SINGLE_DOOR = true;
      } else {
        DUNGEON.SINGLE_DOOR = false;
      }
    });
    $("#limit_size").change(function () {
      if (isNaN(parseInt($("#limit_size").val(), 10))) $("#limit_size").val(2);
      if (parseInt($("#limit_size").val(), 10) < 1) {
        $("#limit_size").val(1);
      }
      DUNGEON.ROOM_LIMIT = parseInt($("#limit_size").val(), 10);
    });
    $("input[name='limit']").change(function () {
      if (this.checked) {
        $("#limit_size").prop("disabled", false);
        DUNGEON.LIMIT_ROOMS = true;
        DUNGEON.ROOM_LIMIT = parseInt($("#limit_size").val(), 10);
        DUNGEON.SINGLE_CENTERED_ROOM = false;
        $("input[name='centered']")[0].checked = false;
      } else {
        $("#limit_size").prop("disabled", true);
        DUNGEON.LIMIT_ROOMS = false;
        DUNGEON.SINGLE_CENTERED_ROOM = false;
        $("input[name='centered']")[0].checked = false;
      }
    });
    $("input[name='open']").change(function () {
      if (this.checked) {
        MAZE.opened = true;
      } else {
        MAZE.opened = false;
      }
    });
    $("input[name='perfect']").change(function () {
      if (this.checked) {
        $("input[name='some']")[0].checked = false;
        $("input[name='polish']")[0].checked = false;
        MAZE.connectDeadEnds = false;
        MAZE.connectSome = false;
        MAZE.addConnections = false;
        $("input[name='conn']")[0].checked = false;
        $("#density").prop("disabled", true);
      }
    });
    $("input[name='polish']").change(function () {
      if (this.checked) {
        MAZE.connectDeadEnds = true;
        $("input[name='some']")[0].checked = false;
        $("input[name='perfect']")[0].checked = false;
      } else {
        MAZE.connectDeadEnds = false;
      }
    });
    $("input[name='glanz']").change(function () {
      if (this.checked) {
        MAZE.polishDeadEnds = true;
      } else {
        MAZE.polishDeadEnds = false;
      }
    });
    $("input[name='some']").change(function () {
      if (this.checked) {
        MAZE.connectSome = true;
        $("input[name='polish']")[0].checked = false;
        $("input[name='perfect']")[0].checked = false;
      } else {
        MAZE.connectSome = false;
      }
    });
    $("input[name='conn']").change(function () {
      if (this.checked) {
        $("input[name='perfect']")[0].checked = false;
        MAZE.addConnections = true;
        $("#density").prop("disabled", false);
      } else {
        MAZE.addConnections = false;
        $("#density").prop("disabled", true);
      }
    });
    $("input[name='bias']").change(function () {
      if (this.checked) {
        MAZE.useBias = true;
        $("#bias_size").prop("disabled", false);
      } else {
        MAZE.useBias = false;
        $("#bias_size").prop("disabled", true);
      }
    });
    $("#bias_size").change(() => {
      if (isNaN(parseInt($("#bias_size").val(), 10))) $("#bias_size").val(2);
      if ($("#bias_size").val() < 1) $("#bias_size").val(1);
      MAZE.bias = parseInt($("#bias_size").val(), 10);
    });
    $("#density").change(() => {
      if (isNaN(parseInt($("#density").val(), 10))) $("#density").val(0.5);
      if ($("#density").val() < 0) $("#density").val(0);
      if ($("#density").val() > 1) $("#density").val(1);
      MAZE.targetDensity = parseFloat($("#density").val());
    });
    $("#MIN_ROOM").change(() => {
      if (isNaN(parseInt($("#MIN_ROOM").val(), 10))) $("#MIN_ROOM").val(3);
      if ($("#MIN_ROOM").val() < 3) $("#MIN_ROOM").val(3);
      if ($("#MIN_ROOM").val() > 4) $("#MIN_ROOM").val(4);
      DUNGEON.MIN_ROOM = parseInt($("#MIN_ROOM").val(), 10);
      GAME.updateDungeonStat();
    });
    $("#MAX_ROOM").change(() => {
      if (isNaN(parseInt($("#MAX_ROOM").val(), 10))) $("#MAX_ROOM").val(3);
      if ($("#MAX_ROOM").val() < 3) $("#MAX_ROOM").val(3);
      if ($("#MAX_ROOM").val() > 10) $("#MAX_ROOM").val(10);
      DUNGEON.MAX_ROOM = parseInt($("#MAX_ROOM").val(), 10);
      GAME.updateDungeonStat();
    });
    $("#MIN_PAD").change(() => {
      if (isNaN(parseInt($("#MIN_PAD").val(), 10))) $("#MIN_PAD").val(2);
      if ($("#MIN_PAD").val() < 1) $("#MIN_PAD").val(1);
      if ($("#MIN_PAD").val() > 10) $("#MIN_PAD").val(10);
      DUNGEON.MIN_PADDING = parseInt($("#MIN_PAD").val(), 10);
      GAME.updateDungeonStat();
    });
    $("#ITERATIONS").change(() => {
      if (isNaN(parseInt($("#ITERATIONS").val(), 10))) $("#ITERATIONS").val(4);
      if ($("#ITERATIONS").val() < 2) $("#ITERATIONS").val(2);
      if ($("#ITERATIONS").val() > 10) $("#ITERATIONS").val(10);
      DUNGEON.ITERATIONS = parseInt($("#ITERATIONS").val(), 10);
      GAME.updateDungeonStat();
    });
    $("#limit_size").change(function () {
      if (isNaN(parseInt($("#limit_size").val(), 10))) $("#limit_size").val(1);
      if ($("#limit_size").val() < 1) $("#limit_size").val(1);
      if ($("#limit_size").val() > 10) $("#limit_size").val(10);
    });
    $("#leave").change(() => {
      if (isNaN(parseInt($("#leave").val(), 10))) $("#leave").val(1);
      if ($("#leave").val() < 0) $("#leave").val(0);
      if ($("#leave").val() > 40) $("#leave").val(40);
      MAZE.leaveDeadEnds = parseInt($("#leave").val(), 10);
    });
    $("#buttons").on("click", "#random", GAME.randomize);
    $("#buttons").on("click", "#dungeon", GAME.dungeon);
    $("#buttons").on("click", "#pdf", GAME.pdf);
    $("#selector input[name=renderer]").click(GAME.render);
    $("#corr").click(GAME.render);
  },
  start() {
    console.log(PRG.NAME + " started.");
    $("#startGame").addClass("hidden");
    $(document).keypress(function (event) {
      if (event.which === 32 || event.which === 13) {
        event.preventDefault();
      }
    });
    GAME.start();
  }
};
var GAME = {
  counter: 0,
  canvas: null,
  start() {
    $("#bottom")[0].scrollIntoView();
    $("#random").prop("disabled", false);
    $("#dungeon").prop("disabled", false);
    GAME.level = 1;
    //GAME.newGrid();
    GAME.started = true;
    GAME.randomize();
  },
  pacGrid() {
    let corr = $("input[name='corr']")[0].checked;
    ENGINE.resizeBOX("ROOM");
    $(ENGINE.gameWindowId).width(ENGINE.gameWIDTH + 4);
    let pac = PacGrid.gridToPacGrid(MAP.DUNGEON);
    let lw = Math.round(ENGINE.INI.GRIDPIX / 12);
    //ENGINE.PACGRID.configure(lw, "pacgrid", "#000", "#0000E0", "#0000FF");
    ENGINE.PACGRID.configure(lw, "pacgrid", "#FFF", "#000", "#666");
    ENGINE.PACGRID.draw(pac, corr);
    GAME.canvas = ENGINE.PACGRID.layer.canvas;
  },
  blockGrid() {
    let corr = $("input[name='corr']")[0].checked;
    ENGINE.resizeBOX("ROOM");
    $(ENGINE.gameWindowId).width(ENGINE.gameWIDTH + 4);
    ENGINE.BLOCKGRID.configure("pacgrid", "#FFF", "#000");
    ENGINE.BLOCKGRID.draw(MAP.DUNGEON, corr);
    GAME.canvas = ENGINE.BLOCKGRID.layer.canvas;
  },
  pdf() {
    GAME.counter++;
    let imgData = GAME.canvas.toDataURL("image/jpeg", 1.0);
    let x = Math.round((INI.MAXWP - (GAME.canvas.width / INI.MAXW) * INI.MAXWP) / 2);
    let pdf = new jsPDF("p", "pt", "a4");
    let y = Math.round((SPRITE.CD113.height / INI.MAXH) * INI.MAXHP);
    let logo = ENGINE.imgToCanvas(SPRITE.CD113).toDataURL("image/jpeg", 1.0);
    let cool = ENGINE.imgToCanvas(SPRITE.COOL).toDataURL("image/png", 1.0);
    pdf.addImage(logo, "JPEG", 0, 0);
    pdf.addImage(imgData, "JPEG", x, y);
    pdf.addImage(
      cool,
      "PNG",
      INI.MAXWP - (SPRITE.COOL.width / INI.MAXW) * INI.MAXWP - 6,
      INI.MAXHP - (SPRITE.COOL.height / INI.MAXH) * INI.MAXHP + 14
    );
    let fs = 8;
    pdf.setFontSize(fs);
    pdf.setFont("courier");
    pdf.setFontStyle("normal");
    let today = new Date();
    let date = `${today.getDate()}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getFullYear()}`;
    let text = `Maze created with ${PRG.NAME} V${PRG.VERSION} on ${date}                 www.c00lsch00l.eu`;
    pdf.text(text, 10, INI.MAXHP + fs); //pt
    pdf.save(`${INI.FILENAME + GAME.counter.toString()}.pdf`);
  },
  resize() {
    MAP.level.width = $("#horizontalGrid").val();
    MAP.level.height = $("#verticalGrid").val();
  },
  render() {
    let DEL = null;
    if (Array.isArray(MAP.DUNGEON.deadEnds)) {
      DEL = MAP.DUNGEON.deadEnds.length;
    } else DEL = MAP.DUNGEON.deadEnds.size;
    var radio = $("#selector input[name=renderer]:checked").val();
    $("#de").html(DEL);
    $("#real_density").html(MAP.DUNGEON.density);
    switch (radio) {
      case "line":
        GAME.pacGrid();
        break;

      case "block":
        GAME.blockGrid();
        break;
    }

    $("#pdf").prop("disabled", false);
  },
  randomize() {
    MAP.level.width = $("#horizontalGrid").val();
    MAP.level.height = $("#verticalGrid").val();
    var randomMaze = MAZE.create(
      MAP.level.width,
      MAP.level.height,
      new Grid(MAP.level.width / 2, MAP.level.height - 2)
    );
    console.log("creating random maze", randomMaze);
    MAP.level.grid = randomMaze.grid;
    MAP.DUNGEON = randomMaze;
    GAME.render();
  },
  dungeon() {
    var randomDungeon = DUNGEON.create(MAP.level.width, MAP.level.height);
    MAP.level.grid = randomDungeon.grid;
    MAP.DUNGEON = randomDungeon;
    console.log("creating random dungeon", MAP.DUNGEON);
    GAME.render();
  },
  updateDungeonStat() {
    DUNGEON.PAD = DUNGEON.MIN_ROOM + 2 * DUNGEON.MIN_PADDING; //minimum area
    DUNGEON.FREE = DUNGEON.MAX_ROOM + 4 * DUNGEON.MIN_PADDING; //not carving further
    $("#MIN_AREA").html(DUNGEON.PAD);
    $("#MAX_AREA").html(DUNGEON.FREE);
  },
  updateWH() {
    if (isNaN(parseInt($("#verticalGrid").val(), 10))) $("#verticalGrid").val(32);
    if (isNaN(parseInt($("#horizontalGrid").val(), 10))) $("#horizontalGrid").val(24);
    if (isNaN(parseInt($("#gridsize").val(), 10))) $("#gridsize").val(32);
    if ($("#verticalGrid").val() > INI.MAXINT)
      $("#verticalGrid").val(INI.MAXINT);
    if ($("#verticalGrid").val() < INI.MININT)
      $("#verticalGrid").val(INI.MININT);
    if ($("#horizontalGrid").val() > INI.MAXINT)
      $("#horizontalGrid").val(INI.MAXINT);
    if ($("#horizontalGrid").val() < INI.MININT)
      $("#horizontalGrid").val(INI.MININT);
    if ($("#gridsize").val() < INI.MIN_GRID) $("#gridsize").val(INI.MIN_GRID);
    if ($("#gridsize").val() > INI.MAX_GRID) $("#gridsize").val(INI.MAX_GRID);
    if ($("#gridsize").val() % 8 !== 0) {
      $("#gridsize").val(Math.floor($("#gridsize").val() / 8) * 8);
    }
    ENGINE.INI.GRIDPIX = parseInt($("#gridsize").val(), 10);
    //change grids
    if ($("#horizontalGrid").val() * ENGINE.INI.GRIDPIX > INI.SPACE_X) {
      $("#horizontalGrid").val(Math.floor(INI.SPACE_X / ENGINE.INI.GRIDPIX));
    }
    if ($("#verticalGrid").val() * ENGINE.INI.GRIDPIX > INI.SPACE_Y) {
      $("#verticalGrid").val(Math.floor(INI.SPACE_Y / ENGINE.INI.GRIDPIX));
    }

    ENGINE.gameHEIGHT = $("#verticalGrid").val() * ENGINE.INI.GRIDPIX;
    ENGINE.gameWIDTH = $("#horizontalGrid").val() * ENGINE.INI.GRIDPIX;
    $("#ENGINEgameWIDTH").html(ENGINE.gameWIDTH);
    $("#ENGINEgameHEIGHT").html(ENGINE.gameHEIGHT);
    if (GAME.started) GAME.resize();
  },
  setup() {
    console.log("GAME SETUP started");
    GAME.updateWH();
    GAME.updateDungeonStat();
    //FEED initial values to MAZE, DUNGEON
    MAZE.openDirs = [UP, DOWN];
    MAZE.opened = $("input[name='open']").attr("checked") === "checked";
    MAZE.connectSome = $("input[name='some']").attr("checked") === "checked";
    MAZE.leaveDeadEnds = parseInt($("#leave").val(), 10);
    MAZE.connectDeadEnds =
      $("input[name='polish']").attr("checked") === "checked";
    MAZE.polishDeadEnds =
      $("input[name='glanz']").attr("checked") === "checked";
    MAZE.addConnections = $("input[name='conn']").attr("checked") === "checked";
    MAZE.targetDensity = parseFloat($("#density").val());
    MAZE.bias = parseInt($("#bias_size").val(), 10);
    MAZE.useBias = $("input[name='bias']").attr("checked") === "checked";
    MAZE.storeDeadEnds = true;
    DUNGEON.MIN_ROOM = parseInt($("#MIN_ROOM").val(), 10);
    DUNGEON.MAX_ROOM = parseInt($("#MAX_ROOM").val(), 10);
    DUNGEON.MIN_PADDING = parseInt($("#MIN_PAD").val(), 10);
    DUNGEON.ITERATIONS = parseInt($("#ITERATIONS").val(), 10);
    DUNGEON.CONFIGURE = false;
    DUNGEON.SET_ROOMS = false;
    DUNGEON.SINGLE_DOOR = $("input[name='singledoor']").attr("checked") === "checked";
    DUNGEON.SINGLE_CENTERED_ROOM = $("input[name='centered']").attr("checked") === "checked";
    $("#buttons").append(
      "<input type='button' id='random' value='Random Maze'>"
    );
    $("#buttons").append(
      "<input type='button' id='dungeon' value='Random Dungeon'>"
    );
    $("#buttons").append("<input type='button' id='pdf' value='Download PDF'>");
    $("#random").prop("disabled", true);
    $("#dungeon").prop("disabled", true);
    $("#pdf").prop("disabled", true);
    $(ENGINE.gameWindowId).width(ENGINE.gameWIDTH + 4);
    ENGINE.addBOX(
      "ROOM",
      ENGINE.gameWIDTH,
      ENGINE.gameHEIGHT,
      ["pacgrid"],
      null
    );
  }
};
$(function () {
  PRG.INIT();
  PRG.setup();
  ENGINE.LOAD.preload();
});
