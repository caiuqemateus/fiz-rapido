// Declare o soundCache globalmente no início do arquivo
let soundCache = {};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando jogo...');
    
    // Verificação de elementos críticos
    const criticalElements = {
        frogCards: document.querySelectorAll('.frog-card'),
        selectedFrogsGrid: document.querySelector('.selected-frogs-grid'),
        selectedFrogsCount: document.querySelector('.selected-frogs-count'),
        betInput: document.querySelector('.bet-input'),
        balanceValue: document.querySelector('.balance-value')
    };

    // Log dos elementos críticos
    Object.entries(criticalElements).forEach(([name, element]) => {
        if (!element) {
            console.error(`Elemento não encontrado: ${name}`);
        }
    });

    // Elementos do DOM
    const frogCards = document.querySelectorAll('.frog-card');
    const selectedFrogsGrid = document.querySelector('.selected-frogs-grid');
    const selectedFrogsCount = document.querySelector('.selected-frogs-count');
    const betInput = document.querySelector('.bet-input');
    const multiplierButtons = document.querySelectorAll('.multiplier-button');
    const multiplierValue = document.querySelector('.multiplier-value');
    const presetButtons = document.querySelectorAll('.preset-button');
    const clearButton = document.querySelector('.action-button.secondary');
    const betButton = document.querySelector('.action-button.primary');
    const quickBetButton = document.querySelector('.action-button.warning');
    const balanceValue = document.querySelector('.balance-value');
    const jackpotValue = document.querySelector('.jackpot-amount');
    const depositActionButton = document.querySelector('.balance-action:first-child');
    const withdrawButton = document.querySelector('.balance-action:last-child');
    const depositMainButton = document.querySelector('button.depositar');
    const withdrawMainButton = document.querySelector('button.sacar');

    // Catálogo de sapos
    const frogImages = [
        {
            name: 'Sapo Azul de Bolinha',
            imageUrl: 'https://i.postimg.cc/LYLKMX78/azul1.png'
        },
        {
            name: 'Sapo Azul Esverdeado',
            imageUrl: 'https://i.postimg.cc/DmQkjSLC/azul2.png'
        },
        {
            name: 'Sapo Azul Símbolo',
            imageUrl: 'https://i.postimg.cc/zVJm9qkq/azul3.png'
        },
        {
            name: 'Sapo Amarelo Estrela',
            imageUrl: 'https://i.postimg.cc/gLp9cpFq/amarelo1.png'
        },
        {
            name: 'Sapo Amarelo Bolinhas',
            imageUrl: 'https://i.postimg.cc/rRNBKHq6/amarelo2.png'
        },
        {
            name: 'Sapo Laranja Peito Verde',
            imageUrl: 'https://i.postimg.cc/dL4MFgWr/laranja1.png'
        },
        {
            name: 'Sapo Verde Listrado',
            imageUrl: 'https://i.postimg.cc/dh1bVnXX/verde1.png'
        },
        {
            name: 'Sapo Verde X',
            imageUrl: 'https://i.postimg.cc/LJbrYLFs/verde2.png'
        },
        {
            name: 'Sapo Verde XX',
            imageUrl: 'https://i.postimg.cc/WDqxMzsw/verde3.png'
        },
        {
            name: 'Sapo Vermelho Pernas Pretas',
            imageUrl: 'https://i.postimg.cc/vgRkXyBF/vermelho1.png'
        },
        {
            name: 'Sapo Vermelho Xestrela',
            imageUrl: 'https://i.postimg.cc/62dSmP27/vermelho2.png'
        },
        {
            name: 'Sapo Vermelho Coração',
            imageUrl: 'https://i.postimg.cc/p5R7bBzs/vermelho3.png'
        }
    ];

    // Estado do jogo
    let gameState = {
        selectedFrogs: 0,
        maxSelections: 6,
        currentBet: 50,
        currentMultiplier: 1,
        balance: 2172.50,
        jackpot: 100097.06,
        isRevealing: false,
        gameHistory: [],
        selectedColors: [], // Array necessário para armazenar os sapos selecionados
        gameCount: 0,
        houseProfitTotal: 0,
        jackpotContribution: 0,
        qualifiedForJackpot: false,
        lastGameTime: null,
        isAutoPlaying: false,
        shouldStopAutoPlay: false,
        autoPlayCount: 0,
        autoPlayMaxCount: 100
        
    };

    // Sistema de sons
    const SOUND_URLS = {
        win: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
        lose: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
        click: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
        reveal: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3' // Som de revelação
    };

    // Funções do jogo
    async function preloadSounds() {
        try {
            const loadPromises = Object.entries(SOUND_URLS).map(async ([key, url]) => {
                try {
                    const audio = new Audio();
                    audio.preload = 'auto';
                    audio.src = url;
                    
                    await new Promise((resolve, reject) => {
                        audio.oncanplaythrough = resolve;
                        audio.onerror = reject;
                        
                        // Adiciona timeout de 5 segundos
                        setTimeout(reject, 5000);
                    });
                    
                    soundCache[key] = audio;
                } catch (error) {
                    console.warn(`Erro ao carregar som ${key}:`, error);
                }
            });
            
            await Promise.all(loadPromises);
            console.log('Sons carregados com sucesso');
        } catch (error) {
            console.error('Erro ao carregar sons:', error);
        }
    }

    function playSound(type) {
        if (!soundCache) return; // Adiciona verificação de segurança
        
        if (soundCache[type]) {
            const settings = JSON.parse(localStorage.getItem('soundSettings')) || {
                master: 100,
                muted: false
            };
            
            soundCache[type].volume = settings.muted ? 0 : settings.master / 100;
            soundCache[type].currentTime = 0;
            soundCache[type].play().catch(console.error);
        }
    }

    function initializeFrogCards() {
        const frogGrid = document.querySelector('.frog-grid');
        frogGrid.innerHTML = '';

        frogImages.forEach((frog, index) => {
            const frogCard = document.createElement('div');
            frogCard.className = `frog-card frog-type-${(index % 6) + 1}`;
            frogCard.innerHTML = `
                <div class="frog-card-inner">
                    <img src="${frog.imageUrl}" alt="${frog.name}" class="frog-image">
                </div>
                <div class="frog-card-bg"></div>
            `;
            frogGrid.appendChild(frogCard);
            frogCard.addEventListener('click', () => selectFrog(frogCard));
        });
    }

    function updateSelectedCount() {
        selectedFrogsCount.textContent = `${gameState.selectedFrogs}/${gameState.maxSelections}`;
    }

    function updateBetValue(value) {
        if (value < 0.50) {
            value = 0.50;
        }
        gameState.currentBet = Number(value);
        // Formata o valor com duas casas decimais
        betInput.value = Number(value).toFixed(2);
    }

    function updateMultiplier(value) {
        // Limita o valor entre 1 e 100
        if (value < 1) value = 1;
        if (value > 100) value = 100;
        
        gameState.autoPlayCount = Number(value);
        multiplierValue.value = value;
    }

    function selectFrog(card) {
        if (gameState.selectedFrogs < gameState.maxSelections) {
            playSound('click');
            const emptySlot = Array.from(selectedFrogsGrid.children)
                .find(slot => slot.classList.contains('empty'));
            
            if (emptySlot) {
                emptySlot.classList.remove('empty');
                const frogClone = card.querySelector('.frog-card-inner').cloneNode(true);
                const removeButton = document.createElement('button');
                removeButton.className = 'remove-frog';
                removeButton.innerHTML = '×';
                removeButton.onclick = () => removeFrog(card, emptySlot);
                
                emptySlot.appendChild(frogClone);
                emptySlot.appendChild(removeButton);
                gameState.selectedFrogs++;
                updateSelectedCount();
                
                // Adiciona o índice do sapo ao array de seleções
                const frogIndex = Array.from(document.querySelectorAll('.frog-card')).indexOf(card);
                gameState.selectedColors.push(frogIndex);
            }
        }
    }

    function removeFrog(originalCard, slot) {
        slot.innerHTML = '';
        slot.classList.add('empty');
        gameState.selectedFrogs--;
        updateSelectedCount();
        
        // Remove o sapo do array de seleções
        const slotIndex = Array.from(selectedFrogsGrid.children).indexOf(slot);
        gameState.selectedColors.splice(slotIndex, 1);
    }

    function clearSelection() {
        Array.from(selectedFrogsGrid.children).forEach(slot => {
            slot.innerHTML = '';
            slot.classList.add('empty');
        });
        gameState.selectedFrogs = 0;
        gameState.selectedColors = [];
        updateSelectedCount();
    }

    function updateCurrentDateTime() {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const seconds = String(now.getUTCSeconds()).padStart(2, '0');
        
        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        
        const dateTimeElements = document.querySelectorAll('.current-datetime');
        dateTimeElements.forEach(element => {
            if (element) {
                element.textContent = formattedDateTime;
            }
        });
    }

    function updateUserLogin() {
        const currentUser = 'amigodolanche191';
        const userLoginElement = document.querySelector('.current-user');
        if (userLoginElement) {
            userLoginElement.textContent = `Usuário: ${currentUser}`;
        }
    }

    function formatCurrency(value) {
        const fixed = value.toFixed(2);
        const [integerPart, decimalPart] = fixed.split('.');
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `R$ ${formattedInteger},${decimalPart}`;
    }
        function updateCurrentDateTime() {
        const now = new Date();
        // Formato UTC YYYY-MM-DD HH:MM:SS
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const seconds = String(now.getUTCSeconds()).padStart(2, '0');
        
        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        
        const dateTimeElement = document.querySelector('.current-datetime');
        if (dateTimeElement) {
            dateTimeElement.textContent = formattedDateTime;
        }
    }

    function updateBalance(newBalance) {
        gameState.balance = newBalance;
        
        // Atualiza o saldo na sidebar
        balanceValue.textContent = formatCurrency(newBalance);
        
        // Atualiza o saldo no cabeçalho
        const headerBalanceValue = document.querySelector('.header-balance-value');
        if (headerBalanceValue) {
            headerBalanceValue.textContent = formatCurrency(newBalance);
        }
        
        saveGameState();
    }

    function updateJackpotValue(value) {
        gameState.jackpot = value;
        jackpotValue.textContent = formatCurrency(value);
        saveGameState();
    }

   async function revealResults(results) {
    const resultGrid = document.querySelector('.results-grid');
    resultGrid.innerHTML = '';

    for (let i = 0; i < results.length; i++) {
        const resultSlot = document.createElement('div');
        resultSlot.className = 'result-frog'; 
        
        const frogImage = document.createElement('img');
        frogImage.src = frogImages[results[i]].imageUrl;
        frogImage.alt = frogImages[results[i]].name;
        
        resultSlot.appendChild(frogImage);
        resultGrid.appendChild(resultSlot);
        
        // Força um reflow antes de adicionar a classe de animação
        resultSlot.offsetHeight;

        // Toca o som de revelação
        playSound('reveal');

        // Adiciona a classe que ativa a animação
        resultSlot.classList.add('revealed');

        // Aguarda antes de revelar o próximo sapo
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Após revelar todos os sapos, verifica os vencedores
    checkWin(results, gameState.currentBet * gameState.currentMultiplier);
}

    function checkConsecutiveMatches(selected, results) {
        let maxLength = 0;
        let currentLength = 0;
        let startIndex = -1;
        let tempStartIndex = 0;
        
        for (let i = 0; i < 6; i++) {
            if (selected[i] === results[i]) {
                if (currentLength === 0) {
                    tempStartIndex = i;
                }
                currentLength++;
                
                if (currentLength > maxLength) {
                    maxLength = currentLength;
                    startIndex = tempStartIndex;
                }
            } else {
                currentLength = 0;
            }
        }
        
        return { maxLength, startIndex };
    }

    function checkSimpleMatches(selected, results) {
        let matches = 0;
        const positions = [];
        
        for (let i = 0; i < 6; i++) {
            if (selected[i] === results[i]) {
                matches++;
                positions.push(i);
            }
        }
        
        return { count: matches, positions };
    }

   function checkWin(results, totalBet) {
    if (!Array.isArray(results) || results.length === 0) {
        console.error("Erro: O array 'results' está vazio ou não é válido.");
        return;
    }

    const selectedIndices = gameState.selectedColors;

    // Verifica sequências consecutivas
    const consecutiveMatches = checkConsecutiveMatches(selectedIndices, results);
    // Verifica acertos simples
    const simpleMatches = checkSimpleMatches(selectedIndices, results);

    let winAmount = 0;
    let winType = '';
    let winningPositions = [];

    // Verifica diferentes tipos de vitória
    if (consecutiveMatches.maxLength === 6) {
        if (gameState.qualifiedForJackpot) {
            winAmount = gameState.jackpot;
            winType = 'JACKPOT!';
            showPopup('jackpot', winAmount);
        } else {
            winAmount = totalBet * 1000;
            winType = 'Sequência Completa';
            showPopup('quina', winAmount);
        }
        winningPositions = Array.from({ length: 6 }, (_, i) => i);
    } else if (consecutiveMatches.maxLength === 5) {
        winAmount = totalBet * 500;
        winType = 'Quina em Sequência';
        showPopup('quina', winAmount);
        winningPositions = Array.from({ length: 5 }, (_, i) => i);
    } else if (consecutiveMatches.maxLength === 4) {
        winAmount = totalBet * 100;
        winType = 'Quadra em Sequência';
        showPopup('quarta', winAmount);
        winningPositions = Array.from({ length: 4 }, (_, i) => i);
    } else if (consecutiveMatches.maxLength === 3) {
        winAmount = totalBet * 25;
        winType = 'Tripla em Sequência';
        showPopup('tripla', winAmount);
        winningPositions = Array.from({ length: 3 }, (_, i) => i);
    } else if (consecutiveMatches.maxLength === 2) {
        winAmount = totalBet * 5;
        winType = 'Par em Sequência';
        showPopup('dupla', winAmount);
        winningPositions = Array.from({ length: 2 }, (_, i) => i);
    } else if (simpleMatches.count >= 2) {
        const multipliers = { 2: 2, 3: 3, 4: 5, 5: 10, 6: 20 };
        winAmount = totalBet * (multipliers[simpleMatches.count] || 0);
        winType = `${simpleMatches.count} Acertos Simples`;
        showPopup('simples', winAmount);
        winningPositions = simpleMatches.positions;
    }

    // Destacar os sapos vencedores
    highlightWinners(winningPositions, results, gameState.selectedColors);

    // Processa o resultado
    if (winAmount > 0) {
        gameState.balance += winAmount;
        updateBalance(gameState.balance);
        playSound('win');
        showResult(true, winAmount, winType);
    } else {
        playSound('lose');
        showResult(false, 0, 'Sem acertos');
    }

    // Atualiza contadores
    gameState.gameCount++;
    if (gameState.gameCount >= 5) {
        gameState.qualifiedForJackpot = true;
    }

    saveGameState();
}
        async function placeBet() {
    const betButton = document.querySelector('.action-button.primary');
    
    if (gameState.isRevealing) {
        return false;
    }

    if (gameState.selectedFrogs < gameState.maxSelections) {
        alert('Selecione 6 sapos para fazer sua aposta!');
        return false;
    }

    // Adiciona validação do valor mínimo
    const totalBet = gameState.currentBet * gameState.currentMultiplier;
    if (totalBet < 0.50) {
        alert('O valor mínimo para apostar é R$ 0,50');
        return false;
    }

    if (totalBet > gameState.balance) {
        alert('Saldo insuficiente para realizar esta aposta!');
        return false;
    }

    try {
        gameState.isRevealing = true;
        // Desabilita o botão e muda seu estilo
        betButton.disabled = true;
        betButton.style.opacity = '0.5';
        betButton.style.cursor = 'not-allowed';

        // Processa a aposta
        gameState.balance -= totalBet;
        updateBalance(gameState.balance);

        // Contribuição para o jackpot (2%)
        const jackpotContribution = totalBet * 0.02;
        gameState.jackpot += jackpotContribution;
        gameState.jackpotContribution += jackpotContribution;
        updateJackpotValue(gameState.jackpot);

        const results = Array.from({ length: 6 }, () =>
            Math.floor(Math.random() * frogImages.length)
        );

        await revealResults(results);
        checkWin(results, totalBet);

        gameState.isRevealing = false;
        // Reabilita o botão e restaura seu estilo
        betButton.disabled = false;
        betButton.style.opacity = '1';
        betButton.style.cursor = 'pointer';

        gameState.lastGameTime = new Date();
        saveGameState();
        return true;
    } catch (error) {
        console.error('Erro durante o jogo:', error);
        gameState.isRevealing = false;
        // Reabilita o botão em caso de erro
        betButton.disabled = false;
        betButton.style.opacity = '1';
        betButton.style.cursor = 'pointer';
        return false;
    }
}

    async function startAutoPlay() {
        const count = parseInt(document.querySelector('#autoPlayCount').value);
        
        if (isNaN(count) || count < 1 || count > gameState.autoPlayMaxCount) {
            alert('Por favor, insira um número entre 1 e 100');
            return;
        }

        if (gameState.selectedFrogs !== gameState.maxSelections) {
            alert('Selecione 6 sapos antes de começar as jogadas automáticas');
            return;
        }

        const totalBet = gameState.currentBet * count;
        if (totalBet > gameState.balance) {
            alert('Saldo insuficiente para realizar todas as jogadas');
            return;
        }

        gameState.isAutoPlaying = true;
        gameState.shouldStopAutoPlay = false;
        gameState.autoPlayCount = count;
        
        const playBtn = document.querySelector('.action-button.primary');
        playBtn.textContent = 'Parar Auto';
        playBtn.classList.add('auto-playing');
        
        await runAutoPlay();
    }

    async function runAutoPlay() {
    while (gameState.autoPlayCount > 0 && !gameState.shouldStopAutoPlay) {
        if (!await placeBet()) {
            stopAutoPlay();
            break;
        }

        gameState.autoPlayCount--;
        document.querySelector('#autoPlayCount').value = gameState.autoPlayCount;

        if (gameState.autoPlayCount > 0 && !gameState.shouldStopAutoPlay) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    if (gameState.autoPlayCount === 0 || gameState.shouldStopAutoPlay) {
        stopAutoPlay();
    }
}

    function stopAutoPlay() {
        gameState.isAutoPlaying = false;
        gameState.shouldStopAutoPlay = true;
        gameState.autoPlayCount = 0;
        
        const playBtn = document.querySelector('.action-button.primary');
        playBtn.textContent = 'Fazer Aposta';
        playBtn.classList.remove('auto-playing');
        
        //document.querySelector('.toggle-input').checked = false;
    }

    function showResult(win, amount, winType) {
        const resultMessage = document.querySelector('.result-message');
        resultMessage.className = 'result-message ' + (win ? 'win' : 'lose');
        
        if (win) {
            resultMessage.textContent = `Parabéns! Você ganhou ${formatCurrency(amount)}! (${winType})`;
        } else {
            resultMessage.textContent = 'Não foi dessa vez... Tente novamente!';
        }
        
        addToHistory(win, amount, winType);
    }

    function addToHistory(win, amount, winType) {
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;

        const now = new Date();
        const timeString = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;
        
        // Verifica se já existe uma entrada idêntica recente (últimos 2 segundos)
        const existingItems = historyList.querySelectorAll('.history-item');
        const isDuplicate = Array.from(existingItems).some(item => {
            const itemDate = item.querySelector('.history-date').textContent;
            const timeDiff = Math.abs(new Date(timeString) - new Date(itemDate));
            return timeDiff < 2000; // 2 segundos em milissegundos
        });

        if (isDuplicate) return;

        const historyItem = document.createElement('li');
        historyItem.className = 'history-item';
        
        historyItem.innerHTML = `
            <div class="history-details">
                <p class="history-bet">Aposta: ${formatCurrency(gameState.currentBet * gameState.currentMultiplier)}</p>
                <p class="history-win-type">${winType || ''}</p>
                <span class="history-date">${timeString}</span>
            </div>
            <span class="history-result ${win ? 'win' : 'lose'}">
                ${win ? '+ ' + formatCurrency(amount) : 'Perdeu'}
            </span>
        `;
        
        historyList.insertBefore(historyItem, historyList.firstChild);
        
        // Mantem apenas os últimos 10 itens
        while (historyList.children.length > 10) {
            historyList.removeChild(historyList.lastChild);
        }
    }
        function updateCurrentDateTime() {
        const now = new Date();
        // Formato específico UTC: YYYY-MM-DD HH:MM:SS
        const formattedDateTime = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;
        
        const dateTimeElement = document.querySelector('.current-datetime');
        if (dateTimeElement) {
            dateTimeElement.textContent = formattedDateTime;
        }
    }

    function saveGameState() {
        try {
            // Validação básica dos dados antes de salvar
            if (typeof gameState.balance !== 'number' || gameState.balance < 0) {
                console.error('Invalid balance state detected');
                gameState.balance = 0;
            }
            if (typeof gameState.jackpot !== 'number' || gameState.jackpot < 100000) {
                console.error('Invalid jackpot state detected');
                gameState.jackpot = 100000;
            }
            
            localStorage.setItem('saposGameState', JSON.stringify(gameState));
        } catch (error) {
            console.error('Erro ao salvar estado do jogo:', error);
        }
    }

    function loadGameState() {
        try {
            const savedState = localStorage.getItem('saposGameState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                gameState = { ...gameState, ...parsedState };
                
                // Atualiza a interface com os valores carregados
                updateBalance(gameState.balance);
                updateJackpotValue(gameState.jackpot);
                updateSelectedCount();
                
                console.log('Estado do jogo carregado com sucesso');
            }
        } catch (error) {
            console.error('Erro ao carregar estado do jogo:', error);
        }
    }

    function updateJackpotTimer() {
        const timerBoxes = document.querySelectorAll('.timer-box .timer-value');
        let [hours, minutes, seconds] = Array.from(timerBoxes).map(box => Number(box.textContent));
        
        setInterval(() => {
            seconds--;
            if (seconds < 0) {
                seconds = 59;
                minutes--;
                if (minutes < 0) {
                    minutes = 59;
                    hours--;
                    if (hours < 0) {
                        hours = 23;
                    }
                }
            }
            
            timerBoxes[0].textContent = hours.toString().padStart(2, '0');
            timerBoxes[1].textContent = minutes.toString().padStart(2, '0');
            timerBoxes[2].textContent = seconds.toString().padStart(2, '0');
        }, 1000);
    }

    function handleDeposit() {
        const amount = prompt('Digite o valor que deseja depositar:');
        const depositAmount = Number(amount);
        
        if (isNaN(depositAmount) || depositAmount <= 0) {
            alert('Por favor, digite um valor válido maior que zero.');
            return;
        }

        gameState.balance += depositAmount;
        updateBalance(gameState.balance);
        playSound('win');
        alert(`Depósito de ${formatCurrency(depositAmount)} realizado com sucesso!`);
    }

    function handleWithdraw() {
        const amount = prompt('Digite o valor que deseja sacar:');
        const withdrawAmount = Number(amount);
        
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            alert('Por favor, digite um valor válido maior que zero.');
            return;
        }

        if (withdrawAmount > gameState.balance) {
            alert('Saldo insuficiente para realizar o saque.');
            return;
        }

        gameState.balance -= withdrawAmount;
        updateBalance(gameState.balance);
        playSound('click');
        alert(`Saque de ${formatCurrency(withdrawAmount)} realizado com sucesso!`);
    }

    // Event Listeners
    depositActionButton?.addEventListener('click', handleDeposit);
    withdrawButton?.addEventListener('click', handleWithdraw);
    depositMainButton?.addEventListener('click', handleDeposit);
    withdrawMainButton?.addEventListener('click', handleWithdraw);

    multiplierButtons.forEach(button => {
        button.addEventListener('click', () => {
            const currentValue = Number(multiplierValue.value);
            if (button.textContent === '+' && currentValue < 100) {
                updateMultiplier(currentValue + 1);
            } else if (button.textContent === '-' && currentValue > 1) {
                updateMultiplier(currentValue - 1);
            }
        });
    });

    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            presetButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const value = button.textContent === 'Máximo' 
                ? gameState.balance 
                : Number(button.textContent.replace('R$ ', ''));
            
            updateBetValue(value);
        });
    });

    // Modal PIX
