const { Record, Stack, List } = require('immutable');

/**
 * Default properties.
 */
const DEFAULTS = {
    // The previous states. Last is the closest to current (most
    // recent)
    undos: new List(),

    // The next states. Top is the closest to current (oldest)
    redos: new Stack()
};

// Default maximum number of undo
const MAX_UNDOS = 500;


/**
 * Data structure for an History of state, with undo/redo.
 */
class History extends new Record(DEFAULTS) {

    /**
     * @param {Any} initial The initial state
     * @return {History}
     */
    static create(opts = {}) {
        const { maxUndos = MAX_UNDOS } = opts;

        return new History({
            _maxUndos: maxUndos
        });
    }

    get canUndo() {
        return !this.undos.isEmpty();
    }

    get canRedo() {
        return !this.redos.isEmpty();
    }

    /**
     * @return {Any?} the previous state
     */
    get previous() {
        return this.undos.last();
    }

    /**
     * @return {Any?} the next state
     */
    get next() {
        return this.redos.first();
    }

    /**
     * Push a new state, and clear all the next states.
     * @param {Any} state The new state
     * @return {History}
     */
    push(state) {
        return this.merge({
            undos: this.undos.size >= MAX_UNDOS
                ? this.undos.push(state).shift()
                : this.undos.push(state),
            redos: new Stack()
        });
    }

    /**
     * Go back to previous state. Return itself if no previous state.
     * @param {Any} current The current state
     * @return {History}
     */
    undo(current) {
        if (!this.canUndo) return this;

        return this.merge({
            undos: this.undos.pop(),
            redos: this.redos.push(current)
        });
    }

    /**
     * Go to next state. Return itself if no next state
     * @param {Any} current The current state
     * @return {History}
     */
    redo(current) {
        if (!this.canRedo) return this;

        return this.merge({
            undos: this.undos.push(current),
            redos: this.redos.pop()
        });
    }
}

module.exports = History;
