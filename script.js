"use strict";

let canvas;
let gl;
let program;
let anim = false;
let reverse = false;
let isShadingON = true;

var modelView;

let instanceMatrix;

var modelViewMatrixLoc = mat4();
var projectionMatrix = mat4();
var modelViewMatrix = mat4();
var projectionMatrixLoc = mat4();

// Initial camera parameters
var cameraPosition = [0, 0, 5];
var cameraTarget = [0, 0, 0];
var cameraUp = [0, 1, 0];

var viewMatrix = lookAt(cameraPosition, cameraTarget, cameraUp);

var axis = 0;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

let vertices = [
  vec4(-0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, 0.5, 0.5, 1.0),
  vec4(0.5, 0.5, 0.5, 1.0),
  vec4(0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, -0.5, -0.5, 1.0),
  vec4(-0.5, 0.5, -0.5, 1.0),
  vec4(0.5, 0.5, -0.5, 1.0),
  vec4(0.5, -0.5, -0.5, 1.0),
];

let torsoId = 0;
let headId = 1;
let head1Id = 1;
let head2Id = 10;
let leftUpperArmId = 2;
let leftLowerArmId = 3;
let rightUpperArmId = 4;
let rightLowerArmId = 5;
let leftUpperLegId = 6;
let leftLowerLegId = 7;
let rightUpperLegId = 8;
let rightLowerLegId = 9;

let torsoHeight = 3.0;
let torsoWidth = 2.0;
let torsoDeep = 1.0;
let upperArmHeight = 1.5;
let lowerArmHeight = 1.5;
let upperArmWidth = 1.0;
let lowerArmWidth = 1.0;
let upperLegWidth = 1.0;
let lowerLegWidth = 1.0;
let lowerLegHeight = 1.5;
let upperLegHeight = 1.5;
let headHeight = 2.0;
let headWidth = 2.0;

let numNodes = 10;
let zoomValue = 1.0;

let theta = [0, 0, 180, 0, 180, 0, 180, 0, 180, 0, 0];
let stack = [];

let figure = [];

for (let i = 0; i < numNodes; i++)
  figure[i] = createNode(null, null, null, null);

let vBuffer;
let pointsArray = [];

var ambientProduct;

var diffuseProduct;

var specularProduct;