const pixModal = document.getElementById('pixModal');
const closePixModal = document.getElementById('closePixModal');
const depositPixButton = document.querySelector('.balance-button.primary');
const copyPixButton = document.getElementById('copyPixKey');
const pixKeyInput = document.getElementById('pixKey');

// Abrir modal PIX
depositPixButton.addEventListener('click', () => {
    pixModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
});

// Fechar modal PIX
closePixModal.addEventListener('click', () => {
    pixModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Fechar modal ao clicar fora
window.addEventListener('click', (event) => {
    if (event.target === pixModal) {
        pixModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Copiar chave PIX
copyPixButton.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(pixKeyInput.value);
        alert('Chave PIX copiada com sucesso!');
    } catch (err) {
        alert('Erro ao copiar a chave PIX');
    }
});

    // Continuação no próximo bloco...
        // Atualiza relógio em formato UTC
    function updateCurrentDateTime() {
        const now = new Date();
        // Formato específico: YYYY-MM-DD HH:MM:SS
        const dateTimeString = now.toISOString()
            .replace('T', ' ')
            .substring(0, 19);
        
        const dateTimeElement = document.querySelector('.current-datetime');
        if (dateTimeElement) {
            dateTimeElement.textContent = dateTimeString;
        }
    }

    betInput.addEventListener('input', (e) => {
        const value = Number(e.target.value);
        if (value > gameState.balance) {
            e.target.value = gameState.balance;
            updateBetValue(gameState.balance);
        } else {
            updateBetValue(value);
        }
    });

    clearButton.addEventListener('click', () => {
    if (!gameState.isRevealing) { 
        clearSelection();
        playSound('click');
    }
});

    betButton.addEventListener('click', () => {
        if (gameState.isAutoPlaying) {
            stopAutoPlay();
        } else {
            const autoPlayCount = parseInt(document.querySelector('#autoPlayCount')?.value || '0');
            if (autoPlayCount > 0) {
                startAutoPlay();
            } else {
                placeBet();
            }
        }
    });

   quickBetButton.addEventListener('click', async () => {
    if (gameState.isRevealing) {
        alert('Aguarde a revelação da sequência atual!');
        return;
    }

    // Limpa a seleção anterior
    clearSelection();
    playSound('click');
    
    try {
        // Seleciona 6 sapos aleatórios (permite repetições)
        for (let i = 0; i < gameState.maxSelections; i++) {
            const randomIndex = Math.floor(Math.random() * frogImages.length); // Corrigido para usar frogImages
            const randomFrog = document.querySelectorAll('.frog-card')[randomIndex]; // Garante que está selecionando do DOM
            
            await new Promise(resolve => setTimeout(resolve, 200)); // Aguarda para simular tempo entre seleções
            selectFrog(randomFrog);
        }

        if (gameState.selectedFrogs !== gameState.maxSelections) {
            alert('Erro ao selecionar sapos. Por favor, tente novamente.');
            clearSelection();
        }
    } catch (error) {
        console.error('Erro na seleção rápida:', error);
        clearSelection();
    }
});

    // Inicialização do jogo
   // Modifique a função initGame para limpar os campos "Sapos Selecionados" e "Resultado da Rodada"
async function initGame() {
    try {
        await preloadSounds();
        loadGameState();
        initializeFrogCards();
        updateJackpotTimer();
        updateSelectedCount();

        // Limpa o campo "Sapos Selecionados"
        clearSelection();

        // Limpa o campo "Resultado da Rodada"
        const resultsGrid = document.querySelector('.results-grid');
        if (resultsGrid) {
            resultsGrid.innerHTML = ''; // Remove qualquer conteúdo existente
        }

        // Atualização inicial de data/hora e usuário
        updateCurrentDateTime();
        updateUserLogin();

        // Atualiza data/hora a cada segundo
        setInterval(updateCurrentDateTime, 1000);

        // Define valor inicial da aposta
        updateBetValue(50);
        updateMultiplier(1);

        // Ativa o botão de preset padrão (R$ 50)
        const defaultPreset = Array.from(presetButtons)
            .find(button => button.textContent === 'R$ 50');
        if (defaultPreset) {
            defaultPreset.classList.add('active');
        }

        // Oculta o multiplicador inicialmente
        const betMultiplier = document.querySelector('.bet-multiplier');
        betMultiplier.classList.add('hidden');

        console.log('Jogo inicializado com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar o jogo:', error);
    }
}

    // Event Listener para o Auto Play Count
    document.querySelector('#autoPlayCount')?.addEventListener('change', (e) => {
        const value = parseInt(e.target.value);
        if (isNaN(value) || value < 0) {
            e.target.value = 0;
        } else if (value > gameState.autoPlayMaxCount) {
            e.target.value = gameState.autoPlayMaxCount;
        }
    });

    // Função para debug de imagens
    function debugImagePaths() {
        console.group('Debug de Caminhos de Imagens');
        frogImages.forEach((frog, index) => {
            console.log(`Sapo ${index + 1}:`);
            console.log(`Nome: ${frog.name}`);
            console.log(`URL: ${frog.imageUrl}`);
            
            const img = new Image();
            img.onload = () => console.log(`✅ Imagem ${index + 1} carregada com sucesso`);
            img.onerror = () => console.error(`❌ Erro ao carregar imagem ${index + 1}`);
            img.src = frog.imageUrl;
        });
        console.groupEnd();
    }

    // Função para verificar carregamento das imagens
    function verifyImages() {
        console.log('Verificando imagens...');
        frogImages.forEach(frog => {
            const img = new Image();
            img.onload = () => console.log(`✅ Imagem carregada: ${frog.name}`);
            img.onerror = () => {
                console.error(`❌ Erro ao carregar: ${frog.name}`);
                console.error(`   URL: ${frog.imageUrl}`);
            };
            img.src = frog.imageUrl;
        });
    }


   function highlightWinners(matchingPositions, results, selectedColors) {
    const resultGrid = document.querySelector('.results-grid');
    const resultFrogs = resultGrid.querySelectorAll('.result-frog');
    
    // Limpa todos os estilos e classes anteriores
    resultFrogs.forEach(frog => {
        frog.classList.remove('winner', 'sequence');
        frog.style.removeProperty('border');
        frog.style.removeProperty('box-shadow');
    });

    // Não adiciona nenhum estilo novo
    // Removido o código que adicionava bordas e sombras
}


    // Inicia o jogo
    initGame();

    // Adicione esta nova função
    function handleScroll() {
        const header = document.querySelector('.game-header');
        // Mostra o saldo após rolar 200 pixels
        if (window.scrollY > 200) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    // Adicione o evento de scroll se ainda não existir
    window.addEventListener('scroll', handleScroll);

    // Função para gerenciar o header fixo
function initStickyHeader() {
    const header = document.querySelector('.game-header');
    const headerBalance = document.querySelector('.header-balance');
    let isModalOpen = false;

    function handleScroll() {
        // Não atualiza o header se um modal estiver aberto
        if (isModalOpen) return;

        if (window.scrollY > 200) {
            header.classList.add('scrolled');
            headerBalance.style.opacity = '1';
            headerBalance.style.visibility = 'visible';
            headerBalance.style.transform = 'translateY(0)';
        } else {
            header.classList.remove('scrolled');
            headerBalance.style.opacity = '0';
            headerBalance.style.visibility = 'hidden';
            headerBalance.style.transform = 'translateY(-20px)';
        }
    }


    // Adiciona o evento de scroll
    window.addEventListener('scroll', handleScroll);

    // Função para reativar o scroll após fechar modais
    function reactivateScroll() {
        handleScroll();
    }

    // Adiciona listeners para todos os botões que fecham modais
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            setTimeout(reactivateScroll, 100);
        });
    });

    // Adiciona listeners para cliques fora dos modais
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                setTimeout(reactivateScroll, 100);
            }
        });
    });

    // Executa verificação inicial
    handleScroll();
}

