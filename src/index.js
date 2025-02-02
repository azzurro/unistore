import { assign } from './util';
import createSubscriber from './subscriber';

/**
 * Creates a new store, which is a tiny evented state container.
 * @name createStore
 * @param {Object} [state={}]		Optional initial state
 * @returns {store}
 * @example
 * let store = createStore();
 * store.subscribe( state => console.log(state) );
 * store.setState({ a: 'b' });   // logs { a: 'b' }
 * store.setState({ c: 'd' });   // logs { a: 'b', c: 'd' }
 */
export default function createStore(state) {
	const { emit, subscribe, unsubscribe } = createSubscriber();
	state = state || {};

	function setState(update, overwrite, action) {
		state = overwrite ? update : assign(assign({}, state), update);
		emit(state, action);
	}

	/**
	 * An observable state container, returned from {@link createStore}
	 * @name store
	 */

	return /** @lends store */ {

		/**
		 * Create a bound copy of the given action function.
		 * The bound returned function invokes action() and persists the result back to the store.
		 * If the return value of `action` is a Promise, the resolved value will be used as state.
		 * @param {Function} action	An action of the form `action(state, ...args) -> stateUpdate`
		 * @returns {Function} boundAction()
		 */
		action(action) {
			function apply(result) {
				setState(result, false, action);
			}

			// Note: perf tests verifying this implementation: https://esbench.com/bench/5a295e6299634800a0349500
			return function() {
				let args = [state];
				for (let i=0; i<arguments.length; i++) args.push(arguments[i]);
				let ret = action.apply(this, args);
				if (ret!=null) {
					if (ret.then) return ret.then(apply);
					return apply(ret);
				}
			};
		},

		/**
		 * Apply a partial state object to the current state, invoking registered listeners.
		 * @param {Object} update				An object with properties to be merged into state
		 * @param {Boolean} [overwrite=false]	If `true`, update will replace state instead of being merged into it
		 */
		setState,

		/**
		 * Register a listener function to be called whenever state is changed. Returns an `unsubscribe()` function.
		 * @param {Function} listener	A function to call when state changes. Gets passed the new state.
		 * @returns {Function} unsubscribe()
		 */
		subscribe,

		/**
		 * Remove a previously-registered listener function.
		 * @param {Function} listener	The callback previously passed to `subscribe()` that should be removed.
		 * @function
		 */
		unsubscribe,

		/**
		 * Retrieve the current state object.
		 * @returns {Object} state
		 */
		getState() {
			return state;
		}
	};
}
