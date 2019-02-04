var PI = 3.14159;
var thickness = 0.08;
var scene, camera, renderer, controls;
var basePlatform, baseLegs;

function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    controls = new THREE.OrbitControls( camera );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    var ambientLight = new THREE.AmbientLight( 0xcccccc );
    scene.add( ambientLight );
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.position.set( 1, 1, 1 ).normalize();
    scene.add( directionalLight );
    scene.background = new THREE.Color( 0xffffff );

    camera.position.z = 1;
}

function setupRobot() {
    var blueMat = new THREE.MeshLambertMaterial( { color: 0x00aaff } );

    var basePlatShape = new THREE.Shape();
    basePlatShape.moveTo( -0.5, -0.3536 );
    basePlatShape.lineTo( 0.5, -0.3536 );
    basePlatShape.lineTo( 0, 0.3536 );
    basePlatShape.lineTo( -0.5, -0.3536 );
    
    var basePlatGeo = new THREE.ExtrudeBufferGeometry( basePlatShape, {steps: 2, depth: thickness, bevelEnabled: false} );
    basePlatGeo.translate(0, 0, -thickness/2);
    basePlatform = new THREE.Mesh( basePlatGeo, blueMat ) ;
    scene.add( basePlatform );
    
    var baseLegGeo = new THREE.BoxBufferGeometry( thickness, 1, thickness );
    baseLegGeo.translate(0, 0.5, -thickness/2);
    
    baseLegs = [];
    baseLegs.push(new THREE.Mesh( baseLegGeo, blueMat ));
    baseLegs[0].position.y = 0.3536;
    baseLegs[0].position.z = thickness/2;
    scene.add( baseLegs[0] );
    
    baseLegs.push(new THREE.Mesh( baseLegGeo, blueMat ));
    baseLegs[1].rotateZ(-2 * PI / 3);
    baseLegs[1].position.x = 0.5;
    baseLegs[1].position.y = -0.3536;
    baseLegs[1].position.z = thickness/2;
    scene.add( baseLegs[1] );
    
    baseLegs.push(new THREE.Mesh( baseLegGeo, blueMat ));
    baseLegs[2].rotateZ(2 * PI / 3);
    baseLegs[2].position.x = -0.5;
    baseLegs[2].position.y = -0.3536;
    baseLegs[2].position.z = thickness/2;
    scene.add( baseLegs[2] );

    addOutline( basePlatform );
    addOutline( baseLegs[0] );
    addOutline( baseLegs[1] );
    addOutline( baseLegs[2] );
}

function animate() {
    requestAnimationFrame( animate );
    controls.update();
    renderer.render( scene, camera );
}

function addOutline(object) {
    var edges_geometry = new THREE.EdgesGeometry( object.geometry );
    var edges_material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 2 } );
    var edges = new THREE.LineSegments( edges_geometry, edges_material );
    object.add( edges );
}

setupScene();
setupRobot();
animate();
