const expect = require('expect');
const linear = require('../lib/linear');

describe('linear()', () => {

    it('should reproduce y = x', () => {
        const curve = linear({
            x0: 0,
            y0: 0
        }, {
            x1: 10,
            y1: 10
        });

        const serie = [...Array(20).keys()];
        expect(serie.map(curve)).toEqual(serie);
    });

    it('should reproduce y = 3x + 1', () => {
        const curve = linear({
            x0: -1,
            y0: -2
        }, {
            x1: 1,
            y1: 4
        });

        const serie = [...Array(20).keys()];
        expect(serie.map(curve)).toEqual(serie.map(x => 3 * x + 1));
    });
});
