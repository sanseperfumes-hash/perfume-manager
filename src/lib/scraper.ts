import * as cheerio from 'cheerio';

interface ScrapedProduct {
    name: string;
    groupName: string;
    url: string;
    variants: {
        size: string; // "30g", "100g", "15g"
        price: number;
    }[];
}

const BASE_URL = 'https://vanrossum.com.ar';
const CATEGORY_URLS = [
    'https://vanrossum.com.ar/productos/00021', // Femenino
    'https://vanrossum.com.ar/productos/00022', // Masculino
    'https://vanrossum.com.ar/productos/00024', // Unisex
];

export async function scrapeVanRossum(): Promise<ScrapedProduct[]> {
    const allProducts: ScrapedProduct[] = [];

    for (const categoryUrl of CATEGORY_URLS) {
        try {
            console.log(`Scraping category: ${categoryUrl}`);
            const response = await fetch(categoryUrl);
            ```typescript
import * as cheerio from 'cheerio';

interface ScrapedProduct {
    name: string;
    groupName: string;
    url: string;
    variants: {
        size: string; // "30g", "100g", "15g"
        price: number;
    }[];
}

const BASE_URL = 'https://vanrossum.com.ar';
const CATEGORY_URLS = [
    'https://vanrossum.com.ar/productos/00021', // Femenino
    'https://vanrossum.com.ar/productos/00022', // Masculino
    'https://vanrossum.com.ar/productos/00024', // Unisex
];

export async function scrapeVanRossum(): Promise<ScrapedProduct[]> {
    const allProducts: ScrapedProduct[] = [];

    for (const categoryUrl of CATEGORY_URLS) {
        try {
            console.log(`Scraping category: ${ categoryUrl } `);
            const response = await fetch(categoryUrl);
            const html = await response.text();
            const $ = cheerio.load(html);

            const productLinks: string[] = [];

            // Find all product links in the category page
            $('.product-item-name').each((_, element) => {
                const href = $(element).attr('href');
                if (href) {
                    productLinks.push(href);
                }
            });

            console.log(`Found ${ productLinks.length } products in category.`);

            for (const link of productLinks) {
                try {
                    const productUrl = link.startsWith('http') ? link : `${ BASE_URL }${ link } `;
                    console.log(`Scraping product: ${ productUrl } `);

                    const productRes = await fetch(productUrl);
                    const productHtml = await productRes.text();
                    const $p = cheerio.load(productHtml);

                    const fullName = $p('.product-title').text().trim() || $p('h1').text().trim();
                    const groupName = fullName
                        .replace(/\s*\([FMU]\)\s*X\s*KG/i, '')
                        .replace(/\s*X\s*KG/i, '')
                        .trim();

                    const variants: { size: string; price: number }[] = [];

                    // Find prices by iterating over table cells
                    $p('td').each((_, el) => {
                        const text = $p(el).text().trim();
                        if (text.includes('Botella de')) {
                            let size = '';
                            if (text.includes('30 gramos')) size = '30g';
                            else if (text.includes('100 gramos')) size = '100g';
                            else if (text.includes('15 gramos')) size = '15g';
                            else if (text.includes('250 gramos')) size = '250g';
                            else if (text.includes('500 gramos')) size = '500g';
                            else if (text.includes('1 kg')) size = '1000g';

                            if (size) {
                                const priceText = $p(el).next().text().trim();
                                const priceMatch = priceText.match(/\$\s*([\d.,]+)/);
                                if (priceMatch) {
                                    const priceStr = priceMatch[1].replace(/\./g, '').replace(',', '.');
                                    const price = parseFloat(priceStr);
                                    if (!isNaN(price)) {
                                        variants.push({ size, price });
                                    }
                                }
                            }
                        }
                    });

                    if (variants.length > 0) {
                        allProducts.push({
                            name: fullName,
                            groupName,
                            url: productUrl,
                            variants
                        });
                    }

                } catch (error) {
                    console.error(`Error scraping product ${ link }: `, error);
                }
                
                // Small delay
                await new Promise(r => setTimeout(r, 200));
            }

        } catch (error) {
            console.error(`Error scraping category ${ categoryUrl }: `, error);
        }
    }

    return allProducts;
}
```
