const cheerio = require('cheerio');

async function test() {
    const url = 'https://vanrossum.com.ar/producto/ESEPUR0701'; // Alien Godness
    console.log(`Fetching ${url}...`);
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    const html = await res.text();
    const fs = require('fs');
    fs.writeFileSync('debug.html', html);
    console.log('Saved HTML to debug.html');
    const $ = cheerio.load(html);

    const bodyText = $('body').text();
    console.log('--- BODY TEXT START ---');
    console.log(bodyText.substring(0, 2000)); // Log first 2000 chars to see structure
    console.log('--- BODY TEXT END ---');

    // Check title extraction
    console.log('--- CHECKING TITLE ---');
    const titleTag = $('title').text().trim();
    console.log('title tag:', titleTag);

    const h1 = $('h1').text().trim();
    console.log('h1:', h1);

    // Search for "Alien"
    console.log('--- SEARCHING FOR "Alien" ---');
    $('*').each((i, el) => {
        const text = $(el).text().trim();
        if (text.includes('Alien') && text.length < 100) {
            console.log(`Found "Alien" in <${el.tagName} class="${$(el).attr('class')}">`);
        }
    });

    // Search for elements containing "Botella de"
    console.log('--- SEARCHING FOR "Botella de" ---');
    $('*').each((i, el) => {
        const text = $(el).text().trim();
        if (text.includes('Botella de') && text.length < 100) {
            console.log(`Found element: <${el.tagName}> ${text}`);
            console.log(`Parent: <${$(el).parent().get(0).tagName}>`);
            console.log(`Next sibling text: ${$(el).next().text().trim()}`);
        }
    });

    // Search for hidden inputs with price
    console.log('--- SEARCHING FOR PRICE INPUTS ---');
    $('input[id^="price_unit_"]').each((i, el) => {
        console.log(`Found input: id=${$(el).attr('id')} value=${$(el).attr('value')}`);
        // Try to find the associated label
        // The input seems to be near the price display
    });
}

test();
