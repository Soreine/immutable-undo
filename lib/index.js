const { Record, Stack, List } = require('immutable');
const linear = require('./linear');

// Default maximum number of undo
const MAX_UNDOS = 500;

/*
type Snapshot<T> = {
  value: T,
  merged: number=1 // Number of snapshots virtually contained in this one,
                   // including itself. It increases each time a snapshot is merged // with this one.
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
    strategy: lru
};

/**
 * Data structure for an History of state, with undo/redo.
 */
class History extends new Record(DEFAULTS) {

    static lru = lru;
    static smooth = smooth;

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
     * Prune undo/redo using the defined strategy,
     * after pushing a value on a valid History.
     * @return {History}
     */
    prune() {
        if (this.undos.size <= this.maxUndos) {
            return this;
        } else {
            return this.strategy(this);
        }
    }
}


// Strategies
function lru(history) {
    return history.set('undos', history.undos.shift());
}

function smooth(history) {
    const maxMerge = history.undos.first().merged;
    const minMerge = history.undos.last().merged;
    const size = history.undos.count();

    const curve = linear({
        x0: 0,
        y0: minMerge
    }, {
        x1: size - 1,
        y1: maxMerge
    });

    // Find the first undo that was not merged enough
    // compared to the rest of the history.
    let receivingIndex = history.undos.findIndex(
        ({ merged }, index) => merged < curve(size - 1 - index)
    );

    if (receivingIndex === -1) {
        // Fallback to the oldest possible
        receivingIndex = 0; // but always keep the initial state
    }

    const mergedIndex = receivingIndex + 1;
    const [
        receivingSnapshot,
        mergedSnapshot // always defined since
        // the comparison to curve(x) is strict
    ] = history.undos
            .slice(receivingIndex, mergedIndex + 1)
            .toArray();

    return history.set(
        'undos',
        history.undos
            .set(receivingIndex, incrementSnapshot(
                receivingSnapshot, mergedSnapshot.merged
            ))
            .delete(mergedIndex)
    );
}

/**
 * Make a snapshot of a value.
 */
function snapshot(value, merged = 1) {
    return { value, merged };
}

/**
 * Returns the given snapshot with increment merge count
 */
function incrementSnapshot({ value, merged }, amount) {
    return { value, merged: merged + amount };
}

module.exports = History;
