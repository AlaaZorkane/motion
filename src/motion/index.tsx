import * as React from "react"
import { forwardRef, useContext } from "react"
import { MotionProps } from "./types"
import { RenderComponent, FeatureBundle } from "./features/types"
import { useFeatures } from "./features/use-features"
import { MotionConfigContext } from "../context/MotionConfigContext"
import { MotionContext } from "../context/MotionContext"
import { CreateVisualElement } from "../render/types"
import { useVisualElement } from "./utils/use-visual-element"
import { UseVisualState } from "./utils/use-visual-state"
import { useMotionRef } from "./utils/use-motion-ref"
import { useCreateMotionContext } from "../context/MotionContext/create"
import { loadFeatures } from "./features/definitions"
import { isBrowser } from "../utils/is-browser"
import { useProjectionId } from "../projection/node/id"
import { LayoutGroupContext } from "../context/LayoutGroupContext"

export interface MotionComponentConfig<Instance, RenderState> {
    preloadedFeatures?: FeatureBundle
    createVisualElement?: CreateVisualElement<Instance>
    useRender: RenderComponent<Instance, RenderState>
    useVisualState: UseVisualState<Instance, RenderState>
    Component: string | React.ComponentType
}

/**
 * Create a `motion` component.
 *
 * This function accepts a Component argument, which can be either a string (ie "div"
 * for `motion.div`), or an actual React component.
 *
 * Alongside this is a config option which provides a way of rendering the provided
 * component "offline", or outside the React render cycle.
 *
 * @internal
 */
export function createMotionComponent<Props extends {}, Instance, RenderState>({
    preloadedFeatures,
    createVisualElement,
    useRender,
    useVisualState,
    Component,
}: MotionComponentConfig<Instance, RenderState>) {
    preloadedFeatures && loadFeatures(preloadedFeatures)

    function MotionComponent(
        props: Props & MotionProps,
        externalRef?: React.Ref<Instance>
    ) {
        const layoutId = useLayoutId(props)
        props = { ...props, layoutId }
        /**
         * If we're rendering in a static environment, we only visually update the component
         * as a result of a React-rerender rather than interactions or animations. This
         * means we don't need to load additional memory structures like VisualElement,
         * or any gesture/animation features.
         */
        const { isStatic } = useContext(MotionConfigContext)

        let features: JSX.Element[] | null = null

        /**
         * Create the tree context. This is memoized and will only trigger renders
         * when the current tree variant changes in static mode.
         */
        const context = useCreateMotionContext(props, isStatic)

        /**
         * Create a unique projection ID for this component. If a new component is added
         * during a layout animation we'll use this to query the DOM and hydrate its ref early, allowing
         * us to measure it as soon as any layout effect flushes pending layout animations.
         *
         * Performance note: It'd be better not to have to search the DOM for these elements.
         * For newly-entering components it could be enough to only correct treeScale, in which
         * case we could mount in a scale-correction mode. This wouldn't be enough for
         * shared element transitions however. Perhaps for those we could revert to a root node
         * that gets forceRendered and layout animations are triggered on its layout effect.
         */
        const projectionId = useProjectionId()

        /**
         *
         */
        const visualState = useVisualState(props, isStatic)

        if (!isStatic && isBrowser) {
            /**
             * Create a VisualElement for this component. A VisualElement provides a common
             * interface to renderer-specific APIs (ie DOM/Three.js etc) as well as
             * providing a way of rendering to these APIs outside of the React render loop
             * for more performant animations and interactions
             */
            context.visualElement = useVisualElement(
                Component,
                visualState,
                props,
                createVisualElement
            )

            /**
             * Load Motion gesture and animation features. These are rendered as renderless
             * components so each feature can optionally make use of React lifecycle methods.
             *
             * TODO: The intention is to move these away from a React-centric to a
             * VisualElement-centric lifecycle scheme.
             */
            features = useFeatures(
                props,
                projectionId,
                context.visualElement,
                preloadedFeatures
            )
        }

        /**
         * The mount order and hierarchy is specific to ensure our element ref
         * is hydrated by the time features fire their effects.
         */
        return (
            <>
                {features}
                <MotionContext.Provider value={context}>
                    {useRender(
                        Component,
                        props,
                        projectionId,
                        useMotionRef(
                            visualState,
                            context.visualElement,
                            externalRef
                        ),
                        visualState,
                        isStatic
                    )}
                </MotionContext.Provider>
            </>
        )
    }

    return forwardRef(MotionComponent)
}

function useLayoutId({ layoutId }: MotionProps) {
    const layoutGroupId = useContext(LayoutGroupContext).prefix
    return layoutGroupId && layoutId !== undefined
        ? layoutGroupId + "-" + layoutId
        : layoutId
}
