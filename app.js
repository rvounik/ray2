
// helpers
import helpers from './helpers/index.js';

// globals
const context = document.getElementById('canvas').getContext('2d');

const state = {
    player: {
        x: 250,
        y: 550,
        rotation: 300,
        speed: 3,
        height: 300 // 0 would mean all wall segments are drawn above the horizon, 600 all below
    },
    upHeld: false,
    downHeld: false,
    rightHeld: false,
    leftHeld: false,
    map: true,
    debug: true,
    lengths: [],
    rayCount: 400,
    showRays: true,
    showIntersectionPoints: true,
    textured: true,
    nextX: null,
    nextY: null,
    segmentHeight: 600, // height of wall segment if standing directly in front of it
    fov: 55
};

if (!Number.isInteger(800 / state.rayCount)) {
    console.log('warning: segment width is a float')
}

const images = [
    {
        id: 'texture',
        src: 'assets/images/texture.jpeg'
    },
    {
        id: 'background',
        src: 'assets/images/background.png'
    }
];

images.map(image => {
    image.img = new Image();
    image['img'].src = image['src'];
});

let KEYCODE_LEFT = 37, KEYCODE_RIGHT = 39, KEYCODE_UP = 38, KEYCODE_DOWN = 40, KEYCODE_M = 77;

const handleKeyDown = e => {
    switch(e.keyCode) {
        case KEYCODE_LEFT:
            state.rightHeld = false;
            state.leftHeld = true;
            break;
        case KEYCODE_RIGHT:
            state.leftHeld = false;
            state.rightHeld = true;
            break;
        case KEYCODE_UP:
            state.downHeld = false;
            state.upHeld = true;
            break;
        case KEYCODE_DOWN:
            state.upHeld = false;
            state.downHeld = true;
            break;
    }
};

const handleKeyUp = e => {
    switch(e.keyCode) {
        case KEYCODE_LEFT:
            state.leftHeld = false;
            break;
        case KEYCODE_RIGHT:
            state.rightHeld = false;
            break;
        case KEYCODE_UP:
            state.upHeld = false;
            break;
        case KEYCODE_DOWN:
            state.downHeld = false;
            break;
        case KEYCODE_M:
            state.map = state.map !== true;
            break;
    }
};

