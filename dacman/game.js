document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid')
    const ScoreDisplay = document.getElementById('score')
    const width = 19
    const height = 21
    const layout = [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 3, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 3, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1,
        1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1,
        4, 4, 4, 1, 0, 1, 4, 4, 4, 4, 4, 4, 4, 1, 0, 1, 4, 4, 4,
        1, 1, 1, 1, 0, 1, 4, 1, 1, 2, 1, 1, 4, 1, 0, 1, 1, 1, 1,
        4, 4, 4, 4, 0, 0, 4, 1, 7, 8, 9, 1, 4, 0, 0, 4, 4, 4, 4,
        1, 1, 1, 1, 0, 1, 4, 1, 1, 1, 1, 1, 4, 1, 0, 1, 1, 1, 1,
        4, 4, 4, 1, 0, 1, 4, 4, 4, 6, 4, 4, 4, 1, 0, 1, 4, 4, 4,
        1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1,
        1, 3, 0, 1, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 1, 0, 3, 1,
        1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1,
        1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1,
        1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1,
        1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
    ]

    class Ghost {
        constructor(className, startIndex, speed) {
            this.className = className
            this.startIndex = startIndex
            this.speed = speed
            this.timerID = NaN
            this.reset()
        }

        reset() {
            this.currentIndex = this.startIndex
            this.isScared = false
        }
        eaten(index) {
            if (this.currentIndex === index) this.reset()
        }
    }

    let dacmanIndex = 0
    let score = 0
    let totalDots = 0
    let dacmanDirection = 0
    let dacmanSpeed = 150
    let ghostSpeed = 200
    const ghosts = []
    const squares = []

    //  0 - dot
    //  1 - wall
    //  2 - ghost
    //  3 - power
    //  4 - empty
    //  5 - dacman

    function createBoard() {
        for (let i = 0; i < layout.length; i++) {
            const square = document.createElement('div')
            if (layout[i] === 0) {
                square.classList.add('dot')
                totalDots++
            }
            if (layout[i] === 1) {
                square.classList.add('wall')
            }
            if (layout[i] === 2) {
                square.classList.add('lair')
            }
            if (layout[i] === 3) {
                square.classList.add('powerup')
                totalDots++
            }
            if (layout[i] === 5) {
                square.classList.add('dacman')
                dacmanIndex = i
            }
            if (layout[i] === 6) {
                square.classList.add('fruit')
            }
            if (layout[i] === 7) {
                //square.classList.add('lair')
                ghosts.push(new Ghost('blinky', i, ghostSpeed))
            }
            if (layout[i] === 8) {
                //square.classList.add('lair')
                ghosts.push(new Ghost('inky', i, ghostSpeed))
            }
            if (layout[i] === 9) {
                //square.classList.add('lair')
                ghosts.push(new Ghost('clyde', i, ghostSpeed))
            }
            grid.appendChild(square)
            squares.push(square)
        }
        ghosts.forEach(ghost => {
            squares[ghost.currentIndex].classList.add('ghost', ghost.className)
        })
    }
    createBoard()

    ghosts.forEach(ghost => moveGhost(ghost))

    // WARP MOVES ALLOWED
    function warp(index, direction) {
        if (direction === -1) {
            index += ((index % width === 0) ? width : 0) - 1
        }
        if (direction === -width) {
            index += ((index < width) ? width * height : 0) - width
        }
        if (direction === 1) {
            index += -((index % width === width - 1) ? width : 0) + 1
        }
        if (direction === width) {
            index += width
            if (index >= width * height) index %= width
        }
        return index
    }

    // RANDOM MOVES
    function moveGhost(ghost) {
        const directions = [-1, -width, 1, width]
        let direction = directions[Math.floor(Math.random() * directions.length)]
        ghost.timerID = setInterval(function() {
            let possibleDirections = []
            directions.forEach(
                function(possibleDirection) {
                    index = warp(ghost.currentIndex, possibleDirection)
                    if (!squares[index].classList.contains('ghost') && !squares[index].classList.contains('wall')) {
                        if (possibleDirection != -direction)
                            possibleDirections.push(possibleDirection)
                    }
                }
            )
            if (possibleDirections.length === 0) {
                direction = 0
            } else {
                direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)]
                squares[ghost.currentIndex].classList.remove('ghost', ghost.className, 'scared')
                ghost.currentIndex = warp(ghost.currentIndex, direction)
                if (squares[ghost.currentIndex].classList.contains('dacman')) {
                    if (ghost.isScared) {
                        ghost.reset()
                        addGhostScore()
                    }
                }
                squares[ghost.currentIndex].classList.add('ghost', ghost.className)
            }
            if (ghost.isScared) {
                squares[ghost.currentIndex].classList.add('scared')
            }
            isGameOver()
        }, ghost.speed)
    }

    var Key = {
        _pressed: {},

        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,

        isDown: function(keyCode) {
            return this._pressed[keyCode];
        },

        onKeydown: function(event) {
            this._pressed[event.keyCode] = true;
        },

        onKeyup: function(event) {
            delete this._pressed[event.keyCode];
        }
    };

    document.addEventListener('keyup', function(event) {
        Key.onKeyup(event);
    }, false);
    document.addEventListener('keydown', function(event) {
        Key.onKeydown(event);
    }, false);

    dacmanTimeID = setInterval(moveDacman, dacmanSpeed)

    function moveDacman() {
        squares[dacmanIndex].classList.remove('dacman')
        let dacmanNewIndex = dacmanIndex
        if (Key.isDown(Key.LEFT)) {
            dacmanDirection = -1
        }
        if (Key.isDown(Key.UP)) {
            dacmanDirection = -width
        }
        if (Key.isDown(Key.RIGHT)) {
            dacmanDirection = 1
        }
        if (Key.isDown(Key.DOWN)) {
            dacmanDirection = width
        }
        dacmanNewIndex = warp(dacmanIndex, dacmanDirection)
            // Can't go through walls
        if (squares[dacmanNewIndex].classList.contains('wall')) {
            dacmanDirection = 0
            dacmanNewIndex = dacmanIndex
        }
        // Can't enter ghost lair
        if (squares[dacmanNewIndex].classList.contains('lair')) {
            dacmanDirection = 0
            dacmanNewIndex = dacmanIndex
        }
        dacmanIndex = dacmanNewIndex
            // Can eat dot
        if (squares[dacmanIndex].classList.contains('dot')) {
            eatDot()
        }
        // Can eat fruit
        if (squares[dacmanIndex].classList.contains('fruit')) {
            eatFruit()
        }
        // Can eat powerup
        if (squares[dacmanIndex].classList.contains('powerup')) {
            eatPowerUP()
        }
        if (squares[dacmanIndex].classList.contains('scared')) {
            eatGhost()
        }
        isWin()
        isGameOver()
        squares[dacmanIndex].classList.add('dacman')
    }

    function updateScore(scoreIncrease) {
        score += scoreIncrease
        ScoreDisplay.innerHTML = score
    }

    function eatDot() {
        updateScore(10)
        totalDots--
        squares[dacmanIndex].classList.remove('dot')
    }

    function eatFruit() {
        updateScore(100)
        squares[dacmanIndex].classList.remove('fruit')
    }

    function eatGhost() {
        updateScore(ghostScore)
        squares[dacmanIndex].classList.remove('ghost', 'scared', 'blinky', 'inky', 'clyde')
        ghostScore += ghostScore
        ghosts.forEach(ghost => ghost.eaten(dacmanIndex))
    }

    function setGhostsScaredState(state) {
        ghosts.forEach(ghost => ghost.isScared = state)
    }

    function unScaredGhosts() {
        setGhostsScaredState(false)
    }

    function eatPowerUP() {
        updateScore(50)
        totalDots--
        squares[dacmanIndex].classList.remove('powerup')
        setGhostsScaredState(true)
        setTimeout(unScaredGhosts, 5000)
        ghostScore = 200
    }

    function stopGhosts() {
        ghosts.forEach(ghost => clearInterval(ghost.timerID))
    }

    function stopGame() {
        stopGhosts()
        clearInterval(dacmanTimeID)
    }

    function isGameOver() {
        if (squares[dacmanIndex].classList.contains('ghost') && !squares[dacmanIndex].classList.contains('scared')) {
            stopGame()
            setTimeout(function() {
                alert("GAME OVER")
            }, 1000)
        }
    }

    function isWin() {
        if (totalDots === 0) {
            stopGame()
            setTimeout(function() {
                alert("YOU WIN")
            }, 1000)
        }
    }

    //document.addEventListener('keyup',moveDacman)
    //document.addEventListener('keydown',moveDacman)

})