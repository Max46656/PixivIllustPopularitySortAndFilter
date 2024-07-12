// ==UserScript==
// @name         Pixiv作品熱門程度排序與篩選器
// @name:ja      Pixiv作品人気度ソート＆フィルター
// @name:en      Pixiv Illustration Popularity Sorter and Filter
// @namespace    https://github.com/Max46656
// @description  在追蹤繪師作品、繪師作品、標籤作品頁面中以按讚數進行排序，並僅顯示高於閾值的作品。
// @description:ja  フォローアーティスト作品、アーティスト作品、タグ作品ページで、いいね數でソートし、閾値以上の作品のみを表示します。
// @description:en  Sort Illustration by likes and display only those above the threshold on followed artist illustrations, artist illustrations, and tag illustrations pages.
// @namespace    https://github.com/Max46656
// @version      1.6.6
// @author       Max
// @match        https://www.pixiv.net/bookmark_new_illust.php*
// @match        https://www.pixiv.net/users/*
// @match        https://www.pixiv.net/tags/*
// @match        https://www.pixiv.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pixiv.net
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @license MPL2.0
// @downloadURL https://update.greasyfork.org/scripts/497015/Pixiv%E4%BD%9C%E5%93%81%E7%86%B1%E9%96%80%E7%A8%8B%E5%BA%A6%E6%8E%92%E5%BA%8F%E8%88%87%E7%AF%A9%E9%81%B8%E5%99%A8.user.js
// @updateURL https://update.greasyfork.org/scripts/497015/Pixiv%E4%BD%9C%E5%93%81%E7%86%B1%E9%96%80%E7%A8%8B%E5%BA%A6%E6%8E%92%E5%BA%8F%E8%88%87%E7%AF%A9%E9%81%B8%E5%99%A8.meta.js
// ==/UserScript==
/* TODO
*提示文字多語言翻譯
*userPage的AllButtonClass除了第一頁以外缺乏正確的css class設定
*/
class pageStrategy {
    getThumbnailClass() {}
    getArtsClass() {}
    getRenderArtWallClass() {}
    getButtonAtClass() {}
    getAllButtonClass() {}
    getArtsCountClass(){}
}

class userStrategy extends pageStrategy{
    getThumbnailClass() {
        return 'li.sc-9y4be5-2 img'
    }
    getArtsClass() {
        return 'div.cDZIoX li';
    }
    getRenderArtWallClass() {
        return 'div.cDZIoX';
    }
    getOutArtWallWayClass(){
        return '.sc-1nr368f-4.sc-1xj6el2-3.ggHNyV.CAStc';
    }
    getButtonAtClass() {
        return 'nav.kWAFb';
    }
    getAllButtonClass() {
        return ['jZgOUq','kmjYsK','jYyUpu'];
    }
    getArtsCountClass(){
        return 'div.sc-7zddlj-2 span';
    }
}

class tagsStrategy extends pageStrategy{
    getThumbnailClass() {
        return 'div.fxGVAF a.fGjAxR img'
    }
    getArtsClass() {
        return 'div.juyBTC div.ggHNyV li';
    }
    getRenderArtWallClass() {
        return 'ul.hdRpMN';
        // return 'div.ggHNyV:has(ul.hdRpMN)';
    }
    getOutArtWallWayClass(){
        return 'div.ggHNyV:has(table)';
    }
    getButtonAtClass() {
        return 'div.laRMNP div.hbGpVM';
    }
    getAllButtonClass() {
        return ['hDldyK','hDldyK','hDldyK'];
    }
    getArtsCountClass(){
        return 'span.sc-1pt8s3a-10';
    }
}

class subStrategy extends pageStrategy{
    getThumbnailClass() {
        return 'div.fxGVAF a.fGjAxR img'
    }
    getArtsClass() {
        return 'ul.jtUPOE li';
    }
    getRenderArtWallClass() {
        return 'div.cwAKCq';
        // return 'div.ggHNyV:has(ul.hdRpMN)';
    }
    getOutArtWallWayClass(){
        return 'div.FIoEP';
    }
    getButtonAtClass() {
        return 'nav.kWAFb';
    }
    getAllButtonClass() {
        return ['hDldyK','hDldyK','hDldyK'];
    }
    getArtsCountClass(){
        return null;
    }
}

