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
    let gridSize = 3, winLength = 3;
    let pvpScoreX = 0, pvpScoreO = 0, pvpTies = 0;
    let pvaScoreX = 0, pvaScoreO = 0, pvaTies = 0;
    let previousScreen = null;
    const PLAYER_X = 'X', PLAYER_O = 'O'; // Human is 'X', AI is 'O'

    // --- DOM Elements ---
    const menuScreen = document.getElementById('menu-screen'),
        difficultyScreen = document.getElementById('difficulty-screen'),
        gridScreen = document.getElementById('grid-screen'),
        gameScreen = document.getElementById('game-screen'),
        funModesScreen = document.getElementById('fun-modes-screen');
    const statusText = document.getElementById('status-text'),
        gameBoard = document.getElementById('game-board');
    const pvpButton = document.getElementById('pvp-button'),
        pvaButton = document.getElementById('pva-button'),
        funModesButton = document.getElementById('fun-modes-button');
    const gameBackButton = document.getElementById('game-back-button'),
        difficultyBackButton = document.getElementById('difficulty-back-button'),
        gridBackButton = document.getElementById('grid-back-button'),
        funModesBackButton = document.getElementById('fun-modes-back-button');
    const teamCredit = document.querySelector('.team-credit'),
        scoreXElement = document.getElementById('score-x'),
        scoreOElement = document.getElementById('score-o'),
        scoreTieElement = document.getElementById('score-tie');

    // --- Event Listeners ---
    pvpButton.addEventListener('click', () => { playSound('ui'); showGridScreen(); });
    pvaButton.addEventListener('click', () => { playSound('ui'); showDifficultyScreen(); });
    funModesButton.addEventListener('click', () => { playSound('ui'); showFunModesScreen(); });
    document.querySelectorAll('#difficulty-screen .difficulty-btn').forEach(button => button.addEventListener('click', e => { playSound('ui'); selectMode('pva', e.target.dataset.difficulty); }));
    document.querySelectorAll('#fun-modes-screen .menu-button').forEach(button => button.addEventListener('click', () => { playSound('ui'); alert('This Fun Mode is coming soon!'); }));
    gameBackButton.addEventListener('click', () => { playSound('ui'); goBack(); });
    difficultyBackButton.addEventListener('click', () => { playSound('ui'); showMenu(); });
    gridBackButton.addEventListener('click', () => { playSound('ui'); showMenu(); });
    funModesBackButton.addEventListener('click', () => { playSound('ui'); showMenu(); });
    
    gameScreen.addEventListener('click', (e) => {
        if (!gameActive) {
            playSound('ui');
            startGame();
        } else if (e.target.classList.contains('cell')) {
            handleCellClick(e.target);
        }
    });

    // --- Game Flow ---
    function showMenu() { gameScreen.classList.add('hidden'); difficultyScreen.classList.add('hidden'); gridScreen.classList.add('hidden'); funModesScreen.classList.add('hidden'); menuScreen.classList.remove('hidden'); teamCredit.classList.remove('hidden'); document.body.className = 'x-turn'; }
    function goBack() { gameScreen.classList.add('hidden'); if (previousScreen === 'difficulty') showDifficultyScreen(); else if (previousScreen === 'grid') showGridScreen(); else showMenu(); }
    function showDifficultyScreen() { menuScreen.classList.add('hidden'); difficultyScreen.classList.remove('hidden'); teamCredit.classList.add('hidden'); previousScreen = 'difficulty'; }
    function showGridScreen() { menuScreen.classList.add('hidden'); gridScreen.classList.remove('hidden'); teamCredit.classList.add('hidden'); populateGridOptions(); previousScreen = 'grid'; }
    function showFunModesScreen() { menuScreen.classList.add('hidden'); funModesScreen.classList.remove('hidden'); teamCredit.classList.add('hidden'); previousScreen = 'fun-modes'; }
    
    function selectMode(mode, diff = null, size = 3, length = 3) {
        gameMode = mode; difficulty = diff; gridSize = size; winLength = length;
        menuScreen.classList.add('hidden'); difficultyScreen.classList.add('hidden'); gridScreen.classList.add('hidden'); funModesScreen.classList.add('hidden'); gameScreen.classList.remove('hidden'); teamCredit.classList.add('hidden');
        if (gameMode === 'pvp' && previousScreen !== 'grid') { pvpScoreX = 0; pvpScoreO = 0; pvpTies = 0; } 
        else if (gameMode === 'pva' && previousScreen !== 'difficulty') { pvaScoreX = 0; pvaScoreO = 0; pvaTies = 0; }
        startGame();
    }

    function startGame() {
		
		statusText.classList.remove('status-pop-out');

		// Reset the status text color to its default from the stylesheet
		statusText.style.color = '';
		
        board = Array(gridSize * gridSize).fill(null);
        gameActive = true;
        currentPlayer = PLAYER_X;
        statusText.textContent = gameMode === 'pva' ? "Your Turn" : `Player X's Turn`;
        document.body.className = 'x-turn';
        updateScoreboard();
        createBoardUI();
    }

    function createBoardUI() {
        gameBoard.innerHTML = '';
        const boardSizePx = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.7, 600);
        const cellSize = boardSizePx / gridSize, fontSize = cellSize * 0.6;
        gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`; gameBoard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
        gameBoard.style.width = `${boardSizePx}px`; gameBoard.style.height = `${boardSizePx}px`;
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.style.fontSize = `${fontSize}px`;
            gameBoard.appendChild(cell);
        }
    }

// --- Main Game Logic ---
function handleCellClick(targetCell) {
    const index = parseInt(targetCell.dataset.index);
    if (!gameActive || board[index] !== null) return;
    
    // This condition already prevents clicks when it's not the player's turn.
    if (gameMode === 'pvp' || (gameMode === 'pva' && currentPlayer === PLAYER_X)) {
        playSound('click');
        makeMove(index, currentPlayer);
        
        if (checkGameOver()) return;

        if (gameMode === 'pvp') {
            currentPlayer = currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
            statusText.textContent = `Player ${currentPlayer}'s Turn`;
            document.body.className = currentPlayer === 'X' ? 'x-turn' : 'o-turn';
            updateScoreboard();
        } else {
            // It's the AI's turn now
            currentPlayer = PLAYER_O;
            statusText.textContent = "AI is thinking...";
            document.body.className = 'o-turn';
            updateScoreboard();

            // BUG FIX: The line "gameActive = false;" was removed from here.
            
            setTimeout(aiMove, 500);
        }
    }
}

    function makeMove(index, player) { board[index] = player; const cell = gameBoard.children[index]; cell.textContent = player; cell.classList.add(player.toLowerCase()); }
    function checkGameOver() { const winner = checkWinner(board); if (winner) { endGame(winner); return true; } return false; }

    function endGame(result) {
        gameActive = false;
        scoreXElement.classList.remove('active-player');
        scoreOElement.classList.remove('active-player');
        if (result === 'draw') {
            playSound('draw');
            statusText.textContent = "It's a tie!";
            if (gameMode === 'pvp') pvpTies++; else pvaTies++;
        } else {
            playSound('win');
            if (gameMode === 'pvp') { if (result === PLAYER_X) pvpScoreX++; else pvpScoreO++; } 
            else { if (result === PLAYER_X) pvaScoreX++; else pvaScoreO++; }
            statusText.textContent = (gameMode === 'pva' && result === PLAYER_O) ? "AI Wins!" : `Player ${result} Wins!`;
		
		// Set the status text color to the winner's color
        const winnerColor = result === PLAYER_X ? 'var(--player-x-color)' : 'var(--player-o-color)';
        statusText.style.color = winnerColor;
        }
		
		statusText.classList.add('status-pop-out');
        updateScoreboard();
    }

    function updateScoreboard() {
        if (gameMode === 'pvp') {
            scoreXElement.textContent = `Player X: ${pvpScoreX}`;
            scoreOElement.textContent = `Player O: ${pvpScoreO}`;
            scoreTieElement.textContent = `Ties: ${pvpTies}`;
        } else {
            scoreXElement.textContent = `You (X): ${pvaScoreX}`;
            scoreOElement.textContent = `AI (O): ${pvaScoreO}`;
            scoreTieElement.textContent = `Ties: ${pvaTies}`;
        }
        scoreXElement.classList.remove('active-player');
        scoreOElement.classList.remove('active-player');
        if (gameActive) {
            if (currentPlayer === PLAYER_X) scoreXElement.classList.add('active-player');
            else scoreOElement.classList.add('active-player');
        }
    }

    // --- Dynamic Win Condition Checker ---
    function checkWinner(board) {
        const size = gridSize, length = winLength;
        function get(r, c) { return board[r * size + c]; }
        for (let r = 0; r < size; r++) { for (let c = 0; c < size; c++) {
            const player = get(r, c); if (player === null) continue;
            if (c + length <= size) { let w = true; for (let i = 1; i < length; i++) if (get(r, c + i) !== player) { w = false; break; } if (w) return player; }
            if (r + length <= size) { let w = true; for (let i = 1; i < length; i++) if (get(r + i, c) !== player) { w = false; break; } if (w) return player; }
            if (c + length <= size && r + length <= size) { let w = true; for (let i = 1; i < length; i++) if (get(r + i, c + i) !== player) { w = false; break; } if (w) return player; }
            if (c - length + 1 >= 0 && r + length <= size) { let w = true; for (let i = 1; i < length; i++) if (get(r + i, c - i) !== player) { w = false; break; } if (w) return player; }
        } }
        if (!board.includes(null)) return 'draw';
        return null;
    }
    
    // --- AI-Specific Functions ---
    function aiMove() {
        playSound('click');
        const moveIndex = getAiMove(board);
        if (moveIndex !== null) makeMove(moveIndex, PLAYER_O);
        if (checkGameOver()) return;
        currentPlayer = PLAYER_X;
        gameActive = true;
        statusText.textContent = "Your Turn";
        document.body.className = 'x-turn';
        updateScoreboard();
    }

    function getAiMove(currentBoard) {
        if (gridSize !== 3) return getEasyMove(currentBoard);
        switch (difficulty) {
            case 'easy': return getEasyMove(currentBoard);
            case 'medium': return getMediumMove(currentBoard);
            case 'hard': return findBestMoveAI(currentBoard, 4);
            case 'unbeatable': return findBestMoveAI(currentBoard);
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
        for (let i = 0; i < 9; i++) { if (currentBoard[i] === null) { currentBoard[i] = PLAYER_O; if (checkWinner3x3ForScore(currentBoard) === 10) { currentBoard[i] = null; return i; } currentBoard[i] = null; } }
        for (let i = 0; i < 9; i++) { if (currentBoard[i] === null) { currentBoard[i] = PLAYER_X; if (checkWinner3x3ForScore(currentBoard) === -10) { currentBoard[i] = null; return i; } currentBoard[i] = null; } }
        return getEasyMove(currentBoard);
    }
    
    // --- START: NEW MINIMAX ALGORITHM (FIXED: MOVED INSIDE DOMCONTENTLOADED) ---
    const win_combinations_3x3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    
    function checkWinner3x3ForScore(board) {
        for (const combo of win_combinations_3x3) {
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a] === PLAYER_O ? 10 : -10;
            }
        }
        if (!board.slice(0, 9).includes(null)) return 0;
        return null;
    }

    function minimaxAI(currentBoard, depth, isMaximizing, alpha, beta, maxDepth) {
        const score = checkWinner3x3ForScore(currentBoard);
        if (score !== null) return score;
        if (depth === maxDepth) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (currentBoard[i] === null) {
                    currentBoard[i] = PLAYER_O;
                    let currentScore = minimaxAI(currentBoard, depth + 1, false, alpha, beta, maxDepth);
                    currentBoard[i] = null;
                    bestScore = Math.max(bestScore, currentScore);
                    alpha = Math.max(alpha, bestScore);
                    if (beta <= alpha) break;
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (currentBoard[i] === null) {
                    currentBoard[i] = PLAYER_X;
                    let currentScore = minimaxAI(currentBoard, depth + 1, true, alpha, beta, maxDepth);
                    currentBoard[i] = null;
                    bestScore = Math.min(bestScore, currentScore);
                    beta = Math.min(beta, bestScore);
                    if (beta <= alpha) break;
                }
            }
            return bestScore;
        }
    }

    function findBestMoveAI(currentBoard, maxDepth = Infinity) {
        let bestScore = -Infinity;
        let move = null;
        for (let i = 0; i < 9; i++) {
            if (currentBoard[i] === null) {
                currentBoard[i] = PLAYER_O;
                let score = minimaxAI(currentBoard, 0, false, -Infinity, Infinity, maxDepth);
                currentBoard[i] = null;
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        return move !== null ? move : getEasyMove(currentBoard);
    }
    // --- END: NEW MINIMAX ALGORITHM ---

    // --- Grid Options For PVP ---
    function populateGridOptions() {
        const gridOptionsContainer = document.querySelector('#grid-screen .menu-buttons');
        gridOptionsContainer.innerHTML = '';
        const options = [ { size: 2, length: 2 }, { size: 3, length: 3 }, { size: 4, length: 3 }, { size: 5, length: 4 }, { size: 6, length: 5 }, { size: 7, length: 5 }, { size: 8, length: 6 }, { size: 9, length: 6 } ];
        options.forEach(opt => { const button = document.createElement('button'); button.classList.add('menu-button', 'grid-option-btn'); button.textContent = `${opt.size}x${opt.size} (${opt.length}-in-a-row)`; button.onclick = () => { playSound('ui'); selectMode('pvp', null, opt.size, opt.length); }; gridOptionsContainer.appendChild(button); });
    }
});