// Adicione esta linha dentro do seu DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // ... código existente ...
    initStickyHeader();
});

// Elementos do modal
const rulesModal = document.querySelector('#rulesModal');
const rulesButton = document.querySelector('.hero-button.secondary');
const closeModal = document.querySelector('.close-modal');

// Abrir modal
rulesButton.addEventListener('click', () => {
    rulesModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Impede rolagem do body
});

// Fechar modal
closeModal.addEventListener('click', () => {
    rulesModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaura rolagem do body
});

// Fechar modal ao clicar fora
window.addEventListener('click', (event) => {
    if (event.target === rulesModal) {
        rulesModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

betInput.addEventListener('blur', (e) => {
    const value = Number(e.target.value);
    if (!isNaN(value)) {
        e.target.value = value.toFixed(2);
    }
});

// Adicione dentro do evento DOMContentLoaded
const toggleSwitch = document.querySelector('.toggle-input');

toggleSwitch.addEventListener('change', function() {
    const betMultiplier = document.querySelector('.bet-multiplier');
    
    if (this.checked) {
        betMultiplier.classList.remove('hidden');
        betMultiplier.classList.add('visible');
        // Define valor inicial como 1 quando ativado
        multiplierValue.value = 1;
        gameState.autoPlayCount = 1;
    } else {
        betMultiplier.classList.remove('visible');
        betMultiplier.classList.add('hidden');
        // Zera o valor quando desativado
        multiplierValue.value = 0;
        gameState.autoPlayCount = 0;
        if (gameState.isAutoPlaying) {
            stopAutoPlay();
        }
    }
});

function disableAutoPlay() {
    stopAutoPlay();
    document.querySelector('.toggle-input').checked = false;
    document.querySelector('.bet-multiplier').classList.add('hidden');
    document.querySelector('.bet-multiplier').classList.remove('visible');
}

// Modifique o event listener do toggle switch
document.querySelector('.toggle-input').addEventListener('change', function() {
    const betMultiplier = document.querySelector('.bet-multiplier');
    const multiplierValue = document.querySelector('.multiplier-value');
    
    if (this.checked) {
        betMultiplier.classList.remove('hidden');
        betMultiplier.classList.add('visible');
        // Define valor inicial como 1 quando ativado
        multiplierValue.value = 1;
        gameState.autoPlayCount = 1;
    } else {
        betMultiplier.classList.remove('visible');
        betMultiplier.classList.add('hidden');
        // Zera o valor quando desativado
        multiplierValue.value = 0;
        gameState.autoPlayCount = 0;
        if (gameState.isAutoPlaying) {
            stopAutoPlay();
        }
    }
});

// Adicione estas funções
function showPopup(type, winAmount) {
    const popup = document.getElementById(`popup-${type}`);
    if (popup) {
        // Atualiza o valor do prêmio no popup
        const premioValor = popup.querySelector('.premio-valor');
        if (premioValor) {
            premioValor.textContent = formatCurrency(winAmount);
        }
        popup.classList.add('active');
    }
}

function closePopup(type) {
    const popup = document.getElementById(`popup-${type}`);
    if (popup) {
        popup.classList.remove('active');
    }
}
window.closePopup = closePopup;
});

// Adicione este código no seu arquivo JavaScript existente

document.addEventListener('DOMContentLoaded', () => {
    // Manipuladores para os botões de configurações
    const settingsItems = document.querySelectorAll('.settings-item');
    
    settingsItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const action = e.target.textContent.trim();
            
            switch(action) {
                case 'Perfil':
                    // Implementar lógica do perfil
                    console.log('Perfil clicado');
                    break;
                    
                case 'Som':
                    // Implementar lógica do som
                    console.log('Som clicado');
                    break;
                    
                case 'Histórico':
                    // Implementar lógica do histórico
                    console.log('Histórico clicado');
                    break;
                    
                case 'Geral':
                    // Implementar lógica das configurações gerais
                    console.log('Geral clicado');
                    break;
                    
                case 'Modo Teste':
                    // Implementar lógica do modo teste
                    console.log('Modo Teste clicado');
                    break;
            }
        });
    });
});