class artScraper {
    constructor(targetPages,likesMinLimit) {
        this.domain = 'https://www.pixiv.net';
        this.allArts = [];
        this.allArtsWithoutLike = [];
        this.targetPages = GM_getValue("targetPages", 10) || targetPages;
        this.likesMinLimit=GM_getValue("likesMinLimit", 50) || likesMinLimit;
        this.strategy = this.setStrategy();
        this.currentArtCount=0;
        // console.log(strategy.getThumbnailClass(),strategy.getArtsClass(),strategy.getRenderArtWallClass(),strategy.getButtonAtClass(),strategy.getAllButtonClass())
    }
    setStrategy(){
        const url = self.location.href;
        if (url.includes('https://www.pixiv.net/bookmark_new_illust.php')) {
            return new subStrategy();
        } else if (url.match(/^https:\/\/www.pixiv.net\/users\/.*\/.*$/)) {
            return new userStrategy();
        } else if (url.match(/^https:\/\/www.pixiv.net\/tags\/.*\/.*$/)) {
            return new tagsStrategy();
        } else {
            throw new Error('Unsupported page type');
        }
    }

    async eatAllArts() {
        const startTime = performance.now();

        await this.executeAndcountUpSec('readingPages', () => this.readingPages(this.strategy.getThumbnailClass(), this.strategy.getArtsClass()));
        await this.executeAndcountUpSec('sortArts', this.sortArts.bind(this));
        let renderArtWallAtClass = this.strategy.getRenderArtWallClass();
        await this.executeAndcountUpSec('renderArtWall', () => this.renderArtWall(renderArtWallAtClass));
        //this.changeElementClassName(document.querySelector(this.strategy.getOutArtWallWayClass()),'sortArtWall');
        let buttonAtClass = this.strategy.getButtonAtClass();
        //this.addRestoreButton(buttonAtClass, this.strategy.getAllButtonClass()[1]);
        this.addRerenderButton(renderArtWallAtClass, buttonAtClass, this.strategy.getAllButtonClass()[2]);

        const endTime = performance.now();
        console.log(`總耗時: ${(endTime - startTime) / 1000} 秒`);
    }

    async getElementOrListBySelector(selector) {
        let elements = document.querySelectorAll(selector);
        while (elements.length == 0) {
            await this.delay(50);
            elements = document.querySelectorAll(selector);
            //console.log("selector",selector,"找不到，將重試")
        }
        return elements.length > 1 ? elements : elements[0];
    }

    async readingPages(thumbnailClass, artsClass) {
        const startTime = performance.now();
        if(document.getElementById("RerenderButton")){
            this.toNextPage();
        }
        for (let i = 0; i <= this.targetPages; i++) {
            const iterationStartTime = performance.now();

            await this.getArtsInPage(thumbnailClass, artsClass);

            // 最後一頁的下一頁按鈕為隱藏
            let allPageNav = document.querySelectorAll("a.sc-xhhh7v-1-filterProps-Styled-Component");
            if (allPageNav[allPageNav.length-1].hasAttribute("hidden")) {
                break;
            }
            let takeALook = Math.floor(Math.random() * 10) + 30;
            let waitTime = Math.floor(Math.random() * 3000) + 2000;

            if(i > 400 && i % takeALook * 10 == 0){
                console.log("請等待API冷卻時間");
                await this.delay(waitTime * 10);
            }else if(i > 40 && i % takeALook == 0){
                console.log("請等待API冷卻時間");
                await this.delay(waitTime);
            }

            if(this.allArtsWithoutLike.length>=800){
                while(this.allArtsWithoutLike.length != 0){
                    try{
                        await this.executeAndcountUpSec('appendLikeElementToAllArts',()=>this.appendLikeElementToAllArts());
                    }catch (e){
                        console.log("請等待API冷卻時間");
                        await this.delay(waitTime);
                    }
                }
            }


            if (i < this.targetPages - 1) {
                await this.toNextPage();
            }

            const iterationEndTime = performance.now();
        }

        while(this.allArtsWithoutLike.length != 0){
            try{
                await this.executeAndcountUpSec('appendLikeElementToAllArts',()=>this.appendLikeElementToAllArts());
            }catch (e){
                console.log("請等待API冷卻時間");
                await this.delay(Math.floor(Math.random() * 1000));
            }
        }
    }

