import { IPointerControlFactory } from ".";
import PointerControls from "../../InputControls/PointerControls";
import { BasicBoard, BoardType } from "../../View/BasicBoard";



class PointerControlsFactory implements IPointerControlFactory {
    constructor() {

    }

    makePointerControls = (refObj: unknown): PointerControls => {
        if (refObj instanceof BasicBoard) {
            return this.makePointerControlsFromBoard(refObj);
        }

        throw new Error("Could not determine refObj type when creating PointerControls");
    }

    private makePointerControlsFromBoard = (board: BoardType): PointerControls => {
        const pointerControl = new PointerControls();
    
        board.onPlayerPointerClickDown(pointerControl.onClickDown);
        board.onPlayerPointerClickUp(pointerControl.onClickUp);
        board.onPlayerPointerMove(pointerControl.onMovement);
    
        return pointerControl;
    }
}

export default PointerControlsFactory;