import { forwardRef, ReactNode, useMemo } from 'react'
import { RecordsDiff, TLRecord, TLShape, TLShapeId } from 'tldraw'
import { TldrawViewer } from './TldrawViewer'
import classNames from 'classnames'

/** @public */
export interface TLShapeWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
	/** The shape being rendered. */
	shape: TLShape
	/** Whether this is the shapes regular, or background component. */
	isBackground: boolean
	/** The shape's rendered component. */
	children: ReactNode
}

/** @public @react */
export const DefaultShapeWrapper = forwardRef(function DefaultShapeWrapper(
	{ children, shape, isBackground, ...props }: TLShapeWrapperProps,
	ref: React.Ref<HTMLDivElement>
) {
	const isFilledShape = 'fill' in shape.props && shape.props.fill !== 'none'

	return (
		<div
			ref={ref}
			data-shape-type={shape.type}
			data-shape-is-filled={isBackground ? undefined : isFilledShape}
			data-shape-id={shape.id}
			draggable={false}
			{...props}
			className={classNames('tl-shape', isBackground && 'tl-shape-background', props.className)}
		>
			{children}
		</div>
	)
})

export function TldrawDiffViewer({ diff }: { diff: RecordsDiff<TLRecord> }) {
	const diffShapes = useMemo(() => getDiffShapesFromDiff(diff), [diff])
	return <TldrawViewer shapes={diffShapes} components={{ ShapeWrapper: DiffShapeWrapper }} />
}

function getDiffShapesFromDiff(diff: RecordsDiff<TLRecord>): TLShape[] {
	const diffShapes: TLShape[] = []

	const numberOfShapes =
		Object.keys(diff.added).length +
		Object.keys(diff.updated).length +
		Object.keys(diff.removed).length

	// If there are many shapes in the diff, don't show shadows (for performance reasons)
	const showShadows = numberOfShapes < 20

	for (const key in diff.removed) {
		const id = key as TLShapeId
		const prevShape = diff.removed[id]
		if (prevShape.typeName !== 'shape') continue
		const shape = {
			...prevShape,
			opacity: showShadows ? prevShape.opacity : prevShape.opacity / 2,
			props: { ...prevShape.props },
			meta: { ...prevShape.meta, changeType: showShadows ? 'delete-shadow' : 'delete' },
		}

		if ('dash' in shape.props) {
			shape.props.dash = 'solid'
		}

		diffShapes.push(shape)
	}

	for (const key in diff.updated) {
		const id = key as TLShapeId

		const prevBefore = diff.updated[id][0]
		const prevAfter = diff.updated[id][1]
		if (prevBefore.typeName !== 'shape' || prevAfter.typeName !== 'shape') continue

		const before = {
			...prevBefore,
			id: (id + '-before') as TLShapeId,
			opacity: prevAfter.opacity / 2,
			props: { ...prevBefore.props },
			meta: {
				...prevBefore.meta,
				changeType: showShadows ? 'update-before-shadow' : 'update-before',
			},
		}

		const after = {
			...prevAfter,
			props: { ...prevAfter.props },
			meta: {
				...prevAfter.meta,
				changeType: showShadows ? 'update-after-shadow' : 'update-after',
			},
		}

		if ('dash' in before.props) {
			before.props.dash = 'dashed'
		}
		if ('fill' in before.props) {
			before.props.fill = 'none'
		}
		if ('dash' in after.props) {
			after.props.dash = 'solid'
		}

		diffShapes.push(before)
		diffShapes.push(after)
	}

	for (const key in diff.added) {
		const id = key as TLShapeId
		const prevShape = diff.added[id]
		if (prevShape.typeName !== 'shape') continue
		const shape = {
			...prevShape,
			props: { ...prevShape.props },
			meta: {
				...prevShape.meta,
				changeType: showShadows ? 'create-shadow' : 'create',
			},
		}
		if ('dash' in shape.props) {
			shape.props.dash = 'solid'
		}
		diffShapes.push(shape)
	}

	return diffShapes
}

const DiffShapeWrapper = forwardRef(function DiffShapeWrapper(
	{ children, shape, isBackground }: TLShapeWrapperProps,
	ref: React.Ref<HTMLDivElement>
) {
	const changeType = shape.meta.changeType

	return (
		<DefaultShapeWrapper
			ref={ref}
			shape={shape}
			isBackground={isBackground}
			className={changeType ? 'diff-shape-' + changeType : undefined}
		>
			{children}
		</DefaultShapeWrapper>
	)
})
