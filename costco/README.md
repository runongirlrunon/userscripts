# Costco Unit Price Comparator

A userscript for Costco.com and Costco Same-Day that makes it easier to compare products by actual unit cost.

## What it does

The script:

- detects package quantities and sizes
- normalizes weight to price per pound
- normalizes liquid volume to price per fluid ounce
- calculates price per item for count-based products
- highlights the cheapest result
- highlights the second-cheapest result
- ranks weight, volume, and count products independently

This means a search containing liquid detergent, powder detergent, and detergent pods can show a separate winner for each meaningful form of comparison.

## Supported sites

- `costco.com`
- `sameday.costco.com`

## Installation

[Install the userscript](https://raw.githubusercontent.com/runongirlrunon/userscripts/main/costco/costco-unit-price.user.js)

Requires a userscript manager such as Tampermonkey, Violentmonkey, or Userscripts for Safari.

## Caveats

Costco product descriptions are inconsistent, so package-size parsing is necessarily heuristic.

If Costco changes its site markup, portions of the script may stop working.