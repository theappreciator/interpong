const DEFAULTS = {
    width: 512,
    height: 512,
    score: {
        increment: 1000
    },
    combo: {
        interval: 0.003,
        bonus: 1
    },
    player: {
        speed: 1.5,
        width: 40,
        height: 200,
        health: 3,
        startPos: {
            x: 100,
            y: (512 / 2 - 200 / 2)
        },
        direction: {
            x: 7,
            y: 3
        },
        invulnerableMillis: 2000,
        flashMillis: 200
    }
}

export { DEFAULTS };