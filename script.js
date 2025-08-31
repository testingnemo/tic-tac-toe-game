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
    const PLAYER_X = 'X';
    const PLAYER_O = 'O';

    // --- DOM Elements ---
    const menuScreen = document.getElementById('menu-screen');
    const difficultyScreen = document.getElementById('difficulty-screen');
    const gameScreen = document.getElementById('game-screen');
    const statusText = document.getElementById('status-text');
    const gameBoard = document.getElementById('game-board');
    const pvpButton = document.getElementById('pvp-button');
    const pvaButton = document.getElementById('pva-button');
    const gameBackButton = document.getElementById('game-back-button');
    const difficultyBackButton = document.getElementById('difficulty-back-button');

    // --- Event Listeners ---
    pvpButton.addEventListener('click', () => { playSound('ui'); selectMode('pvp'); });
    pvaButton.addEventListener('click', () => { playSound('ui'); showDifficultyScreen(); });
    document.querySelectorAll('.difficulty-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            playSound('ui');
            selectMode('pva', e.target.dataset.difficulty);
        });
    });
    gameBackButton.addEventListener('click', () => { playSound('ui'); showMenu(); });
    difficultyBackButton.addEventListener('click', () => { playSound('ui'); showMenu(); });

    // --- Game Flow ---
    function showMenu() {
        gameScreen.classList.add('hidden');
        difficultyScreen.classList.add('hidden');
        menuScreen.classList.remove('hidden');
    }

    function showDifficultyScreen() {
        menuScreen.classList.add('hidden');
        difficultyScreen.classList.remove('hidden');
    }

    function selectMode(mode, diff = null) {
        gameMode = mode;
        difficulty = diff;
        difficultyScreen.classList.add('hidden');
        menuScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        startGame();
    }

    function startGame() {
        board = Array(9).fill(null);
        gameActive = true;
        currentPlayer = PLAYER_X;
        statusText.textContent = gameMode === 'pva' ? "Your Turn" : "Play Player X";
        createBoardUI();
    }

    function createBoardUI() {
        gameBoard.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
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
                statusText.textContent = "AI Wins as Expected!";
            } else {
                statusText.textContent = `Player ${result} is the Winner!`;
            }
        }
    }

    // --- AI-Specific Functions ---
    function aiMove() {
        const moveIndex = getAiMove(board);
        if (moveIndex !== null) {
            makeMove(moveIndex, PLAYER_O);
        }
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
        for (let i = 0; i < 9; i++) {
            if (currentBoard[i] === null) {
                availableMoves.push(i);
            }
        }
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    function getMediumMove(currentBoard) {
        for (let i = 0; i < 9; i++) {
            if (currentBoard[i] === null) {
                currentBoard[i] = PLAYER_O;
                if (checkWinner(currentBoard) === PLAYER_O) {
                    currentBoard[i] = null;
                    return i;
                }
                currentBoard[i] = null;
            }
        }
        for (let i = 0; i < 9; i++) {
            if (currentBoard[i] === null) {
                currentBoard[i] = PLAYER_X;
                if (checkWinner(currentBoard) === PLAYER_X) {
                    currentBoard[i] = null;
                    return i;
                }
                currentBoard[i] = null;
            }
        }
        return getEasyMove(currentBoard);
    }

    // --- AI BRAIN ---
    function checkWinner(board) {
        const win_combinations = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for (const combo of win_combinations) {
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        if (!board.includes(null)) return 'draw';
        return null;
    }
    
    // FIX: Corrected syntax error from previous version and removed duplicate functions.
    function minimax(currentBoard, depth, alpha, beta, isMaximizing, maxDepth) {
        const winner = checkWinner(currentBoard);
        if (winner === PLAYER_O) return 1;
        if (winner === PLAYER_X) return -1;
        if (winner === 'draw') return 0;
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
            // This is the line that had the error. It's now fixed.
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
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        if (move === null) {
            return getEasyMove(currentBoard);
        }
        return move;
    }
});