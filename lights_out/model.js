//Refactor goals:
// 1. Make it so that you're not hardcoding in the times for setTimeout
// 2. Separate logic into model, view, and controller
// 3. Look at where you're passing cell vs. index (is it better to pass cell or index to swapColor??)
// 4. Write specs
// 5. Write code that tells the user when he/she has won!!
// 6. Share on github!

var table = document.getElementById("board");
var tds = table.getElementsByTagName("td");

var cellTypeFunctions = [topLeft, topMiddle, topRight, leftMiddle, meatyMiddle
                         , rightMiddle, bottomLeft, bottomMiddle, bottomRight];

var cellTypeStrings = ['topLeft', 'topMiddle', 'topRight', 'leftMiddle', 'meatyMiddle'
                         , 'rightMiddle', 'bottomLeft', 'bottomMiddle', 'bottomRight'];

var spinArray = [0,5,10,15,20,21,22,23,24,19,14,9,4,3,2,1,6,11,16,17,18,13,8,7,12];

window.onload = dazzle;

function dazzle() {
  for (var i = 0; i < spinArray.length; i++) {
    var index = spinArray[i];
    var cell = tds[index];
    setDelay(cell, i);
  }

  setTimeout(function() {
    makeStar()
  }, 5800);
  init();
}

function makeStar() {
  starArray = [7, 11, 12, 13, 17];
  starArray.forEach(function(e, i){
    swapColor(tds[e]);
  })
}

function setDelay(cell, i) {
  setTimeout(function() { 
    doubleSwapColor(cell, i); 
  }, i * 200);
}

function doubleSwapColor(cell, i) {
  var cellColor = cell.getAttribute("id");

  if(cellColor === 'blue') {
    turnYellow(cell);
  } else {
    turnBlue(cell);
  }

  setTimeout(function() {
    swapColor(cell);
  }, 650);
}

function swapColor(cell) {
  var cellColor = cell.getAttribute("id");
  if(cellColor === 'blue') {
    turnYellow(cell);
  } else {
    turnBlue(cell);
  }
}

var distinctCellTypes = {
  topLeft: [0]
  , topMiddle: [1,2,3]
  , topRight: [4]
  , leftMiddle: [5,10,15]
  , meatyMiddle: [6,7,8,11,12,13,16,17,18]
  , rightMiddle: [9,14,19]
  , bottomLeft: [20]
  , bottomMiddle: [21,22,23]
  , bottomRight:[24]
}

function converter(string) {
  var index = cellTypeStrings.indexOf(string);
  return cellTypeFunctions[index];
}

function init() {
  for (var i = 0; i < tds.length; i++) {
    tds[i].onclick = swapColors;
  }
}

function swapColors(eventObj) {
  var cell = eventObj.target;
  for (var i = 0; i < tds.length; i++) { 
    if(tds[i] === cell) { 
      var index = i; 
    } 
  }
  findBorderCells(cell, index);
}

function findBorderCells(cell, index) {
  for (var key in distinctCellTypes) { 
    if (distinctCellTypes[key].includes(index)) { 
      var fxnString = key;
    } 
  }
  var test = converter(fxnString);
  test(index);
}

function turnBlue(cell) {
  cell.setAttribute("id", "blue");
}

function turnYellow(cell) {
  cell.setAttribute("id", "yellow");
}

function topLeft(index) {
  var array = [tds[index], tds[index + 1], tds[index + 5]];
  array.forEach(function(cell) {
    swapColor(cell);
  })
}

function topMiddle(index) {
  var array = [tds[index], tds[index - 1], tds[index + 1], tds[index + 5]];
  array.forEach(function(cell) {
    swapColor(cell);
  })
}

function topRight(index) {
  var array = [tds[index], tds[index - 1], tds[index + 5]];
  array.forEach(function(cell) {
    swapColor(cell);
  })
}

function leftMiddle(index) {
  var array = [tds[index], tds[index + 1], tds[index + 5], tds[index - 5]];
  array.forEach(function(cell) {
    swapColor(cell);
  })  
}

function meatyMiddle(index) {
  var array = [tds[index], tds[index + 1], tds[index - 1], tds[index + 5], tds[index - 5]];
  array.forEach(function(cell) {
    swapColor(cell);
  })  
}

function rightMiddle(index) {
  var array = [tds[index], tds[index - 1], tds[index + 5], tds[index - 5]];
  array.forEach(function(cell) {
    swapColor(cell);
  })  
}

function bottomLeft(index) {
  var array = [tds[index], tds[index + 1], tds[index - 5]];
  array.forEach(function(cell) {
    swapColor(cell);
  })
}

function bottomMiddle(index) {
  var array = [tds[index], tds[index + 1], tds[index - 1], tds[index - 5]];
  array.forEach(function(cell) {
    swapColor(cell);
  })
}

function bottomRight(index) {
  var array = [tds[index], tds[index - 1], tds[index - 5]];
  array.forEach(function(cell) {
    swapColor(cell);
  })
}
