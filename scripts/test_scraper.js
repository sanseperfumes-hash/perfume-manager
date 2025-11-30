const cheerio = require('cheerio');

async function test() {
    const url = 'https://vanrossum.com.ar/producto/ESEPUR0701'; // Alien Godness
    console.log(`Fetching ${url}...`);
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const bodyText = $('body').text();
    console.log('--- BODY TEXT START ---');
    console.log(bodyText.substring(0, 2000)); // Log first 2000 chars to see structure
    console.log('--- BODY TEXT END ---');

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