    async getArtsInPage(thumbnailClass, artsClass) {
        let pageStandard = await this.getElementOrListBySelector(artsClass);
        pageStandard = pageStandard.length - 1;
        let thumbnailCount = 0;
        let errorCount = 0;

        while (thumbnailCount < pageStandard) {
            const thumbnails = await this.getElementOrListBySelector(thumbnailClass);
            thumbnailCount = thumbnails.length;
            if (thumbnailCount < pageStandard) {
                errorCount++;
                console.log(`缺少${pageStandard - thumbnailCount}張圖片，請關閉開發者工具且保持視窗在本分頁以確保所有圖片都載入`);
                window.scrollBy(0, 800);
                await this.delay(100);
                if(errorCount % 5==0){
                    window.scrollBy(0, -5000);
                }
                if (errorCount % 30==0) {
                    console.log("返回上一頁。");
                    await this.toPervPage();
                    await this.toNextPage();
                }
            }
        }

        const arts = await this.getElementOrListBySelector(artsClass);
        console.log(`找到${arts.length}張圖片，開始抓取圖片`);

        for (let art of arts) {
            this.allArtsWithoutLike.push(art);
        }
    }

    async appendLikeElementToAllArts() {
        this.allArtsWithoutLike = this.allArtsWithoutLike.filter(art => art !== undefined);
        const ids = this.allArtsWithoutLike.filter(art => art.getElementsByTagName('a')[0] !== undefined)
        .map(art => {
            const href = art.getElementsByTagName('a')[0].getAttribute('href');
            return href.match(/\/(\d+)/)[1];
        });

        const likeCounts = await Promise.all(ids.map(id => this.fetchLikeCount(id)));

        likeCounts.forEach((likeCount, index) => {
            const art = this.allArtsWithoutLike[index];
            if (!art.getElementsByClassName('likes').length) {// 檢查是否已經有處理過
                const referenceElement = art.getElementsByTagName('div')[0];
                if (referenceElement) {
                    const likeCountElement = document.createElement('span');
                    likeCountElement.textContent = `${likeCount}`;
                    likeCountElement.className = 'likes';
                    likeCountElement.style.cssText = 'text-align: center !important; padding-bottom: 20px !important; color: #0069b1 !important; font-size: 12px !important; font-weight: bold !important; text-decoration: none !important; background-color: #cef !important; background-image: url("data:image/svg+xml;charset=utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22 viewBox=%220 0 12 12%22><path fill=%22%230069B1%22 d=%22M9,1 C10.6568542,1 12,2.34314575 12,4 C12,6.70659075 10.1749287,9.18504759 6.52478604,11.4353705 L6.52478518,11.4353691 C6.20304221,11.6337245 5.79695454,11.6337245 5.4752116,11.4353691 C1.82507053,9.18504652 0,6.70659017 0,4 C1.1324993e-16,2.34314575 1.34314575,1 3,1 C4.12649824,1 5.33911281,1.85202454 6,2.91822994 C6.66088719,1.85202454 7.87350176,1 9,1 Z%22/></svg>") !important; background-position: center left 6px !important; background-repeat: no-repeat !important; padding: 3px 6px 3px 18px !important; border-radius: 3px !important;';
                    referenceElement.appendChild(likeCountElement);
                }
                this.allArts.push({ art, likeCount });
            }
        });

        this.allArtsWithoutLike = [];
    }