// disable page movement using cursor keys
window.addEventListener("keydown", e => {
    if([37, 38, 39, 40, 77].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

document.onkeydown = handleKeyDown;
document.onkeyup = handleKeyUp;

let mapData = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
    [1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1],
    [1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1],
    [1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1],
    [1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

mapData = [
    [1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,1],
    [1,0,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,1],
    [1,0,0,1,1,0,0,1],
    [1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1]
]

// todo: rename to grid size or something
let resolution = 100; // if the map is 28 units wide, this translates to 2800 pixels on screen

// this should not have any effect on the rendered projection
const miniMapResolution = 30;

const drawMiniMap = () => {
    const { x, y, rotation } = state.player;

    context.save();

    context.globalAlpha = 0.8; // map is transparent

    for (let a = 0; a < mapData.length; a++) {
        for (let b = 0; b < mapData[a].length; b++) {
            if (mapData[a][b] === 1) {
                context.fillStyle = '#aaaaaa'; // wall

                if (b===state.nextX && a===state.nextY && state.rayCount === 1) {
                    context.fillStyle = '#ff0000';
                }
            } else {
                context.fillStyle = '#ffffff'; // empty (you could omit this for better performance)
            }

            context.fillRect(b * miniMapResolution, a * miniMapResolution, miniMapResolution, miniMapResolution);
            context.strokeRect(b * miniMapResolution, a * miniMapResolution, miniMapResolution, miniMapResolution); // (you could omit this for better performance)
        }
    }

    const playerToMiniMapRatio = getPlayerToMiniMapRatio();

    // draw 'player'
    context.fillStyle = '#000000';
    context.fillRect(x / playerToMiniMapRatio - 2, y / playerToMiniMapRatio - 2, 4, 4);

    // determine endpoints for the 'rotation indicator' (line representing player rotation)
    const endOfRotationIndicator = getNewCoordsForAngle(x, y, rotation, 50);

    // draw player line of sight
    context.strokeStyle = '#000000';
    context.lineWidth = '1';
    context.beginPath();
    context.moveTo(x / playerToMiniMapRatio, y / playerToMiniMapRatio);
    context.lineTo(endOfRotationIndicator[0] / playerToMiniMapRatio, endOfRotationIndicator[1] / playerToMiniMapRatio);
    context.stroke();

    context.restore();
};

// how much smaller are the mini map coordinates are compared to the actual player coordinates
const getPlayerToMiniMapRatio = () => {
    return resolution / miniMapResolution;
};

// https://www.slimleren.nl/onderwerpen/wiskunde/12.254/basis-1-zijden-berekenen-met-de-sinus,-cosinus-en-tangens
const getNewCoordsForAngle = (x, y, rotation, length) => {
    let x2, y2;
    rotation = Math.abs(rotation % 360);

    if (rotation >= 0 && rotation < 90) {
        x2 = x + length * Math.cos(toRadians(rotation));
        y2 = y + length * Math.sin(toRadians(rotation));
    }
    if (rotation >= 90 && rotation < 180) {
        x2 = x - (length * Math.cos(toRadians(180 - rotation)));
        y2 = y + (length * Math.sin(toRadians(180 - rotation)));
    }
    if (rotation >= 180 && rotation < 270) {
        x2 = x - length * Math.cos(toRadians(180 + rotation));
        y2 = y - length * Math.sin(toRadians(180 + rotation));
    }
    if (rotation >= 270) {
        x2 = x + length * Math.cos(toRadians(360 - rotation));
        y2 = y - length * Math.sin(toRadians(360 - rotation));
    }

    return [x2, y2];
};

const getGridCollisionForCoords = (mapX, mapY) => {

    // true if 1 (collision), false if 0. requires normalised coords (mapped to grid unit)
    return mapData[mapY][mapX] === 1;
};

const toRadians = angle => {
    return angle * (Math.PI / 180);
};

const validateGridCoords = (x, y) => {
    return (x >= 0 && y >= 0 && x < mapData[0].length && y < mapData.length)
};

// normalise x, y to grid coordinates, with floor/ceil based on the direction the player is going
const normaliseCoordsToGridCoords = (x, y, rotation) => {
    let nextX, nextY;

    rotation = rotation % 360;

    if (rotation >= 0) {
        nextX = Math.ceil((x+1) / resolution) - 1;
        nextY = Math.ceil((y+1) / resolution) - 1;
    }

    if (rotation >= 90) {
        nextX = Math.floor((x-1) / resolution);
        nextY = Math.ceil((y+1) / resolution) - 1;
    }

    if (rotation >= 180) {
        nextX = Math.floor((x-1) / resolution);
        nextY = Math.floor((y-1) / resolution);
    }

    if (rotation >= 270) {
        nextX = Math.ceil((x+1) / resolution) - 1;
        nextY = Math.floor((y-1) / resolution);
    }

    if (state.debug) {
        state.nextX = nextX;
        state.nextY = nextY;
    }

    return [nextX, nextY]
};

const handleKeyPresses = () => {
    const player = state.player;

    if (state.upHeld) {

        // get new x, y according to direction the player is heading
        const newCoords = getNewCoordsForAngle(player.x, player.y, player.rotation, player.speed);

        // normalise new x, y to grid units
        const normalisedCoords = normaliseCoordsToGridCoords(newCoords[0], newCoords[1], player.rotation);

        // debug: draw the hit box
        if (state.debug && state.map) {
            context.fillStyle = '#ff0000';
            context.fillRect(normalisedCoords[0] * miniMapResolution, normalisedCoords[1] * miniMapResolution, miniMapResolution, miniMapResolution);
        }

        // if the coordinates are valid and there is no wall at the requested position, move the player to that position
        if (validateGridCoords(normalisedCoords[0], normalisedCoords[1])) {
            if (!getGridCollisionForCoords(normalisedCoords[0], normalisedCoords[1])) {
                player.x = newCoords[0];
                player.y = newCoords[1];
            }
        }
   }

    if (state.downHeld) {

        // get new x, y according to direction the player is heading
        const newCoords = getNewCoordsForAngle(player.x, player.y, player.rotation, 0 - player.speed);

        // normalise new x, y to grid units with floor/ceil based on the direction the player is going
        const normalisedCoords = normaliseCoordsToGridCoords(newCoords[0], newCoords[1], player.rotation);

        // if the coordinates are valid and there is no wall at the requested position, move the player to that position
        if (validateGridCoords(normalisedCoords[0], normalisedCoords[1])) {
            if (!getGridCollisionForCoords(normalisedCoords[0], normalisedCoords[1])) {
                player.x = newCoords[0];
                player.y = newCoords[1];
            }
        }
    }

    if (state.leftHeld) {
        player.rotation -= player.speed;

        if (player.rotation < 0){ player.rotation += 360 }
    }

    if (state.rightHeld) {
        player.rotation += player.speed;

        if (player.rotation >= 360){ player.rotation -= 360 }
    }
};

const getRayLength = (rayRotation, x, y, invert = false) => {
    let angle, remainderX, remainderY, horizontalRay, verticalRay;

    // normalise the rotation (always between 0 and 360)
    let rotation = Math.abs(rayRotation % 360);

    // normalise the rotation to the relative angle used to calculate the triangle
    angle = rotation - (Math.floor(rotation / 90) * 90);

    // normalise the remaining pixels to the grid edge by subtracting it from the grid unit size when going right or up
    remainderX = rotation < 90 || rotation > 270 ? resolution - (x % resolution) : (x % resolution);
    remainderY = rotation < 180 ? resolution - (y % resolution) : y % resolution;

    // when exactly at the line itself, ofcourse the outcome shouldnt be 0 but it should jump to the next grid unit
    if (remainderX === 0) { remainderX = resolution}
    if (remainderY === 0) { remainderY = resolution}

    // calculate the triangle side length opposite to the angle using cos on the angle (inverted when going right or up) and the length of the "attached" side
    horizontalRay = (rotation >= 180 && rotation < 270) || rotation < 90 ? remainderX / Math.cos(toRadians(angle)) : remainderX / Math.cos(toRadians(90 - angle));
    verticalRay   = (rotation >= 180 && rotation < 270) || rotation < 90 ? remainderY / Math.cos(toRadians(90 - angle)) : remainderY / Math.cos(toRadians(angle));

    // return the shortest ray length of the two calculated triangles (beforehand it is unknown which "side" of the grid unit it will cut through)
    // return horizontalRay < verticalRay ? horizontalRay : verticalRay;

    // if (invert) {
    //     return horizontalRay > verticalRay
    //         ? { length: horizontalRay, color: '#00ff00' }
    //         : { length: verticalRay, color: '#ff0000' } ;
    // }

    return horizontalRay < verticalRay
        ? { length: horizontalRay, color: '#ff0000' }
        : { length: verticalRay, color: '#00ff00' } ;
};

const calculateRays = () => {
    const player = state.player;
    const rayIteration = state.fov / state.rayCount; // sets how many "degrees" each ray is covering

    // since the rays and player and line of sight are drawn on the map, this ratio stores by how much it should be divided to match its dimensions
    const playerToMiniMapRatio = getPlayerToMiniMapRatio();

    let firstRayRot = player.rotation - (state.fov / 2);

    firstRayRot = firstRayRot < 0 ? firstRayRot + 360 : firstRayRot;

    // this holds the calculated lengths, so the drawProjection method can utilise it to draw the segments
    state.lengths = [];

    // draw each ray, calculate how long it is before hitting the wall, store it in the state, so projection can use it
    for (let c = 0; c < state.rayCount; c++) {

        let totalRayLength = 0;

        // reset old coordinates for this ray
        let oldCoords = [];

        // determine rotation offset based in which ray iteration is being calculated
        let rayRotation = firstRayRot + (c * rayIteration);

        // get the length of the ray from player coordinates to edge of grid unit
        let rayLength = getRayLength(rayRotation, player.x, player.y);

        rayLength = rayLength.length;

        // get the coordinates where the previously calculated ray intersects the grid (these are the new coordinates)
        // todo: it either goes wrong here
        let newCoords = getNewCoordsForAngle(player.x, player.y, rayRotation, rayLength);

        // debug: draw the active rectangle
        if (state.debug && state.map && state.showRays) {
            context.fillStyle = '#ff0000';
            context.fillRect(newCoords[0] / playerToMiniMapRatio - 2, newCoords[1] / playerToMiniMapRatio - 2, 4, 4);
        }

        // convert the new coordinates to coordinates that can be queried as map data to see if it has a wall
        // todo: or here
        let gridCoords = normaliseCoordsToGridCoords(newCoords[0], newCoords[1], rayRotation);

        if (!getGridCollisionForCoords(gridCoords[0], gridCoords[1])) {
            // first add the length of the first line to reach the grid edge todo: there is a bug here!
            totalRayLength = rayLength;
        } else {
            let rayLength = getRayLength(rayRotation, player.x, player.y, true);

            rayLength = rayLength.length;

            totalRayLength = rayLength;
        }

        // console.log('to reach the grid unit edge the ray needs to have a length of',rayLength)

        // keep calculating the new coordinates for the ray until it hits a wall or the map data is exhausted
        while(validateGridCoords(gridCoords[0], gridCoords[1]) && !getGridCollisionForCoords(gridCoords[0], gridCoords[1])) {

            // store old coords since they serve as a starting point for the new triangle
            oldCoords = newCoords;

            // calculate the ray length to the next intersection, starting from new coordinates
            rayLength = getRayLength(rayRotation, newCoords[0], newCoords[1]).length;

            // calculate the new coordinates, starting not at player position, but at the previously stored coords (called oldCoords by now)
            newCoords = getNewCoordsForAngle(oldCoords[0], oldCoords[1], rayRotation, rayLength);

            if (oldCoords[0] === newCoords[0] && oldCoords[1] === newCoords[1]) {
                console.log('error: newCoords === oldCoords, rayLength:', rayLength);
            }

            // if (c > 609 && c < 627) {
                // debug: draw the ray
                if (state.debug && state.map && state.showRays) {
                    context.strokeStyle = '#ff0000';
                    context.lineWidth = '1';
                    context.beginPath();
                    context.moveTo(oldCoords[0] / playerToMiniMapRatio, oldCoords[1] / playerToMiniMapRatio);
                    context.lineTo(newCoords[0] / playerToMiniMapRatio, newCoords[1] / playerToMiniMapRatio);
                    context.stroke();

                    // debug: draw intersection point
                    if (state.showIntersectionPoints) {
                        context.fillStyle = '#0000ff';
                        context.fillRect(newCoords[0] / playerToMiniMapRatio - 2, newCoords[1] / playerToMiniMapRatio - 2, 4, 4);
                    }
                }
            // }

            // convert newCoords to grid coordinates that can be queried for wall detection / end of array
            gridCoords = normaliseCoordsToGridCoords(newCoords[0], newCoords[1], rayRotation);

            // increment total ray length if still within map boundaries
            if (validateGridCoords(gridCoords[0], gridCoords[1])) {
                totalRayLength += rayLength;
            }
        }

        const testcol = getRayLength(rayRotation, newCoords[0], newCoords[1]);

        state.lengths.push({ length: totalRayLength, color: testcol.color });
    }
};

/* to prevent fish eye effect the distance to projection should be used rather than distance to wall */
const convertRayLengthToProjectionRayLength = (rayLength, rayIndex) => {
    const degreesToPlayerCenter = state.player.rotation - (state.fov / 2) + (rayIndex * (state.fov / state.rayCount));
    const angleDiff = degreesToPlayerCenter - state.player.rotation;

    return Math.cos(toRadians(angleDiff)) * rayLength;
}

const drawBackground = () => {
    const background = images.filter(img => img.id === 'background')[0];

    context.drawImage(
        background['img'],
        0,
        0
    );
}

const drawProjection = () => {

    for (let a = 0; a < state.rayCount; a++) {
        context.save();

        context.translate(a * (800 / state.rayCount), 0);

        // define clipping mask (if you want 2x2 mode, it should do 'lineTo(2, ...' etc)
        context.beginPath();
        context.translate(0, 0);
        context.lineTo((800 / state.rayCount), 0);
        context.lineTo((800 / state.rayCount), 600);
        context.lineTo(0, 600);
        context.lineTo(0, 0);
        context.clip();

        if (state.lengths.length) {

            const distanceToWall = state.lengths[a].length;
            // const fillColor = state.lengths[a].color;
            const distanceToProjection = convertRayLengthToProjectionRayLength(distanceToWall, a);

            // const ph = 1 + state.player.height / 2;

            if (state.textured) {
                const texture = images.filter(img => img.id === 'texture')[0];

                // center point is middle of screen
                context.translate(0, 300);

                // determines how soon the texture loses height in the distance. 1 is default but 1.1 or 1.2 looks more realistic
                context.scale(1 - (distanceToWall / 400), 1 - (distanceToWall / 400));

                // offset x pos to middle of the texture with an offset of a (so texture renders correct when standing in front)
                // let xDist = a * (a - ((distanceToWall * distanceToWall) / perspectiveCorrection));
                // let xDist =  (a - ((distanceToWall * distanceToWall) / 100));
                // let xDist = a - distanceToWall;
                let xDist = 0 - ((distanceToWall * distanceToWall) / 10);

                // should be half the texture height, you can play around with it to adjust the camera height
                const yDist = 433;
                xDist = 0;

                // use remainder operator to ensure texture wrapping around
                context.translate(xDist % 1300 - a, yDist);

                // set some distance fogging
                const foggingStrength = 1;

                context.globalAlpha = state.textured ? (foggingStrength * (1 - (distanceToWall / 400))) : 1;

                // this extra check ensures the texture is not rendered 'negatively' for very short distances
                if ((distanceToWall / 400) < 1) {
                    if (state.textured) {
                        context.drawImage(
                            texture['img'],
                            0,
                            -866
                        );
                    }
                }

            } else {
                context.globalAlpha = distanceToProjection > 600 ? 0 : 1 - (distanceToProjection / 600);
                context.fillStyle = '#9999bb'; //fillColor; // '#9999bb';

                const wallHeight = 300 * (100 / distanceToProjection);

                if (distanceToProjection < 600) {
                    context.fillRect(
                        0,
                        (600 - wallHeight) / 2, // just align vertically. todo: ensure player.height is respected here
                        800 / state.rayCount,
                        wallHeight
                    );
                }

                context.font = "8px Monospace";
                context.fillStyle = "#000000";
                context.fillText(`${a}`, 0, 590);
            }
        }

        context.restore();
    }
};

/**
 * Perform all timely actions
 */
const update = () => {
    helpers.Canvas.clearCanvas(context, '#ffffff');

    drawBackground();
    calculateRays();
    drawProjection();

    handleKeyPresses();

    if (state.map) {
        drawMiniMap();
    }


    requestAnimationFrame(() => {
       update();
    });
};

// call the updater
update();

const tt = normaliseCoordsToGridCoords(state.player.x, state.player.y, state.player.rotation);

console.log('Initialising Raycaster 2.0');
console.log('casting: ', state.rayCount, ' rays');
console.log('grid unit size is: ', resolution, 'x', resolution);
console.log('player x: ', state.player.x, '(',tt[0],')');
console.log('player.y: ', state.player.y, '(',tt[1],')');
console.log('player.rotation: ', state.player.rotation, '(',state.player.rotation  *  (Math.PI / 180),')');




