const { Record, Stack, List } = require('immutable');

// Default maximum number of undo
const MAX_UNDOS = 500;
// Strategies
const LRU = 'LRU';
const SMOOTH = 'SMOOTH';

/*
type Snapshot<T> = {
  value: T,
  merged: number=1 // Number of time this snapshot was merged
                   // with another one (for SMOOTH strategy)
}
*/

/**
 * Default properties.
 */
const DEFAULTS = {
    // The previous states. Last is the closest to current (most
    // recent)
    undos: new List(), // List<Snapshot>

    // The next states. Top is the closest to current (oldest)
    redos: new Stack(), // Stack<Snapshot>

    // Remember the current merged count. For SMOOTH strategy
    merged: 1,

    maxUndos: MAX_UNDOS,
    strategy: LRU
};

/**
 * Data structure for an History of state, with undo/redo.
 */
class History extends new Record(DEFAULTS) {

    static LRU = LRU;
    static SMOOTH = SMOOTH;

    /**
     * @param {Any} initial The initial state
     * @return {History}
     */
    static create(opts = {}) {
        return new History(opts);
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
        return this.undos.last().value;
    }

    /**
     * @return {Any?} the next state
     */
    get next() {
        return this.redos.first().value;
    }

    /**
     * Push a new state, and clear all the next states.
     * @param {Any} state The new state
     * @return {History}
     */
    push(state) {
        const newHistory = this.merge({
            undos: this.undos.push(snapshot(state, this.merged)),
            redos: new Stack(),
            merged: 1
        });

        return newHistory.prune();
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
            redos: this.redos.push(snapshot(current, this.merged)),
            merged: this.previous.merged
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
            undos: this.undos.push(snapshot(current, this.merged)),
            redos: this.redos.pop(),
            merged: this.next.merged
        });
    }

    /**
     * Prune undo/redo using the defined strategy
     * @return {History}
     */
    prune() {
        switch (this.strategy) {
        case LRU:
        default:
            if (this.undos.size >= this.maxUndos) {
                return this.set('undos', this.undos.slice(this.undos.size - this.maxUndos));
            } else {
                return this;
            }
        }
    }
}

function snapshot(value, merged = 1) {
    return { value, merged };
}

module.exports = History;