    async toNextPage() {
        let pageButtonsClass='a.sc-d98f2c-0.sc-xhhh7v-2.cCkJiq.sc-xhhh7v-1-filterProps-Styled-Component.kKBslM';
        const pageButtons = document.querySelectorAll(pageButtonsClass);
        let nextPageButton = pageButtons[pageButtons.length - 1];
        nextPageButton.click();
    }

    async toPervPage() {
        let pageButtonsClass='a.sc-d98f2c-0.sc-xhhh7v-2.cCkJiq.sc-xhhh7v-1-filterProps-Styled-Component.kKBslM';
        const pageButtons = document.querySelectorAll(pageButtonsClass);
        let nextPageButton = pageButtons[0];
        nextPageButton.click();
    }

    async fetchLikeCount(id) {
        const response = await fetch(`https://www.pixiv.net/ajax/illust/${id}`, { credentials: 'omit' });
        const json = await response.json();
        return json.body.likeCount;
    }

    async sortArts() {
        this.allArts = Array.from(new Set(this.allArts
                                          .sort((a, b) => b.likeCount - a.likeCount)
                                          .map(({ art }) => art)
                                          .filter(art => art != undefined)
                                         ));
    }

    async renderArtWall(renderArtWallAtClass) {
        const parentElement = await this.getElementOrListBySelector(renderArtWallAtClass);
        this.clearElement(parentElement);

        const table = document.createElement('table');
        table.style.cssText = 'width: 1223px; overflow-y: auto; margin: 0 auto;';
        table.classList.add('TableArtWall');

        const fragment = document.createDocumentFragment();
        fragment.appendChild(table);

        let tr = document.createElement('tr');
        table.appendChild(tr);
        let row = GM_getValue("rowsOfArtsWall", 7);

        let artCount = 0; // 計算繪畫數量

        for (let art of this.allArts) {
            if (art.getElementsByClassName('likes')[0].textContent >= this.likesMinLimit) {
                const td = document.createElement('td');

                Array.from(art.attributes).forEach(attr => {
                    td.setAttribute(attr.name, attr.value);
                });

                td.innerHTML = art.innerHTML;
                tr.appendChild(td);
                artCount++; // 增加繪畫數量

                if (tr.children.length % row === 0) {
                    tr = document.createElement('tr');
                    table.appendChild(tr);
                }
            }
        }
        parentElement.appendChild(fragment);
        this.currentArtCount = artCount;
    }

    // 縮圖換原圖，以其他腳本獨立解決
    /*async changeThumbToOriginal() {
        for (const element of this.allArts) {
            const img = element.getElementsByTagName('img')[0];
            if (img) {
                const originalSrc = img.src.replace(/\/c\/\d+x\d+_\d+/, '')
                .replace('/img-master/', '/img-original/')
                .replace('/custom-thumb/', '/img-original/')
                .replace(/_square1200/, '')
                .replace(/_custom1200/, '');

                //console.log(originalSrc);
                const newSrc = await this.testImageSrc(originalSrc);
                img.src = newSrc;
                //console.log(img.src);
            }
        }
    }
    async testImageSrc(src) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = function() {
                resolve(src);
            };
            img.onerror = function() {
                resolve(src.replace('.jpg', '.png'));
            };
            img.src = src;
        });
    }*/

