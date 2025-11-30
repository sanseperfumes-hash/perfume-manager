import * as cheerio from 'cheerio';

interface ScrapedProduct {
    name: string;
    groupName: string;
    url: string;
    gender?: string;
    variants: {
        size: string; // "30g", "100g", "15g"
        price: number;
        priceStatus: 'available' | 'consultar'; // New field
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
        let page = 1;
        let hasMorePages = true;

        while (hasMorePages) {
            const pageUrl = `${categoryUrl}?page=${page}`;
            try {
                console.log(`Scraping category page: ${pageUrl}`);
                const response = await fetch(pageUrl);
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

                if (productLinks.length === 0) {
                    console.log(`No products found on page ${page}. Stopping category.`);
                    hasMorePages = false;
                    break;
                }

                console.log(`Found ${productLinks.length} products on page ${page}.`);

                for (const link of productLinks) {
                    try {
                        const productUrl = link.startsWith('http') ? link : `${BASE_URL}${link}`;

                        // Check if we already scraped this URL to avoid duplicates (though unlikely with pagination)
                        if (allProducts.some(p => p.url === productUrl)) {
                            continue;
                        }

                        console.log(`Scraping product: ${productUrl}`);

                        const productRes = await fetch(productUrl);
                        const productHtml = await productRes.text();
                        const $p = cheerio.load(productHtml);

                        const fullName = $p('h3.color-scorpion').text().trim() || $p('h3').first().text().trim();
                        const groupName = fullName
                            .replace(/\s*\([FMU]\)\s*X\s*KG/i, '')
                            .replace(/\s*X\s*KG/i, '')
                            .trim();

                        // Infer gender from category URL
                        let gender = 'UNISEX';
                        if (categoryUrl.includes('00021')) gender = 'FEMALE';
                        else if (categoryUrl.includes('00022')) gender = 'MALE';
                        else if (categoryUrl.includes('00024')) gender = 'UNISEX';

                        const variants: { size: string; price: number; priceStatus: 'available' | 'consultar' }[] = [];

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

                                    // Check if price is "consultar" or similar
                                    if (priceText.toLowerCase().includes('consultar') || priceText.toLowerCase().includes('consulte')) {
                                        variants.push({ size, price: 0, priceStatus: 'consultar' });
                                    } else {
                                        const priceMatch = priceText.match(/\$\s*([\d.,]+)/);
                                        if (priceMatch) {
                                            const priceStr = priceMatch[1].replace(/\./g, '').replace(',', '.');
                                            const price = parseFloat(priceStr);
                                            if (!isNaN(price)) {
                                                variants.push({ size, price, priceStatus: 'available' });
                                            } else {
                                                // Price found but NaN? Treat as consultar
                                                variants.push({ size, price: 0, priceStatus: 'consultar' });
                                            }
                                        } else {
                                            // No price format found? Treat as consultar to ensure we capture the item
                                            variants.push({ size, price: 0, priceStatus: 'consultar' });
                                        }
                                    }
                                }
                            }
                        });

                        if (variants.length > 0 && groupName) {
                            allProducts.push({
                                name: fullName,
                                groupName,
                                url: productUrl,
                                gender,
                                variants
                            });
                        }

                    } catch (error) {
                        console.error(`Error scraping product ${link}:`, error);
                    }

                    // Small delay
                    await new Promise(r => setTimeout(r, 200));
                }

                // Check for next page button to be sure, or just rely on empty products
                // If we found products, try next page
                page++;

                // Safety break to prevent infinite loops if something goes wrong
                if (page > 20) {
                    console.log('Max pages reached for category.');
                    hasMorePages = false;
                }

            } catch (error) {
                console.error(`Error scraping category page ${pageUrl}:`, error);
                hasMorePages = false;
            }
        }
    }

    return allProducts;
}
