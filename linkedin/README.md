# LinkedIn Compact Messaging

A small CSS override that makes LinkedIn Messaging use the available browser width and cuts down the excessive spacing in the interface.

## What it changes

- Expands the Messaging layout to use the full browser width
- Reduces empty space around the conversation pane
- Compacts message groups and individual messages
- Shrinks the conversation header
- Shrinks the message composer
- Compacts the conversation list
- Reduces several of LinkedIn's generic spacing utility classes inside Messaging

The goal is simple: **show more of the actual conversation and less empty UI.**

## Files

- `linkedin-compact-messaging.css` — the stylesheet

## Installation

This is plain CSS rather than a JavaScript userscript. Add the contents of `linkedin-compact-messaging.css` using a browser extension or tool that can inject custom CSS on LinkedIn.

Apply it to:

```text
https://www.linkedin.com/messaging/*
```

If your extension supports domain-level rules instead, applying it to `linkedin.com` is fine; the selectors are scoped primarily to LinkedIn's Messaging interface.

## Updating

LinkedIn changes its markup frequently. If part of the layout stops being compact, one or more LinkedIn CSS class names probably changed and the affected selector will need to be updated.

## Repository

Part of [runongirlrunon/userscripts](https://github.com/runongirlrunon/userscripts).
