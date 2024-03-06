import * as THREE from "three";
import { OrbitControls} from '../threejs/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../threejs/examples/jsm/loaders/GLTFLoader.js';
import GUI from '../threejs/examples/jsm/libs/lil-gui.module.min.js';
import * as TWEEN from "tween.js";

import * as CANNON from "../cannonjs/cannon-es.js";
import CannonDebugger from "../cannonjs/cannon-es-debugger.js";

let elThreejs = document.getElementById("threejs");
let camera,scene,renderer;

// helpers to debug
let controls;
let gui;

// show and move cube
let cubeThree,cubeThree1,cubeThree2,cubeThree3, cubeThree4, cubeThree5, cubeThree6;
let keyboard = {};

// camera follow player
let enableFollow = true;

// cannon variables
let world;
let cannonDebugger;
let timeStep = 1 / 60;
let cubeBody, planeBody;
let slipperyMaterial, groundMaterial;
let obstacleBody;
let obstaclesBodies = [];
let obstaclesMeshes = [];

init();

  //______________________________________________________
async function init() {

	scene = new THREE.Scene();

  // Set Projection
	camera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight,0.1,1000);
  camera.position.z = 100;
  camera.position.y = 5;

  // render
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

  // light
  const light = new THREE.HemisphereLight(0xffffbb, 0x080820);
  scene.add(light);

  const light2 = new THREE.DirectionalLight(0xFFFFFF, 3);
  light2.position.set( 1, 20, 6);
  scene.add(light2);
  //___________________________________________________
  // orbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.rotateSpeed = 5.0
  controls.zoomSpeed = 5.0
  controls.enablePan = false
  controls.dampingFactor = 0.2
  controls.minDistance = 10
  controls.maxDistance = 500
  controls.enabled = false

	document.body.appendChild(renderer.domElement);

  initCannon();

  addBackground();

  addPlaneBody();
  addPlane();

  addCubeBody();
  await addCube();

  addObstacleBody();
  addObstacle();

  addContactMaterials();

  addKeysListener();
	addGUI();

  animate()
}

function animate(){
	renderer.render(scene, camera);

  movePlayer();

  if (enableFollow) followPlayer();

  world.step(timeStep);
	cannonDebugger.update();

  cubeThree.position.copy(cubeBody.position);
  cubeThree.position.y = cubeBody.position.y - 1.3;
  cubeThree.quaternion.copy(cubeBody.quaternion);

  cubeThree1.position.copy(cubeBody.position);
  cubeThree1.position.y = cubeBody.position.y - 1.3;
  cubeThree1.quaternion.copy(cubeBody.quaternion);

  cubeThree2.position.copy(cubeBody.position);
  cubeThree2.position.y = cubeBody.position.y - 1.3;
  cubeThree2.quaternion.copy(cubeBody.quaternion);


  for (let i = 0; i < obstaclesBodies.length; i++) {
    obstaclesMeshes[i].position.copy(obstaclesBodies[i].position);
		obstaclesMeshes[i].quaternion.copy(obstaclesBodies[i].quaternion);
	}

	requestAnimationFrame(animate);
}

function addCubeBody(){
  let cubeShape = new CANNON.Box(new CANNON.Vec3(1,1.3,2));
  slipperyMaterial = new CANNON.Material('slippery');
  cubeBody = new CANNON.Body({ mass: 100,material: slipperyMaterial });
  cubeBody.addShape(cubeShape, new CANNON.Vec3(0,0,-1));

  const polyhedronShape = createCustomShape()
  cubeBody.addShape(polyhedronShape, new CANNON.Vec3(-1, -1.3, 1));

  // change rotation
  cubeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 180 * 180);
  
  cubeBody.position.set(0, 2, 0);

  cubeBody.linearDamping = 0.5;
  cubeBody.angularDamping = 1; // Set angularDamping to 1 to prevent rotation

  world.addBody(cubeBody);
}


async function addCube(){
  const gltfLoader = new GLTFLoader().setPath( 'src/assets/' );
	const carLoaddedd = await gltfLoader.loadAsync( 'duck.glb' );

	cubeThree = carLoaddedd.scene.children[0];
  cubeThree1 = carLoaddedd.scene.children[1];
  cubeThree2 = carLoaddedd.scene.children[2];
  
  scene.add(cubeThree);
  scene.add(cubeThree1);
  scene.add(cubeThree2);
  
}


function addPlaneBody(){
  groundMaterial = new CANNON.Material('ground')
  const planeShape = new CANNON.Box(new CANNON.Vec3(10, 0.01, 100));
	planeBody = new CANNON.Body({ mass: 0, material: groundMaterial });
	planeBody.addShape(planeShape);
	planeBody.position.set(0, 0, -90);
	world.addBody(planeBody);
}

function addPlane(){
  const texture = new THREE.TextureLoader().load( "src/assets/plane.jpg" );

  let geometry =  new THREE.BoxGeometry(20, 0, 2000);
  let material = new THREE.MeshBasicMaterial({map: texture});
  let planeThree = new THREE.Mesh(geometry, material);
  planeThree.position.set(0, 0, -90);
  scene.add(planeThree);
}

