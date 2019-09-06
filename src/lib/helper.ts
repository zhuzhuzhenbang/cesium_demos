import { Debug } from "./debug";

export class Helper {
    static clamp3dtilesToGround(viewer: Cesium.Viewer, tileset: Cesium.Cesium3DTileset, boundingSphere: Cesium.BoundingSphere, callBack?: (tilest: Cesium.Cesium3DTileset) => void) {
        viewer.scene.camera.lookAt(boundingSphere.center, new Cesium.Cartesian3(0, 0, boundingSphere.radius));
        let checked = false;
        tileset.allTilesLoaded.addEventListener(() => {
            if (!checked) {
                checked = true;
                let lowestheight = this.pickLowestPostion(viewer, boundingSphere);
                let surfaceNormal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(boundingSphere.center);
                let translationb = Cesium.Cartesian3.multiplyByScalar(surfaceNormal, -lowestheight, new Cesium.Cartesian3());
                tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translationb);
                if (callBack != null) {
                    callBack(tileset);
                }
            }
        });
    }

    static pickLowestPostion(viewer: Cesium.Viewer, boundingSpere: Cesium.BoundingSphere) {
        let plane = new Cesium.EllipsoidTangentPlane(boundingSpere.center, Cesium.Ellipsoid.WGS84);
        let lowestheight = Number.POSITIVE_INFINITY;
        let func = (halfCount, dir, origin) => {
            for (let i = -1 * halfCount; i < halfCount; i += 2) {
                let offset = Cesium.Cartesian3.multiplyByScalar(dir, i, new Cesium.Cartesian3());
                let samplePos = Cesium.Cartesian3.add(offset, origin, new Cesium.Cartesian3());
                let res = this.pickPosByNormalDir(samplePos, viewer);
                if (res != null && res.object != null) {
                    let height = Cesium.Cartographic.fromCartesian(res.position).height;
                    if (height < lowestheight) {
                        lowestheight = height;
                    }
                    // Debug.addSpriteMark(res.position, viewer);
                }
            }
        }
        //------------------xaxis yaxis 采样一遍
        func(Math.round(boundingSpere.radius), plane.xAxis, plane.origin);
        func(Math.round(boundingSpere.radius), plane.yAxis, plane.origin);

        if (lowestheight < Number.POSITIVE_INFINITY) {
            return lowestheight + (lowestheight > 0 ? - 0.2 : 0.2);
        } else {
            return null;
        }
    }

    static pickPosByNormalDir(samplePos: Cesium.Cartesian3, viewer: Cesium.Viewer) {
        let normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(samplePos, new Cesium.Cartesian3());
        normal = Cesium.Cartesian3.negate(normal, normal);
        let car = Cesium.Cartographic.fromCartesian(samplePos);
        let origin = Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, car.height + 1000);
        let res = viewer.scene.pickFromRay(new Cesium.Ray(origin, normal), []);
        return res;
    }


    static rotationTo(from: Cesium.Cartesian3, to: Cesium.Cartesian3, out: Cesium.Quaternion = new Cesium.Quaternion()): Cesium.Quaternion {
        let tmpVec3 = new Cesium.Cartesian3();
        let xUnitVec3 = Cesium.Cartesian3.UNIT_X;
        let yUnitVec3 = Cesium.Cartesian3.UNIT_Y;

        let dot = Cesium.Cartesian3.dot(from, to);
        if (dot < -0.999999) {
            Cesium.Cartesian3.cross(tmpVec3, xUnitVec3, from);
            if (Cesium.Cartesian3.magnitude(tmpVec3) < 0.000001) Cesium.Cartesian3.cross(tmpVec3, yUnitVec3, from);
            Cesium.Cartesian3.normalize(tmpVec3, tmpVec3);
            Cesium.Quaternion.fromAxisAngle(tmpVec3, Math.PI, out);
            return out;
        } else if (dot > 0.999999) {
            out.x = 0;
            out.y = 0;
            out.z = 0;
            out.w = 1;
            return out;
        } else {
            Cesium.Cartesian3.cross(tmpVec3, from, to);
            out.x = tmpVec3.x;
            out.y = tmpVec3.y;
            out.z = tmpVec3.z;
            out.w = 1 + dot;
            return Cesium.Quaternion.normalize(out, out);
        }
    }

    static unitxyzToRotation(xAxis: Cesium.Cartesian3, yAxis: Cesium.Cartesian3, zAxis: Cesium.Cartesian3, out: Cesium.Quaternion) {
        var m11 = xAxis.x, m12 = yAxis.x, m13 = zAxis.x;
        var m21 = xAxis.y, m22 = yAxis.y, m23 = zAxis.y;
        var m31 = xAxis.z, m32 = yAxis.z, m33 = zAxis.z;
        var trace = m11 + m22 + m33;
        var s;
        if (trace > 0) {

            s = 0.5 / Math.sqrt(trace + 1.0);

            out.w = 0.25 / s;
            out.x = (m32 - m23) * s;
            out.y = (m13 - m31) * s;
            out.z = (m21 - m12) * s;
        } else if (m11 > m22 && m11 > m33) {

            s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

            out.w = (m32 - m23) / s;
            out.x = 0.25 * s;
            out.y = (m12 + m21) / s;
            out.z = (m13 + m31) / s;
        } else if (m22 > m33) {

            s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

            out.w = (m13 - m31) / s;
            out.x = (m12 + m21) / s;
            out.y = 0.25 * s;
            out.z = (m23 + m32) / s;
        } else {

            s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

            out.w = (m21 - m12) / s;
            out.x = (m13 + m31) / s;
            out.y = (m23 + m32) / s;
            out.z = 0.25 * s;
        }
        return out;
    }


}