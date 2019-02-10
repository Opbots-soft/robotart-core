// Constants
var PI = 3.14159;
var THICKNESS = 0.06;

// Objects
var scene, camera, renderer, controls;
var basePlat, baseLegs = [],
    upperPlat, upperLegs = [];

// Parameters
var basePlatLen = 1,
    baseLegLen = 1,
    upperPlatLen = 0.7,
    upperLegLen = 1,
    baseAngles = [0, 0, 0];

function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 1;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight - 5);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    document.body.appendChild(renderer.domElement);

    var ambientLight = new THREE.AmbientLight(0xcccccc);
    scene.add(ambientLight);
    var directionalLight = new THREE.DirectionalLight(0xbbbbbb, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    directionalLight = new THREE.DirectionalLight(0xbbbbbb, 1);
    directionalLight.position.set(-1, -1, 1).normalize();
    scene.add(directionalLight);
    scene.background = new THREE.Color(0xffffff);
}

function setupRobot() {
    var blueMat = new THREE.MeshLambertMaterial({ color: 0x0088bb });
    var redMat = new THREE.MeshLambertMaterial({ color: 0xff3a3a });
    var purpleMat = new THREE.MeshLambertMaterial({ color: 0x7a5df9 });

    var triangle = new THREE.Shape();
    triangle.setFromPoints([
        new THREE.Vector2(-0.5, 0.2887),
        new THREE.Vector2(0.5, 0.2887),
        new THREE.Vector2(0, -0.5774)
    ]);
    var basePlatGeo = new THREE.ExtrudeBufferGeometry(triangle, {
        steps: 1,
        depth: THICKNESS,
        bevelEnabled: false
    });
    basePlatGeo.translate(0, 0, -THICKNESS / 2);
    basePlat = new THREE.Mesh(basePlatGeo, blueMat);
    scene.add(basePlat);

    var upperPlatGeo = new THREE.ExtrudeBufferGeometry(triangle, {
        steps: 1,
        depth: THICKNESS,
        bevelEnabled: false
    });
    upperPlatGeo.rotateX(PI);
    upperPlatGeo.translate(0, 0, THICKNESS / 2);
    upperPlat = new THREE.Mesh(upperPlatGeo, purpleMat);
    scene.add(upperPlat);

    var baseLegGeo = new THREE.BoxBufferGeometry(THICKNESS, 1, THICKNESS);
    baseLegGeo.translate(0, 0.5, -THICKNESS / 2);

    var upperLegGeo = new THREE.CylinderBufferGeometry(THICKNESS / 2, THICKNESS / 2, 1, 8);
    upperLegGeo.translate(0, 0.5, 0);
    upperLegGeo.rotateX(PI / 2);

    for (var i = 0; i < 3; i++) {
        baseLegs.push(new THREE.Mesh(baseLegGeo, redMat));
        baseLegs[i].position.z = THICKNESS / 2;
        scene.add(baseLegs[i]);
        upperLegs.push(new THREE.Mesh(upperLegGeo, blueMat));
        upperLegs[i].cont = new THREE.Group();
        upperLegs[i].cont.add(upperLegs[i]);
        baseLegs[i].add(upperLegs[i].cont);
    }
}

function animate() {
    requestAnimationFrame(animate);
    updateRobot()
    controls.update();
    renderer.render(scene, camera);
}

function updateRobot() {
    baseLegs[0].setRotationFromEuler(new THREE.Euler(baseAngles[0], 0, 0, 'ZYX'));
    baseLegs[1].setRotationFromEuler(new THREE.Euler(baseAngles[1], 0, -2 * PI / 3, 'ZYX'));
    baseLegs[2].setRotationFromEuler(new THREE.Euler(baseAngles[2], 0, 2 * PI / 3, 'ZYX'));

    upperPlat.scale.x = upperPlatLen;
    upperPlat.scale.y = upperPlatLen;

    basePlat.scale.x = basePlatLen;
    basePlat.scale.y = basePlatLen;

    baseLegs[0].position.y = 0.2887 * basePlatLen;

    baseLegs[1].position.x = 0.25 * basePlatLen;
    baseLegs[1].position.y = -0.1443 * basePlatLen;

    baseLegs[2].position.x = -0.25 * basePlatLen;
    baseLegs[2].position.y = -0.1443 * basePlatLen;

    for (var i = 0; i < 3; i++) {
        baseLegs[i].scale.y = baseLegLen;
        upperLegs[i].cont.scale.y = 1 / baseLegLen;
        upperLegs[i].position.y = baseLegLen;
        upperLegs[i].scale.z = upperLegLen;
    }
}

setupScene();
setupRobot();
animate();