var lightPosition = vec4(0.1, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.1, 1.0, 0.4, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 10.0;

function scale4(a, b, c) {
  let result = mat4();
  result[0][0] = a;
  result[1][1] = b;
  result[2][2] = c;
  return result;
}

function createNode(transform, render, sibling, child) {
  return {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
  };
}

function initNodes(Id) {
  let m = mat4();

  switch (Id) {
    case torsoId:
      m = rotate(theta[torsoId], 0, 1, 0);
      figure[torsoId] = createNode(m, torso, null, headId);
      break;

    case headId:
    case head1Id:
    case head2Id:
      m = translate(0.0, torsoHeight + 0.5 * headHeight, 0.0);
      m = mult(m, rotate(theta[head1Id], 1, 0, 0));
      m = mult(m, rotate(theta[head2Id], 0, 1, 0));
      m = mult(m, translate(0.0, -0.5 * headHeight, 0.0));
      figure[headId] = createNode(m, head, leftUpperArmId, null);
      break;

    case leftUpperArmId:
      m = translate(-(1.5 * upperArmWidth), torsoHeight, 0.0);
      m = mult(m, rotate(theta[leftUpperArmId], 1, 0, 0));
      figure[leftUpperArmId] = createNode(
        m,
        leftUpperArm,
        rightUpperArmId,
        leftLowerArmId
      );
      break;

    case rightUpperArmId:
      m = translate(1.5 * upperArmWidth, torsoHeight, 0.0);
      m = mult(m, rotate(theta[rightUpperArmId], 1, 0, 0));
      figure[rightUpperArmId] = createNode(
        m,
        rightUpperArm,
        leftUpperLegId,
        rightLowerArmId
      );
      break;

    case leftUpperLegId:
      m = translate(-(0.5 * upperLegWidth), 0.1 * upperLegHeight, 0.0);
      m = mult(m, rotate(theta[leftUpperLegId], 1, 0, 0));
      figure[leftUpperLegId] = createNode(
        m,
        leftUpperLeg,
        rightUpperLegId,
        leftLowerLegId
      );
      break;

    case rightUpperLegId:
      m = translate(0.5 * upperLegWidth, 0.1 * upperLegHeight, 0.0);
      m = mult(m, rotate(theta[rightUpperLegId], 1, 0, 0));
      figure[rightUpperLegId] = createNode(
        m,
        rightUpperLeg,
        null,
        rightLowerLegId
      );
      break;

    case leftLowerArmId:
      m = translate(0.0, upperArmHeight, 0.0);
      m = mult(m, rotate(theta[leftLowerArmId], 1, 0, 0));
      figure[leftLowerArmId] = createNode(m, leftLowerArm, null, null);
      break;

    case rightLowerArmId:
      m = translate(0.0, upperArmHeight, 0.0);
      m = mult(m, rotate(theta[rightLowerArmId], 1, 0, 0));
      figure[rightLowerArmId] = createNode(m, rightLowerArm, null, null);
      break;

    case leftLowerLegId:
      m = translate(0.0, upperLegHeight, 0.0);
      m = mult(m, rotate(theta[leftLowerLegId], 1, 0, 0));
      figure[leftLowerLegId] = createNode(m, leftLowerLeg, null, null);
      break;

    case rightLowerLegId:
      m = translate(0.0, upperLegHeight, 0.0);
      m = mult(m, rotate(theta[rightLowerLegId], 1, 0, 0));
      figure[rightLowerLegId] = createNode(m, rightLowerLeg, null, null);
      break;
  }
}

function traverse(Id) {
  if (Id == null) return;
  stack.push(modelViewMatrix);
  modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
  figure[Id].render();
  if (figure[Id].child != null) traverse(figure[Id].child);
  modelViewMatrix = stack.pop();
  if (figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function torso() {
  instanceMatrix = mult(
    modelViewMatrix,
    translate(0.0, 0.5 * torsoHeight, 0.0)
  );
  instanceMatrix = mult(
    instanceMatrix,
    scale4(torsoWidth, torsoHeight, torsoDeep)
  );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (let i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function head() {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0));
  instanceMatrix = mult(
    instanceMatrix,
    scale4(headWidth, headHeight, headWidth)
  );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (let i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftUpperArm() {
  instanceMatrix = mult(
    modelViewMatrix,
    translate(0.0, 0.5 * upperArmHeight, 0.0)
  );
  instanceMatrix = mult(
    instanceMatrix,
    scale4(upperArmWidth, upperArmHeight, upperArmWidth)
  );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (let i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftLowerArm() {
  instanceMatrix = mult(
    modelViewMatrix,
    translate(0.0, 0.5 * lowerArmHeight, 0.0)
  );
  instanceMatrix = mult(
    instanceMatrix,
    scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth)
  );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (let i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightUpperArm() {
  instanceMatrix = mult(
    modelViewMatrix,
    translate(0.0, 0.5 * upperArmHeight, 0.0)
  );
  instanceMatrix = mult(
    instanceMatrix,
    scale4(upperArmWidth, upperArmHeight, upperArmWidth)
  );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (let i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightLowerArm() {
  instanceMatrix = mult(
    modelViewMatrix,
    translate(0.0, 0.5 * lowerArmHeight, 0.0)
  );
  instanceMatrix = mult(
    instanceMatrix,
    scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth)
  );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (let i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftUpperLeg() {
  instanceMatrix = mult(
    modelViewMatrix,
    translate(0.0, 0.5 * upperLegHeight, 0.0)
  );
  instanceMatrix = mult(
    instanceMatrix,
    scale4(upperLegWidth, upperLegHeight, upperLegWidth)
  );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (let i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftLowerLeg() {
  instanceMatrix = mult(
    modelViewMatrix,
    translate(0.0, 0.5 * lowerLegHeight, 0.0)
  );
  instanceMatrix = mult(
    instanceMatrix,
    scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth)
  );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (let i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightUpperLeg() {
  instanceMatrix = mult(
    modelViewMatrix,
    translate(0.0, 0.5 * upperLegHeight, 0.0)
  );
  instanceMatrix = mult(
    instanceMatrix,
    scale4(upperLegWidth, upperLegHeight, upperLegWidth)
  );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  for (let i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightLowerLeg() {
  instanceMatrix = mult(
    modelViewMatrix,
    translate(0.0, 0.5 * lowerLegHeight, 0.0)
  );
  instanceMatrix = mult(
    instanceMatrix,
    scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth)
  );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  // console.log(gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix)));
  for (let i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function quad(a, b, c, d) {
  pointsArray.push(vertices[a]);
  pointsArray.push(vertices[b]);
  pointsArray.push(vertices[c]);
  pointsArray.push(vertices[d]);
}

function cube() {
  quad(1, 0, 3, 2);
  quad(2, 3, 7, 6);
  quad(3, 0, 4, 7);
  quad(6, 5, 1, 2);
  quad(4, 5, 6, 7);
  quad(5, 4, 0, 1);
}

function setTexcoords(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      // // top rung front
      32 / 63,
      20 / 63,
      32 / 63,
      32 / 63,
      40 / 63,
      32 / 63,
      32 / 63,
      32 / 63,

      40 / 63,
      32 / 63,
      40 / 63,
      20 / 63,
      20 / 63,
      20 / 63,
      20 / 63,
      32 / 63,

      28 / 63,
      20 / 63,
      20 / 63,
      32 / 63,
      28 / 63,
      32 / 63,
      28 / 63,
      20 / 63,

      20 / 63,
      20 / 63,
      20 / 63,
      32 / 63,
      28 / 63,
      20 / 63,
      20 / 63,
      32 / 63,

      28 / 63,
      32 / 63,
      28 / 63,
      20 / 63,
      20 / 63,
      20 / 63,
      20 / 63,
      32 / 63,

      28 / 63,
      20 / 63,
      20 / 63,
      32 / 63,
      28 / 63,
      32 / 63,
      28 / 63,
      20 / 63,
    ]),
    gl.STATIC_DRAW
  );
}

function requestCORSIfNotSameOrigin(img, url) {
  if (new URL(url, window.location.href).origin !== window.location.origin) {
    img.crossOrigin = "";
  }
}

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  //  Load shaders and initialize attribute buffers

  program = initShaders(gl, "vertex-shader", "fragment-shader");

  gl.useProgram(program);

  instanceMatrix = mat4();

  projectionMatrix = ortho(
    -10.0 * zoomValue,
    10.0 * zoomValue,
    -10.0 * zoomValue,
    10.0 * zoomValue,
    -30.0,
    100.0
  );
  modelViewMatrix = mat4();

  modelViewMatrix = mult(viewMatrix, modelViewMatrix);
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "modelViewMatrix"),
    false,
    flatten(modelViewMatrix)
  );
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "projectionMatrix"),
    false,
    flatten(projectionMatrix)
  );

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

  cube();
  vBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  let vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  document.getElementById("zoom").onclick = function (event) {
    zoomValue = 50.0 / event.target.value;
    init();
  };
  document.getElementById("torso").onclick = function (event) {
    theta[torsoId] = event.target.value;
    initNodes(torsoId);
  };
  document.getElementById("head1").onclick = function (event) {
    theta[head1Id] = event.target.value;
    initNodes(head1Id);
  };
  document.getElementById("head2").onclick = function (event) {
    theta[head2Id] = event.target.value;
    initNodes(head2Id);
  };
  document.getElementById("left-upper-arm").onclick = function (event) {
    theta[leftUpperArmId] = event.target.value;
    initNodes(leftUpperArmId);
  };
  document.getElementById("left-lower-arm").onclick = function (event) {
    theta[leftLowerArmId] = event.target.value;
    initNodes(leftLowerArmId);
  };
  document.getElementById("right-upper-arm").onclick = function (event) {
    theta[rightUpperArmId] = event.target.value;
    initNodes(rightUpperArmId);
  };
  document.getElementById("right-lower-arm").onclick = function (event) {
    theta[rightLowerArmId] = event.target.value;
    initNodes(rightLowerArmId);
  };
  document.getElementById("left-upper-leg").onclick = function (event) {
    theta[leftUpperLegId] = event.target.value;
    initNodes(leftUpperLegId);
  };
  document.getElementById("left-lower-leg").onclick = function (event) {
    theta[leftLowerLegId] = event.target.value;
    initNodes(leftLowerLegId);
  };
  document.getElementById("right-upper-leg").onclick = function (event) {
    theta[rightUpperLegId] = event.target.value;
    initNodes(rightUpperLegId);
  };
  document.getElementById("right-lower-leg").onclick = function (event) {
    theta[rightLowerLegId] = event.target.value;
    initNodes(rightLowerLegId);
  };
  document.getElementById("materialshininess").onchange = function () {
    materialShininess = document.getElementById("materialshininess").value;
    gl.uniform1f(
      gl.getUniformLocation(program, "shininess"),
      materialShininess
    );
  };
  document.getElementById("xlightpositions").onchange = function () {
    var x = parseFloat(document.getElementById("xlightpositions").value);
    lightPosition = vec4(x, 1.0, 1.0, 1.0);
    gl.uniform4fv(
      gl.getUniformLocation(program, "lightPosition"),
      flatten(lightPosition)
    );
  };
  document.getElementById("ylightpositions").onchange = function () {
    var y = parseFloat(document.getElementById("ylightpositions").value);
    lightPosition = vec4(1.0, y, 1.0, 1.0);
    gl.uniform4fv(
      gl.getUniformLocation(program, "lightPosition"),
      flatten(lightPosition)
    );
  };
  document.getElementById("ambientLight").onchange = function () {
    var x = parseFloat(document.getElementById("ambientLight").value);
    lightAmbient = vec4(x, x, 0.1, 1.0);
    ambientProduct = mult(lightAmbient, materialAmbient);
    gl.uniform4fv(
      gl.getUniformLocation(program, "ambientProduct"),
      flatten(ambientProduct)
    );
  };
  document.getElementById("diffuseLight").onchange = function () {
    var x = parseFloat(document.getElementById("diffuseLight").value);
    lightDiffuse = vec4(x, x, 0.1, 1.0);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    gl.uniform4fv(
      gl.getUniformLocation(program, "diffuseProduct"),
      flatten(diffuseProduct)
    );
  };
  document.getElementById("specularLight").onchange = function () {
    var x = parseFloat(document.getElementById("specularLight").value);
    lightSpecular = vec4(x, x, 0.1, 1.0);
    specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv(
      gl.getUniformLocation(program, "specularProduct"),
      flatten(specularProduct)
    );
  };
  document.getElementById("cameraX").oninput = function (event) {
    // Update camera position X based on slider value
    cameraPosition[0] = parseFloat(event.target.value);
    updateViewMatrix();
  };
  document.getElementById("cameraY").oninput = function (event) {
    // Update camera position Y based on slider value
    cameraPosition[1] = parseFloat(event.target.value);
    updateViewMatrix();
  };
  document.getElementById("cameraZ").oninput = function (event) {
    // Update camera position Z based on slider value
    cameraPosition[2] = parseFloat(event.target.value);
    updateViewMatrix();
  };
  document.getElementById("buttonX").onclick = function () {
    theta[xAxis] += 5; // Adjust the rotation angle
    initNodes(torsoId);
  };
  document.getElementById("buttonY").onclick = function () {
    theta[yAxis] += 5; // Adjust the rotation angle
    initNodes(torsoId);
  };
  document.getElementById("buttonZ").onclick = function () {
    axis = zAxis; //Rotate in z-axis
  };
  document.getElementById("StopStart").onclick = function () {
    anim = !anim;
  };

  // gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
  // gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
  // gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
  // gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
  // gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

  for (let i = 0; i < numNodes; i++) initNodes(i);

  let texcoordLocation = gl.getAttribLocation(program, "a_texcoord");
  let textureLocation = gl.getUniformLocation(program, "u_texture");
  let texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  // Set Texcoords.
  setTexcoords(gl);

  // Create a texture.
  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 255])
  );
  // Asynchronously load an image
  let image = new Image();
  let url = "imagesFile/Blue.png";
  if (isShadingON === false) url = "";
  requestCORSIfNotSameOrigin(image, url);
  image.src = url;
  image.addEventListener("load", function () {
    // Now that the image has loaded make copy it to the texture.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
  });

  // Turn on the texcoord attribute
  gl.enableVertexAttribArray(texcoordLocation);

  // bind the texcoord buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // Tell the shader to use texture unit 0 for u_texture
  gl.uniform1i(textureLocation, 0);

  // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
  let size = 2; // 2 components per iteration
  let type = gl.FLOAT; // the data is 32bit floats
  let normalize = false; // don't normalize the data
  let stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    texcoordLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );
  render();
  console.log(figure);
};

let render = function () {
  if (anim) {
    theta[torsoId]++;
    theta[axis] += 2.0;
    initNodes(torsoId);
    if (theta[torsoId] == 180) {
      reverse = true;
    }
    if (reverse) {
      theta[torsoId] -= 5;
      initNodes(torsoId);
      if (theta[torsoId] == -180) {
        reverse = false;
      }
    }
  }

  modelView = mat4();
  modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0]));
  modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0]));
  modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1]));
  let lightPositionLoc = gl.getUniformLocation(program, "lightPosition");
  gl.uniform4fv(lightPositionLoc, flatten(lightPosition));

  gl.clear(gl.COLOR_BUFFER_BIT);
  traverse(torsoId);
  requestAnimFrame(render);
};

