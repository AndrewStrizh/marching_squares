onload = () => {
    const canvas = document.getElementById('CANVAS');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 600;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    let allPoints = [];
    let cellside = 10;
    let r = 40;
    let treshold = 0.4;
    let grid = newGrid(ctx,cellside);

    const getMouseCoords = e => {
        const rect = canvas.getBoundingClientRect();
        return [e.clientX - rect.x, e.clientY - rect.y];
    }

    canvas.onmousedown = e => {
        [x, y] = getMouseCoords(e);
        let point = grid.getNode(Math.floor(x/cellside),Math.floor(y/cellside));
        let keysGrid = Object.keys(grid);
        let keys = Object.keys(point);
        apply = grid.applyInfluence(point[keys[0]],point[keys[1]], r);
        allPoints.push({x, y});
        grid.clearGrid();
        for (let point of allPoints) {
            grid.applyInfluence(point.x, point.y, r);
        }


        const segments = [];
        for(let i = 0; i < grid[keysGrid[2]] - 1; i ++) {
            for(let j = 0; j < grid[keysGrid[3]] - 1; j ++) {
                const cellPoints = [
                    grid.getNode(j, i),
                    grid.getNode(j + 1, i),
                    grid.getNode(j + 1, i + 1),
                    grid.getNode(j, i + 1)
                ]
                for (let seg of getSegments(cellPoints, treshold)) {
                    segments.push(seg);

                }
            }
        }

        console.log(segments);
        console.log(grid);

        for (let numX = 0; numX < grid[keysGrid[2]]; numX ++) {
            for (let numY = 0; numY < grid[keysGrid[3]]; numY ++) {
                const { x, y, value } = grid.getNode(numX, numY);

                const color = Math.min(Math.floor((value / 4)*255), 255);
                ctx.fillStyle = `rgb(0,${color},0)`;
                ctx.fillRect(x-1, y-1, 3, 3);
            }
        }
        ctx.strokeStyle = 'white';
        for (const s of segments) {
            ctx.beginPath();
            ctx.moveTo(s[0].x, s[0].y);
            ctx.lineTo(s[1].x, s[1].y);
            ctx.stroke();
        }
    }
}



function newGrid(ctx, cellSide) {
    const ncols = Math.ceil(ctx.canvas.width / cellSide) + 1;
    const nrows = Math.ceil(ctx.canvas.height / cellSide) + 1;

    const nodeValues = [];
    for (let x = 0; x < ncols; x++) {
        for (let y = 0; y < nrows; y++) {
            nodeValues.push(0);
        }
    }

    const getIndex = (numX, numY) => numX*nrows + numY;

    return {
        cellSide,
        nodeValues,
        ncols,
        nrows,

        getNode: (numX, numY) => { //горизонтальный и вертикальный номер узла
            if (numX < 0 || numX >= ncols) { throw `wrong numX: ${numX}`; }
            if (numY < 0 || numY >= nrows) { throw `wrong numY: ${numY}`; }

            const x = numX*cellSide;
            const y = numY*cellSide;

            return { x, y, value: nodeValues[getIndex(numX, numY)] }; 
            //возвращает реальные координаты узла(номер умноженный на длину стороны сетки) и концентрацию узла
        },

        applyInfluence: (pointX, pointY, r, f) => { //добавляет на сетку концентрацию точки облака
            //координаты точки, радиус влияния, функция, которая показывает, как убывает концентрацию в зависимости от расстояния
            if (f === undefined) {
                const rr = r*r;

                f = (dd) => {
                    if (rr >= dd) { return (rr - dd) / rr; } //rr - квадрат расстояния влияния, dd - квадрат расстояния до точки
                    return 0;
                }
            }

            const minX = Math.floor((pointX - r)/cellSide); //все узлы сетки, до которых точка может дотянуться
            const minY = Math.floor((pointY - r)/cellSide);
            const maxX = Math.ceil((pointX + r)/cellSide);
            const maxY = Math.ceil((pointY + r)/cellSide);

            for (let numX = minX; numX <= maxX; numX++) {
                for (let numY = minY; numY <= maxY; numY++) {
                    const x = numX*cellSide;
                    const y = numY*cellSide;
                    const dx = pointX - x;
                    const dy = pointY - y;
                    const dd = dx*dx + dy*dy;

                    nodeValues[getIndex(numX, numY)] += f(dd); //применяем к каждой точке нашу функцию
                }
            }
            return nodeValues
        },

        clearGrid: () => {
            for (let i = 0; i < nodeValues.length; i++) {
                nodeValues[i] = 0;
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }
        },
    };
}

/*
0 --0-- 1
|       |
3       1
|       |
3 --2-- 2
*/


const SEGMENT_TABLE = [
/* 0 */ [],    
/* 1 */ [ [0, 3], ],    
/* 2 */ [ [0, 1], ],    
/* 3 */ [ [1, 3], ],
/* 4 */ [ [1, 2], ],    
/* 5 */ [ [0, 3], [1, 2], ],    
/* 6 */ [ [0, 2], ],    
/* 7 */ [ [3, 2], ],    
/* 8 */ [ [2, 3], ],    
/* 9 */ [ [2, 0], ],    
/* 10 */ [ [0, 1], [2, 3], ],    
/* 11 */ [ [2, 1], ],    
/* 12 */ [ [3, 1], ],    
/* 13 */ [ [1, 0], ],
/* 14 */ [ [3, 0], ],    
/* 15 */ [],    
];


const SEGMENT_TO_VERTICES = [ [0, 1], [1, 2], [2, 3], [3, 0] ];

function getSegments(points, threshold) {
    let index = 0;
    if (points[0].value > threshold) { index |= 1; }
    if (points[1].value > threshold) { index |= 2; }
    if (points[2].value > threshold) { index |= 4; }
    if (points[3].value > threshold) { index |= 8; }

    const getMidpoint = (i, j) => {
        const vi = Math.abs(points[i].value - threshold);
        const vj = Math.abs(points[j].value - threshold);
        return vi / (vi + vj);  // плохая формула
    };

    const answer = [];
    
    for (const segment of SEGMENT_TABLE[index]) {
        const [side1, side2] = segment;
        const [i11, i12] = SEGMENT_TO_VERTICES[side1];
        const [i21, i22] = SEGMENT_TO_VERTICES[side2];
        const m1 = getMidpoint(i11, i12);
        const m2 = getMidpoint(i21, i22);

        const v11 = points[i11];
        const v12 = points[i12];
        const v21 = points[i21];
        const v22 = points[i22];

        answer.push([
            { 
                x: v11.x * (1-m1) + v12.x * m1,
                y: v11.y * (1-m1) + v12.y * m1,
            },
            { 
                x: v21.x * (1-m2) + v22.x * m2,
                y: v21.y * (1-m2) + v22.y * m2,
            },
        ]);
    }

    return answer;
}