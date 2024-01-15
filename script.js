"use strict";
window.OffscreenCanvas = function () {
  throw new Error("");
};

// Declaration variable
var canvas;
var gl;
var BtnB1;

var modelView, projection;
var program;

var numVertices = 20;

var modelViewMatrixLoc = mat4();
var projectionMatrixLoc = mat4();
var modelViewMatrix = mat4();
var projectionMatrix = mat4();

//Set default rotating around x, y and z axis
var axis = 0;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var theta = [0, 0, 0];

//If flag is true, it will rotate while if false, it will pause the rotation
var flag = false;

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

//Store textures into variables
var sphereTexture, cylinderTexture, cubeTexture;
var sphereTextures, cylinderTextures, cubeTextures;
var sphereBuffers, cylinderBuffers, cubeBuffers;

function createBuffersForShape(data) {
  const normals = data.TriangleNormals;

  const points = data.TriangleVertices;

  const vertexcols = data.TriangleVertexColors;

  const textcords = data.TextureCoordinates;

  //Normal buffer
  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

  //Vertex color buffer
  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexcols), gl.STATIC_DRAW);

  //Point or vertices buffer
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  //Texture coordinates buffer
  var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(textcords), gl.STATIC_DRAW);

  return {
    nBuffer,
    cBuffer,
    vBuffer,
    tBuffer,
    numVertices: points.length,
  };
}

//Set attributes for each buffers of shape
function setAttributesForShape({ nBuffer, cBuffer, vBuffer, tBuffer }) {
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);

  //vNormal
  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  //vColor
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  //vPosition
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  //vTexCoord
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);
}

function doWhichKey(e) {
  //Detect the key that user press on keyboard
  e = e || window.event;
  let charCode = e.keyCode || e.which;
  return String.fromCharCode(charCode);
}

