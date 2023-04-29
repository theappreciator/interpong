import { randomIntegerBetween, randomItem, randomNumberBetween } from "../../source/utils";

describe("utilities", () => {
    it("should make random integer between 0 and 1", () => {
        for (let i = 0; i < 100; i++) {
            const rand = randomIntegerBetween(0, 1);

            expect(rand).toBeDefined();
        }
    });

    it("should make random integer between 0 and 0", () => {
        for (let i = 0; i < 100; i++) {
            const rand = randomIntegerBetween(0, 0);

            console.log("random", rand);

            expect(rand).toBeDefined();
        }
    });

    it("should make random index for 2 items", () => {
        for (let i = 0; i < 100; i++) {
            const arr: string[] = ["one", "two"]
            const rand = randomItem(arr);

            expect(rand).toBeDefined();
        }
    });

    it("should make random index for 1 item", () => {
        for (let i = 0; i < 100; i++) {
            const arr: string[] = ["one"]
            const rand = randomItem(arr);

            expect(rand).toEqual("one");
        }
    });

    it("should make random index for 0 items", () => {
        for (let i = 0; i < 100; i++) {
            const arr: string[] = []
            const rand = randomItem(arr);

            expect(rand).toBeUndefined();
        }
    })
})