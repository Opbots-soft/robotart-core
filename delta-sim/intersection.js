// Author: Kausik Krishnakumar (2019)
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
    let d = n2.dot(c2.clone().sub(c1));
    let centerP = c1.clone().addScaledVector(n2, d);
    let radiusP = Math.sqrt(r1*r1 - d*d);

    let [centerI, normalI, radiusI] = sphere_sphere(centerP, radiusP, c2, r2);
    let tangent = centerP.clone().sub(c2).cross(n2).normalize();

    let p0 = centerI.clone().addScaledVector(tangent, radiusI);
    let p1 = centerI.clone().addScaledVector(tangent, -radiusI);

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
    let d2 = c2.distanceToSquared(c1);
    let h = 0.5 + (r1*r1 - r2*r2)/(2*d2);

    let center = c1.clone().addScaledVector(c2.clone().sub(c1), h);
    let radius = Math.sqrt(r1*r1 - h*h*d2);
    let normal = c1.clone().sub(c2).normalize();

    return [center, normal, radius];
}
