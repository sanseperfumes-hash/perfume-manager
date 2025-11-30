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
            const html = await response.text();
            const $ = cheerio.load(html);

            const productLinks: string[] = [];

            // Find all product links in the category page
            // Based on inspection: <td><a href="..." class="product-item-name">NAME</a></td>
            $('.product-item-name').each((_, element) => {
                const href = $(element).attr('href');
                if (href) {
                    productLinks.push(href);
                }
            });

            console.log(`Found ${productLinks.length} products in category.`);

            // Limit for testing/performance if needed, but we want all
            // For now, let's process them sequentially to avoid rate limiting
            for (const link of productLinks) {
                try {
                    const productUrl = link.startsWith('http') ? link : `${BASE_URL}${link}`;
                    console.log(`Scraping product: ${productUrl}`);

                    const productRes = await fetch(productUrl);
                    const productHtml = await productRes.text();
                    const $p = cheerio.load(productHtml);

                    const fullName = $p('.product-title').text().trim() || $p('h1').text().trim();
                    // Clean name: remove " (F) X KG", " (M) X KG", etc.
                    const groupName = fullName
                        .replace(/\s*\([FMU]\)\s*X\s*KG/i, '')
                        .replace(/\s*X\s*KG/i, '')
                        .trim();

                    const variants: { size: string; price: number }[] = [];

                    // Look for price inputs or text
                    // Based on inspection: "Botella de 30 gramos" followed by price
                    // Or hidden inputs like <input type="hidden" value="30534.00273" id="price_unit_8260">
                    // But text is safer if IDs change.

                    // Let's try to find the label "Botella de X gramos" and the associated price
                    // This part is tricky without exact DOM structure, but we saw "Botella de 30 gramos" in text

                    const bodyText = $p('body').text();

                    // Regex to find prices for 30g and 100g
                    // Pattern: "Botella de 30 gramos" ... "$ 30.534,00"
                    const sizePatterns = [
                        { size: '30g', regex: /Botella de 30 gramos[\s\S]*?\$([\d.,]+)/ },
                        { size: '100g', regex: /Botella de 100 gramos[\s\S]*?\$([\d.,]+)/ },
                        { size: '15g', regex: /Botella de 15 gramos[\s\S]*?\$([\d.,]+)/ }
                    ];

                    for (const pattern of sizePatterns) {
                        const match = bodyText.match(pattern.regex);
                        if (match && match[1]) {
                            // Parse price: "30.534,00" -> 30534.00
                            const priceStr = match[1].replace(/\./g, '').replace(',', '.');
                            const price = parseFloat(priceStr);
                            if (!isNaN(price)) {
                                variants.push({ size: pattern.size, price });
                            }
                        }
                    }

                    if (variants.length > 0) {
                        allProducts.push({
                            name: fullName,
                            groupName,
                            url: productUrl,
                            variants
                        });
                    }

                } catch (error) {
                    console.error(`Error scraping product ${link}:`, error);
                }

                // Small delay to be nice
                await new Promise(r => setTimeout(r, 500));
            }

        } catch (error) {
            console.error(`Error scraping category ${categoryUrl}:`, error);
        }
    }

    return allProducts;
}
