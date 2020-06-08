(function() {
    "use strict";

    /* The display handles everything to do with drawing graphics and resizing the
    screen. The world holds the map and its dimensions. */

    const states = {
        EDITOR: 'editor',
        GAME: 'game',
        PAUSE: 'pause'
    };

    var state = states.EDITOR;

    const speeds = [8,8,7,7,6,6,6,5,5,5];
    const tickInterval = 1000.0/60;

    const g0=[0,1,2,16+3,4,16+5,16+6,16+7,8,16+9,16+10,16+11,16+12,16+13,16+14,16+15];
    const g1=[0,1,2,1,4, 1,2,16+3,8,1,16+10,  1,8, 16+9,16+10,16+11];
    const g2=[0,1,2,2,4,16+5,2, 2,8,1,  2, 16+3,4, 16+5, 16+6, 16+7];
    const g4=[0,1,2,2,4, 4,4,16+6,8,8,16+10,16+10,4,16+12,  4,16+14];
    const g8=[0,1,2,1,4,16+5,4,16+5,8,8,  8, 16+9,8,  8,16+12,16+13];

    var level, game, ghosts, dacman, display, tile_sheet, world;

        level = 0;

        ghosts = {
            limit: 5,
            originY: [],
            originX: [],
            coordinateY: [],
            coordinateX: [],
            directionX: [],
            directionY: [],
            scared: [],
            invincible: [],
            hide: [],
            totalscared: 0,
            timeScared: 64 - level * 5,
            number: 0,
            ghostscore: 200,
            init: function(numberID,coordinateY,coordinateX) {
              this.coordinateY[numberID] = this.originY[numberID] = coordinateY;
              this.coordinateX[numberID] = this.originX[numberID] = coordinateX;
              this.scared[numberID] = 0;
              this.invincible[numberID] = false;
              this.hide[numberID] = 0;
              this.reset(numberID);
              this.number = numberID + 1;
            },
            vanish: function (numberID) {
              world.map[this.coordinateY[numberID]][this.coordinateX[numberID]] = this.hide[numberID];
            },
            appear: function (numberID) {
              this.hide[numberID] = world.map[this.coordinateY[numberID]][this.coordinateX[numberID]];
              world.map[this.coordinateY[numberID]][this.coordinateX[numberID]] = 6;
            },
            reset: function(numberID) {
              this.vanish(numberID);
              this.coordinateY[numberID] = this.originY[numberID];
              this.coordinateX[numberID] = this.originX[numberID];
              if (this.scared[numberID]) this.totalscared--;
              this.scared[numberID] = 0;
              this.appear(numberID);
              this.directionY[numberID] = 0;
              this.directionX[numberID] = 0;
            },
            resetAll: function() {
              for (let i = 0; i < this.number; i++) this.reset(i);
            },
            scareAll: function() {
              for (let i = 0; i < this.number; i++)
              if (this.scared[i]==0)
              {
                this.scared[i]= this.timeScared;
                this.totalscared++;
              }
            },
            move: function() {
              for (let i = 0; i < this.number; i++)
              {
                /* reduce scared level in ghost */
                if (this.scared[i]>0) this.scared[i]--;
                /* check walls around ghost */
                let wall = 15;
                let value = world.getTile(this.coordinateY[i],this.coordinateX[i],0,1);
                /* ghost is blocked by wall, lock and other ghosts */
                if (value == 2 || value == 4 || value == 6) {
                  wall -= 1;
                }
                value = world.getTile(this.coordinateY[i],this.coordinateX[i],1,0);
                /* ghost is blocked by wall, lock and other ghosts */
                if (value == 2 || value == 4 || value == 6) {
                  wall -= 2;
                }
                value = world.getTile(this.coordinateY[i],this.coordinateX[i],0,-1);
                /* ghost is blocked by wall, lock and other ghosts */
                if (value == 2 || value == 4 || value == 6) {
                  wall -= 4;
                }
                value = world.getTile(this.coordinateY[i],this.coordinateX[i],-1,0);
                /* ghost is blocked by wall, lock and other ghosts */
                if (value == 2 || value == 4 || value == 6) {
                  wall -= 8;
                }
                let direction = (this.directionX[i] == 1) ? 1 : (this.directionY[i] == 1) ? 2 : (this.directionX[i] == -1) ? 4 : (this.directionY[i] == -1) ? 8 : 0;
                switch (direction)
                {
                  case 0:
                    direction = g0[wall];
                    break;
                  case 1:
                    direction = g1[wall];
                    break;
                  case 2:
                    direction = g2[wall];
                    break;
                  case 4:
                    direction = g4[wall];
                    break;
                  case 8:
                    direction = g8[wall];
                    break;
                }
                while (direction > 8) {
                  let oldDirection = direction;
                  let hasard = Math.floor(Math.random()*4);
                  switch (hasard)
                  {
                    case 0:
                      direction &= 1;
                      break;
                    case 1:
                      direction &= 2;
                      break;
                    case 2:
                      direction &= 4;
                      break;
                    case 3:
                      direction &= 8;
                      break;
                  }
                  if (direction == 0) direction = oldDirection;
                }
                this.directionY[i] = 0;
                this.directionX[i] = 0;
                switch (direction)
                {
                  case 1:
                    this.directionX[i] = 1;
                    break;
                  case 2:
                    this.directionY[i] = 1;
                    break;
                  case 4:
                    this.directionX[i] = -1;
                    break;
                  case 8:
                    this.directionY[i] = -1;
                    break;
                }
                this.vanish(i);
                this.coordinateY[i] = world.warpY(this.coordinateY[i],this.directionY[i]);
                this.coordinateX[i] = world.warpX(this.coordinateX[i],this.directionX[i]);
                this.appear(i);

                /* ghost inteactions */
                /* if ghost eat fruit */
                if (this.hide[i]==7) {
                  if (this.scared[i]>0)
                  {
                    this.scared[i]=0;
                    totalscared--;
                  }
                  this.hide[i] = 0;
                  this.invincible[i]=true;  
                }
                /* touches dacman */
                if (this.hide[i]==10) {
                  if (this.scared[i]>0)
                  {
                    this.reset(i);
                    game.score += this.ghostscore;
                  }
                  else
                  {
                    this.hide[i] = dacman.hide;
                    dacman.dies();
                  }
                }
              }
            },
            id: function(y,x) {
              for (let i = 0; i < this.limit; i++)
              if (this.coordinateX[i]==x && this.coordinateY[i]==y)
              {
                return i;
              }
            },
            idLook: function(y,x) {
              let value = 0;
              let i = this.id(y,x);
              if (this.coordinateX[i]==x && this.coordinateY[i]==y)
              {
                if (this.invincible[i]) value = 7;
                else
                {
                  if (this.scared[i])
                  {
                    value = 5;
                    if (this.scared[i]>6 && this.scared[i]<=9) value = 6;
                    if (this.scared[i]>0 && this.scared[i]<=3) value = 6;
                  }
                  else
                  value = i; /* ghost number */
                }
              }
              return value;
            }
        },

        dacman = {
            originY: undefined,
            originX: undefined,
            coordinateY: undefined,
            coordinateX: undefined,
            directionY: 0,
            directionX: -1,
            hide: 0,
            mouthOpen:true,

            init: function(coordinateY,coordinateX) {
              this.coordinateY = this.originY = coordinateY;
              this.coordinateX = this.originX = coordinateX;
              this.hide = 0;
              this.directionY = 0;
              this.directionX = -1;
              this.mouthOpen = true;
              this.reset();
            },
            vanish: function () {
              world.map[this.coordinateY][this.coordinateX] = this.hide;
            },
            appear: function () {
              this.hide = world.map[this.coordinateY][this.coordinateX];
              world.map[this.coordinateY][this.coordinateX] = 10;
            },            
            reset: function() {
              this.vanish();
              this.coordinateY = this.originY;
              this.coordinateX = this.originX;
              this.appear();
            },
            dies: function() {
              game.reset();
              if (game.lives>0)
              {
                game.lives--;
              }
              else
              {
                game.end();
                changeStateTo(states.EDITOR);
                setTimeout(function() {
                  alert("GAME OVER");
                }, 100);
              }
            },
            moveDirection: function(directionY,directionX) {
              this.vanish();
              let newCoordinateY = world.warpY(this.coordinateY, directionY);
              let newCoordinateX = world.warpX(this.coordinateX, directionX);
              if (directionY != 0 && directionX !=0) {
                if (this.directionY != 0)
                {
                  let value = world.map[this.coordinateY][newCoordinateX];
                  if (value == 2 || value ==3)
                  {
                    this.directionX = 0; 
                    newCoordinateX = this.coordinateX;
                    this.directionY = directionY;
                  }
                  else
                  {
                    this.directionY = 0;
                    newCoordinateY = this.coordinateY;
                    this.directionX = directionX;
                  }
                }
                else
                {
                  let value = world.map[newCoordinateY][this.coordinateX];
                  if (value == 2 || value ==3)
                  {
                    this.directionY = 0; 
                    newCoordinateY = this.coordinateY;
                    this.directionX = directionX;
                  }
                  else
                  {
                    this.directionX = 0;
                    newCoordinateX = this.coordinateX;
                    this.directionY = directionY;
                  }
                }
              }
              else
              {
                this.directionY = directionY;
                this.directionX = directionX;
              }
              if (newCoordinateY!=this.coordinateY) {
                let value = world.map[newCoordinateY][this.coordinateX];
                if (value==2 || value==3 || (value==4 && game.keys==0)) /* wall , barrier */
                {
                  newCoordinateY = this.coordinateY;
                }
              }
              if (newCoordinateX!=this.coordinateX) {
                let value = world.map[this.coordinateY][newCoordinateX];
                if (value==2 || value==3 || (value==4 && game.keys==0)) /* wall , barrier */
                {
                  newCoordinateX = this.coordinateX;
                }
              }
              this.coordinateY = newCoordinateY;
              this.coordinateX = newCoordinateX;
              this.appear();
            },
            idLook: function() {
              this.mouthOpen = !(this.mouthOpen);
              if (this.mouthOpen) {
                if (this.directionX==1) return 0;
                if (this.directionY==1) return 1;
                if (this.directionX==-1) return 2;
                if (this.directionY==-1) return 3;
              } else {
                return 4;
              }
            }
        },

        game = {

            score: 0,
            lives: 3,
            keys: 0,
            dots:0,
            ghosts:0,
            dacman:0,
            speed:175,

            start: function() {
                /* init game variables */
                this.score = 0;
                this.lives = 3;
                this.keys = 0;
                /* save game world to not destroy it */
                world.save();
                /* Initialize Ghosts and Dacman status */
                this.ghosts = 0;
                this.dots = 0;
                this.dacman = 0;
                for (let y=0;y<world.rows;y++)
                {
                  for (let x=0;x<world.columns;x++) {
                    let value = world.map[y][x];
                    switch (value)
                    {
                      case 1:
                      case 9:
                        this.dots ++;
                        break;
                      case 10:
                        if (this.dacman<1) {
                          dacman.init(y,x);
                          this.dacman++;
                        }
                        break;
                      case 6:
                        /* limit of 5 ghosts */
                        if (this.ghosts<5) {
                          ghosts.init(this.ghosts,y,x);
                          this.ghosts++;
                        }
                        break;
                    }
                  }
                }
                /* Ghange state to GAME */
                if (this.dacman==1 && this.dots>0)
                {
                  state = states.GAME;
                }
                else
                {
                  /*
                    console.log("dots ="+this.dots+" ghosts ="+this.ghosts);
                   */
                    state = states.EDITOR;
                    setTimeout(function() {
                    alert("INVALID LEVEL")
                  }, 1000);
                }
                /* Start timer */
                this.dacmanTimeID = setInterval(this.moveSprites, tickInterval);
            },

            moveSprites: function() {
              if (game.countdown > 0)
              {
                game.countdown--;  
              }
              else
              {
                game.countdown = speeds[level];
                game.moveDacman();
                ghosts.move();
                display.render();
              }
            },

            moveDacman: function() {
                let dacmanDirectionY = 0;
                let dacmanDirectionX = 0;
                if (Key.isDown(Key.LEFT)) {
                    dacmanDirectionX--;
                }
                if (Key.isDown(Key.UP)) {
                    dacmanDirectionY--;
                }
                if (Key.isDown(Key.RIGHT)) {
                    dacmanDirectionX++;
                }
                if (Key.isDown(Key.DOWN)) {
                    dacmanDirectionY++;
                }
                if (dacmanDirectionY == 0 && dacmanDirectionX == 0)
                {
                  /* no direction change */
                  dacmanDirectionY = dacman.directionY;
                  dacmanDirectionX = dacman.directionX;
                }
                dacman.moveDirection(dacmanDirectionY, dacmanDirectionX);
                /*
                console.log("dotsleft="+game.dots+", dacman is on item#"+dacman.hide);
                */
                /* gomme */
                if (dacman.hide == 1) {
                    dacman.hide = 0;
                    game.dots--;
                    game.score += 10;
                }
                /* super gomme */
                if (dacman.hide == 9) {
                    dacman.hide = 0;
                    ghosts.scareAll();
                    game.dots--;
                    game.score += 50;
                }
                /* fruit */
                if (dacman.hide == 7) {
                    dacman.hide = 0;
                    game.score += 100;
                }
                /* clé */
                if (dacman.hide == 8) {
                    dacman.hide = 0;
                    game.keys++;
                }
                /* serrure */
                if (dacman.hide == 4) {
                    dacman.hide = 0;
                    game.keys--;
                }
                /* touches fantome */
                if (dacman.hide==6) {
                  let i = ghosts.id(dacman.coordinateY,dacman.coordinateX);
                  if (ghosts.scared[i]>0)
                  {
                    dacman.hide = ghosts.hide[i];
                    ghosts.reset(i);
                    game.score += ghosts.ghostscore;
                  }
                  else
                  {
                    dacman.hide = 0;
                    dacman.dies();
                  }
                }                
                /* GAGNE!  si toutes les gommes sont mangées */
                if (game.dots==0)  {
                  game.end();
                  setTimeout(function() {
                    alert("YOU WIN");
                    changeStateTo(states.EDITOR);
                  }, 100);
                }
            },

            reset: function() {
                /* Reset Ghosts and Dacman positions */
                ghosts.resetAll();
                dacman.reset();
            },

            end: function() {
                /* Stop timer */
                clearInterval(this.dacmanTimeID);
                /* Reset world */
                world.load();
            },

        };

    display = {

        /* We draw the tiles to the buffer in "world" coordinates or unscaled coordinates.
        All scaling is handled by drawImage when we draw the buffer to the display canvas. */
        buffer_level: document.createElement("canvas").getContext("2d"),
        buffer_bar: document.createElement("canvas").getContext("2d"),
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
                    if (value == tile_sheet.dictionnary[7]) {
                      value += level;
                    }

                    if (value == tile_sheet.dictionnary[6]) {
                      if (state==states.GAME) {
                        value = tile_sheet.ghosts[ghosts.idLook(y,x)];
                      } else {
                        value += ghost_numbers;
                        ghost_numbers++;
                      }
                    }
                    if (value == tile_sheet.dictionnary[10] && state == states.GAME) {
                      value = tile_sheet.dacman[dacman.idLook()];
                    }
                    let source_x = tile_sheet.tilesize * Math.floor(value / tile_sheet.rows);
                    let source_y = tile_sheet.tilesize * (value % tile_sheet.rows);
                    let destination_x = x * world.tilesize;
                    let destination_y = y * world.tilesize;
                    display.buffer_level.drawImage(tile_sheet.image, source_x, source_y, tile_sheet.tilesize, tile_sheet.tilesize, destination_x, destination_y, world.tilesize, world.tilesize);
                }
            }

            /* Here we loop through the bar. */
            if (state == states.EDITOR) {
                for (let y = 0; y < tile_sheet.dictionnary.length; y++) {
                    let value = tile_sheet.dictionnary[y];
                    let source_x = tile_sheet.tilesize * Math.floor(value / tile_sheet.rows);
                    let source_y = tile_sheet.tilesize * (value % tile_sheet.rows);
                    let destination_x = (display.isLandscape) ? 0 : y * world.tilesize;
                    let destination_y = (!display.isLandscape) ? 0 : y * world.tilesize;
                    display.buffer_bar.drawImage(tile_sheet.image, source_x, source_y, tile_sheet.tilesize, tile_sheet.tilesize, destination_x, destination_y, world.tilesize, world.tilesize);
                    if (y == tile_sheet.index) {
                        display.buffer_bar.lineWidth = "2";
                        display.buffer_bar.strokeStyle = "white";
                        display.buffer_bar.beginPath();
                        display.buffer_bar.rect(destination_x, destination_y, world.tilesize, world.tilesize);
                        display.buffer_bar.stroke();
                    }
                }
            }
            if (state == states.GAME) {
                for (let y = 0; y < tile_sheet.scoring.length; y++) {
                    let value = tile_sheet.scoring[y];
                    switch (y) {
                        case 1:
                            value = tile_sheet.numbers[game.lives];
                            break;
                        case 5:
                            value = tile_sheet.numbers[game.keys % 10];
                            break;
                        case 14:
                            value = tile_sheet.numbers[Math.floor(game.score / 10000) % 10]
                            break;
                        case 15:
                            value = tile_sheet.numbers[Math.floor(game.score / 1000) % 10]
                            break;
                        case 16:
                            value = tile_sheet.numbers[Math.floor(game.score / 100) % 10]
                            break;
                        case 17:
                            value = tile_sheet.numbers[Math.floor(game.score / 10) % 10]
                            break;
                        case 18:
                            value = tile_sheet.numbers[Math.floor(game.score / 1) % 10]
                            break;
                    }
                    let source_x = tile_sheet.tilesize * Math.floor(value / tile_sheet.rows);
                    let source_y = tile_sheet.tilesize * (value % tile_sheet.rows);
                    let destination_x = (display.isLandscape) ? 0 : y * world.tilesize;
                    let destination_y = (!display.isLandscape) ? 0 : y * world.tilesize;
                    display.buffer_bar.drawImage(tile_sheet.image, source_x, source_y, tile_sheet.tilesize, tile_sheet.tilesize, destination_x, destination_y, world.tilesize, world.tilesize);
                    if (state == states.EDITOR && y == tile_sheet.index) {
                        display.buffer_bar.lineWidth = "2";
                        display.buffer_bar.strokeStyle = "white";
                        display.buffer_bar.beginPath();
                        display.buffer_bar.rect(destination_x, destination_y, world.tilesize, world.tilesize);
                        display.buffer_bar.stroke();
                    }
                }
            }

            /* Now we draw the finalized buffer to the display canvas. */
            if (display.isLandscape) {
                display.context.drawImage(display.buffer_level.canvas, 0, 0, display.buffer_level.canvas.width, display.buffer_level.canvas.height, 0, 0, display.context.canvas.height * world.columns / world.rows, display.context.canvas.height);
                display.context.drawImage(display.buffer_bar.canvas, 0, 0, display.buffer_bar.canvas.width, display.buffer_bar.canvas.height, display.context.canvas.width - display.context.canvas.height / tile_sheet.dictionnary.length, 0, display.context.canvas.height / tile_sheet.dictionnary.length, display.context.canvas.height);
            } else {
                display.context.drawImage(display.buffer_level.canvas, 0, 0, display.buffer_level.canvas.width, display.buffer_level.canvas.height, 0, 0, display.context.canvas.width, display.context.canvas.width * world.rows / world.columns);
                display.context.drawImage(display.buffer_bar.canvas, 0, 0, display.buffer_bar.canvas.width, display.buffer_bar.canvas.height, 0, display.context.canvas.height - display.context.canvas.width / tile_sheet.dictionnary.length, display.context.canvas.width, display.context.canvas.width / tile_sheet.dictionnary.length);
            }
            /*
            console.log(display.context.canvas);
            console.log(display.context.canvas.height * world.columns / world.rows);
            console.log(display.context.canvas.width * world.rows / world.columns);
            */
        },

        resizeBuffers: function() {
            display.buffer_level.canvas.height = world.rows * world.tilesize;
            display.buffer_level.canvas.width = world.columns * world.tilesize;
            if (display.isLandscape) {
                display.buffer_bar.canvas.height = tile_sheet.dictionnary.length * tile_sheet.tilesize;
                display.buffer_bar.canvas.width = 1 * tile_sheet.tilesize;
            } else {
                display.buffer_bar.canvas.height = 1 * tile_sheet.tilesize;
                display.buffer_bar.canvas.width = tile_sheet.dictionnary.length * tile_sheet.tilesize;
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
            display.buffer_bar.imageSmoothingEnabled = false;
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
                    if (state == states.EDITOR) {
                        if (world.map[map_y][map_x] != tile_sheet.index) {
                            world.map[map_y][map_x] = tile_sheet.index;
                        }
                      this.render();
                    }
                    else if (state == states.GAME) {
                      if (map_y<=world.rows/3) {Key.down(Key.UP); Key.up(Key.DOWN);}
                      if (map_y>=world.rows*2/3) {Key.down(Key.DOWN); Key.up(Key.UP);}
                      if (map_x<=world.columns/3) {Key.down(Key.LEFT); Key.up(Key.RIGHT);}
                      if (map_x>=world.columns*2/3) {Key.down(Key.RIGHT); Key.up(Key.LEFT);}
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
                    if (state == states.EDITOR) {

                        if (world.map[map_y][map_x] != tile_sheet.index) {
                            world.map[map_y][map_x] = tile_sheet.index;
                        }
                      this.render();
                    } else if (state == states.GAME) {
                      if (map_y<=world.rows/3) {Key.down(Key.UP); Key.up(Key.DOWN);}
                      if (map_y>=world.rows*2/3) {Key.down(Key.DOWN); Key.up(Key.UP);}
                      if (map_x<=world.columns/3) {Key.down(Key.LEFT); Key.up(Key.RIGHT);}
                      if (map_x>=world.columns*2/3) {Key.down(Key.RIGHT); Key.up(Key.LEFT);}
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
        ],

        dacman: [
            34, /* right */
            35, /* down */
            36, /* left */
            37, /* up */
            38  /* mouth close */
        ],

        ghosts: [
            43, /* red */
            44, /* cyan */
            45, /* green */
            46, /* purple */
            47, /* pink */
            48, /* scared */
            49, /* scared-end */
            42 /* never scared */
        ],

        scoring: [
            36, /* dacman */
            168, /* number */
            91, /* space */
            91, /* space */
            61, /* clé */
            168, /* number */
            91, /* space */
            91, /* space */
            114, /* S */
            98, /* C */
            110, /* O */
            113, /* R */
            100, /* E */
            91, /* space */
            168, /* number */
            168, /* number */
            168, /* number */
            168, /* number */
            168, /* number */
        ],

        numbers: [
            168, /* 0 */
            169, /* 1 */
            170, /* 2 */
            171, /* 3 */
            172, /* 4 */
            173, /* 5 */
            174, /* 6 */
            175, /* 7 */
            176, /* 8 */
            177 /* 9 */
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

        saved: [],

        save: function() {
            for (let y = 0; y < world.rows; y++) {
                for (let x = 0; x < world.columns; x++) {
                    world.saved[y] = world.map[y].slice();
                }
            }
        },

        load: function() {
            for (let y = 0; y < world.rows; y++) {
                for (let x = 0; x < world.columns; x++) {
                    world.map[y][x] = world.saved[y][x];
                }
            }
        },

        clear: function() {
            for (let y = 0; y < world.rows; y++) {
                for (let x = 0; x < world.columns; x++) {
                    world.map[y][x] = 0;
                }
            }
        },

        warpX: function(x,dx) {
          return (x+dx+world.columns) % world.columns;
        },

        warpY: function(y,dy) {
          return (y+dy+world.rows) % world.rows;
        },

        getTile: function(y,x,dy,dx)
        {
          return world.map[world.warpY(y,dy)][world.warpX(x,dx)];
        },

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
    }, false);
    window.addEventListener('mousemove', function(event) {
        display.drawMove(event);
    }, false);
    window.addEventListener('mouseup', function(event) {
        display.drawEnd(event);
    }, false);
    window.addEventListener('touchstart', function(event) {
        display.drawStart(event);
    }, false);
    window.addEventListener('touchmove', function(event) {
        display.drawMove(event);
    }, false);
    window.addEventListener('touchend', function(event) {
        display.drawEnd(event);
    }, false);

    function changeStateTo(newState) {
      if (state != newState) {
        state = newState;
        if (state == states.GAME) {
          game.start();
        }
        if (state == states.EDITOR) {
          game.end();
          state = states.EDITOR;
        }
      }
      display.render();
    }

    document.getElementById("new").addEventListener("click", function(){
      /*
      console.log("new");
      */
      if (state == states.GAME) {
        game.end();
      }
      world.clear();
      changeStateTo(states.EDITOR);
    });

    document.getElementById("edit").addEventListener("click", function(){
      /*
      console.log("edit");
      */
      changeStateTo(states.EDITOR);
    });

    document.getElementById("run").addEventListener("click", function(){
      /*
      console.log("run");
      */
      changeStateTo(states.GAME);
    });

    document.getElementById("level").addEventListener("click", function(){
      /*
      console.log("level");
       */
      level = (level+1) % 10;
      display.render();
    });

    var Key = {
        _pressed: {},

        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,

        isDown: function(keyCode) {
            return this._pressed[keyCode];
        },

        down: function(keyCode) {
          this._pressed[keyCode] = true;
        },

        up: function(keyCode) {
          delete this._pressed[keyCode];
        },

        onKeydown: function(event) {
            Key.down(event.keyCode);
        },

        onKeyup: function(event) {
            Key.up(event.keyCode);
        }
    };

    document.addEventListener('keyup', function(event) {
        Key.onKeyup(event);
    }, false);
    document.addEventListener('keydown', function(event) {
        Key.onKeydown(event);
    }, false);

})();