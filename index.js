const puppeteer = require('puppeteer');
const fs = require('fs');

//informações da pagina que o robo irar pecorrer
const site = 'https://hidratorrent.org/-'
const qtPags = 1
//pegando data e hora atual para gerar o nome do arquivo de dados
// Pegar do horário atual
const timestamp = new Date().getTime();

(async () => {
    //{headless: false} - permite ver o robo entrando nas paginas e {headless: true} não
    const browser = await puppeteer.launch({headless: false})
    const page = await browser.newPage()
    //tirando tempo limite de uma pagina
    await page.setDefaultNavigationTimeout(0);

    const arr =[]
    const links = []
    

    //navegando entre as paginas e pegando as informações e os links das postagens
    for (let index = 1; index <= qtPags; index++) {
        console.log(`Entrando na PAGINA: ${index}`)
        await page.goto(site + index)
    
    
        //pegando Titulo
        titles = await page.$$eval("#localPagInfinito > li > a > div > h2", (el) => {
            return el.map((h2) => h2.innerHTML);
        });
    
        //pegando Imagem
        const imgs = await page.$$eval("#localPagInfinito > li > a > img", (el) => {
            return el.map((img) => img.getAttribute("src"));
        }); 
    
        // pegando URL
        const urls = await page.$$eval("#localPagInfinito > li > a", (el) => {
            return el.map((a) => a.getAttribute("href"));
        });  
    
        //pegando Tipos F/S
        const tipos = await page.$$eval("#localPagInfinito > li > div.midia_lista", (el) => {
            return el.map((div) => div.innerText);
        });
        
        //pegando Audio
        const idiomas = await page.$$eval("#localPagInfinito > li > div.idioma_lista", (el) => {
            return el.map((div) => div.innerText);
        });
        
        //pegando Nota
        const notas = await page.$$eval("#localPagInfinito > li > div.imdb_lista", (el) => {
            return el.map((div) => div.innerText);
        });
    
        
        //juntando os arryas
        for (const key in titles) {
            arr.push({title: titles[key], type: tipos[key], language: idiomas[key], note: notas[key], src: imgs[key], href: urls[key], page: null})
            links.push(urls[key])
        }
    }
      
    console.log(`Foran Encontrados ${arr.length}, postagens!`)

    // entrando nas paginas
    const posts = [];
    //for para caminhar em cada uma das URLS
    let cont = 1
    for (const url of links) {
        await page.goto(url); // caminha para a URL 
        const arrMag =[]

        //Contado qual pagina está
        console.log(`${Math.round((cont*100)/arr.length)}% - PT ${cont} de ${arr.length} PT : Faltam: ${arr.length - cont} (${url})`)
        //Arrumando titulo 
        function arrString (text){
            function arrStringBuluray (text){
                return text.replace("BluRay","")
            }
            function arrStringFHD (text){
                return text.replace("FHD","")
            }
            function arrStringUHD (text){
                return text.replace("UHD","")
            }
            return arrStringBuluray(arrStringFHD(arrStringUHD(text))).trim()
        }

        //pegando Titolo Original
        const info = await page.$$eval("body > div.container-fluid > div > div > div > ul > li > a", (el) => {
            return el.map((a) => a.innerText);
        });

        let title_ori = info[0]

        //pegando Titolo Legenda
        const tMag = await page.$$eval("body > div.container-fluid > div > div > div.col-sm-6 > ul > a", (el) => {
            return el.map((a) => a.innerText);
        });

        // pegando MagnetLink
        const magnets = await page.$$eval("body > div.container-fluid > div > div > div.col-sm-6 > ul > a", (el) => {
            return el.map((a) => a.getAttribute("href"));
        });
        //juntado todas as informações em um unico objeto
        for (const key in tMag) {
            arrMag.push({title_t: tMag[key], magntL: magnets[key]})
        }
        
        posts.push({title_ori: title_ori, info: info, magnets: arrMag })
        cont++
    }

    //salvando os dados no array
    for (const key in arr) {
        arr[key].page = posts[key]
    }
    
    //escrevendo dados em um arquivo local (json)
    fs.writeFile('./res/dadostorrent' + timestamp +'.json', JSON.stringify(arr, null, 2), err =>{
        if (err) throw new Error('Aconteceu Alguma coisa!')

        console.log("Tudo Certo!")
    })
    
    
    await browser.close();
})();