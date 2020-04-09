// Import the three.js module
import * as THREE from 'three';
import {OrbitControls} from "./node_modules/three/examples/jsm/controls/OrbitControls";

/* Some global settings */
const ENABLE_ORBIT_CONTROLS = true; // Enable this to move around the sphere
const DEBUG_MOUSE = false; // Enable this to see mouse movement in console.log
const DEBUG_SHOW_GRID = false;
const AUTO_ROTATE_VAL = 0.005; // Speed of sphere rotation
const SPH_PRIM_COLOR = null;
const MATERIAL_ROUGHNESS = 2;
const MATERIAL_METALNESS = 0.9;

/* Load all texture files upfront. Add files folder like /assets/texture */
const TXTR_NORM = require('./assets/texture/Slate_Rock_001_NORM.jpg');
const TXTR_ROUGH = require('./assets/texture/Slate_Rock_001_ROUGH.jpg');
const TXTR_COLOR = require('./assets/texture/Slate_Rock_001_COLOR.jpg');
const TXTR_DISP = require('./assets/texture/Slate_Rock_001_DISP.png');
const TXTR_OCCL = require('./assets/texture/Slate_Rock_001_OCC.jpg');

const TXTR_NORM2 = require('./assets/texture3/Concrete_Wall_005_Normal.jpg');
const TXTR_ROUGH2 = require('./assets/texture3/Concrete_Wall_005_Roughness.jpg');
const TXTR_COLOR2 = require('./assets/texture3/Concrete_Wall_005_Base Color.jpg');
const TXTR_OCCL2 = require('./assets/texture3/Concrete_Wall_005_Ambient Occlusion.jpg');
const TXTR_DISP2 = require('./assets/texture3/Concrete_Wall_005_Height.png');

/* Variables for world */
var scene, renderer, camera;
/* Variables for auxilary, like mouse */
var mouse, raycaster, my_sphere, _light;

/* Setting up the renderer and a few interesting global settings. */
renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio( window.devicePixelRatio );
document.body.appendChild(renderer.domElement); // Add the renderer to our HTML
mouse = new THREE.Vector2(); // Enable mouse vector

/*
    Renderer settings for shadows and lights
    Check out PhysicallyCorrectLights:
    https://threejs.org/docs/#api/en/renderers/WebGLRenderer.physicallyCorrectLights
    and https://threejs.org/examples/#webgl_lights_physical
*/
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;

/* Set up the scene */
scene = new THREE.Scene();

/* Set up single camera and make it look at scene's default position */
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 5, 20);
camera.lookAt(scene.position);

/*
    Set up several lights for our show. For spotlights I created a custom function called createSpotLight 
    Ambient light at low intensity to see the object's shine
*/
var light = new THREE.AmbientLight(0xffffff, 0.2 );
scene.add(light);

/* Create Spotlight on the right side
    x, y, z values. x = 15 moves the light to the right. A bit of y and z gives lights some nice variance.
    Last value is intensity
*/
var p_light1 = createSpotLight(0xffffff, 15, 3, 5, 900);
scene.add(p_light1);

/* Create Spotlight on the left side
    x, y, z values. x = -15 moves the light to the right. A bit of y and z gives lights some nice variance.
*/
var p_light2 = createSpotLight(0xffffff, -15, 5, 7, 900);
scene.add(p_light2);

/*
    Light on the mouse pointer for you to move. Pull in towards you (z value) by 15.
*/
var mouse_light = createSpotLight(0xffffff, 0, 0, 15, 1500);
scene.add(mouse_light);

/*
    Texture Load
    Here you only load the textures, and a few texture settings.
    It's not yet applied to your mesh.
    I am using wrong textures, but they work fine
    Texture Maps Explained - Essential for All Texture Artists: https://www.youtube.com/watch?v=ZOHNRlrd1Ak
*/
var tex_disp = new THREE.TextureLoader().load( TXTR_DISP );
tex_disp.wrapS = THREE.RepeatWrapping;
tex_disp.wrapT = THREE.RepeatWrapping;
var tex_norm = new THREE.TextureLoader().load( TXTR_NORM );
var tex_rough = new THREE.TextureLoader().load( TXTR_ROUGH );
var tex_color = new THREE.TextureLoader().load( TXTR_COLOR );
var tex_ao = new THREE.TextureLoader().load( TXTR_OCCL );

/*
    The Object: Shphere Geometry and Mesh (Standard Material)
    The magical sphere and where all settings and texures are applied.
    Keep experimenting.
    Texture Maps Explained - Essential for All Texture Artists: https://www.youtube.com/watch?v=ZOHNRlrd1Ak
*/
var geo1 = new THREE.SphereGeometry(8, 28, 28);
var material = new THREE.MeshStandardMaterial({
    color: SPH_PRIM_COLOR // Set primary color of the sphere!
});
// Apply textures
material.displacementMap = tex_disp;
material.normalMap = tex_norm;
material.roughnessMap = tex_rough;
material.bumpMap = tex_rough;
material.map = tex_color;
material.emissiveMap = tex_color;
material.aoMap = tex_ao;
// These settings can change the experience
material.roughness = MATERIAL_ROUGHNESS;
material.metalness = MATERIAL_METALNESS;

/*
    The Object: Sphere combined into something that can be added into the scene.
    What's the difference between Mesh, Geometry and Material?
*/
var sphere = new THREE.Mesh( geo1, material );
sphere.name = 'sphere';
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add( sphere ); // Finally added to the scene


/* DEBUG SETTINGS */

/*
    Obitcontrols. If available, you can control your scene
    import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
*/
if (ENABLE_ORBIT_CONTROLS) {
    new OrbitControls(camera, renderer.domElement);
}

if (DEBUG_SHOW_GRID) {
    var gridHelper = new THREE.GridHelper( 100, 20 );
    scene.add( gridHelper );
}

/* Event Listeners */
window.addEventListener('resize', onWindowResize, false);
window.addEventListener('deviceorientation', onDeviceMove, false);
document.addEventListener('mousemove', onMouseMove, false);

// On resize keep things stable
function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
}

// On mouse move, move the lights or debug mouse
function onMouseMove(event) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    mouse_light.position.x = 12 * mouse.x;
    mouse_light.position.y = 12 * mouse.y;

    if (DEBUG_MOUSE) {
        var raycaster = new THREE.Raycaster();
        var intersects = raycaster.intersectObjects(scene.children, true);
        for (var i = 0; i < intersects.length; i++){
            console.log(intersects[i]);
        }
        console.log(mouse);
        raycaster.setFromCamera(mouse, camera);
    }
}

/* This isn't working on Android and Apple. Can someone help with this? */
function onDeviceMove(event) {
    mouse_light.position.x = event.alpha * 0.4;
    mouse_light.position.y = (event.beta - 60) / 1.66;
}

/* Create light helper function */
function createSpotLight(color, x, y, z, power) {
    var _light = new THREE.SpotLight(color);
    _light.intensity = 2;
    _light.power = power;
    _light.penumbra = 0.8;
    _light.decay = 2;
    _light.position.set(x, y, z);
    _light.castShadow = true;
    return _light;
}

/* Finally render and animate */
function animate() {
    my_sphere = scene.getObjectByName('sphere');
    my_sphere.rotation.y += AUTO_ROTATE_VAL; // Slowly auto rotate
    // controls.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};
animate();