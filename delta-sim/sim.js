// Constants
var PI = 3.14159;
var THICKNESS = 0.1;
var CIRCUM_RADIUS = 0.5774;
var INSCRIBED_RADIUS = 0.2887;
var UPPERPLAT_START_POS = 1.5;
var AUTO_UPDATE_MATRIX = false;

// Objects
var scene, camera, renderer, controls, drag;
var basePlat, baseLegs = [], joints = [],
    upperPlat, upperLegs = [];

// Parameters
var basePlatLen = 2,
    baseLegLen = 2,
    upperPlatLen = 1,
    upperLegLen = 2,
    baseAngles = [];

function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3;

    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight - 5);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    document.body.appendChild(renderer.domElement);

    var ambientLight = new THREE.AmbientLight(0xcccccc);
    scene.add(ambientLight);
    var directionalLight = new THREE.DirectionalLight(0xbbbbbb, 1);
    directionalLight.position.set(0, 5, -1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1000;
    directionalLight.shadow.mapSize.height = 1000;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);
    scene.background = new THREE.Color(0xffffff);

    var planeGeometry = new THREE.PlaneBufferGeometry( 100, 100, 1, 1 );
    var planeMaterial = new THREE.MeshLambertMaterial( { color: 0x777777 } )
    var plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.position.copy(new THREE.Vector3(0, -CIRCUM_RADIUS * basePlatLen - 0.5, 0));
    plane.quaternion.setFromEuler(new THREE.Euler(-PI/2, 0, 0));
    plane.updateMatrix();
    plane.receiveShadow = true;
    scene.add( plane );

    THREE.Object3D.DefaultMatrixAutoUpdate = AUTO_UPDATE_MATRIX;
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
    upperPlat.position.z = UPPERPLAT_START_POS;
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

    var jointGeometry = new THREE.SphereBufferGeometry(THICKNESS, 16, 16);
    for (var i = 0; i < 3; i++) {
        joints.push(new THREE.Mesh(jointGeometry, purpleMat));
        scene.add(joints[i]);
    }

    upperPlat.castShadow = true;
    upperPlat.receiveShadow = false;
    basePlat.castShadow = true;
    basePlat.receiveShadow = false;
    for (var i = 0; i < 3; i++) {
        baseLegs[i].castShadow = true;
        baseLegs[i].receiveShadow = false;
        upperLegs[i].castShadow = true;
        upperLegs[i].receiveShadow = false;
    }
}

function animate() {
    requestAnimationFrame(animate);
    updateRobot();
    controls.update();
    renderer.render(scene, camera);
}

function updateRobot() {
    upperPlat.scale.x = upperPlatLen;
    upperPlat.scale.y = upperPlatLen;

    basePlat.scale.x = basePlatLen;
    basePlat.scale.y = basePlatLen;

    upperPlat.updateMatrix();
    basePlat.updateMatrix();

    baseLegs[0].position.y = INSCRIBED_RADIUS * basePlatLen;

    baseLegs[1].position.x = 0.25 * basePlatLen;
    baseLegs[1].position.y = (INSCRIBED_RADIUS - CIRCUM_RADIUS)/2 * basePlatLen;

    baseLegs[2].position.x = -0.25 * basePlatLen;
    baseLegs[2].position.y = (INSCRIBED_RADIUS - CIRCUM_RADIUS)/2 * basePlatLen;

    for (var i = 0; i < 3; i++) {
        baseLegs[i].scale.y = baseLegLen;
        upperLegs[i].container.scale.y = 1 / baseLegLen;
        upperLegs[i].position.y = baseLegLen;
        upperLegs[i].scale.z = upperLegLen;
    }

    calculateBaseAngles();
    for (var i = 0; i < 3; i++) {
        baseLegs[i].quaternion.setFromEuler(baseAngles[i]);
        baseLegs[i].updateMatrix();
        upperLegs[i].container.updateMatrix();
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

    for (var i = 0; i < 3; i++) {
        upperLegs[i].updateMatrix();
        joints[i].updateMatrix();
    }
}

function calculateBaseAngles() {
    /* https://gamedev.stackexchange.com/questions/75756/sphere-sphere-intersection-and-circle-sphere-intersection
     * centerC = center of circle swept by base leg
     * centerS = center of sphere swept by upper leg about upper platform corner
     * normal = normal of plane which circle swept by base leg lies on
     * radiusP = radius of circle cut by plane through sphere
     * centerP = center of circle cut by plane through sphere
     * radiusI = half of the distance between the two intersection points
     * centerI = midpoint between the two intersection points
     * tangent = cross product of normal and vector from center of circle to center of circle cut by plane
     * point0 = intersection point with leg joint "kinked out"
     */
    var origin = new THREE.Vector3(0, 0, THICKNESS/2);
    for (var i = 0; i < 3; i++) {
        var centerC = baseLegs[i].position.clone();
        var centerS = upperPlat.position.clone();
        centerS.x += i > 0 ? (1.5 - i) * upperPlatLen : 0;
        centerS.y += i ? -INSCRIBED_RADIUS * upperPlatLen : CIRCUM_RADIUS * upperPlatLen;
        var normal = new THREE.Vector3(-baseLegs[i].position.y, baseLegs[i].position.x, 0).normalize();

        // d = dot(n, c_c - c_s)
        // c_p = c_s + d*n
        // r_p = sqrt(r_s*r_s - d*d)
        var d = normal.dot(centerC.clone().sub(centerS));
        if (Math.abs(d) > upperLegLen) continue;
        var centerP = centerS.clone().add(normal.clone().multiplyScalar(d));
        var radiusP = Math.sqrt(upperLegLen * upperLegLen - d*d);

        // h = 1/2 + (r_1 * r_1 - r_2 * r_2)/(2 * d*d)
        // r_i = sqrt(r_1*r_1 - h*h*d*d)
        // c_i = c_1 + h * (c_2 - c_1)
        var d2 = centerP.distanceToSquared(centerC);
        var h = 0.5 + (baseLegLen * baseLegLen - radiusP * radiusP)/(2 * d2);
        var radiusI = Math.sqrt(baseLegLen * baseLegLen - h * h * d2);
        var centerI =  centerC.clone().addScaledVector(centerP.clone().sub(centerC), h);

        // t = normalize(cross(c_p - c_c, n))
        // p_0 = c_i - t * r_i
        // p_1 = c_i + t * r_i
        var tangent = centerP.clone().sub(centerC).cross(normal).normalize();
        var point0 = centerI.clone().addScaledVector(tangent, -radiusI);

        joints[i].position.copy(point0);
        baseAngles[i].x = PI - point0.clone().sub(centerC).angleTo(origin.clone().sub(centerC));
    }
}

setupScene();
setupRobot();
animate();