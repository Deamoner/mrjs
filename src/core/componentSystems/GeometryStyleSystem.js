import { MRSystem } from 'mrjs/core/MRSystem';
import { MRDivEntity } from 'mrjs/core/MRDivEntity';
import { MREntity } from 'mrjs/core/MREntity';
import { MRPanel } from 'mrjs/core/entities/MRPanel';
import { MRButton } from 'mrjs/core/entities/MRButton';
import { MRImage } from 'mrjs/core/entities/MRImage';
import { MRModel } from 'mrjs/core/entities/MRModel';

/**
 * @class GeometryStyleSystem
 * @classdesc Handles geometry updates for all items.
 * @augments MRSystem
 */
export class GeometryStyleSystem extends MRSystem {
    /**
     * @class
     * @description StyleSystem's default constructor with a starting framerate of 1/30.
     */
    constructor() {
        super(false);
    }

    /**
     * @function
     * @description The generic system update call. Handles updating all 3D items to match whatever geometry/style is expected whether that be a 2D setup or a 3D change.
     * @param {number} deltaTime - given timestep to be used for any feature changes
     * @param {object} frame - given frame information to be used for any feature changes
     */
    update(deltaTime, frame) {
        for (const entity of this.registry) {
            if (!entity.needsGeometryUpdate) {
                return;
            }

            // Only want to dispatch if anything was actually updated
            // in this iteration.
            let changed = false;

            // Anything needed for mrjs defined entities - the order of the below matters
            if (entity instanceof MRDivEntity) {
                changed = this.setUpdatedBorder(entity);
            }
            changed = this.setScale(entity);
            if (entity instanceof MRImage) {
                changed = this.setUpdatedImagePlane(entity);
                changed = this.fixImagePlaneForZIndex(entity);
            }

            // User additional - Main Entity Style Change
            if (entity instanceof MREntity) {
                changed = entity.updateGeometryStyle();
            }
            
            // Cleanup
            if (changed) {
                // TBH i think this is only needed for scale, but just in case others use changed
                // width/height for anything else, and update is required for children as well
                entity.dispatchEvent(new CustomEvent('child-updated', { bubbles: true }));
            }
            if (!entity.alwaysNeedsGeometryUpdate) {
                entity.needsGeometryUpdate = false;
            }
        }
    }

    /**
     * @function
     * @description Called when a new entity is added to the scene. Adds said new entity to the style's system registry.
     * @param {MREntity} entity - the entity being added.
     */
    onNewEntity(entity) {
        this.registry.add(entity);
    }

    setScale(entity) {
        let new_scale = entity.compStyle.scale != 'none'
            ? parseFloat(entity.compStyle.scale) * mrjsUtils.app.scale
            : 1;
        if (new_scale != entity.object3D.scale) {
            entity.object3D.scale.setScalar(new_scale);
            return true;
        }
        return false;
    }

    /**
     * @function
     * @description Sets the border of the UI based on compStyle and inputted css elements.
     */
    setUpdatedBorder(entity) {
        // geometry will only update if width, height, or borderRadii have changed
        let w = entity.width;
        let h = entity.height;
        let b = entity.borderRadii;
        if (entity._storedWidth != w || entity._storedHeight != h || entity._storedBorderRadii != b) {
            entity._storedWidth = w;
            entity._storedHeight = h;
            entity._storedBorderRadii = b;
        } else {
            // no update needed
            return false;
        }

        if (entity.background.geometry !== undefined) {
            entity.background.geometry.dispose();
        }
        entity.background.geometry = mrjsUtils.geometry.UIPlane(w, h, b, 18);

        return true;
    }

    setUpdatedImagePlane(entity) {
        entity.computeImageObject3DFitDimensions();

        // geometry will only update if width, height, or borderRadii have changed
        let w = entity.width;
        let h = entity.height;
        let b = entity.borderRadii;
        if (entity._storedWidth != w || entity._storedHeight != h || entity._storedBorderRadii != b) {
            entity._storedWidth = w;
            entity._storedHeight = h;
            entity._storedBorderRadii = b;
        } else {
            // no update needed
            return false;
        }

        if (entity.object3D.geometry !== undefined) {
            entity.object3D.geometry.dispose();
        }
        entity.object3D.geometry = mrjsUtils.geometry.UIPlane(w, h, b, 18);

        return true;
    }

    fixImagePlaneForZIndex(entity) {
        // Since we potentially updated the background plane and the image plane itself,
        // we need to make sure the image plane is bumped forward a little bit
        //
        // entity.object3D is the image itself.
        if (entity.object3D.position.z == entity.background.position.z) {
            entity.object3D.position.z += 0.0001;
            return true;
        }
        return false;
    }
}