// Adicione ao seu arquivo script.js
document.addEventListener('DOMContentLoaded', function() {
    const settingsButton = document.querySelector('.settings-dropdown .nav-button');
    const settingsDropdown = document.querySelector('.settings-dropdown');
    
    settingsButton.addEventListener('click', function(e) {
        e.stopPropagation(); // Impede que o clique se propague
        settingsDropdown.classList.toggle('open');
        settingsButton.classList.toggle('active');
    });

    // Fecha o menu quando clicar fora
    document.addEventListener('click', function(e) {
        if (!settingsDropdown.contains(e.target)) {
            settingsDropdown.classList.remove('open');
            settingsButton.classList.remove('active');
        }
    });

    // Previne que o menu feche quando clicar dentro dele
    const settingsMenu = document.querySelector('.settings-menu');
    settingsMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});

// Funções para o Modal de Perfil
function initializeProfileModal() {
    const profileButton = document.querySelector('.settings-item:first-child');
    const profileModal = document.getElementById('profileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const changeAvatarBtn = document.querySelector('.change-avatar-btn');
    const avatarInput = document.getElementById('avatarInput');
    const saveProfileBtn = document.querySelector('.save-profile-btn');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');

    // Abrir modal
    profileButton.addEventListener('click', () => {
        profileModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        loadProfileData(); // Carrega dados salvos
    });

    // Fechar modal
    closeProfileModal.addEventListener('click', () => {
        profileModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    // Fechar ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target === profileModal) {
            profileModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Mudar avatar
    changeAvatarBtn.addEventListener('click', () => {
        avatarInput.click();
    });

    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                userAvatar.src = e.target.result;
                localStorage.setItem('userAvatar', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // Salvar perfil
    saveProfileBtn.addEventListener('click', () => {
        const profileData = {
            name: userName.value,
            email: userEmail.value,
            avatar: userAvatar.src
        };

        localStorage.setItem('profileData', JSON.stringify(profileData));
        alert('Perfil salvo com sucesso!');
        profileModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
}

// Carregar dados do perfil
function loadProfileData() {
    const profileData = JSON.parse(localStorage.getItem('profileData')) || {};
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');

    if (profileData.avatar) {
        userAvatar.src = profileData.avatar;
    }
    if (profileData.name) {
        userName.value = profileData.name;
    }
    if (profileData.email) {
        userEmail.value = profileData.email;
    }
}

// Adicione esta linha ao seu evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // ... código existente ...
    initializeProfileModal();
    initializeSoundSettings(); // Adiciona inicialização das configurações de som
});


// Configurações de Som
function initializeSoundSettings() {
    const soundButton = document.getElementById('soundSettingsBtn');
    const soundModal = document.getElementById('soundModal');
    const closeSoundModal = document.getElementById('closeSoundModal');
    const masterVolume = document.getElementById('masterVolume');
    const muteAll = document.getElementById('muteAll');
    const saveSoundBtn = document.querySelector('.save-sound-btn');
    const volumeValue = document.querySelector('.volume-value');

    if (!soundButton || !soundModal || !closeSoundModal || !masterVolume || !muteAll || !saveSoundBtn || !volumeValue) {
        console.error('Elementos de som não encontrados');
        return;
    }

    const loadSoundSettings = () => {
        const settings = JSON.parse(localStorage.getItem('soundSettings')) || {
            master: 100,
            muted: false
        };

        masterVolume.value = settings.master;
        muteAll.checked = settings.muted;
        updateVolumeDisplay();
        applySoundSettings(settings);
    };

    const updateVolumeDisplay = () => {
        volumeValue.textContent = `${masterVolume.value}%`;
    };

    soundButton.addEventListener('click', () => {
        soundModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        loadSoundSettings();
    });

    closeSoundModal.addEventListener('click', () => {
        soundModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    masterVolume.addEventListener('input', updateVolumeDisplay);

    muteAll.addEventListener('change', () => {
        masterVolume.disabled = muteAll.checked;
    });

    saveSoundBtn.addEventListener('click', () => {
        const settings = {
            master: parseInt(masterVolume.value),
            muted: muteAll.checked
        };

        localStorage.setItem('soundSettings', JSON.stringify(settings));
        applySoundSettings(settings);
        soundModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        showToast('Configurações de som salvas!');
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target === soundModal) {
            soundModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Carrega as configurações iniciais
    loadSoundSettings();
}

// Função para aplicar as configurações de som
function applySoundSettings(settings) {
    if (!soundCache) return; // Adiciona verificação de segurança
    
    const volume = settings.muted ? 0 : settings.master / 100;
    
    Object.values(soundCache).forEach(audio => {
        try {
            audio.volume = volume;
        } catch (error) {
            console.error('Erro ao ajustar volume:', error);
        }
    });
}

// Função para mostrar toast de feedback
function showToast(message) {
    // Criar elemento toast se não existir
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = 'toast show';

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Inicialização do Modal de Histórico
function initializeHistoryModal() {
    const historyButton = document.querySelector('.settings-item:nth-child(3)');
    const historyModal = document.getElementById('historyModal');
    const closeHistoryModal = document.getElementById('closeHistoryModal');
    const historyEntries = document.querySelector('.history-entries');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.querySelector('.history-search');
    
    // Verifica se todos os elementos necessários existem
    if (!historyModal || !historyEntries) {
        console.error('Elementos do modal de histórico não encontrados');
        return;
    }
    
    // Abrir modal
    historyButton?.addEventListener('click', () => {
        try {
            historyModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            loadHistoryData();
        } catch (error) {
            console.error('Erro ao abrir modal de histórico:', error);
        }
    });

    // Fechar modal
    closeHistoryModal.addEventListener('click', () => {
        historyModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    // Fechar ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target === historyModal) {
            historyModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Filtros
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadHistoryData(btn.dataset.filter);
        });
    });

    // Busca
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterHistory(searchTerm);
    });
}

// Carregar dados do histórico
function loadHistoryData(filter = 'all') {
    const historyEntries = document.querySelector('.history-entries');
    const gameHistory = JSON.parse(localStorage.getItem('gameHistory')) || [];
    
    // Atualizar estatísticas
    updateHistoryStats(gameHistory);
    
    // Filtrar histórico
    const filteredHistory = filterHistoryByType(gameHistory, filter);
    
    // Limpar entradas existentes
    historyEntries.innerHTML = '';
    
    // Adicionar novas entradas
    filteredHistory.forEach(entry => {
        const historyEntry = createHistoryEntry(entry);
        historyEntries.appendChild(historyEntry);
    });
}

// Criar elemento de entrada do histórico
function createHistoryEntry(entry) {
    const div = document.createElement('div');
    div.className = 'history-entry';
    
    div.innerHTML = `
        <div class="entry-info">
            <div class="entry-time">${entry.date}</div>
            <div class="entry-details">
                <span class="entry-bet">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    <span class="entry-amount">R$ ${entry.bet.toFixed(2)}</span>
                </span>
                <span class="entry-result ${entry.win ? 'win' : 'loss'}">
                    ${entry.win ? '+ R$ ' + entry.amount.toFixed(2) : 'Perdeu'}
                </span>
            </div>
        </div>
    `;
    
    return div;
}

// Atualizar estatísticas
function updateHistoryStats(history) {
    try {
        const statsElements = {
            winnings: document.querySelector('.history-stats .stat-card:nth-child(1) .stat-value'),
            games: document.querySelector('.history-stats .stat-card:nth-child(2) .stat-value'),
            winRate: document.querySelector('.history-stats .stat-card:nth-child(3) .stat-value')
        };

        // Verifica se todos os elementos existem
        if (!statsElements.winnings || !statsElements.games || !statsElements.winRate) {
            console.error('Elementos de estatísticas não encontrados');
            return;
        }

        const totalWinnings = history.reduce((acc, entry) => acc + (entry.win ? entry.amount : 0), 0);
        const totalGames = history.length;
        const wins = history.filter(entry => entry.win).length;
        const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(1) : 0;

        // Atualiza os valores
        statsElements.winnings.textContent = `R$ ${totalWinnings.toFixed(2)}`;
        statsElements.games.textContent = totalGames;
        statsElements.winRate.textContent = `${winRate}%`;

    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}

// Filtrar histórico por tipo
function filterHistoryByType(history, filter) {
    switch(filter) {
        case 'wins':
            return history.filter(entry => entry.win);
        case 'losses':
            return history.filter(entry => !entry.win);
        default:
            return history;
    }
}

// Filtrar histórico por termo de busca
function filterHistory(searchTerm) {
    const entries = document.querySelectorAll('.history-entry');
    
    entries.forEach(entry => {
        const text = entry.textContent.toLowerCase();
        entry.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Adicione esta linha ao seu evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // ... código existente ...
    initializeHistoryModal();
});

// Inicialização das Configurações Gerais
function initializeGeneralSettings() {
    const generalSettingsBtn = document.querySelector('.settings-item:nth-child(4)');
    const generalSettingsModal = document.getElementById('generalSettingsModal');
    const closeGeneralSettingsModal = document.getElementById('closeGeneralSettingsModal');
    const saveGeneralSettingsBtn = document.getElementById('saveGeneralSettings');
    const resetSettingsBtn = document.getElementById('resetSettings');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Carregar configurações salvas
    const loadGeneralSettings = () => {
        const settings = JSON.parse(localStorage.getItem('generalSettings')) || {
            darkMode: false,
            notifications: {
                game: true,
                wins: true,
                jackpot: true
            },
            language: 'pt-BR'
        };

        // Aplicar configurações
        darkModeToggle.checked = settings.darkMode;
        document.getElementById('gameNotifications').checked = settings.notifications.game;
        document.getElementById('winNotifications').checked = settings.notifications.wins;
        document.getElementById('jackpotNotifications').checked = settings.notifications.jackpot;
        document.getElementById('languageSelect').value = settings.language;

        // Aplicar modo escuro se necessário
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        }
    };

    // Salvar configurações
    const saveGeneralSettings = () => {
        const settings = {
            darkMode: darkModeToggle.checked,
            notifications: {
                game: document.getElementById('gameNotifications').checked,
                wins: document.getElementById('winNotifications').checked,
                jackpot: document.getElementById('jackpotNotifications').checked
            },
            language: document.getElementById('languageSelect').value
        };

        localStorage.setItem('generalSettings', JSON.stringify(settings));
        
        // Aplicar modo escuro
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        showToast('Configurações salvas com sucesso!');
        generalSettingsModal.style.display = 'none';
    };

    // Restaurar configurações padrão
    const resetSettings = () => {
        if (confirm('Tem certeza que deseja restaurar todas as configurações para o padrão?')) {
            const defaultSettings = {
                darkMode: false,
                notifications: {
                    game: true,
                    wins: true,
                    jackpot: true
                },
                language: 'pt-BR'
            };

            localStorage.setItem('generalSettings', JSON.stringify(defaultSettings));
            loadGeneralSettings();
            showToast('Configurações restauradas com sucesso!');
        }
    };

    // Event Listeners
    generalSettingsBtn.addEventListener('click', () => {
        generalSettingsModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        loadGeneralSettings();
    });

    closeGeneralSettingsModal.addEventListener('click', () => {
        generalSettingsModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    saveGeneralSettingsBtn.addEventListener('click', saveGeneralSettings);
    resetSettingsBtn.addEventListener('click', resetSettings);

    // Fechar modal ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target === generalSettingsModal) {
            generalSettingsModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Carregar configurações iniciais
    loadGeneralSettings();
}

// Adicione esta linha ao seu evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // ... código existente ...
    initializeGeneralSettings();
});

function showGameNotification(title, message, type = 'info') {
    const settings = JSON.parse(localStorage.getItem('generalSettings')) || {};
    
    if (!settings.notifications?.game) return;

    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, {
                    body: message,
                    icon: '/path/to/your/icon.png'
                });
            }
        });
    }
}

// Inicialização do Modo Teste
function initializeTestMode() {
    const testModeBtn = document.querySelector('.settings-item:last-child');
    const testModeModal = document.getElementById('testModeModal');
    const closeTestModeModal = document.getElementById('closeTestModeModal');
    
    // Estado do modo teste
    let testModeState = {
        enabled: false,
        winRate: 50,
        forceResult: 'random',
        testGamesCount: 0,
        testWinsCount: 0
    };

    // Carregar configurações salvas
    const loadTestSettings = () => {
        const saved = localStorage.getItem('testModeSettings');
        if (saved) {
            testModeState = { ...testModeState, ...JSON.parse(saved) };
            updateTestModeUI();
        }
    };

    // Atualizar interface
    const updateTestModeUI = () => {
        document.getElementById('testModeToggle').checked = testModeState.enabled;
        document.getElementById('winRateInput').value = testModeState.winRate;
        document.getElementById('forceResultSelect').value = testModeState.forceResult;
        updateTestStats();
    };

    // Atualizar estatísticas
    const updateTestStats = () => {
        document.getElementById('totalGamesStats').textContent = testModeState.testGamesCount;
        document.getElementById('totalWinsStats').textContent = testModeState.testWinsCount;
        const winRate = testModeState.testGamesCount > 0 
            ? ((testModeState.testWinsCount / testModeState.testGamesCount) * 100).toFixed(1)
            : '0';
        document.getElementById('actualWinRateStats').textContent = `${winRate}%`;
    };

    // Executar simulação
    const runSimulation = async () => {
        const count = parseInt(document.getElementById('simulationCountInput').value);
        if (isNaN(count) || count < 1) return;

        const balance = parseFloat(document.getElementById('balanceInput').value);
        if (balance > 0) {
            updateBalance(balance);
        }

        for (let i = 0; i < count; i++) {
            await simulateGame();
            testModeState.testGamesCount++;
            updateTestStats();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    };

    // Simular uma jogada
    const simulateGame = async () => {
        if (!testModeState.enabled) return;

        const willWin = Math.random() * 100 < testModeState.winRate;
        
        if (willWin) {
            // Força um resultado específico se selecionado
            if (testModeState.forceResult !== 'random') {
                await forceWinningGame(testModeState.forceResult);
            } else {
                await placeBet(); // Usa a função normal de aposta
            }
            testModeState.testWinsCount++;
        } else {
            await placeBet(); // Usa a função normal de aposta
        }
    };

    // Forçar um resultado vencedor específico
    const forceWinningGame = async (type) => {
        // Implementar lógica para forçar diferentes tipos de vitória
        switch(type) {
            case 'simple':
                // Lógica para forçar acerto simples
                break;
            case 'double':
                // Lógica para forçar dupla
                break;
            case 'triple':
                // Lógica para forçar tripla
                break;
            case 'quadra':
                // Lógica para forçar quadra
                break;
            case 'quina':
                // Lógica para forçar quina
                break;
            case 'jackpot':
                // Lógica para forçar jackpot
                break;
        }
    };

    // Event Listeners
    testModeBtn.addEventListener('click', () => {
        testModeModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        loadTestSettings();
    });

    closeTestModeModal.addEventListener('click', () => {
        testModeModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    document.getElementById('testModeToggle').addEventListener('change', (e) => {
        testModeState.enabled = e.target.checked;
    });

    document.getElementById('winRateInput').addEventListener('change', (e) => {
        testModeState.winRate = Math.min(100, Math.max(0, parseFloat(e.target.value)));
    });

    document.getElementById('forceResultSelect').addEventListener('change', (e) => {
        testModeState.forceResult = e.target.value;
    });

    document.getElementById('runSimulationBtn').addEventListener('click', runSimulation);

    document.getElementById('resetTestStats').addEventListener('click', () => {
        testModeState.testGamesCount = 0;
        testModeState.testWinsCount = 0;
        updateTestStats();
    });

    document.getElementById('saveTestSettings').addEventListener('click', () => {
        localStorage.setItem('testModeSettings', JSON.stringify(testModeState));
        showToast('Configurações do modo teste salvas!');
        testModeModal.style.display = 'none';
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target === testModeModal) {
            testModeModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Carregar configurações iniciais
    loadTestSettings();
}

// Adicione esta linha ao seu evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // ... código existente ...
    initializeTestMode();
});

