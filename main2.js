onload = () => {
    const canvas = document.getElementById('CANVAS');
    const ctx = canvas.getContext('2d');
    canvas.width = 500;
    canvas.height = 500;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    let points = [];
    let cellSide = 10;
    let treshold = 1;
    let radius = 40;
    let sos = false;

    grid = newGrid(ctx, cellSide);

    document.getElementById("newSize").addEventListener("change", function () {
        radius = this.value;
        motion(0,0);
    });
    document.getElementById('newSize').value = radius;

    document.getElementById("newtresHold").addEventListener("change", function () {
        treshold = this.value / 100;
        motion(0,0);
    });
    document.getElementById('newtresHold').value = treshold * 100;



    const getMouseCoords = e => {
        const rect = canvas.getBoundingClientRect();
        return [e.clientX - rect.x, e.clientY - rect.y]
    };

    function motion(x , y){
        point = grid.getNode(Math.floor(x / cellSide), Math.floor(y / cellSide));
        grid.applyInfluence(point.x, point.y, radius);
        if (sos == true){
            points.push({x, y});
        }
        grid.clearGrid();
        for (let point of points) {
            grid.applyInfluence(point.x, point.y, radius);
        }
        for(let i = 0; i < grid.cols; i++){
            for(let j = 0; j < grid.rows; j++){
                const { x, y, value } = grid.getNode(i, j);
                const color = Math.min(Math.floor((value / 4)*255), 255);
                ctx.fillStyle = `rgb(0,${color},0)`;
                ctx.fillRect(x-1, y-1, 3, 3);
            }
        }
        const squares = [];
        for(let i = 0; i < grid.cols - 1; i ++) {
            for(let j = 0; j < grid.rows - 1; j ++) {
                const cellPoints = [
                    grid.getNode(j, i),
                    grid.getNode(j + 1, i),
                    grid.getNode(j + 1, i + 1),
                    grid.getNode(j, i + 1)
                ];
                for (let seg of getSegments(cellPoints, treshold)) {
                    squares.push(seg);

                };
            }
        }
        ctx.strokeStyle = 'white';
        for (const square of squares) {
            ctx.beginPath();
            ctx.moveTo(square[0].x, square[0].y);
            ctx.lineTo(square[1].x, square[1].y);
            ctx.stroke();
        }

    }

    canvas.onmousedown = e => {
        sos = true;
        if (e.button === 0) {
            [x, y] = getMouseCoords(e);
            motion(x, y);
        }
    };

    canvas.onmousemove = e => {
        if (sos === true) {
            canvas.onmouseout = handlerOut;
            function handlerOut(event) {
                if (event.type === 'mouseout') {
                    sos = false;
                    return;
                }
            }
            [x, y] = getMouseCoords(e);
            motion(x, y);
        }
    }

    canvas.onmouseup = e => {
        sos = false;
    }


    function newGrid(ctx, cellSide){
        let concentation_array = [];
        const cols = Math.floor(ctx.canvas.width/ cellSide);
        const rows = Math.floor(ctx.canvas.width/ cellSide);
        for(let i = 0; i < cols; i++){
            for(let j = 0; j < rows; j++){
                concentation_array.push(0);
            }
        }
        const getIndex = (numX, numY) => numX*rows + numY;
        return {

            concentation_array,
            cellSide,
            cols,
            rows,

            getNode: (numX, numY) => { //горизонтальный и вертикальный номер узла
                if (numX < 0 || numX >= cols) { throw `wrong numX: ${numX}`; };
                if (numY < 0 || numY >= rows) { throw `wrong numY: ${numY}`; };
    
                const x = numX*cellSide;
                const y = numY*cellSide;
    
                return { x, y, value: concentation_array[getIndex(numX, numY)] }; 
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
    
                let minX = Math.floor((pointX - r)/cellSide); //все узлы сетки, до которых точка может дотянуться
                let minY = Math.floor((pointY - r)/cellSide);
                let maxX = Math.ceil((pointX + r)/cellSide);
                let maxY = Math.ceil((pointY + r)/cellSide);
                if(minX < 0){
                    minX = 0;
                };
                if(minY < 0){
                    minY = 0;
                };
                if(maxY > rows){
                    maxY = rows-1;
                };
                if(maxX > cols){
                    maxX = cols-1;
                };
                for (let numX = minX; numX <= maxX; numX++) {
                    for (let numY = minY; numY <= maxY; numY++) {
                        const x = numX*cellSide;
                        const y = numY*cellSide;
                        const dx = pointX - x;
                        const dy = pointY - y;
                        const dd = dx*dx + dy*dy;
                        concentation_array[getIndex(numX, numY)] += f(dd); //применяем к каждой точке нашу функцию
                    }
                }
                return concentation_array
            },

            clearGrid: () => {
                for (let i = 0; i < concentation_array.length; i++) {
                    concentation_array[i] = 0;
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                }
            }
        }
    }
}
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

    const getMidpoint = (i, j, valuei, valuej) => {
        if (i < j){
            return i + Math.abs((threshold - valuei)/(valuej - valuei) * (i - j))
        };
        return i - Math.abs((threshold - valuei)/(valuej - valuei) * (i - j));
    };

    const answer = [];
    
    for (const segment of SEGMENT_TABLE[index]) {
        const [side1, side2] = segment;
        const [i11, i12] = SEGMENT_TO_VERTICES[side1];
        const [i21, i22] = SEGMENT_TO_VERTICES[side2];

        const v11 = points[i11];
        const v12 = points[i12];
        const v21 = points[i21];
        const v22 = points[i22];

        answer.push([
            { 
                x: getMidpoint(v11.x, v12.x, v11.value, v12.value),
                y: getMidpoint(v11.y, v12.y, v11.value, v12.value)
            },
            { 
                x: getMidpoint(v21.x, v22.x, v21.value, v22.value),
                y: getMidpoint(v21.y, v22.y, v21.value, v22.value)
            },
        ]);
    }

    return answer;

}
