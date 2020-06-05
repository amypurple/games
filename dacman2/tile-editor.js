(function() {
    "use strict";

    /* The display handles everything to do with drawing graphics and resizing the
    screen. The world holds the map and its dimensions. */
    var display, tile_sheet, world;

    display = {

        /* We draw the tiles to the buffer in "world" coordinates or unscaled coordinates.
        All scaling is handled by drawImage when we draw the buffer to the display canvas. */
        buffer_level: document.createElement("canvas").getContext("2d"),
        buffer_palette: document.createElement("canvas").getContext("2d"),
        /* Scaling takes place on the display canvas. This is its drawing context. The
        height_width_ratio is used in scaling the buffer to the canvas. */
        context: document.querySelector("canvas").getContext("2d"),
        /* The height width ratio is the height to width ratio of the tile map. It is
        used to size the display canvas to match the aspect ratio of the game world. */
        height_width_ratio: undefined,

        isDrawing: false,

        /* This function draws the tile graphics from the tile_sheet.image to the buffer
        one by one according to the world.map. It then draws the buffer to the display
        canvas and takes care of scaling the buffer image up to the display canvas size. */
        render: function() {

            let ghost_numbers = 0;

            /* Here we loop through the tile map. */
            for (let y = 0; y < world.rows; y++) {
                for (let x = 0; x < world.columns; x++) {
                    let value = tile_sheet.dictionnary[world.map[y][x]];
                    /* if it's a wall ,  try connecting them */
                    if (value == tile_sheet.dictionnary[2]) {
                        if (x < world.columns - 1 && world.map[y][x + 1] == 2) {
                            value += 1;
                        }
                        if (y < world.rows - 1 && world.map[y + 1][x] == 2) {
                            value += 2;
                        }
                        if (x > 0 && world.map[y][x - 1] == 2) {
                            value += 4;
                        }
                        if (y > 0 && world.map[y - 1][x] == 2) {
                            value += 8;
                        }
                    }
                    if (value == tile_sheet.dictionnary[6]) {
                        value += ghost_numbers;
                        ghost_numbers++;
                    }
                    let source_x = tile_sheet.tilesize * Math.floor(value / tile_sheet.rows);
                    let source_y = tile_sheet.tilesize * (value % tile_sheet.rows);
                    let destination_x = x * world.tilesize;
                    let destination_y = y * world.tilesize;
                    this.buffer_level.drawImage(tile_sheet.image, source_x, source_y, tile_sheet.tilesize, tile_sheet.tilesize, destination_x, destination_y, world.tilesize, world.tilesize);
                }
            }

            /* Here we loop through the palette. */
            for (let y = 0; y < tile_sheet.dictionnary.length; y++) {
                let value = tile_sheet.dictionnary[y];
                let source_x = tile_sheet.tilesize * Math.floor(value / tile_sheet.rows);
                let source_y = tile_sheet.tilesize * (value % tile_sheet.rows);
                let destination_x = 0;
                let destination_y = y * world.tilesize;
                this.buffer_palette.drawImage(tile_sheet.image, source_x, source_y, tile_sheet.tilesize, tile_sheet.tilesize, destination_x, destination_y, world.tilesize, world.tilesize);
                if (y == tile_sheet.index) {
                    this.buffer_palette.lineWidth = "2";
                    this.buffer_palette.strokeStyle = "white";
                    this.buffer_palette.beginPath();
                    this.buffer_palette.rect(destination_x, destination_y, world.tilesize, world.tilesize);
                    this.buffer_palette.stroke();
                }
            }

            /* Now we draw the finalized buffer to the display canvas. You don't need to
            use a buffer; you could draw your tiles directly to the display canvas. If
            you are going to scale your display canvas at all, however, I recommend this
            method, because it eliminates antialiasing problems that arize due to scaling
            individual tiles. It is somewhat slower, however. */
            this.context.drawImage(this.buffer_level.canvas, 0, 0, this.buffer_level.canvas.width, this.buffer_level.canvas.height, 0, 0, this.context.canvas.height * world.columns / world.rows, this.context.canvas.height);
            this.context.drawImage(this.buffer_palette.canvas, 0, 0, this.buffer_palette.canvas.width, this.buffer_palette.canvas.height, this.context.canvas.width - this.context.canvas.height / tile_sheet.dictionnary.length, 0, this.context.canvas.height / tile_sheet.dictionnary.length, this.context.canvas.height);
        },

        /* Resizes the display canvas when the screen is resized. */
        resize: function(event) {

            let offset = 12;
            let clientWidth = document.documentElement.clientWidth - offset;
            let clientHeight = document.documentElement.clientHeight - offset;
            let height = clientHeight;
            let width = height * (19.5 / 21.0 + 1.5 / tile_sheet.dictionnary.length);
            if (width > clientWidth) {
                height = (clientWidth / width) * clientHeight;
                width = clientWidth;
            }

            display.context.canvas.width = width;
            display.context.canvas.height = height;

            display.buffer_level.imageSmoothingEnabled = false;
            display.buffer_palette.imageSmoothingEnabled = false;
            display.context.imageSmoothingEnabled = false;

            display.render();
        },

        cursorXY: function(x, y) {
            /* Let's determine il click is in level or palette */
            if (x < this.context.canvas.height * world.columns / world.rows) {
                /* it's in the level */
                /* update level data */
                let map_y = Math.floor(y * world.rows / this.context.canvas.height);
                let map_x = Math.floor(x * world.rows / this.context.canvas.height);
                if (world.map[map_y][map_x] != tile_sheet.index) {
                    world.map[map_y][map_x] = tile_sheet.index;
                    display.render();
                }
            }
            if (x >= this.context.canvas.width - this.context.canvas.height / tile_sheet.dictionnary.length) {
                let index = Math.floor(y * tile_sheet.dictionnary.length / this.context.canvas.height);
                if (index != tile_sheet.index) {
                    tile_sheet.index = index;
                    display.render();
                }
            }
        },

        inCanvas: function(x, y) {
            if (this.isDrawing) {
                x -= display.context.canvas.offsetLeft;
                y -= display.context.canvas.offsetTop;
                if (x >= 0 && x <= display.context.canvas.offsetWidth) {
                    if (y >= 0 && y <= display.context.canvas.offsetHeight) {
                        this.cursorXY(x, y);
                    }
                }
            }
        },

        drawStart: function(event) {
            this.isDrawing = true;
            let x = event.pageX;
            let y = event.pageY;
            if (event.touches && event.touches.length == 1) {
                // Get the information for finger #1
                let touch = event.touches[0];
                x = touch.pageX;
                y = touch.pageY;
            }
            this.inCanvas(x, y);
        },

        drawMove: function(event) {
            event.preventDefault();
            let x = event.pageX;
            let y = event.pageY;
            if (event.touches && event.touches.length == 1) {
                // Get the information for finger #1
                let touch = event.touches[0];
                x = touch.pageX;
                y = touch.pageY;
            }
            this.inCanvas(x, y);
        },

        drawEnd: function(event) {
            this.isDrawing = false;
        }

    };

    /* The tile_sheet object holds the tile sheet graphic as well as its dimensions. */
    tile_sheet = {

        image: new Image(), // The actual graphic will be loaded into this.
        rows: 8,
        tilesize: 16,
        index: 0,
        dictionnary: [
            91, /* space */
            32, /* gomme */
            0, /* mur */
            41, /* barrière */
            62, /* serrure */
            63, /* teleporteur */
            43, /* fantôme */
            51, /* fruit */
            61, /* clé */
            33, /* super gomme */
            36, /* dacman */
            64, /* deco: flower */
            65, /* deco: herb */
            66, /* deco: heart */
            67, /* deco: diamond */
            68, /* deco: club */
            69, /* deco: spade */
            70, /* deco: smiley */
            71 /* deco: animal */
        ]

    };

    /* The world holds information about the tile map. */
    world = {

        map: [
            [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
            [2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
            [2, 9, 2, 2, 1, 2, 2, 2, 1, 2, 1, 2, 2, 2, 1, 2, 2, 9, 2],
            [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
            [2, 1, 2, 2, 1, 2, 1, 2, 2, 2, 2, 2, 1, 2, 1, 2, 2, 1, 2],
            [2, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 2],
            [2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2],
            [0, 0, 0, 2, 1, 2, 0, 0, 0, 0, 0, 0, 0, 2, 1, 2, 0, 0, 0],
            [2, 2, 2, 2, 1, 2, 0, 2, 2, 3, 2, 2, 0, 2, 1, 2, 2, 2, 2],
            [0, 0, 0, 0, 1, 1, 0, 2, 6, 6, 6, 2, 0, 1, 1, 0, 0, 0, 0],
            [2, 2, 2, 2, 1, 2, 0, 2, 2, 2, 2, 2, 0, 2, 1, 2, 2, 2, 2],
            [0, 0, 0, 2, 1, 2, 0, 0, 0, 7, 0, 0, 0, 2, 1, 2, 0, 0, 0],
            [2, 2, 2, 2, 1, 2, 1, 2, 2, 2, 2, 2, 1, 2, 1, 2, 2, 2, 2],
            [2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
            [2, 1, 2, 2, 1, 2, 2, 2, 1, 2, 1, 2, 2, 2, 1, 2, 2, 1, 2],
            [2, 9, 1, 2, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 2, 1, 9, 2],
            [2, 2, 1, 2, 1, 2, 1, 2, 2, 2, 2, 2, 1, 2, 1, 2, 1, 2, 2],
            [2, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 2],
            [2, 1, 2, 2, 2, 2, 2, 2, 1, 2, 1, 2, 2, 2, 2, 2, 2, 1, 2],
            [2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
            [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
        ],
        tilesize: 16,
        columns: 19,
        rows: 21

    };

    //// INITIALIZE ////

    /* Before we can draw anything we have to load the tile_sheet image. */
    tile_sheet.image.addEventListener("load", function(event) {
        display.buffer_level.canvas.height = world.rows * world.tilesize;
        display.buffer_level.canvas.width = world.columns * world.tilesize;
        display.buffer_palette.canvas.height = tile_sheet.dictionnary.length * tile_sheet.tilesize;
        display.buffer_palette.canvas.width = 1 * tile_sheet.tilesize;
        display.resize();
    });

    /* Start loading the image. */
    tile_sheet.image.src = "tilesheet.png";

    window.addEventListener("resize", display.resize);

    window.addEventListener('mousedown', function(event) {
        display.drawStart(event);
    }, false)
    window.addEventListener('mousemove', function(event) {
        display.drawMove(event);
    }, false)
    window.addEventListener('mouseup', function(event) {
        display.drawEnd(event);
    }, false)
    window.addEventListener('touchstart', function(event) {
        display.drawStart(event);
    }, false)
    window.addEventListener('touchmove', function(event) {
        display.drawMove(event);
    }, false)
    window.addEventListener('touchend', function(event) {
        display.drawEnd(event);
    }, false)

})();