window.addEventListener(
  "keypress",
  function (e) {
    var key = doWhichKey(e);
    console.log("You pressed : " + key);
    if (key == "s" || key == "S") {
      //For start or stop animation
      flag = !flag;
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

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);

  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.enable(gl.DEPTH_TEST);

  //Cylinder
  var myCylinder = cylinder(72, 3, true);
  myCylinder.scale(0.3, 0.3, 0.3);
  myCylinder.rotate(45.0, [1, 1, 1]);
  myCylinder.translate(0.0, 0.0, 0.0);

  //Sphere
  var mySphere = sphere(5);
  mySphere.scale(0.25, 0.25, 0.25);
  mySphere.translate(-0.6, -0.1, 0.0);

  //Cube
  var myCube = cube(0.3);
  myCube.rotate(45.0, [1, 1, 1]);
  myCube.translate(0.7, 0.0, 0.0);

  sphereBuffers = createBuffersForShape(mySphere);
  cylinderBuffers = createBuffersForShape(myCylinder);
  cubeBuffers = createBuffersForShape(myCube);

  //Configure texture
  function createTexture(id) {
    const image = document.getElementById(id);
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.NEAREST_MIPMAP_LINEAR
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
  }

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  ambientProduct = mult(lightAmbient, materialAmbient);
  diffuseProduct = mult(lightDiffuse, materialDiffuse);
  specularProduct = mult(lightSpecular, materialSpecular);

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  sphereTextures = [
    createTexture("PictureA1"),
    createTexture("PictureA2"),
    createTexture("PictureA3"),
  ];
  cylinderTextures = [
    createTexture("PictureB1"),
    createTexture("PictureB2"),
    createTexture("PictureB3"),
  ];
  cubeTextures = [
    createTexture("PictureC1"),
    createTexture("PictureC2"),
    createTexture("PictureC3"),
  ];

  sphereTexture = sphereTextures[0];
  cubeTexture = cubeTextures[0];
  cylinderTexture = cylinderTextures[0];

  projection = ortho(-1, 1, -1, 1, -100, 100);

  document.getElementById("materialshininess").onchange = function () {
    materialShininess = document.getElementById("materialshininess").value;
    gl.uniform1f(
      gl.getUniformLocation(program, "shininess"),
      materialShininess
    );
  };

  document.getElementById("xlightpositions").onchange = function () {
    var x = document.getElementById("xlightpositions").value;
    lightPosition = vec4(x, 1.0, 1.0, 0.0);
    gl.uniform4fv(
      gl.getUniformLocation(program, "lightPosition"),
      flatten(lightPosition)
    );
  };
  document.getElementById("ylightpositions").onchange = function () {
    var y = document.getElementById("ylightpositions").value;
    lightPosition = vec4(1.0, y, 1.0, 0.0);
    gl.uniform4fv(
      gl.getUniformLocation(program, "lightPosition"),
      flatten(lightPosition)
    );
  };

  document.getElementById("ambientLight").onchange = function () {
    var x = document.getElementById("ambientLight").value;
    lightAmbient = vec4(x, x, 0.1, 1.0);
    ambientProduct = mult(lightAmbient, materialAmbient);
    gl.uniform4fv(
      gl.getUniformLocation(program, "ambientProduct"),
      flatten(ambientProduct)
    );
  };

  document.getElementById("diffuseLight").onchange = function () {
    var x = document.getElementById("diffuseLight").value;
    lightDiffuse = vec4(x, x, 0.1, 1.0);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    gl.uniform4fv(
      gl.getUniformLocation(program, "diffuseProduct"),
      flatten(diffuseProduct)
    );
  };

  document.getElementById("specularLight").onchange = function () {
    var x = document.getElementById("specularLight").value;
    lightSpecular = vec4(x, x, 0.1, 1.0);
    specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv(
      gl.getUniformLocation(program, "specularProduct"),
      flatten(specularProduct)
    );
  };

  //Sphere

  document.getElementById("BtnA1").onclick = function () {
    sphereTexture = sphereTextures[0];
    //football texture
  };

  document.getElementById("BtnA2").onclick = function () {
    sphereTexture = sphereTextures[1];
    //moon texture
  };
  document.getElementById("BtnA3").onclick = function () {
    sphereTexture = sphereTextures[2];
    //sun texture
  };

  //Cylinder
  document.getElementById("BtnB1").onclick = function () {
    cylinderTexture = cylinderTextures[0];
    //battery texture
  };
  document.getElementById("BtnB2").onclick = function () {
    cylinderTexture = cylinderTextures[1];
    //can texture
  };
  document.getElementById("BtnB3").onclick = function () {
    cylinderTexture = cylinderTextures[2];
    //tissue texture
  };

  //Cube
  document.getElementById("BtnC1").onclick = function () {
    cubeTexture = cubeTextures[0];
    //dice texture
  };
  document.getElementById("BtnC2").onclick = function () {
    cubeTexture = cubeTextures[1];
    //gift texture
  };
  document.getElementById("BtnC3").onclick = function () {
    cubeTexture = cubeTextures[2];
    //rubic cube texture
  };

  document.getElementById("buttonX").onclick = function () {
    axis = xAxis; //Rotate in x-axis
  };
  document.getElementById("buttonY").onclick = function () {
    axis = yAxis; //Rotate in y-axis
  };
  document.getElementById("buttonZ").onclick = function () {
    axis = zAxis; //Rotate in z-axis
  };

  document.getElementById("StopStart").onclick = function () {
    flag = !flag;
  };

  //Getting the information and the value of the lightig and shading for object
  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition)
  );
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

  //Render the canvas per frame
  render();
};

function drawShape(shapeBuffers, texture) {
  setAttributesForShape(shapeBuffers);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.drawArrays(gl.TRIANGLES, 0, shapeBuffers.numVertices);
}

//Program generation function
var render = function () {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "projectionMatrix"),
    false,
    flatten(projection)
  );

  if (flag) theta[axis] += 2.0;

  modelView = mat4();
  modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0]));
  modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0]));
  modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1]));

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelView));

  drawShape(cylinderBuffers, cylinderTexture);
  drawShape(cubeBuffers, cubeTexture);
  drawShape(sphereBuffers, sphereTexture);

  requestAnimFrame(render);
};

// init();
