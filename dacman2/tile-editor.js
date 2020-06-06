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

        isLandscape: undefined,

        isDrawing: false,

        /* This function draws the tile graphics from the tile_sheet.image to the buffer
        one by one according to the world.map. It then draws the buffer to the display
        canvas and takes care of scaling the buffer image up to the display canvas size. */
        render: function() {

            display.resizeBuffers();

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
                    display.buffer_level.drawImage(tile_sheet.image, source_x, source_y, tile_sheet.tilesize, tile_sheet.tilesize, destination_x, destination_y, world.tilesize, world.tilesize);
                }
            }

            /* Here we loop through the palette. */
            for (let y = 0; y < tile_sheet.dictionnary.length; y++) {
                let value = tile_sheet.dictionnary[y];
                let source_x = tile_sheet.tilesize * Math.floor(value / tile_sheet.rows);
                let source_y = tile_sheet.tilesize * (value % tile_sheet.rows);
                let destination_x = (display.isLandscape) ? 0 : y * world.tilesize;
                let destination_y = (!display.isLandscape) ? 0 : y * world.tilesize;
                display.buffer_palette.drawImage(tile_sheet.image, source_x, source_y, tile_sheet.tilesize, tile_sheet.tilesize, destination_x, destination_y, world.tilesize, world.tilesize);
                if (y == tile_sheet.index) {
                    display.buffer_palette.lineWidth = "2";
                    display.buffer_palette.strokeStyle = "white";
                    display.buffer_palette.beginPath();
                    display.buffer_palette.rect(destination_x, destination_y, world.tilesize, world.tilesize);
                    display.buffer_palette.stroke();
                }
            }

            /* Now we draw the finalized buffer to the display canvas. */
            if ( display.isLandscape ) {
              display.context.drawImage(display.buffer_level.canvas, 0, 0, display.buffer_level.canvas.width, display.buffer_level.canvas.height, 0, 0, display.context.canvas.height * world.columns / world.rows, display.context.canvas.height);
              display.context.drawImage(display.buffer_palette.canvas, 0, 0, display.buffer_palette.canvas.width, display.buffer_palette.canvas.height, display.context.canvas.width - display.context.canvas.height / tile_sheet.dictionnary.length, 0, display.context.canvas.height / tile_sheet.dictionnary.length, display.context.canvas.height);
            } else {
              display.context.drawImage(display.buffer_level.canvas, 0, 0, display.buffer_level.canvas.width, display.buffer_level.canvas.height, 0, 0, display.context.canvas.width, display.context.canvas.width * world.rows / world.columns);
              display.context.drawImage(display.buffer_palette.canvas, 0, 0, display.buffer_palette.canvas.width, display.buffer_palette.canvas.height, 0, display.context.canvas.height - display.context.canvas.width / tile_sheet.dictionnary.length, display.context.canvas.width, display.context.canvas.width / tile_sheet.dictionnary.length);
            }
            console.log(display.context.canvas);
            console.log(display.context.canvas.height * world.columns / world.rows);
            console.log(display.context.canvas.width * world.rows / world.columns);
        },

        resizeBuffers: function() {
            display.buffer_level.canvas.height = world.rows * world.tilesize;
            display.buffer_level.canvas.width = world.columns * world.tilesize;
            if (display.isLandscape) {
              display.buffer_palette.canvas.height = tile_sheet.dictionnary.length * tile_sheet.tilesize;
              display.buffer_palette.canvas.width = 1 * tile_sheet.tilesize;
            } else {
              display.buffer_palette.canvas.height = 1 * tile_sheet.tilesize;
              display.buffer_palette.canvas.width = tile_sheet.dictionnary.length * tile_sheet.tilesize;
            }
        },

        /* Resizes the display canvas when the screen is resized. */
        resize: function(event) {

            let offset = 48;
            let clientWidth = document.documentElement.clientWidth - offset;
            let clientHeight = document.documentElement.clientHeight - offset;
            let width = clientWidth
            let height = clientWidth * (21.5 / 19 + 1.5 / tile_sheet.dictionnary.length);
            display.isLandscape = false;
            if (height > clientHeight) {
              height = clientHeight;
              width = height * (19.5 / 21.0 + 1.5 / tile_sheet.dictionnary.length);
              display.isLandscape = true;
              if (width > clientWidth) {
                height = (clientWidth / width) * clientHeight;
                width = clientWidth;
              }
            }
            display.context.canvas.width = width;
            display.context.canvas.height = height;

            display.buffer_level.imageSmoothingEnabled = false;
            display.buffer_palette.imageSmoothingEnabled = false;
            display.context.imageSmoothingEnabled = false;

            display.render();
        },

        cursorXY: function(x, y) {
          if (display.isLandscape) {
            /* Let's determine il click is in level or palette */
            if (x < display.context.canvas.height * world.columns / world.rows) {
                /* it's in the level */
                /* update level data */
                let map_y = Math.floor(y * world.rows / display.context.canvas.height);
                let map_x = Math.floor(x * world.rows / display.context.canvas.height);
                if (world.map[map_y][map_x] != tile_sheet.index) {
                    world.map[map_y][map_x] = tile_sheet.index;
                    this.render();
                }
            }
            if (x >= display.context.canvas.width - display.context.canvas.height / tile_sheet.dictionnary.length) {
                let index = Math.floor(y * tile_sheet.dictionnary.length / display.context.canvas.height);
                if (index != tile_sheet.index) {
                    tile_sheet.index = index;
                    this.render();
                }
            }
          } else {
            if (y < display.context.canvas.width * world.rows / world.columns) {
                /* it's in the level */
                /* update level data */
                let map_y = Math.floor(y * world.columns / display.context.canvas.width);
                let map_x = Math.floor(x * world.columns / display.context.canvas.width);
                if (world.map[map_y][map_x] != tile_sheet.index) {
                    world.map[map_y][map_x] = tile_sheet.index;
                    this.render();
                }
            }
            if (y >= display.context.canvas.height - display.context.canvas.width / tile_sheet.dictionnary.length) {
                let index = Math.floor(x * tile_sheet.dictionnary.length / display.context.canvas.width);
                if (index != tile_sheet.index) {
                    tile_sheet.index = index;
                    this.render();
                }
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