import Color from "color";



export const SanityCheck = () => console.log("SANITY");

const randomNumberBetween = (n1: number, n2: number) => {
    const random = Math.random();
    const diff = Math.abs(n2 - n1);
    return n1 + (random * diff);
}

const randomNumberWithVariance = (n1: number, variance: number) => {
    return randomNumberBetween(n1 - variance, n1 + variance);
}

const randomColorNumber = (): number => {
    const hue = Math.floor(Math.random() * 361);
    const saturation = randomNumberBetween(70, 100);
    const lightness = randomNumberBetween(30, 90);
    const color = Color(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    return color.rgbNumber();
}

export {
    randomNumberBetween, 
    randomNumberWithVariance, 
    randomColorNumber
}