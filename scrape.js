const fs = require('fs');
const path = require('path');
const https = require('https');

// Raw github url for Pokemon 151 set data
const API_URL = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en/sv3pt5.json';
const PRICES_FILE = path.join(__dirname, 'public', 'prices.json');
const IMAGES_MAP_FILE = path.join(__dirname, 'public', 'item-images.json');
const ITEMS_DIR = path.join(__dirname, 'public', 'items');

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${res.statusCode}`));
                return;
            }
            const file = fs.createWriteStream(filepath);
            res.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', reject);
    });
};

const sanitizeName = (name) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

const priceMultiplier = (rarity) => {
    if (!rarity) return 50000;
    if (rarity.includes('Rare Holo')) return 400000;
    if (rarity.includes('Double Rare')) return 200000;
    if (rarity.includes('Rare')) return 150000;
    if (rarity.includes('Ultra Rare') || rarity.includes('Special Illustration') || rarity.includes('Secret Rare') || rarity.includes('Hyper Rare') || rarity.includes('Illustration Rare')) {
        return Math.floor(Math.random() * 4000000) + 1000000;
    }
    return 50000;
};

async function scrape() {
    console.log('Fetching 50 Pokemon cards from GitHub static dump...');
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

        // The github file is an array of card objects directly
        const cards = await response.json();

        let pricesData = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf-8'));
        let imagesMap = JSON.parse(fs.readFileSync(IMAGES_MAP_FILE, 'utf-8'));

        // take first 50
        const targetCards = cards.slice(0, 50);

        let count = 0;
        for (const card of targetCards) {
            const fullName = `${card.name} - ${card.rarity || 'Common'}`;

            // Check if already exists
            if (imagesMap[fullName]) continue;

            const filename = `${sanitizeName(card.name)}_${card.id}.png`;
            const filepath = path.join(ITEMS_DIR, filename);

            try {
                if (card.images && card.images.large) {
                    console.log(`Downloading ${card.name}...`);
                    await downloadImage(card.images.large, filepath);

                    const price = priceMultiplier(card.rarity);
                    const subcategory = 'Scarlet & Violet 151'; // hardcoded for this set
                    const condition = price > 500000 ? 'PSA 10' : (price > 100000 ? 'NM-M' : '');

                    pricesData.push({
                        name: fullName,
                        category: "Pokemon",
                        subcategory: subcategory,
                        price: price,
                        qty: Math.floor(Math.random() * 5) + 1,
                        condition: condition
                    });

                    imagesMap[fullName] = `/items/${filename}`;
                    count++;
                }
            } catch (err) {
                console.error(`Error processing ${card.name}: ${err.message}`);
            }
        }

        fs.writeFileSync(PRICES_FILE, JSON.stringify(pricesData, null, 2));
        fs.writeFileSync(IMAGES_MAP_FILE, JSON.stringify(imagesMap, null, 2));

        console.log(`Scraping complete! Added ${count} new Pokemon cards.`);
    } catch (err) {
        console.error('Failed to scrape:', err);
    }
}

scrape();
