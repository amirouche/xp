var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);


var geometry = new THREE.BoxGeometry(2, 1, 1);
var material = new THREE.MeshLambertMaterial({ color: 0x00ff00});
var cube = new THREE.Mesh(geometry, material);

scene.add(cube);


var ambientLight = new THREE.AmbientLight( 0x000000 );
scene.add( ambientLight );

var lights = [];
lights[0] = new THREE.PointLight( 0xffffff, 1, 0 );
lights[1] = new THREE.PointLight( 0xffffff, 1, 0 );
lights[2] = new THREE.PointLight( 0xffffff, 1, 0 );

lights[0].position.set( 0, 200, 0 );
lights[1].position.set( 100, 200, 100 );
lights[2].position.set( -100, -200, -100 );

scene.add( lights[0] );
scene.add( lights[1] );
scene.add( lights[2] );
camera.position.z = 5;


document.body.appendChild(renderer.domElement);



function render() {
    requestAnimationFrame( render );
    renderer.render( scene, camera );
    cube.rotation.x += 0.01; cube.rotation.y += 0.01;
}

render();
