// script.js - 最終邏輯與數據結構版 (修正選牌邏輯 + 盤面高度 + 牌義簡化)

// ==========================================================
// 1. 牌組數據庫 (Deck Data)
// ==========================================================

const ALL_TAROT_CARDS = [
    // --- 大阿爾克那 (22 張) ---
    { name: "0 愚者", img: "images/zombie/0_fool.jpg", meaning_up: "新的開始、純真、潛能無限。勇往直前的態度，放下束縛，開啟一段自由自在的旅程。", meaning_rev: "魯莽、不負責任、缺乏方向。盲目衝動，不顧後果，錯失良機。" },
    { name: "I 魔術師", img: "images/zombie/1_magician.jpg", meaning_up: "行動力、創造、資源運用。擁有技能與工具，能夠將想法付諸實現，創造奇蹟。", meaning_rev: "欺騙、缺乏信心、資源浪費。華而不實，空有技巧卻無實際成果，缺乏自信。" },
    { name: "II 女祭司", img: "images/zombie/2_high_priestess.jpg", meaning_up: "直覺、內在智慧、神秘。保持沉默與傾聽內心的聲音，尋求深層的真理與知識。", meaning_rev: "表象、秘密揭露、直覺受阻。只看表面，忽略內在的警示，秘密可能被揭露。" },
    { name: "III 皇后", img: "images/zombie/3_empress.jpg", meaning_up: "豐盛、滋養、母性。代表自然、美和創造力，享受生活的富足與舒適。", meaning_rev: "依賴、停滯不前、過度奢侈。過度依賴他人，缺乏獨立性，物質生活失衡。" },
    // 佔位符補足 78 張 (牌義已加長以示範截斷效果)
    ...Array(78 - 4).fill(0).map((_, i) => ({ 
        name: `偉特牌 ${i + 5}`, 
        img: `images/zombie/card_${i + 5}.jpg`, 
        meaning_up: `這是正位牌義佔位符，內容已經被特意加長，以便在顯示時會被截斷，只留下最重要的約二十個字。`, 
        meaning_rev: `這是逆位牌義佔位符，內容也一樣會被簡化，讓結果呈現更簡潔的指引。`, 
    })),
];

// --- 神諭卡 (44 張) 佔位符 ---
const ARCHANGEL_CARDS = Array(44).fill(0).map((_, i) => ({
    name: `大天使神諭卡 ${i + 1}`,
    img: `images/archangel/angel_${i + 1}.jpg`,
    meaning_up: `大天使神諭卡第 ${i + 1} 號的指引，這句話也是要被簡短呈現的。`,
    meaning_rev: '', 
}));

const DECKS = {
    archangel: { name: "大天使神諭卡", cards: ARCHANGEL_CARDS, },
    zombie: { name: "殭屍偉特牌", cards: ALL_TAROT_CARDS, },
    joker: { name: "小丑偉特牌", cards: ALL_TAROT_CARDS.map(card => ({ ...card, img: card.img.replace("zombie", "joker"), })), }
};

const SPREAD_LABELS = {
    single: ["指引"],
    three: ["過去", "現在", "未來"],
    four: ["您", "對方", "關係現狀", "關係潛力"],
};

// ==========================================================
// 2. DOM 元素選取與事件監聽器
// ==========================================================
const deckSelect = document.getElementById('deck-select');
const spreadSelect = document.getElementById('spread-select');
const drawButton = document.getElementById('draw-button');
const cardsContainer = document.getElementById('cards-container');
const messageElement = document.getElementById('message');

let selectedCount = 0; 
let cardsToDraw = 0; 
let selectedDeckCards = []; 

deckSelect.addEventListener('change', () => {
    spreadSelect.disabled = false;
    spreadSelect.selectedIndex = 0; 
    drawButton.disabled = true; 
    clearResults();
});

