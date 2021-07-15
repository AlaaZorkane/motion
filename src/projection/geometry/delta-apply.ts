import { IProjectionNode } from "../node/types"
import { Axis, Box, Delta, Point } from "./types"

/**
 * Scales a point based on a factor and an originPoint
 */
export function scalePoint(point: number, scale: number, originPoint: number) {
    const distanceFromOrigin = point - originPoint
    const scaled = scale * distanceFromOrigin
    return originPoint + scaled
}

/**
 * Applies a translate/scale delta to a point
 */
export function applyPointDelta(
    point: number,
    translate: number,
    scale: number,
    originPoint: number,
    boxScale?: number
): number {
    if (boxScale !== undefined) {
        point = scalePoint(point, boxScale, originPoint)
    }

    return scalePoint(point, scale, originPoint) + translate
}

/**
 * Applies a translate/scale delta to an axis
 */
export function applyAxisDelta(
    axis: Axis,
    translate: number = 0,
    scale: number = 1,
    originPoint: number,
    boxScale?: number
): void {
    axis.min = applyPointDelta(
        axis.min,
        translate,
        scale,
        originPoint,
        boxScale
    )

    axis.max = applyPointDelta(
        axis.max,
        translate,
        scale,
        originPoint,
        boxScale
    )
}

/**
 * Applies a translate/scale delta to a box
 */
export function applyBoxDelta(box: Box, { x, y }: Delta): void {
    applyAxisDelta(box.x, x.translate, x.scale, x.originPoint)
    applyAxisDelta(box.y, y.translate, y.scale, y.originPoint)
}

/**
 * Apply a tree of deltas to a box. We do this to calculate the effect of all the transforms
 * in a tree upon our box before then calculating how to project it into our desired viewport-relative box
 *
 * This is the final nested loop within updateLayoutDelta for future refactoring
 */
export function applyTreeDeltas(
    box: Box,
    treeScale: Point,
    treePath: IProjectionNode[]
) {
    const treeLength = treePath.length
    if (!treeLength) return

    // Reset the treeScale
    treeScale.x = treeScale.y = 1

    let node: IProjectionNode
    let delta: Delta | undefined

    for (let i = 0; i < treeLength; i++) {
        node = treePath[i]
        delta = node.projectionDelta

        if (!delta) continue

        // Incoporate each ancestor's scale into a culmulative treeScale for this component
        treeScale.x *= delta.x.scale
        treeScale.y *= delta.y.scale

        // Apply each ancestor's calculated delta into this component's recorded layout box
        applyBoxDelta(box, delta)
    }
}
