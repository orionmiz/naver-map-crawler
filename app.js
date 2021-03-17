import xlsx from 'xlsx'
import fs from 'fs'
import pkg from 'selenium-webdriver'
const {Builder, By, Key, until} = pkg;

const data = xlsx.readFile('./roadlist.xls');
const sheet = data.Sheets['도로명정보조회']

const roadList = new Set(Object.keys(sheet).filter(key => key.startsWith('C')).map(ckey => sheet[ckey].v).sort());

// '도로명' 컬럼 없앨것

console.log([...roadList.values()]);

(async function example() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        // Navigate to Url
        await driver.get('https://v4.map.naver.com');

        const popupCloseBtn = await driver.wait(until.elementLocated(By.css('div.bottom_area+button.btn_close')), 10000);
        await popupCloseBtn.click();

        let first = true;
        let count = 0;

        for (let road of [...roadList.values()]) {

            const searchString = `서울 영등포구 ${road}`

            const searchBox = await driver.findElement(By.id('search-input'));
            await searchBox.clear();

            if (first) {
                await searchBox.sendKeys(searchString, Key.ENTER);
                first = false;
            } else {
                try {
                    const result = await driver.wait(until.elementLocated(By.css('.lst_site')), 1000);
                    await searchBox.sendKeys(searchString, Key.ENTER);
                    await driver.wait(until.stalenessOf(result), 5000); // wait for complete update.
                } catch (err) { // keep working after no search result.
                    await searchBox.sendKeys(searchString, Key.ENTER);
                }
            }
            
            console.log(`About : ${searchString}`)

            while(1) {
                // TODO : 상위 element인 search list를 가져와서 '검색 결과없음' 비교.
                let pagination;
                try { // hacky
                    pagination = await driver.wait(until.elementLocated(By.css('div.paginate.loaded')), 1000);
                } catch (err) { // no search result.
                    console.log('No results found.')
                    break;
                }
                let result;
                try { // hacky
                    result = await driver.wait(until.elementLocated(By.css('.lst_site')), 1000);
                } catch (err) {
                    console.log('No results found.')
                    break;
                }
                const cards = await result.findElements(By.css('dl.lsnx_det>dd.tel'));

                for await(let elem of cards) {
                    const rawTel = await elem.getAttribute('textContent');
                    const tel = rawTel.split(' ').join('');
                    if (tel.startsWith('010-')) {
                        count++;
                        fs.appendFile('logs/tels.txt', `\n${tel}`, (err, data) => {
                            if (err)
                                console.log(err);
                        })
                    }
                }

                try {
                    const nextPage = await pagination.findElement(By.css('strong+a'));
                    await nextPage.click();
                    const stale = await driver.wait(until.stalenessOf(result), 1000);
                } catch(err) { // No more page
                    console.log('Done!');
                    break;
                }
            }
        }
        console.log(`Total : ${count}`);
    } catch(err) {
        console.log(err);
    } finally {
        //driver.quit();
    }
})();