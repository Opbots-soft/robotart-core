// Constants
var PI = 3.14159;
var THICKNESS = 0.06;
var CIRCUM_RADIUS = 0.5774;
var INSCRIBED_RADIUS = 0.2887;

// Objects
var scene, camera, renderer, controls, drag;
var basePlat, baseLegs = [],
    upperPlat, upperLegs = [];

// Parameters
var basePlatLen = 1,
    baseLegLen = 1,
    upperPlatLen = 0.5,
    upperLegLen = 1,
    baseAngles = [];

function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3;

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
        new THREE.Vector2(-0.5, INSCRIBED_RADIUS),
        new THREE.Vector2(0.5, INSCRIBED_RADIUS),
        new THREE.Vector2(0, -CIRCUM_RADIUS)
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
    upperPlat = new THREE.Mesh(upperPlatGeo, redMat);
    upperPlat.position.z = 1.8;
    scene.add(upperPlat);

    drag = new THREE.DragControls([upperPlat], camera, renderer.domElement);
    drag.addEventListener('dragstart', () => { controls.enabled = false; });
    drag.addEventListener('dragend', () => { controls.enabled = true; });

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
        upperLegs[i].container = new THREE.Group();
        upperLegs[i].container.add(upperLegs[i]);
        baseLegs[i].add(upperLegs[i].container);
    }
    baseAngles.push(new THREE.Euler(0, 0, 0, 'ZYX'));
    baseAngles.push(new THREE.Euler(0, 0, -2 * PI / 3, 'ZYX'));
    baseAngles.push(new THREE.Euler(0, 0, 2 * PI / 3, 'ZYX'));
}

function animate() {
    requestAnimationFrame(animate);
    updateRobot()
    controls.update();
    renderer.render(scene, camera);
}

function updateRobot() {
    upperPlat.scale.x = upperPlatLen;
    upperPlat.scale.y = upperPlatLen;

    basePlat.scale.x = basePlatLen;
    basePlat.scale.y = basePlatLen;

    baseLegs[0].position.y = INSCRIBED_RADIUS * basePlatLen;

    baseLegs[1].position.x = 0.25 * basePlatLen;
    baseLegs[1].position.y = -0.1443 * basePlatLen;

    baseLegs[2].position.x = -0.25 * basePlatLen;
    baseLegs[2].position.y = -0.1443 * basePlatLen;

    for (var i = 0; i < 3; i++) {
        baseLegs[i].scale.y = baseLegLen;
        upperLegs[i].container.scale.y = 1 / baseLegLen;
        upperLegs[i].position.y = baseLegLen;
        upperLegs[i].scale.z = upperLegLen;
    }

    upperLegs[0].lookAt(upperPlat.position.x,
                        upperPlat.position.y + CIRCUM_RADIUS * upperPlatLen,
                        upperPlat.position.z);
    upperLegs[1].lookAt(upperPlat.position.x + 0.5 * upperPlatLen,
                        upperPlat.position.y - INSCRIBED_RADIUS * upperPlatLen,
                        upperPlat.position.z);
    upperLegs[2].lookAt(upperPlat.position.x - 0.5 * upperPlatLen,
                        upperPlat.position.y - INSCRIBED_RADIUS * upperPlatLen,
                        upperPlat.position.z);

    //calculateBaseAngles();
    for (var i = 0; i < 3; i++)
        baseLegs[i].quaternion.setFromEuler(baseAngles[i]);
}

function calculateBaseAngles() {
    /* https://gamedev.stackexchange.com/questions/75756/sphere-sphere-intersection-and-circle-sphere-intersection
     *
     * centerC = center of circle swept by base leg
     * centerS = center of sphere swept by upper leg about upper platform corner
     * normal = normal of plane which circle swept by base leg lies on
     * radiusP = 
     */

    for (var i = 0; i < 3; i++) {
        var centerC = baseLegs[i].position.clone();
        var centerS = upperPlat.position.clone(), normal;
        if (i == 0) {
            centerS.y += CIRCUM_RADIUS * upperPlatLen;
            normal = new THREE.Vector3(1, 0, 0);
        } else if (i == 1) {
            centerS.x += 0.5 * upperPlatLen;
            centerS.y -= INSCRIBED_RADIUS * upperPlatLen;
            normal = new THREE.Vector3(-INSCRIBED_RADIUS, -0.5, 0);
        } else if (i == 2) {
            centerS.x -= 0.5 * upperPlatLen;
            centerS.y -= INSCRIBED_RADIUS * upperPlatLen;
            normal = new THREE.Vector3(-INSCRIBED_RADIUS, 0.5, 0);
        }
        normal.normalize();

        var radiusP = normal.dot(centerC.clone().sub(centerS));
        var centerP = normal.clone().multiplyScalar(radiusP).add(centerS);
        var d2 = centerC.distanceToSquared(centerP);
        var h = 0.5 + (baseLegLen * baseLegLen - upperLegLen * upperLegLen) / (2 * d2);
        var radiusI = Math.sqrt(baseLegLen * baseLegLen - h * h * d2);
        //c_i = c_1 + h * (c_2 - c_1)
        var centerI = centerC.clone().add(centerS.clone().sub(centerC).multiplyScalar(h));
    }
}

setupScene();
setupRobot();
animate();