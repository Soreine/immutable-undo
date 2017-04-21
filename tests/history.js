const expect = require('expect');
const History = require('../lib');

describe('History', () => {

    // All the Histories in these test contain the serie of natural
    // integer as successive states.
    // 0, 1, 2, 3 etc.

    it('should init', () => {
        const history = History.create();
        expect(history).toBeA(History);
        expect(history.undos.isEmpty()).toBe(true);
        expect(history.redos.isEmpty()).toBe(true);
    });

    it('should expose strategies', () => {
        expect(History.SMOOTH).toBe('SMOOTH');
        expect(History.LRU).toBe('LRU');
    });

    it('should do', () => {
        const history = History.create().push(0);

        expect(history.undos.count()).toEqual(1);
        expect(history.redos.count()).toEqual(0);
    });

    it('should undo', () => {
        const history = History
                  .create()
                  .push(0);


        expect(history.previous).toEqual(0);

        expect(history.undo(1).undos.count()).toEqual(0);
        expect(history.undo(1).redos.count()).toEqual(1);
    });

    it('should redo', () => {
        const history = History
                  .create()
                  .push(0)
                  .undo(1);


        expect(history.next).toEqual(1);

        expect(history.redo(0).undos.count()).toEqual(1);
        expect(history.redo(0).redos.count()).toEqual(0);
    });

    it('should drop redos on push', () => {
        const history = History
                  .create()
                  .push(0)
                  .undo(1)
                  .push(0);

        expect(history.previous).toEqual(0);

        expect(history.undos.count()).toEqual(1);
        expect(history.redos.count()).toEqual(0);
    });

    it('should handle max undo size', () => {
        // Serie of natural integers
        const serie = [...Array(1000).keys()];
        const history = serie.reduce(
            (h, n) => h.push(n),
            History.create({ maxUndos: 300 })
        );

        expect(history.previous).toEqual(999);

        expect(history.undos.count()).toEqual(300);
        expect(history.redos.count()).toEqual(0);
    });
});
