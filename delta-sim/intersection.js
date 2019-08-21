// https://gamedev.stackexchange.com/questions/75756/sphere-sphere-intersection-and-circle-sphere-intersection

/* 
 * Calculate intersection between a sphere and a circle
 * 
 * Args:    c1 - THREE.Vector3, center of sphere
 *          r1 - Number, radius of sphere
 *          c2 - THREE.Vector3, center of circle
 *          n2 - THREE.Vector3, normal of circle
 *          r2 - Number, radius of circle
 * Returns: p0 - THREE.Vector3, 1st intersection
 *          p1 - THREE.Vector3, 2nd intersection
 */
function sphere_circle(c1, r1, c2, n2, r2) {
    var d = n2.dot(c2.clone().sub(c1));
    var centerP = c1.clone().addScaledVector(n2, d);
    var radiusP = Math.sqrt(r1*r1 - d*d);

    var [centerI, normalI, radiusI] = sphere_sphere(centerP, radiusP, c2, r2);
    var tangent = centerP.clone().sub(c2).cross(n2).normalize();

    var p0 = centerI.clone().addScaledVector(tangent, radiusI);
    var p1 = centerI.clone().addScaledVector(tangent, -radiusI);

    return [p0, p1];
}

/* 
 * Calculate intersection between two spheres
 * 
 * Args:    c1 - THREE.Vector3, center of sphere
 *          r1 - Number, radius of sphere
 *          c2 - THREE.Vector3, center of sphere
 *          r2 - Number, radius of sphere
 * Returns: center - THREE.Vector3, center of intersecting circle
 *          normal - THREE.Vector3, normal of circle
 *          radius - Number, radius of circle
 */
function sphere_sphere(c1, r1, c2, r2) {
    var d2 = c2.distanceToSquared(c1);
    var h = 0.5 + (r1*r1 - r2*r2)/(2*d2);

    var center = c1.clone().addScaledVector(c2.clone().sub(c1), h);
    var radius = Math.sqrt(r1*r1 - h*h*d2);
    var normal = c1.clone().sub(c2).normalize();

    return [center, normal, radius];
}