    //     搜尋樣式
    /*     async addStartButton() {
        let startButtonParentClass = '.sc-s8zj3z-5.eyagzq';
        let startButtonClass = 'lkjHVk';
        const parentElement = document.querySelector(startButtonParentClass);
        if (!parentElement) {
            await this.delay(50);
            await this.addStartButton();
            return;
        }

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.alignItems = 'center';
        buttonContainer.className = 'startButton';
        buttonContainer.innerHTML= '<div class="hxckiU"><form class="ahao-search"><div class="hjxNtZ"><div class="bbSVxZ"></div><div class="dlaIss"><div class="lclerM"><svg viewBox="0 0 16 16" size="16" class="fiLugu"><path d="M8.25739 9.1716C7.46696 9.69512 6.51908 10 5.5 10C2.73858 10 0.5 7.76142 0.5 5C0.5 2.23858 2.73858 0 5.5 0C8.26142 0 10.5 2.23858 10.5 5C10.5 6.01908 10.1951 6.96696 9.67161 7.75739L11.7071 9.79288C12.0976 10.1834 12.0976 10.8166 11.7071 11.2071C11.3166 11.5976 10.6834 11.5976 10.2929 11.2071L8.25739 9.1716ZM8.5 5C8.5 6.65685 7.15685 8 5.5 8C3.84315 8 2.5 6.65685 2.5 5C2.5 3.34315 3.84315 2 5.5 2C7.15685 2 8.5 3.34315 8.5 5Z" transform="translate(3 3)" fill-rule="evenodd" clip-rule="evenodd"></path></svg></div></div></div></form><div class="kFcBON"></div></div>';

        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.value = this.targetPages;
        inputField.className = 'gSIBXG';
        inputField.addEventListener('input', (event) => {
            this.targetPages = event.target.value;
        });

        const start = document.createElement('button');
        start.textContent = 'Sort';
        start.style.marginRight = '-10px';
        start.className = startButtonClass;
        start.addEventListener('click', async () => {
            await this.eatAllArts();
        });
        const startButton = document.createElement('button');
        startButton.textContent = 'Page Go';
        startButton.className = startButtonClass;
        startButton.addEventListener('click', async () => {
            await this.eatAllArts();
        });

        buttonContainer.appendChild(start);
        buttonContainer.appendChild(inputField);
        buttonContainer.appendChild(startButton);

        parentElement.appendChild(buttonContainer);
    } */

    // 拉桿樣式
    async addStartButton(ParentClass,buttonClass) {
        if(document.getElementById("StartButton"))
        {
            return;
        }

        const buttonContainer = document.createElement('nav');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.alignItems = 'center';
        buttonContainer.id = 'myScriptButtonContainer';

        const startButton = document.createElement('button');
        this.addLikeRangeInput(buttonContainer,startButton);
        await this.addPageRangeInput(buttonContainer,startButton);

        startButton.textContent = `likes: ${this.likesMinLimit} for ${this.targetPages}Page Go!`;
        startButton.className = buttonClass;
        startButton.id = "StartButton";
        startButton.addEventListener('click', async () => {
            GM_setValue("targetPages", this.targetPages);
            GM_setValue("likesMinLimit", this.likesMinLimit);
            await this.eatAllArts();
            startButton.textContent = `likes: ${this.likesMinLimit} for ${this.targetPages}Page Go!`;
        });

        const parentElement = await this.getElementOrListBySelector(ParentClass);
        buttonContainer.appendChild(startButton);
        parentElement.appendChild(buttonContainer);
    }

    async addRerenderButton(renderArtWallAtClass, ParentClass, buttonClass) {
        if(document.getElementById("RerenderButton")){
            document.getElementById("RerenderButton").textContent = `likes: ${this.likesMinLimit} Rerender Go! now:${this.currentArtCount}(${Math.round(this.currentArtCount/this.allArts.length *100)}％)`;
            return;
        }
        document.querySelector("nav#myScriptButtonContainer input[id=LikeRangeInput]").style.display="none";
        document.getElementById("LikeIcon").style.display="none";
        await this.delay(0);
        document.getElementById("StartButton").textContent = 'bug? you can try again.';

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.alignItems = 'center';

        const rerenderButton = document.createElement('button');
        rerenderButton.textContent = `likes: ${this.likesMinLimit} Rerender Go! now:${this.currentArtCount}(${Math.round(this.currentArtCount/this.allArts.length *100)}％)`; // 顯示目前繪畫數量
        rerenderButton.className = buttonClass;
        rerenderButton.id = "RerenderButton";
        rerenderButton.addEventListener('click', async () => {
            GM_setValue("likesMinLimit", this.likesMinLimit);
            await this.renderArtWall(renderArtWallAtClass);
            rerenderButton.textContent = `likes: ${this.likesMinLimit} Rerender Go! now:${this.currentArtCount}(${Math.round(this.currentArtCount/this.allArts.length *100)}％)`; // 更新繪畫數量
        });

        this.addLikeRangeInput(buttonContainer, rerenderButton);

        const parentElement = await this.getElementOrListBySelector(ParentClass);
        buttonContainer.appendChild(rerenderButton);
        parentElement.appendChild(buttonContainer);
    }

