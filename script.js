document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let board;
    let gameActive;
    let gameMode; // 'hvh' or 'hva'
    let currentPlayer;

    // Player constants
    const PLAYER_X = 'X'; // Human in HvA mode
    const PLAYER_O = 'O'; // AI in HvA mode

    // --- DOM Elements ---
    const menuScreen = document.getElementById('menu-screen');
    const gameScreen = document.getElementById('game-screen');
    const statusText = document.getElementById('status-text');
    const gameBoard = document.getElementById('game-board');
    const hvhButton = document.getElementById('hvh-button');
    const hvaButton = document.getElementById('hva-button');
    const backButton = document.getElementById('back-button');

    // --- Event Listeners ---
    hvhButton.addEventListener('click', () => selectMode('hvh'));
    hvaButton.addEventListener('click', () => selectMode('hva'));
    backButton.addEventListener('click', showMenu);

    // --- Game Flow ---
    function selectMode(mode) {
        gameMode = mode;
        menuScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        startGame();
    }

    function showMenu() {
        gameScreen.classList.add('hidden');
        menuScreen.classList.remove('hidden');
    }

    function startGame() {
        board = Array(9).fill(null);
        gameActive = true;
        currentPlayer = PLAYER_X;
        // MODIFICATION: Custom start text based on game mode
        if (gameMode === 'hva') {
            statusText.textContent = "Your Turn";
        } else {
            statusText.textContent = "Play Player X";
        }
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
        
        if (gameMode === 'hvh' || (gameMode === 'hva' && currentPlayer === PLAYER_X)) {
            makeMove(index, currentPlayer);

            if (checkGameOver()) return;

            if (gameMode === 'hvh') {
                currentPlayer = currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
                // MODIFICATION: Custom turn text for HvH
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
        // MODIFICATION: Custom winner text based on game mode and result
        if (result === 'draw') {
            statusText.textContent = "You both tied! 🤝";
        } else if (gameMode === 'hva' && result === PLAYER_O) {
            statusText.textContent = "AI Wins as Expected!";
        } 
        else {
            statusText.textContent = `${result} is the Winner!`;
        }
    }

    // --- AI-Specific Functions ---
    function aiMove() {
        const bestMoveIndex = findBestMove(board);
        if (bestMoveIndex !== null) {
            makeMove(bestMoveIndex, PLAYER_O);
        }

        if (checkGameOver()) return;

        currentPlayer = PLAYER_X;
        gameActive = true;
        // MODIFICATION: Custom turn text for HvA
        statusText.textContent = "Your Turn";
    }

    // --- AI BRAIN (Translated from Python) ---
    function checkWinner(board) {
        const win_combinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (const combo of win_combinations) {
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        if (!board.includes(null)) return 'draw';
        return null;
    }

    function minimax(currentBoard, depth, alpha, beta, isMaximizing) {
        const winner = checkWinner(currentBoard);
        if (winner === PLAYER_O) return 1;
        if (winner === PLAYER_X) return -1;
        if (winner === 'draw') return 0;

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (currentBoard[i] === null) {
                    currentBoard[i] = PLAYER_O;
                    let eval = minimax(currentBoard, depth + 1, alpha, beta, false);
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
                    let eval = minimax(currentBoard, depth + 1, alpha, beta, true);
                    currentBoard[i] = null;
                    minEval = Math.min(minEval, eval);
                    beta = Math.min(beta, eval);
                    if (beta <= alpha) break;
                }
            }
            return minEval;
        }
    }

    function findBestMove(currentBoard) {
        let bestScore = -Infinity;
        let move = null;
        for (let i = 0; i < 9; i++) {
            if (currentBoard[i] === null) {
                currentBoard[i] = PLAYER_O;
                let score = minimax(currentBoard, 0, -Infinity, Infinity, false);
                currentBoard[i] = null;
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        return move;
    }
});