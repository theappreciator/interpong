const getInputValue = (elementId: string): string | undefined => {
    const inputElement: HTMLInputElement = document.getElementById(elementId) as HTMLInputElement;
    if (inputElement) {
        const inputValue = inputElement.value

        if (inputValue) {
            return inputValue;
        }
    }

    return undefined;
}

const functionIfCompare = (x: number, y: number, isLessThan: Function, isGreaterThan: Function, isSameInteger: Function): Function => {
    if (Math.round(x) === Math.round(y)) {
        return isSameInteger;
    }
    else {
        const isLess = x < y;
        if (isLess) {
            return isLessThan;
        }
        else {
            return isGreaterThan;
        }  
    }
}

export {
    getInputValue,
    functionIfCompare
}