    addLikeRangeInput(container,Button) {
        const likesMinLimitsRange = [0, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 7500, 10000];

        const likeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        likeIcon.id="LikeIcon";
        likeIcon.setAttribute("viewBox", "0 0 32 32");
        likeIcon.setAttribute("height", "16");
        likeIcon.setAttribute("width", "16");
        likeIcon.classList.add("dxYRhf");
        likeIcon.innerHTML = `
        <path d="M21,5.5 C24.8659932,5.5 28,8.63400675 28,12.5 C28,18.2694439 24.2975093,23.1517313 17.2206059,27.1100183
        C16.4622493,27.5342993 15.5379984,27.5343235 14.779626,27.110148 C7.70250208,23.1517462 4,18.2694529 4,12.5
        C4,8.63400691 7.13400681,5.5 11,5.5 C12.829814,5.5 14.6210123,6.4144028 16,7.8282366
        C17.3789877,6.4144028 19.170186,5.5 21,5.5 Z"></path>
        <path d="M16,11.3317089 C15.0857201,9.28334665 13.0491506,7.5 11,7.5
        C8.23857625,7.5 6,9.73857647 6,12.5 C6,17.4386065 9.2519779,21.7268174 15.7559337,25.3646328
        C15.9076021,25.4494645 16.092439,25.4494644 16.2441073,25.3646326 C22.7480325,21.7268037 26,17.4385986 26,12.5
        C26,9.73857625 23.7614237,7.5 21,7.5 C18.9508494,7.5 16.9142799,9.28334665 16,11.3317089 Z" class="sc-j89e3c-0 dUurgf"></path>`;

        const likeRangeInput = document.createElement('input');
        likeRangeInput.type = 'range';
        likeRangeInput.min = '0';
        likeRangeInput.max = (likesMinLimitsRange.length - 1).toString();
        likeRangeInput.value = likesMinLimitsRange.indexOf(this.likesMinLimit);
        likeRangeInput.style.marginRight = '10px';
        likeRangeInput.style.backgroundColor = 'red';
        likeRangeInput.id="LikeRangeInput";
        // reRender
        if(document.querySelector('.TableArtWall')){
            likeRangeInput.addEventListener('input', (event) => {
                this.likesMinLimit = likesMinLimitsRange[event.target.value];
                Button.textContent = `likes: ${this.likesMinLimit} Rerender Go! now:${this.currentArtCount}(${Math.round(this.currentArtCount/this.allArts.length *100)}％)`;
            });
        }else{
            likeRangeInput.addEventListener('input', (event) => {
                this.likesMinLimit = likesMinLimitsRange[event.target.value];
                Button.textContent = `likes: ${this.likesMinLimit} for ${this.targetPages}Page Go!`;
            });
        }
        container.appendChild(likeIcon);
        container.appendChild(likeRangeInput);
    }

