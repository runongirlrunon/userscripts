// ==UserScript==
// @name         Costco Unit Price Comparator
// @namespace    lindsey.unitprice.costco
// @version      1.0.3
// @description  Shows normalized unit prices on Costco and highlights the cheapest and second-cheapest search results.
// @match        https://www.costco.com/*
// @match        https://sameday.costco.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
    'use strict';

    const BADGE_CLASS = 'la-unit-price-badge';
    const WINNER_CLASS = 'la-unit-price-winner';
    const SECOND_CLASS = 'la-unit-price-second';

    /******************************************************************
     * CSS
     ******************************************************************/

    const style = document.createElement('style');

    style.textContent = `
        .${BADGE_CLASS} {
            display: block !important;
            width: fit-content !important;
            margin: 6px 0 4px 0 !important;
            padding: 4px 7px !important;
            border-radius: 5px !important;
            background: #eeeeee !important;
            color: #111111 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            line-height: 1.2 !important;
            position: relative !important;
            z-index: 9999 !important;
        }

        .${WINNER_CLASS} {
            outline: 3px solid #159447 !important;
            outline-offset: 3px !important;
            border-radius: 8px !important;
            background: rgba(21, 148, 71, 0.08) !important;
        }

        .${WINNER_CLASS} .${BADGE_CLASS} {
            background: #159447 !important;
            color: white !important;
        }

        .${SECOND_CLASS} {
            outline: 3px solid #d89b00 !important;
            outline-offset: 3px !important;
            border-radius: 8px !important;
            background: rgba(216, 155, 0, 0.08) !important;
        }

        .${SECOND_CLASS} .${BADGE_CLASS} {
            background: #d89b00 !important;
            color: white !important;
        }
    `;

    document.head.appendChild(style);

    /******************************************************************
     * TEXT
     ******************************************************************/

    function cleanText(text) {
        return String(text ?? '')
            .replace(/\u00a0/g, ' ')
            .replace(
                /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g,
                '-'
            )
            .replace(/\u00d7/g, 'x')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /******************************************************************
     * PRICE
     ******************************************************************/

    function extractPrice(text) {
        const t = cleanText(text);

        let match = t.match(
            /current price:\s*\$\s*(\d+(?:,\d{3})*\.\d{2})/i
        );

        if (match) {
            return Number(
                match[1].replace(/,/g, '')
            );
        }

        match = t.match(
            /\$\s*(\d+(?:,\d{3})*\.\d{2})/
        );

        if (match) {
            return Number(
                match[1].replace(/,/g, '')
            );
        }

        return null;
    }

    /******************************************************************
     * LIQUID DETECTION
     ******************************************************************/

    function isLikelyLiquid(text) {
        const t =
            cleanText(text).toLowerCase();

        const liquidWords = [
            'juice',
            'beverage',
            'drink',
            'shot',
            'shots',
            'lemonade',
            'limeade',
            'smoothie',
            'water',
            'soda',
            'cola',
            'sparkling',
            'tea',
            'coffee',
            'milk',
            'creamer',
            'kombucha',
            'nectar',
            'punch',
            'broth',
            'stock',
            'vinegar',
            'oil',
            'syrup',
            'sauce',
            'dressing',
        ];

        return liquidWords.some(
            word => t.includes(word)
        );
    }

    /******************************************************************
     * UNITS
     ******************************************************************/

    function canonicalUnit(raw) {
        if (!raw) {
            return null;
        }

        const u = raw
            .toLowerCase()
            .replace(/\./g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const aliases = {
            oz: 'oz',
            ounce: 'oz',
            ounces: 'oz',

            lb: 'lb',
            lbs: 'lb',
            pound: 'lb',
            pounds: 'lb',

            g: 'g',
            gram: 'g',
            grams: 'g',

            kg: 'kg',
            kilogram: 'kg',
            kilograms: 'kg',

            'fl oz': 'floz',
            floz: 'floz',

            ml: 'ml',
            milliliter: 'ml',
            milliliters: 'ml',

            l: 'l',
            liter: 'l',
            liters: 'l',
            litre: 'l',
            litres: 'l',

            gal: 'gal',
            gallon: 'gal',
            gallons: 'gal',

            ct: 'each',
            count: 'each',
            pack: 'each',
            pk: 'each',
        };

        return aliases[u] ?? null;
    }

    function normalizeQuantity(amount, unit) {
        switch (unit) {
            case 'lb':
                return {
                    dimension: 'weight',
                    quantity: amount,
                    displayUnit: 'lb',
                };

            case 'oz':
                return {
                    dimension: 'weight',
                    quantity: amount / 16,
                    displayUnit: 'lb',
                };

            case 'g':
                return {
                    dimension: 'weight',
                    quantity:
                        amount / 453.59237,
                    displayUnit: 'lb',
                };

            case 'kg':
                return {
                    dimension: 'weight',
                    quantity:
                        amount * 2.2046226218,
                    displayUnit: 'lb',
                };

            case 'floz':
                return {
                    dimension: 'volume',
                    quantity: amount,
                    displayUnit: 'fl oz',
                };

            case 'ml':
                return {
                    dimension: 'volume',
                    quantity:
                        amount / 29.5735295625,
                    displayUnit: 'fl oz',
                };

            case 'l':
                return {
                    dimension: 'volume',
                    quantity:
                        amount * 33.8140227018,
                    displayUnit: 'fl oz',
                };

            case 'gal':
                return {
                    dimension: 'volume',
                    quantity:
                        amount * 128,
                    displayUnit: 'fl oz',
                };

            case 'each':
                return {
                    dimension: 'count',
                    quantity: amount,
                    displayUnit: 'ea',
                };
        }

        return null;
    }

    /******************************************************************
     * COUNT PARSER
     ******************************************************************/

    function extractCountInfo(text) {
        const t =
            cleanText(text).toLowerCase();

        const candidates = [];

        /*
         * 5 dozen
         * 5 dozen-count
         *
         * Costco uses this wording for larger egg packages. Normalize
         * dozens directly to individual items.
         */
        for (const m of t.matchAll(
            /\b(\d+(?:\.\d+)?)\s*dozen(?:\s*-?\s*count)?\b/gi
        )) {
            candidates.push({
                amount: Number(m[1]) * 12,
                source: m[0],
                priority: 4,
            });
        }

        /*
         * Explicit "count" is more trustworthy than abbreviated "ct".
         * Costco sometimes injects a stray UI value such as "1 ct" into
         * card text even when the product title says "24-count".
         */
        for (const m of t.matchAll(
            /\b(\d+)\s*-?\s*count\b/gi
        )) {
            candidates.push({
                amount: Number(m[1]),
                source: m[0],
                priority: 3,
            });
        }

        for (const m of t.matchAll(
            /\b(\d+)\s*-?\s*(?:pack|pk)\b/gi
        )) {
            candidates.push({
                amount: Number(m[1]),
                source: m[0],
                priority: 2,
            });
        }

        for (const m of t.matchAll(
            /\b(\d+)\s*-?\s*ct\b/gi
        )) {
            candidates.push({
                amount: Number(m[1]),
                source: m[0],
                priority: 1,
            });
        }

        if (!candidates.length) {
            return null;
        }

        /*
         * Prefer the strongest wording. If Costco exposes multiple values
         * at the same confidence level, prefer the larger count so a stray
         * "1 ct" UI badge cannot override a real "24 ct" package size.
         */
        candidates.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }

            return b.amount - a.amount;
        });

        return candidates[0];
    }

    /******************************************************************
     * PACKAGE PARSER
     ******************************************************************/

    function parsePackageSize(text) {
        const t =
            cleanText(text).toLowerCase();

        const liquid =
            isLikelyLiquid(t);

        const countInfo =
            extractCountInfo(t);

        const unitPattern =
            '(fl\\s*oz|oz|lbs?|lb|kg|g|ml|liters?|litres?|l|gallons?|gal)';

        /*
         * 2 x 128 fl oz
         * 3 x 46 oz
         * 4 x 8 fl oz
         */
        let matches = [
            ...t.matchAll(
                new RegExp(
                    '\\b(\\d+(?:\\.\\d+)?)\\s*x\\s*' +
                    '(\\d+(?:\\.\\d+)?)\\s*' +
                    unitPattern +
                    '\\b',
                    'gi'
                )
            ),
        ];

        if (matches.length) {
            /*
             * Costco sometimes flattens unrelated metadata into text that
             * looks like multiplication, e.g. "160 x 200 fl oz" where
             * 160 is actually the number of loads and 200 fl oz is the
             * TOTAL bottle volume. Reject obviously implausible multipacks
             * and let the simpler size parsers below handle the real size.
             */
            const believableMatches =
                matches.filter(m => {
                    const count = Number(m[1]);
                    const eachSize = Number(m[2]);

                    return !(
                        count > 48 &&
                        eachSize >= 8
                    );
                });

            if (believableMatches.length) {
                const m =
                    believableMatches[
                        believableMatches.length - 1
                    ];

                const count =
                    Number(m[1]);

                const eachSize =
                    Number(m[2]);

                let unit =
                    canonicalUnit(m[3]);

                if (
                    unit === 'oz' &&
                    liquid
                ) {
                    unit = 'floz';
                }

                return {
                    amount:
                        count * eachSize,

                    unit,

                    source:
                        m[0],
                };
            }
        }

        /*
         * 52 oz, 2-count
         * 2 fl oz, 10-count
         */
        matches = [
            ...t.matchAll(
                new RegExp(
                    '\\b(\\d+(?:\\.\\d+)?)\\s*' +
                    unitPattern +
                    '\\s*[, ]*\\s*' +
                    '(\\d+)\\s*-?\\s*' +
                    '(?:count|ct|pack|pk)\\b',
                    'gi'
                )
            ),
        ];

        if (matches.length) {
            const m =
                matches[matches.length - 1];

            const eachSize =
                Number(m[1]);

            let unit =
                canonicalUnit(m[2]);

            const count =
                Number(m[3]);

            if (
                unit === 'oz' &&
                liquid
            ) {
                unit = 'floz';
            }

            return {
                amount:
                    eachSize * count,

                unit,

                source:
                    m[0],
            };
        }

        /*
         * 6-count 10.5 fl oz
         */
        matches = [
            ...t.matchAll(
                new RegExp(
                    '\\b(\\d+)\\s*-?\\s*' +
                    '(?:count|ct|pack|pk)\\b' +
                    '.{0,30}?\\b' +
                    '(\\d+(?:\\.\\d+)?)\\s*' +
                    unitPattern +
                    '\\b',
                    'gi'
                )
            ),
        ];

        if (matches.length) {
            const m =
                matches[matches.length - 1];

            const count =
                Number(m[1]);

            const eachSize =
                Number(m[2]);

            let unit =
                canonicalUnit(m[3]);

            if (
                unit === 'oz' &&
                liquid
            ) {
                unit = 'floz';
            }

            return {
                amount:
                    count * eachSize,

                unit,

                source:
                    m[0],
            };
        }

        const fluidSizes = [
            ...t.matchAll(
                /\b(\d+(?:\.\d+)?)\s*fl\s*oz\b/gi
            ),
        ];

        if (
            countInfo &&
            fluidSizes.length
        ) {
            const count =
                countInfo.amount;

            const size =
                Number(
                    fluidSizes[
                        fluidSizes.length - 1
                    ][1]
                );

            return {
                amount:
                    count * size,

                unit:
                    'floz',

                source:
                    `${countInfo.source} x ${size} fl oz`,
            };
        }

        if (fluidSizes.length) {
            const m =
                fluidSizes[
                    fluidSizes.length - 1
                ];

            return {
                amount:
                    Number(m[1]),

                unit:
                    'floz',

                source:
                    m[0],
            };
        }

        /*
         * Gallons
         */
        const gallons = [
            ...t.matchAll(
                /\b(\d+(?:\.\d+)?)\s*(gallons?|gal)\b/gi
            ),
        ];

        if (gallons.length) {
            const m =
                gallons[
                    gallons.length - 1
                ];

            return {
                amount:
                    Number(m[1]),

                unit:
                    'gal',

                source:
                    m[0],
            };
        }

        /*
         * Liters
         */
        const liters = [
            ...t.matchAll(
                /\b(\d+(?:\.\d+)?)\s*(liters?|litres?|l)\b/gi
            ),
        ];

        if (liters.length) {
            const m =
                liters[
                    liters.length - 1
                ];

            return {
                amount:
                    Number(m[1]),

                unit:
                    'l',

                source:
                    m[0],
            };
        }

        /*
         * Other simple measurements
         */
        const measurements = [
            ...t.matchAll(
                /\b(\d+(?:\.\d+)?)\s*(oz|lbs?|lb|kg|g|ml)\b/gi
            ),
        ];

        if (measurements.length) {
            const m =
                measurements[
                    measurements.length - 1
                ];

            let unit =
                canonicalUnit(m[2]);

            if (
                unit === 'oz' &&
                liquid
            ) {
                unit = 'floz';
            }

            return {
                amount:
                    Number(m[1]),

                unit,

                source:
                    m[0],
            };
        }

        if (countInfo) {
            return {
                amount:
                    countInfo.amount,

                unit:
                    'each',

                source:
                    countInfo.source,
            };
        }

        return null;
    }

    /******************************************************************
     * FIND COSTCO SEARCH RESULTS ONLY
     *
     * Costco splits search results across multiple lists and may insert
     * sponsored merchandising blocks between them. So do not assume the
     * first <ul> after the Results heading contains the whole result set.
     ******************************************************************/

    function findResultsHeading() {
        const candidates = [
            ...document.querySelectorAll(
                'h1, h2, h3, h4, [role="heading"], div, span'
            ),
        ];

        return (
            candidates.find(el => {
                const text =
                    cleanText(el.innerText);

                return (
                    /^results for\b/i.test(text) &&
                    text.length < 150
                );
            }) || null
        );
    }

    function findEndHeading() {
        const candidates = [
            ...document.querySelectorAll(
                'h1, h2, h3, h4, [role="heading"]'
            ),
        ];

        return (
            candidates.find(el => {
                const text =
                    cleanText(el.innerText);

                return /^(related items|you may also like|recommended)\b/i.test(
                    text
                );
            }) || null
        );
    }

    function isInsideSponsoredModule(card) {
        /*
         * Costco inserts larger sponsored merchandising modules directly
         * between normal search-result rows. Those modules contain ordinary
         * [data-item-card="true"] cards, so simply collecting every card
         * after the Results heading is not enough.
         *
         * Important: an individual search result can itself be marked
         * "Sponsored". That is still a real search result and should keep
         * its unit-price badge. We therefore look for a standalone
         * "Sponsored" label that belongs to an ancestor container but is
         * NOT inside any product card.
         */
        let ancestor = card.parentElement;

        for (let depth = 0; ancestor && depth < 8; depth += 1) {
            const cards = [
                ...ancestor.querySelectorAll(
                    '[data-item-card="true"]'
                ),
            ];

            /*
             * A sponsored merchandising block normally contains a handful
             * of product cards. Once the ancestor gets large enough to be a
             * substantial chunk of the page, stop treating it as a candidate
             * module so a Sponsored label elsewhere cannot poison the whole
             * results area.
             */
            if (cards.length > 1 && cards.length <= 10) {
                const hasModuleSponsoredLabel = [
                    ...ancestor.querySelectorAll('*'),
                ].some(el => {
                    if (
                        cleanText(el.innerText) !==
                        'Sponsored'
                    ) {
                        return false;
                    }

                    /*
                     * Sponsored text inside a product card belongs to that
                     * individual result, not to the surrounding module.
                     */
                    return !el.closest(
                        '[data-item-card="true"]'
                    );
                });

                if (hasModuleSponsoredLabel) {
                    return true;
                }
            }

            ancestor = ancestor.parentElement;
        }

        return false;
    }

    function getProductCards() {
        const resultsHeading =
            findResultsHeading();

        const endHeading =
            findEndHeading();

        const cards = [
            ...document.querySelectorAll(
                '[data-item-card="true"]'
            ),
        ];

        return cards.filter(card => {
            if (resultsHeading) {
                const position =
                    resultsHeading.compareDocumentPosition(
                        card
                    );

                if (
                    !(
                        position &
                        Node.DOCUMENT_POSITION_FOLLOWING
                    )
                ) {
                    return false;
                }
            }

            if (endHeading) {
                const position =
                    endHeading.compareDocumentPosition(
                        card
                    );

                if (
                    position &
                    Node.DOCUMENT_POSITION_FOLLOWING
                ) {
                    return false;
                }
            }

            if (isInsideSponsoredModule(card)) {
                return false;
            }

            return true;
        });
    }

    /******************************************************************
     * ANALYZE
     ******************************************************************/

    function analyzeCard(card) {
        /*
         * Must read LIVE innerText.
         *
         * Costco's multipack detail text disappeared when we previously
         * parsed innerText from a detached cloneNode().
         */
        const text =
            cleanText(card.innerText);

        const price =
            extractPrice(text);

        const packageInfo =
            parsePackageSize(text);

        if (
            !price ||
            !packageInfo ||
            !packageInfo.unit
        ) {
            return null;
        }

        const normalized =
            normalizeQuantity(
                packageInfo.amount,
                packageInfo.unit
            );

        if (
            !normalized ||
            !Number.isFinite(
                normalized.quantity
            ) ||
            normalized.quantity <= 0
        ) {
            return null;
        }

        const unitPrice =
            price /
            normalized.quantity;

        if (
            !Number.isFinite(unitPrice) ||
            unitPrice <= 0
        ) {
            return null;
        }

        return {
            card,

            source:
                packageInfo.source,

            dimension:
                normalized.dimension,

            displayUnit:
                normalized.displayUnit,

            unitPrice,
        };
    }

    /******************************************************************
     * DISPLAY
     ******************************************************************/

    function formatUnitPrice(product) {
        const value =
            product.unitPrice;

        if (
            product.dimension ===
            'volume'
        ) {
            return (
                `${(value * 100).toFixed(1)}¢` +
                ` / ${product.displayUnit}`
            );
        }

        if (value < 1) {
            return (
                `${(value * 100).toFixed(1)}¢` +
                ` / ${product.displayUnit}`
            );
        }

        return (
            `$${value.toFixed(2)}` +
            ` / ${product.displayUnit}`
        );
    }

    function findProductGroup(card) {
        return (
            card.querySelector(
                '[role="group"][aria-label="Product"]'
            ) ||
            card
        );
    }

    function addBadge(product) {
        let badge =
            product.card.querySelector(
                `.${BADGE_CLASS}`
            );

        if (!badge) {
            badge =
                document.createElement(
                    'div'
                );

            badge.className =
                BADGE_CLASS;

            findProductGroup(
                product.card
            ).appendChild(
                badge
            );
        }

        badge.textContent =
            formatUnitPrice(product);

        /*
         * Hover to see what package size was parsed.
         */
        badge.title =
            `Parsed: ${product.source}`;
    }

    /******************************************************************
     * CHEAPEST + SECOND CHEAPEST
     ******************************************************************/

    function highlightRankings(products) {
        document
            .querySelectorAll(
                `.${WINNER_CLASS}, .${SECOND_CLASS}`
            )
            .forEach(card => {
                card.classList.remove(
                    WINNER_CLASS,
                    SECOND_CLASS
                );
            });

        /*
         * Reset badge labels before ranking.
         */
        for (const product of products) {
            const badge =
                product.card.querySelector(
                    `.${BADGE_CLASS}`
                );

            if (badge) {
                badge.textContent =
                    formatUnitPrice(product);
            }
        }

        /*
         * Don't compare weight against volume against count.
         */
        const byDimension =
            new Map();

        for (const product of products) {
            if (
                !byDimension.has(
                    product.dimension
                )
            ) {
                byDimension.set(
                    product.dimension,
                    []
                );
            }

            byDimension
                .get(product.dimension)
                .push(product);
        }

        for (
            const group
            of byDimension.values()
        ) {
            if (!group.length) {
                continue;
            }

            const prices =
                group
                    .map(
                        product =>
                            product.unitPrice
                    )
                    .sort(
                        (a, b) =>
                            a - b
                    );

            const distinct = [];

            for (const price of prices) {
                const exists =
                    distinct.some(
                        existing =>
                            Math.abs(
                                existing -
                                price
                            ) < 0.000001
                    );

                if (!exists) {
                    distinct.push(price);
                }
            }

            const cheapest =
                distinct[0];

            const secondCheapest =
                distinct.length > 1
                    ? distinct[1]
                    : null;

            for (
                const product
                of group
            ) {
                const badge =
                    product.card.querySelector(
                        `.${BADGE_CLASS}`
                    );

                /*
                 * Cheapest
                 */
                if (
                    Math.abs(
                        product.unitPrice -
                        cheapest
                    ) < 0.000001
                ) {
                    product.card
                        .classList.add(
                            WINNER_CLASS
                        );

                    if (badge) {
                        badge.textContent =
                            `🏆 ${formatUnitPrice(product)}`;
                    }

                    continue;
                }

                /*
                 * Second cheapest
                 */
                if (
                    secondCheapest !== null &&
                    Math.abs(
                        product.unitPrice -
                        secondCheapest
                    ) < 0.000001
                ) {
                    product.card
                        .classList.add(
                            SECOND_CLASS
                        );

                    if (badge) {
                        badge.textContent =
                            `🥈 ${formatUnitPrice(product)}`;
                    }
                }
            }
        }
    }

    /******************************************************************
     * REMOVE OLD BADGES/HIGHLIGHTS FROM NON-RESULT CARDS
     ******************************************************************/

    function cleanOutsideResults() {
        const validCards =
            new Set(getProductCards());

        document
            .querySelectorAll(
                `.${BADGE_CLASS}`
            )
            .forEach(badge => {
                const card =
                    badge.closest(
                        '[data-item-card="true"]'
                    );

                if (
                    !card ||
                    !validCards.has(card)
                ) {
                    badge.remove();
                }
            });

        document
            .querySelectorAll(
                `.${WINNER_CLASS}, .${SECOND_CLASS}`
            )
            .forEach(card => {
                if (!validCards.has(card)) {
                    card.classList.remove(
                        WINNER_CLASS,
                        SECOND_CLASS
                    );
                }
            });
    }

    /******************************************************************
     * REFRESH
     ******************************************************************/

    function refresh() {
        cleanOutsideResults();

        const cards =
            getProductCards();

        const products = [];

        for (const card of cards) {
            const product =
                analyzeCard(card);

            if (!product) {
                continue;
            }

            addBadge(product);
            products.push(product);
        }

        highlightRankings(products);
    }

    /******************************************************************
     * DYNAMIC PAGE WATCHER
     ******************************************************************/

    let refreshTimer;

    function scheduleRefresh() {
        clearTimeout(refreshTimer);

        refreshTimer =
            setTimeout(
                refresh,
                300
            );
    }

    const observer =
        new MutationObserver(
            mutations => {
                const externalChange =
                    mutations.some(
                        mutation => {
                            if (
                                mutation.target instanceof Element &&
                                mutation.target.closest(
                                    `.${BADGE_CLASS}`
                                )
                            ) {
                                return false;
                            }

                            return true;
                        }
                    );

                if (externalChange) {
                    scheduleRefresh();
                }
            }
        );

    observer.observe(
        document.documentElement,
        {
            childList: true,
            subtree: true,
        }
    );

    /******************************************************************
     * INITIAL RUNS
     ******************************************************************/

    refresh();
    setTimeout(refresh, 750);
    setTimeout(refresh, 1500);
    setTimeout(refresh, 3000);

})();