spreadSelect.addEventListener('change', () => {
    drawButton.disabled = false;
    clearResults();
    
    const selectedSpreadKey = spreadSelect.value;
    cardsToDraw = SPREAD_LABELS[selectedSpreadKey].length;
});

drawButton.addEventListener('click', handleDraw);

// ==========================================================
// 3. 核心邏輯函數
// ==========================================================

function clearResults() {
    cardsContainer.innerHTML = '';
    messageElement.textContent = '';
    selectedCount = 0;
    drawButton.textContent = "開始抽牌";
    selectedDeckCards = []; 
}

/**
 * 處理抽牌的主邏輯：將整個牌組攤開
 */
function handleDraw() {
    clearResults();

    const selectedDeckKey = deckSelect.value;
    const selectedSpreadKey = spreadSelect.value;
    
    if (!selectedDeckKey || !selectedSpreadKey) {
        messageElement.textContent = "⚠️ 請確實選擇牌組和牌陣。";
        return;
    }

    const deck = DECKS[selectedDeckKey];
    const cardLabels = SPREAD_LABELS[selectedSpreadKey];
    
    selectedDeckCards = [...deck.cards];
    shuffleArray(selectedDeckCards);

    showCardsForSelection(deck, selectedDeckCards, cardLabels);
    
    messageElement.textContent = `🎯 整個 ${deck.name} 牌組已攤開！請點選 ${cardsToDraw} 張牌。`;
    drawButton.disabled = true; 
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * 根據整個牌組，在半弧形上顯示所有牌背 (往上弧形計算 + 高度調整)
 */
function showCardsForSelection(deck, allCards, labels) {
    cardsContainer.innerHTML = ''; 
    
    const count = allCards.length;
    const radius = 200; // 進一步降低半徑，使弧形更低
    const cardHeight = 250; 
    
    const totalAngle = (count === 78) ? 160 : 120; 
    const angleIncrement = totalAngle / (count - 1);
    const startAngle = -totalAngle / 2; 

    cardsContainer.style.flexDirection = 'initial'; 
    cardsContainer.style.transform = 'none'; 
    cardsContainer.style.position = 'relative'; 
    cardsContainer.style.minWidth = '900px'; 
    
    // 容器高度調整：確保弧形不會超出太多，配合更低的半徑
    cardsContainer.style.height = `${cardHeight * 1.2}px`; 
    // 將容器向下移動，為向上的弧形騰出空間，進一步降低卡片位置
    cardsContainer.style.top = `-${cardHeight * 0.3}px`; 

    allCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-selection';
        
        const currentAngle = startAngle + index * angleIncrement;
        
        cardElement.style.transform = `
            rotate(${currentAngle}deg) 
            translateY(${-radius}px) 
            rotate(${-currentAngle}deg) 
        `;
        
        cardElement.dataset.cardIndex = index;
        cardElement.cardData = card; 
        
        cardElement.addEventListener('click', function(event) {
            if (this.classList.contains('selected')) return;

            if (selectedCount >= cardsToDraw) {
                messageElement.textContent = `🚫 您已經選取了所有 ${cardsToDraw} 張牌了！`;
                return;
            }
            
            handleCardClick(this, this.cardData, deck, labels);
        });
        
        cardsContainer.appendChild(cardElement);
    });
}

/**
 * 處理使用者點擊卡片時的邏輯：翻牌並顯示結果
 */