    async addPageRangeInput(container, startButton) {
        const pageIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        pageIcon.setAttribute("viewBox", "0 0 16 16");
        pageIcon.setAttribute("height", "16");
        pageIcon.setAttribute("width", "16");
        pageIcon.classList.add("pageInput");
        pageIcon.innerHTML = `
        <path d="M8.25739 9.1716C7.46696 9.69512 6.51908 10 5.5 10C2.73858 10 0.5 7.76142 0.5 5C0.5
        2.23858 2.73858 0 5.5 0C8.26142 0 10.5 2.23858 10.5 5C10.5 6.01908 10.1951 6.96696 9.67161
        7.75739L11.7071 9.79288C12.0976 10.1834 12.0976 10.8166 11.7071 11.2071C11.3166 11.5976 10.6834
        11.5976 10.2929 11.2071L8.25739 9.1716ZM8.5 5C8.5 6.65685 7.15685 8 5.5 8C3.84315 8 2.5 6.65685
        2.5 5C2.5 3.34315 3.84315 2 5.5 2C7.15685 2 8.5 3.34315 8.5 5Z" transform="translate(3 3)" fill-rule="evenodd" clip-rule="evenodd"></path>`;

        const pageRangeInput = document.createElement('input');
        pageRangeInput.type = 'range';
        pageRangeInput.min = '1';

        let max = await this.getMaxPage();
        const stepSize = Math.floor(max / 24);

        console.log(this.getMaxPage());
        pageRangeInput.max = max || 34;

        if (this.targetPages > max) {
            pageRangeInput.value = max;
            this.targetPages=max;
        } else {
            pageRangeInput.value = this.targetPages;
        }

        pageRangeInput.step = stepSize;
        pageRangeInput.style.marginRight = '10px';
        pageRangeInput.classList.add('pageInput');
        pageRangeInput.addEventListener('input', (event) => {
            this.targetPages = event.target.value;
            startButton.textContent = `likes: ${this.likesMinLimit} for ${this.targetPages}Page Go!`;
        });
        container.appendChild(pageIcon);
        container.appendChild(pageRangeInput);
        if(max>50){
            const pageInputBox = document.createElement('input');
            pageInputBox.type = 'number';
            pageInputBox.min = '1';
            pageInputBox.max = max || 34;
            pageInputBox.classList.add("gSIBXG");
            pageInputBox.value = this.targetPages;
            pageInputBox.style.width = '50px';
            pageInputBox.style.marginRight = '10px';
            pageInputBox.addEventListener('input', (event) => {
                const value = parseInt(event.target.value);
                if (value >= 1 && value <= max) {
                    this.targetPages = value;
                    startButton.textContent = `likes: ${this.likesMinLimit} for ${this.targetPages}Page Go!`;
                }
            });
            container.appendChild(pageInputBox);
        }
    }

    async getMaxPage() {
        if (this.strategy.getArtsCountClass() === null) {
            return 34;
        }
        const artsCountElement = await this.getElementOrListBySelector(this.strategy.getArtsCountClass());
        //console.log(artsCountElement);
        if (artsCountElement) {
            // 刪除數字中的逗號
            const artsCountText = artsCountElement.textContent.replace(/,/g, '');
            const artsCount = parseInt(artsCountText);
            const arts = await this.getElementOrListBySelector(this.strategy.getArtsClass());
            const artsPerPage = arts.length;
            const maxPage = Math.ceil(artsCount / artsPerPage);
            //console.log("artsPerPage", artsPerPage, 'artsCount', artsCount);
            return maxPage;
        } else {
            return 34;
        }
    }

    async addRestoreButton(ParentClass,buttonClass) {
        //const startButton = document.querySelector('nav.startButton');
        //this.clearElement(startButton);

        const restoreButton = document.createElement('button');
        restoreButton.textContent = 'Back to Start';
        restoreButton.style.marginRight = '10px';
        restoreButton.className = buttonClass;

        restoreButton.addEventListener('click', async () => {
            const url = new URL(window.location.href);
            const params = url.searchParams;
            const currentPage = parseInt(params.get('p')) || 1;
            const newPage = currentPage - (this.targetPages - 1);
            params.set('p', newPage > 0 ? newPage : 1);
            url.search = params.toString();
            window.location.href = url.toString();
        });

        const parentElement = await this.getElementOrListBySelector(ParentClass);
        parentElement.appendChild(restoreButton);
    }

