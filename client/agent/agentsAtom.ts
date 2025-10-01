import { atom, Atom, Editor, WeakCache } from 'tldraw'
import { TldrawAgent } from './TldrawAgent'

export class EditorAtom<T> {
	private states = new WeakCache<Editor, Atom<T>>()

	constructor(private name: string, private getInitialState: (editor: Editor) => T) {}

	getAtom(editor: Editor): Atom<T> {
		return this.states.get(editor, () => atom(this.name, this.getInitialState(editor)))
	}

	get(editor: Editor): T {
		return this.getAtom(editor).get()
	}

	update(editor: Editor, update: (state: T) => T): T {
		return this.getAtom(editor).update(update)
	}

	set(editor: Editor, state: T): T {
		return this.getAtom(editor).set(state)
	}
}

/**
 * An atom containing all the agents attached to an editor.
 *
 * More than one agent can be attached to a single editor.
 * This starter doesn't take advantage of that, but you could.
 */
export const $agentsAtom = new EditorAtom<TldrawAgent[]>('agents', () => [])
