import Color from "color";



const randomBoolean = () => {
    const rand = randomIntegerBetween(0, 1);
    if (rand < 0.5) {
        return false;
    }
    else {
        return true;
    }
}

const randomIntegerBetween = (n1: number, n2: number) => {
    if (n1 == n2) {
        return n1;
    }

    const rand = Math.random();
    const diff = Math.abs(n2 - n1);
    return Math.floor(rand * (diff + 1)) + n1;
}

const randomNumberBetween = (n1: number, n2: number) => {
    if (n1 == n2) {
        return n1;
    }
    
    const rand = Math.random();
    const diff = Math.abs(n2 - n1);
    return (rand * diff) + n1;
}

const randomIntegerWithVariance = (n1: number, variance: number) => {
    return randomIntegerBetween(n1 - variance, n1 + variance);
}

const randomNumberWithVariance = (n1: number, variance: number) => {
    return randomNumberBetween(n1 - variance, n1 + variance);
}

const randomColorNumber = (): number => {
    const hue = Math.floor(Math.random() * 361);
    const saturation = randomIntegerBetween(70, 100);
    const lightness = randomIntegerBetween(30, 90);
    const color = Color(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    return color.rgbNumber();
}

const randomItem = <T>(arr: T[]) => {
    if (arr.length === 0) {
        return undefined;
    }
    if (arr.length === 1) {
        return arr[0];
    }

    const randomIndex = randomIntegerBetween(0, arr.length - 1);
    return arr[randomIndex];
}

export {
    randomBoolean,
    randomIntegerBetween,
    randomNumberBetween, 
    randomIntegerWithVariance,
    randomNumberWithVariance, 
    randomColorNumber,
    randomItem
}

export * from './playerUtils';