    deleteExtraButton(){
        const startButtons = document.getElementById("myScriptButtonContainer");
        if(startButtons&&startButtons.length>1){
            startButtons.forEach(e=>e.remove());
        }else if(startButtons&&startButtons.length==1)
        {
            startButtons[0].remove();
        }
    }

    clearElement(element) {
        element.innerHTML='';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    changeElementClassName(element, newClassName) {
        if (element && typeof newClassName === 'string') {
            element.className = newClassName;
        }
    }

    async executeAndcountUpSec(label, fn) {
        const startTime = performance.now();
        await fn();
        const endTime = performance.now();
        console.log(`${label} 花費時間: ${(endTime - startTime) / 1000} 秒`);
    }

}

class customMenu{
    constructor() {
        this.registerMenuCommand(this);
        this.rowsOfArtsWall=this.getRowsOfArtsWall();
    }

    rowsOfArtsWallMenu(){
        const rows=parseInt(prompt(`${this.getFeatureMessageLocalization("rowsOfArtsWallPrompt")} ${this.getRowsOfArtsWall()}`));
        // console.log(Number.isInteger(rows));
        if(rows && Number.isInteger(rows) && rows>0){
            this.setRowsOfArtsWall(rows);
        }else {
            alert(this.getFeatureMessageLocalization("rowsOfArtsWallMenuError"));
        }
    }

    getRowsOfArtsWall() {
        return GM_getValue("rowsOfArtsWall", 7);
    }

    setRowsOfArtsWall(intger) {
        GM_setValue("rowsOfArtsWall",intger);
    }

    getFeatureMessageLocalization(word) {
        let display = {
            "zh-TW": {
                "rowsOfArtsWall": "行數設定",
                "rowsOfArtsWallPrompt": "一行顯示幾個繪畫?(請根據瀏覽器放大程度決定) 目前為：",
                "rowsOfArtsWallMenuError": "請輸入一個數字，且不能小於1",
            },
            "en": {
                "rowsOfArtsWall": "row setting",
                "rowsOfArtsWallPrompt": "How many paintings should be displayed in one row?(Please decide based on browser magnification level) Currently:",
                "rowsOfArtsWallMenuError": "Please enter a number, and it cannot be less than 1",
            },
            "ja": {
                "rowsOfArtsWall": "行設定",
                "rowsOfArtsWallPrompt": "1 行に何枚の絵畫を表示する必要がありますか?(ブラウザの倍率レベルに基づいて決定してください) 現在：",
                "rowsOfArtsWallMenuError": "數値を入力してください。1 未満にすることはできません",
            }
        };
        return display[navigator.language][word];
    }

    registerMenuCommand(instance) {
        //console.log("註冊選單");
        GM_registerMenuCommand(instance.getFeatureMessageLocalization("rowsOfArtsWall"), () => instance.rowsOfArtsWallMenu());
    }
}

class readingStand {
    static expandAllArtworks() {
        const artistHomePattern = /^https:\/\/www.pixiv.net\/users\/[0-9]*$/;
        const tagHomePattern = /^https:\/\/www.pixiv.net\/tags\/[^\/]+$/;
        if (artistHomePattern.test(self.location.href) || tagHomePattern.test(self.location.href)) {
            self.location.href = self.location.href + "/artworks?p=1";
        }
    }
}

//網頁名稱不論載入或AJAX更換頁面都會在過程會觸發1次，hashchange與popstate在此無法正確處理
const title = document.querySelector('head title');
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        //console.log('頁面名稱更改為 "%s"', document.title);
        readingStand.expandAllArtworks();
        const johnTheHornyOne = new artScraper(10, 50);
        johnTheHornyOne.deleteExtraButton();
        johnTheHornyOne.addStartButton(johnTheHornyOne.strategy.getButtonAtClass(), johnTheHornyOne.strategy.getAllButtonClass()[0]);
    });
});
let config = {childList: true,};
observer.observe(title, config);
const johnTheRestaurantWaiter = new customMenu();
