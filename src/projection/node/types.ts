import { Transition } from "../../types"
import { ResolvedValues, VisualElement } from "../../render/types"
import { SubscriptionManager } from "../../utils/subscription-manager"
import { Box, Delta, Point } from "../geometry/types"
import { NodeStack } from "../shared/stack"

export interface Snapshot {
    layout: Box
    visible: Box
    latestValues: ResolvedValues
    isShared?: boolean
}

export interface IProjectionNode<I = unknown> {
    id: number
    parent?: IProjectionNode
    root?: IProjectionNode
    children: Set<IProjectionNode>
    path: IProjectionNode[]
    mount: (node: I, isLayoutDirty?: boolean) => void
    unmount: () => void
    options: ProjectionNodeOptions
    setOptions(options: ProjectionNodeOptions): void
    layout?: Box
    snapshot?: Snapshot
    target?: Box
    targetWithTransforms?: Box
    scroll?: Point
    treeScale?: Point
    projectionDelta?: Delta
    latestValues: ResolvedValues
    isLayoutDirty: boolean
    shouldResetTransform: boolean
    updateBlocked: boolean
    blockUpdate(): void
    unblockUpdate(): void
    isUpdating: boolean
    startUpdate(): void
    willUpdate(notifyListeners?: boolean): void
    didUpdate(): void
    updateLayout(): void
    updateSnapshot(): void
    clearSnapshot(): void
    updateScroll(): void
    scheduleUpdateProjection(): void
    potentialNodes: Map<number, IProjectionNode>
    sharedNodes: Map<string, NodeStack>
    registerPotentialNode(id: number, node: IProjectionNode): void
    registerSharedNode(id: string, node: IProjectionNode): void
    getStack(): NodeStack | undefined
    isVisible: boolean
    hide(): void
    show(): void
    scheduleRender(): void

    setTargetDelta(delta: Delta): void
    resetTransform(): void
    resetRotation(): void
    resolveTargetDelta(): void
    calcProjection(): void
    getProjectionStyles(): ResolvedValues

    animationValues?: ResolvedValues
    setAnimationOrigin(delta: Delta): void
    startAnimation(transition: Transition): void

    // Shared element
    isLead(): boolean
    promote(): void
    relegate(): void
    resumeFrom?: IProjectionNode

    /**
     * Events
     */
    onLayoutWillUpdate: (callback: VoidFunction) => VoidFunction
    onLayoutDidUpdate: (
        callback: (data: LayoutUpdateData) => void
    ) => VoidFunction

    onLayoutMeasure: (callback: VoidFunction) => VoidFunction
    layoutDidUpdateListeners?: SubscriptionManager<LayoutUpdateHandler>
}

export interface LayoutUpdateData {
    layout: Box
    snapshot: Snapshot
    delta: Delta
    hasLayoutChanged: boolean
}

export type LayoutUpdateHandler = (data: LayoutUpdateData) => void

export interface ProjectionNodeConfig<I> {
    defaultParent?: () => IProjectionNode
    attachResizeListener?: (
        instance: I,
        notifyResize: VoidFunction
    ) => VoidFunction
    measureScroll: (instance: I) => Point
    resetTransform?: (instance: I) => void
}

export interface ProjectionNodeOptions {
    animate?: boolean
    shouldMeasureScroll?: boolean
    alwaysMeasureLayout?: boolean
    onProjectionUpdate?: VoidFunction
    onExitComplete?: VoidFunction
    animationType?: "size" | "position" | "both"
    layoutId?: string
    layout?: boolean | string
    visualElement?: VisualElement
    crossfade?: boolean
}

export type ProjectionEventName = "layoutUpdate" | "projectionUpdate"