function addObstacleBody(){
  for (let i = 0; i < 5; i++) {
    let obstacleShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    obstacleBody = new CANNON.Body({ mass: 1 });
    obstacleBody.addShape(obstacleShape);
		obstacleBody.position.set(0, 5,-(i+1) * 15);

    world.addBody(obstacleBody);
    obstaclesBodies.push(obstacleBody);

  }
}

function addObstacle() {
  const radius = 1; 
  const tubeRadius = 0.7;
  const radialSegments = 16;
  const tubularSegments = 16; 

  const geometry = new THREE.TorusGeometry(radius, tubeRadius, radialSegments, tubularSegments);
  const texture = new THREE.TextureLoader().load("src/assets/donut.png");
  const material = new THREE.MeshBasicMaterial({ map: texture });

  for (let i = 0; i < 5; i++) {
    let obstacleMesh = new THREE.Mesh(geometry, material);
    scene.add(obstacleMesh);
    obstaclesMeshes.push(obstacleMesh);
  }
}



function addContactMaterials(){
  const slippery_ground = new CANNON.ContactMaterial(groundMaterial, slipperyMaterial, {
    friction: 0.00,
    restitution: 0.5, //bounciness
    contactEquationStiffness: 1e8,
    contactEquationRelaxation: 3,
  })

  // We must add the contact materials to the world
  world.addContactMaterial(slippery_ground)

}


function addKeysListener(){
  window.addEventListener('keydown', function(event){
    keyboard[event.keyCode] = true;
  } , false);
  window.addEventListener('keyup', function(event){
    keyboard[event.keyCode] = false;
  } , false);
}


let laneSwitched = false;

function movePlayer() {
  const strengthWS = 1000;
  const laneWidth = 8.5; // Adjust this value based on your desired lane width
  const maxCoordinate = 20000; // Set the maximum x-coordinate limit

  // Forward movement
  const forceForward = new CANNON.Vec3(0, 0, strengthWS);
  cubeBody.applyLocalForce(forceForward);

  // Left lane switch
  const strengthAD = 200;
  if (keyboard[65] && !laneSwitched) {
    cubeBody.position.x = Math.max(cubeBody.position.x - laneWidth, -maxCoordinate);
    laneSwitched = true; // Set the flag to true to prevent continuous sliding
  }

  // Right lane switch
  if (keyboard[68] && !laneSwitched) {
    cubeBody.position.x = Math.min(cubeBody.position.x + laneWidth, maxCoordinate);
    laneSwitched = true; // Set the flag to true to prevent continuous sliding
  }

  // Reset the lane switch flag when the key is released
  if (!keyboard[65] && !keyboard[68]) {
    laneSwitched = false;
  }

  // Limit the movement along the X axis
  cubeBody.position.x = Math.max(Math.min(cubeBody.position.x, 9), -9);

  // Limit the movement along the Y axis
  cubeBody.position.y = Math.max(Math.min(cubeBody.position.y, maxCoordinate), 0);


  // Limit the movement along the Z axis
  cubeBody.position.z = Math.max(Math.min(cubeBody.position.z, maxCoordinate / 2), -maxCoordinate / 2);
}



function followPlayer(){
  camera.position.x = cubeThree.position.x;
  camera.position.y = cubeThree.position.y + 5;
  camera.position.z = cubeThree.position.z + 10;
}


function addGUI(){
  gui = new GUI();
  const options = {
		orbitsControls: false
	}

  gui.add(options, 'orbitsControls').onChange( value => {
		if (value){
			controls.enabled = true;
			enableFollow = false;
		}else{
			controls.enabled = false;
			enableFollow = true;
		}
	});
  gui.hide();

}

function initCannon() {
	// Setup world
	world = new CANNON.World();
	world.gravity.set(0, -9.8, 0);

	initCannonDebugger();
}

function initCannonDebugger(){
  cannonDebugger = new CannonDebugger(scene, world, {
		onInit(body, mesh) {
      mesh.visible = false;
			document.addEventListener("keydown", (event) => {
			});
		},
	});
}

function createCustomShape(){
  const vertices = [
		new CANNON.Vec3(2, 0, 0),
		new CANNON.Vec3(2, 0, 2),
		new CANNON.Vec3(2, 2, 0),
		new CANNON.Vec3(0, 0, 0),
		new CANNON.Vec3(0, 0, 2),
		new CANNON.Vec3(0, 2, 0),
	]

	return new CANNON.ConvexPolyhedron({
		vertices,
		faces: [
      [3, 4, 5],
			[2, 1, 0],
			[1,2,5,4],
			[0,3,4,1],
			[0,2,5,3],
		]
	})
}

async function addBackground(){
	const gltfLoader = new GLTFLoader().setPath( 'src/assets/' );

	const domeLoaded = await gltfLoader.loadAsync( 'skydome.glb' );
	let domeMesh = domeLoaded.scene.children[0];
	 domeMesh.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 180 *90);
	domeMesh.position.set(0, -200, -90);
	domeMesh.scale.set(0.1, 0.1, 0.1);
	scene.add(domeMesh);

  const light = new THREE.DirectionalLight(0xFFFFFF, 5);
  light.position.set(0, -150, 0);
  scene.add(light);
}