function handleCardClick(clickedElement, cardData, deck, labels) {
    
    clickedElement.classList.add('selected');
    clickedElement.style.pointerEvents = 'none'; 

    const isReversed = (deck.name !== "大天使神諭卡") && (Math.random() < 0.3); 
    const meaningText = isReversed ? cardData.meaning_rev : cardData.meaning_up;
    
    clickedElement.style.transition = 'transform 1s ease-out, opacity 0.5s';
    
    // 移除弧形定位，準備移動到最終位置
    clickedElement.style.transform = `
        rotate(0deg) 
        translateY(-10px) 
        scale(1.2)
    `;

    // 延遲後將選中的牌卡移到結果區
    setTimeout(() => {
        
        // **重要修正：只有在選第一張牌時才清空容器，並設置為結果顯示模式**
        if (selectedCount === 0) {
            cardsContainer.innerHTML = '';
            cardsContainer.style.flexDirection = 'row'; 
            cardsContainer.style.transform = 'none'; 
            cardsContainer.style.position = 'static'; 
            cardsContainer.style.minWidth = 'initial';
            cardsContainer.style.height = 'initial'; 
            cardsContainer.style.top = '0'; 
        } 
        // 在選完第一張後，將選中的牌從弧形盤面移除
        clickedElement.remove();
        
        // 創建結果卡片並加入結果區
        const resultCard = createResultCard(cardData, labels[selectedCount], isReversed, meaningText);
        cardsContainer.appendChild(resultCard);
        
        selectedCount++; 

        if (selectedCount < cardsToDraw) {
            messageElement.textContent = `🎉 已選取第 ${selectedCount} 張牌 (${labels[selectedCount-1]})！請繼續點選下一張牌 (${labels[selectedCount]})。`;
        } else {
            // **重要修正：選完所有牌後，將未選的牌卡淡出並禁用**
            messageElement.textContent = `🎉 恭喜您，所有 ${cardsToDraw} 張牌卡已選取完畢！請查看您的占卜結果。`;
            drawButton.disabled = false; 
            drawButton.textContent = "進行下一次占卜";
            
            document.querySelectorAll('.card-selection:not(.selected)').forEach(card => {
                card.style.opacity = '0'; // 淡出未選牌
                card.style.pointerEvents = 'none';
                // 延遲後移除，以確保不會影響結果區佈局
                setTimeout(() => card.remove(), 500);
            });
        }
    }, 1000); 
}

/**
 * 截斷文字至指定字數（約 20 字）
 */
function truncateText(text, maxChars = 20) {
    if (text.length > maxChars) {
        // 嘗試在不切斷詞彙的情況下截斷，這裡使用簡單的字數截斷
        return text.substring(0, maxChars) + '...';
    }
    return text;
}


/**
 * 創建單個結果卡片的 HTML 元素 (牌面使用 LOGO1121.jpg 圖案)
 */
function createResultCard(card, label, isReversed, meaningText) {
    const cardDisplay = document.createElement('div');
    cardDisplay.className = 'card-display'; 
    if (isReversed) {
         cardDisplay.classList.add('reversed-bg');
    }
    
    const labelEl = document.createElement('div');
    labelEl.className = 'card-label';
    labelEl.textContent = label;

    // 牌面圖案使用 LOGO1121.jpg
    const cardImage = document.createElement('img');
    cardImage.src = 'LOGO1121.jpg'; 
    cardImage.alt = 'GA•E 牌面圖案';
    cardImage.className = 'card-image';
    if (isReversed) {
         cardImage.classList.add('reversed');
    }

    const cardName = document.createElement('strong');
    cardName.textContent = `GA•E | ${card.name}`; 

    const orientation = document.createElement('p');
    orientation.className = 'card-orientation';
    orientation.textContent = isReversed ? "逆位" : "正位";
    
    // **核心修正：截斷牌義文字**
    const truncatedMeaning = truncateText(meaningText);
    const cardMeaning = document.createElement('p');
    cardMeaning.className = 'card-meaning';
    cardMeaning.textContent = truncatedMeaning;
    
    // **核心修正：加入宣傳文字**
    const adText = document.createElement('p');
    adText.className = 'ad-text';
    adText.textContent = "想了解更多請洽GAE直覺占卜";
    
    cardDisplay.appendChild(labelEl);
    cardDisplay.appendChild(cardImage);
    cardDisplay.appendChild(cardName);
    cardDisplay.appendChild(orientation);
    cardDisplay.appendChild(cardMeaning);
    cardDisplay.appendChild(adText); // 將宣傳文字加入卡片
    
    return cardDisplay;
}