// function changeToLoadFile(file) {
//     let data = JSON.parse(file);
//     torsoHeight = data.torsoHeight;
//     torsoWidth = data.torsoWidth;
//     upperArmHeight = data.upperArmHeight;
//     lowerArmHeight = data.lowerArmHeight;
//     upperArmWidth = data.upperArmWidth;
//     lowerArmWidth = data.lowerArmWidth;
//     upperLegWidth = data.upperLegWidth;
//     lowerLegWidth = data.lowerLegWidth;
//     lowerLegHeight = data.lowerLegHeight;
//     upperLegHeight = data.upperLegHeight;
//     headHeight = data.headHeight;
//     headWidth = data.headWidth;
//     render();
// }

// function loadGlobalData() {
//     let input = document.getElementById("load");
//     let files = input.files;

//     if (files.length == 0) return;

//     const file = files[0];

//     let reader = new FileReader();

//     reader.onload = (e) => changeToLoadFile(e.target.result);
//     reader.onerror = (e) => alert(e.target.error.name);

//     reader.readAsText(file);
// }

function myFunction() {
  var newLine = "\r\n";
  var msg = "Group 19:";
  msg += newLine;
  msg += "Kumara Ruben A/L Kumaravelloo (153053) (leader)";
  msg += newLine;
  msg += "Li Pei Ran (145141)";
  msg += newLine;
  msg += "Lee Soon Keat (158717)";
  msg += newLine;
  msg += "ZHAO RAN (155644)";
  alert(msg);
}

