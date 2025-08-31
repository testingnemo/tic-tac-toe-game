document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let board;
    let gameActive;
    let gameMode; // 'pvp' or 'pva'
    let currentPlayer;
    let difficulty; // 'easy', 'medium', 'hard', 'unbeatable'

    // Player constants
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
    pvpButton.addEventListener('click', () => selectMode('pvp'));
    pvaButton.addEventListener('click', showDifficultyScreen);
    document.querySelectorAll('.difficulty-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            selectMode('pva', e.target.dataset.difficulty);
        });
    });
    gameBackButton.addEventListener('click', showMenu);
    difficultyBackButton.addEventListener('click', showMenu);

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
            statusText.textContent = "You both tied! 🤝";
        } else if (gameMode === 'pva' && result === PLAYER_O) {
            statusText.textContent = "AI Wins!";
        } else {
            statusText.textContent = `Player ${result} is the Winner!`;
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

    // NEW: AI move dispatcher based on difficulty
    function getAiMove(currentBoard) {
        switch (difficulty) {
            case 'easy':
                return getEasyMove(currentBoard);
            case 'medium':
                return getMediumMove(currentBoard);
            case 'hard':
                return findBestMove(currentBoard, 4); // Minimax with depth limit
            case 'unbeatable':
                return findBestMove(currentBoard); // Full Minimax
            default:
                return getEasyMove(currentBoard);
        }
    }
    
    // NEW: Easy difficulty - just picks a random empty cell
    function getEasyMove(currentBoard) {
        const availableMoves = [];
        for (let i = 0; i < 9; i++) {
            if (currentBoard[i] === null) {
                availableMoves.push(i);
            }
        }
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    // NEW: Medium difficulty - blocks wins, takes wins, otherwise random
    function getMediumMove(currentBoard) {
        // 1. Check if AI can win in the next move
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
        // 2. Check if Player can win in the next move, and block them
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
        // 3. Otherwise, make a random move
        return getEasyMove(currentBoard);
    }
    
    // --- AI BRAIN ---
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

    // MODIFIED: Minimax now respects a depth limit for 'Hard' mode
    function minimax(currentBoard, depth, alpha, beta, isMaximizing, maxDepth) {
        // Base cases
        const winner = checkWinner(currentBoard);
        if (winner === PLAYER_O) return 1;
        if (winner === PLAYER_X) return -1;
        if (winner === 'draw') return 0;
        // Hard mode depth limit
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

    // MODIFIED: findBestMove can now take a maxDepth for 'Hard' mode
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
        // If no move improves the score (can happen in depth-limited search), pick a random one
        if (move === null) {
            return getEasyMove(currentBoard);
        }
        return move;
    }
});