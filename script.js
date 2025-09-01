document.addEventListener('DOMContentLoaded', () => {
    // --- ACCESSIBLE SOUND CUSTOMIZATION ---
    const SOUNDS = {
        click: new Audio('sounds/click.wav'),
        win: new Audio('sounds/win.wav'),
        draw: new Audio('sounds/draw.wav'),
        ui: new Audio('sounds/ui-click.wav')
    };
    function playSound(sound) {
        const audio = SOUNDS[sound];
        if (audio) {
            audio.cloneNode().play();
        }
    }
    // --- END SOUND CUSTOMIZATION ---

    // --- State Variables ---
    let board, gameActive, gameMode, currentPlayer, difficulty;
    let gridSize = 3;
    let winLength = 3;
    const PLAYER_X = 'X';
    const PLAYER_O = 'O';

    // --- DOM Elements ---
    const menuScreen = document.getElementById('menu-screen');
    const difficultyScreen = document.getElementById('difficulty-screen');
    const gridScreen = document.getElementById('grid-screen');
    const gameScreen = document.getElementById('game-screen');
    // MODIFICATION: Added new screen
    const funModesScreen = document.getElementById('fun-modes-screen');

    const statusText = document.getElementById('status-text');
    const gameBoard = document.getElementById('game-board');
    const pvpButton = document.getElementById('pvp-button');
    const pvaButton = document.getElementById('pva-button');
    // MODIFICATION: Added new buttons
    const funModesButton = document.getElementById('fun-modes-button');
    const gameBackButton = document.getElementById('game-back-button');
    const difficultyBackButton = document.getElementById('difficulty-back-button');
    const gridBackButton = document.getElementById('grid-back-button');
    const funModesBackButton = document.getElementById('fun-modes-back-button');


    // --- Event Listeners ---
    pvpButton.addEventListener('click', () => { playSound('ui'); showGridScreen(); });
    pvaButton.addEventListener('click', () => { playSound('ui'); showDifficultyScreen(); });
    // MODIFICATION: Added listener for new Fun Modes button
    funModesButton.addEventListener('click', () => { playSound('ui'); showFunModesScreen(); });

    document.querySelectorAll('#difficulty-screen .difficulty-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            playSound('ui');
            selectMode('pva', e.target.dataset.difficulty);
        });
    });
    // MODIFICATION: Changed selector to be more specific
    document.querySelectorAll('#fun-modes-screen .menu-button').forEach(button => {
        button.addEventListener('click', () => {
            playSound('ui');
            alert('This Fun Mode is coming soon!');
        });
    });
    gameBackButton.addEventListener('click', () => { playSound('ui'); showMenu(); });
    difficultyBackButton.addEventListener('click', () => { playSound('ui'); showMenu(); });
    gridBackButton.addEventListener('click', () => { playSound('ui'); showMenu(); });
    // MODIFICATION: Added listener for new back button
    funModesBackButton.addEventListener('click', () => { playSound('ui'); showMenu(); });


    // --- Game Flow ---
    function showMenu() {
        gameScreen.classList.add('hidden');
        difficultyScreen.classList.add('hidden');
        gridScreen.classList.add('hidden');
        // MODIFICATION: Also hide fun modes screen
        funModesScreen.classList.add('hidden');
        menuScreen.classList.remove('hidden');
    }

    function showDifficultyScreen() {
        menuScreen.classList.add('hidden');
        difficultyScreen.classList.remove('hidden');
    }

    function showGridScreen() {
        menuScreen.classList.add('hidden');
        gridScreen.classList.remove('hidden');
        populateGridOptions();
    }
    
    // MODIFICATION: New function to show the Fun Modes screen
    function showFunModesScreen() {
        menuScreen.classList.add('hidden');
        funModesScreen.classList.remove('hidden');
    }

    function selectMode(mode, diff = null, size = 3, length = 3) {
        gameMode = mode;
        difficulty = diff;
        gridSize = size;
        winLength = length;
        menuScreen.classList.add('hidden');
        difficultyScreen.classList.add('hidden');
        gridScreen.classList.add('hidden');
        funModesScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        startGame();
    }

    function startGame() {
        board = Array(gridSize * gridSize).fill(null);
        gameActive = true;
        currentPlayer = PLAYER_X;
        statusText.textContent = gameMode === 'pva' ? "Your Turn" : `Play Player X`;
        createBoardUI();
    }

    function createBoardUI() {
        gameBoard.innerHTML = '';
        const boardSizePx = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.7, 600);
        const cellSize = boardSizePx / gridSize;
        const fontSize = cellSize * 0.6;

        gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
        gameBoard.style.width = `${boardSizePx}px`;
        gameBoard.style.height = `${boardSizePx}px`;
        
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.style.fontSize = `${fontSize}px`;
            cell.addEventListener('click', handleCellClick);
            gameBoard.appendChild(cell);
        }
    }

    // --- Main Game Logic ---
    function handleCellClick(e) {
        const index = parseInt(e.target.dataset.index);
        if (!gameActive || board[index] !== null) return;
        
        if (gameMode === 'pvp' || (gameMode === 'pva' && currentPlayer === PLAYER_X)) {
            playSound('click');
            makeMove(index, currentPlayer);
            if (checkGameOver()) return;

            if (gameMode === 'pvp') {
                currentPlayer = currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
                statusText.textContent = `Play Player ${currentPlayer}`;
            } else {
                currentPlayer = PLAYER_O;
                statusText.textContent = "AI is thinking...";
                gameActive = false;
                setTimeout(aiMove, 500);
            }
        }
    }

    function makeMove(index, player) {
        board[index] = player;
        const cell = gameBoard.children[index];
        cell.textContent = player;
        cell.classList.add(player.toLowerCase());
    }

    function checkGameOver() {
        const winner = checkWinner(board);
        if (winner) {
            endGame(winner);
            return true;
        }
        return false;
    }

    function endGame(result) {
        gameActive = false;
        if (result === 'draw') {
            playSound('draw');
            statusText.textContent = "You both tied! 🤝";
        } else {
            playSound('win');
            if (gameMode === 'pva' && result === PLAYER_O) {
                statusText.textContent = "AI Wins!";
            } else {
                statusText.textContent = `Player ${result} is the Winner!`;
            }
        }
    }

    // --- AI-Specific Functions ---
    function aiMove() {
        const moveIndex = getAiMove(board);
        if (moveIndex !== null) { makeMove(moveIndex, PLAYER_O); }
        if (checkGameOver()) return;
        currentPlayer = PLAYER_X;
        gameActive = true;
        statusText.textContent = "Your Turn";
    }

    function getAiMove(currentBoard) {
        switch (difficulty) {
            case 'easy': return getEasyMove(currentBoard);
            case 'medium': return getMediumMove(currentBoard);
            case 'hard': return findBestMove(currentBoard, 4);
            case 'unbeatable': return findBestMove(currentBoard);
            default: return getEasyMove(currentBoard);
        }
    }

    function getEasyMove(currentBoard) {
        const availableMoves = [];
        for (let i = 0; i < currentBoard.length; i++) {
            if (currentBoard[i] === null) availableMoves.push(i);
        }
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    function getMediumMove(currentBoard) {
        for (let i = 0; i < 9; i++) {
            if (currentBoard[i] === null) {
                currentBoard[i] = PLAYER_O;
                if (checkWinner3x3(currentBoard) === PLAYER_O) { currentBoard[i] = null; return i; }
                currentBoard[i] = null;
            }
        }
        for (let i = 0; i < 9; i++) {
            if (currentBoard[i] === null) {
                currentBoard[i] = PLAYER_X;
                if (checkWinner3x3(currentBoard) === PLAYER_X) { currentBoard[i] = null; return i; }
                currentBoard[i] = null;
            }
        }
        return getEasyMove(currentBoard);
    }

    // --- Dynamic & AI Brain ---
    function checkWinner(board) {
        const size = gridSize;
        const length = winLength;
        function get(r, c) { return board[r * size + c]; }
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const player = get(r, c);
                if (player === null) continue;
                if (c + length <= size) { let win = true; for (let i = 1; i < length; i++) { if (get(r, c + i) !== player) { win = false; break; } } if (win) return player; }
                if (r + length <= size) { let win = true; for (let i = 1; i < length; i++) { if (get(r + i, c) !== player) { win = false; break; } } if (win) return player; }
                if (c + length <= size && r + length <= size) { let win = true; for (let i = 1; i < length; i++) { if (get(r + i, c + i) !== player) { win = false; break; } } if (win) return player; }
                if (c - length + 1 >= 0 && r + length <= size) { let win = true; for (let i = 1; i < length; i++) { if (get(r + i, c - i) !== player) { win = false; break; } } if (win) return player; }
            }
        }
        if (!board.includes(null)) return 'draw';
        return null;
    }
    
    function minimax(currentBoard, depth, alpha, beta, isMaximizing, maxDepth) {
        const winnerResult = checkWinner3x3(currentBoard);
        if (winnerResult === PLAYER_O) return 1;
        if (winnerResult === PLAYER_X) return -1;
        if (winnerResult === 'draw') return 0;
        if (depth === maxDepth) return 0;
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (currentBoard[i] === null) {
                    currentBoard[i] = PLAYER_O;
                    let eval = minimax(currentBoard, depth + 1, alpha, beta, false, maxDepth);
                    currentBoard[i] = null;
                    maxEval = Math.max(maxEval, eval);
                    alpha = Math.max(alpha, eval);
                    if (beta <= alpha) break;
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < 9; i++) {
                if (currentBoard[i] === null) {
                    currentBoard[i] = PLAYER_X;
                    let eval = minimax(currentBoard, depth + 1, alpha, beta, true, maxDepth);
                    currentBoard[i] = null;
                    minEval = Math.min(minEval, eval);
                    beta = Math.min(beta, eval);
                    if (beta <= alpha) break;
                }
            }
            return minEval;
        }
    }
    
    function findBestMove(currentBoard, maxDepth = Infinity) {
        let bestScore = -Infinity;
        let move = null;
        for (let i = 0; i < 9; i++) {
            if (currentBoard[i] === null) {
                currentBoard[i] = PLAYER_O;
                let score = minimax(currentBoard, 0, -Infinity, Infinity, false, maxDepth);
                currentBoard[i] = null;
                if (score > bestScore) { bestScore = score; move = i; }
            }
        }
        return move !== null ? move : getEasyMove(currentBoard);
    }
    
    const win_combinations_3x3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    function checkWinner3x3(board) {
        for (const combo of win_combinations_3x3) {
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) { return board[a]; }
        }
        if (!board.slice(0, 9).includes(null)) return 'draw';
        return null;
    }

    function populateGridOptions() {
        const gridOptionsContainer = document.querySelector('#grid-screen .menu-buttons');
        gridOptionsContainer.innerHTML = '';
        const options = [
            { size: 2, length: 2 }, { size: 3, length: 3 }, { size: 4, length: 3 }, { size: 5, length: 4 },
            { size: 6, length: 5 }, { size: 7, length: 6 }, { size: 8, length: 6 }, { size: 9, length: 6 }
        ];
        options.forEach(opt => {
            const button = document.createElement('button');
            button.classList.add('menu-button', 'grid-option-btn');
            button.textContent = `${opt.size}x${opt.size} (${opt.length}-in-a-row)`;
            button.onclick = () => {
                playSound('ui');
                selectMode('pvp', null, opt.size, opt.length);
            };
            gridOptionsContainer.appendChild(button);
        });
    }
});