window.addEventListener(
  "keypress",
  function (e) {
    var key = doWhichKey(e);
    console.log("You pressed : " + key);
    if (key == "s" || key == "S") {
      //For start or stop animation
      anim = !anim;
    } else if (key == "x" || key == "X") {
      //Rotate x-axis
      axis = xAxis;
    } else if (key == "y" || key == "Y") {
      //Rotate y-axis
      axis = yAxis;
    } else if (key == "z" || key == "Z") {
      //Rotate z-axis
      axis = zAxis;
    } else {
      //If user pressed other key, nothing happened
    }
  },
  false
);

function doWhichKey(e) {
  //Detect the key that user press on keyboard
  e = e || window.event;
  let charCode = e.keyCode || e.which;
  return String.fromCharCode(charCode);
}

function lookAt(eye, at, up) {
  var n = normalize(subtract(eye, at));
  var u = normalize(cross(up, n));
  var v = cross(n, u);

  var result = mat4(
    vec4(u, -dot(u, eye)),
    vec4(v, -dot(v, eye)),
    vec4(n, -dot(n, eye)),
    vec4(0.0, 0.0, 0.0, 1.0)
  );

  return result;
}

function updateViewMatrix() {
  modelViewMatrix = mat4();
  viewMatrix = lookAt(cameraPosition, cameraTarget, cameraUp);
  modelViewMatrix = mult(viewMatrix, modelViewMatrix);
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "modelViewMatrix"),
    false,
    flatten(modelViewMatrix)
  );
}
