# userscripts

A small collection of browser tweaks and userscripts for making websites less annoying and more useful.

Most of these started as one-off fixes for sites I use regularly and turned into scripts worth keeping around.

## Scripts

### Costco

**Unit Price Comparator**

Adds normalized unit pricing to Costco product listings so products are easier to compare across different package sizes and formats.

Highlights useful category winners such as:

* Cheapest overall
* Cheapest liquid
* Cheapest powder
* Cheapest pack, where applicable

### LinkedIn

**Compact Messaging**

CSS overrides for LinkedIn Messaging that reduce wasted space and make better use of the browser window.

Changes include:

* Full-width messaging layout
* Less padding and vertical whitespace
* More compact conversation list
* Smaller message composer
* More messages visible on screen at once

### Instacart

**Unit Price Comparator**

Adds normalized unit pricing to Instacart listings to make comparing products by actual quantity easier.

This one is still a work in progress.

## Installation

JavaScript files ending in `.user.js` are intended for a userscript manager such as:

* Userscripts for Safari
* Tampermonkey
* Violentmonkey

CSS-only tweaks can be installed using a browser extension or other tool that supports custom per-site CSS.

See the README inside each script directory for site-specific installation instructions and notes.

## Compatibility

These scripts modify sites I do not control.

Costco, LinkedIn, Instacart, and other sites can change their markup at any time, which may break selectors or behavior. If something stops working, it probably needs an update rather than an exorcism.

## Contributing

This is primarily a personal collection, but bug reports and useful fixes are welcome.

If reporting a broken script, including the affected page, browser, and a screenshot or relevant DOM snippet will make debugging much easier.

## License

Licensed under the GNU General Public License v3.0.

See [LICENSE](LICENSE) for details.
