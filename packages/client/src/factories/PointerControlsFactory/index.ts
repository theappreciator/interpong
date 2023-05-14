import PointerControls from "../../InputControls/PointerControls";

import PointerControlsFactory from "./pointerControlsFactory";

export {
    PointerControlsFactory
}

export interface IPointerControlFactory {
    makePointerControls(refObj: unknown): PointerControls
}