# Hide Comments Everywhere

Fed up with the vitriol left in comments, many sites are dumping their comment systems completely. It's just too costly to monitor them, so they tend to devolve into a cess pool. Personally, I just want the content most of the time. _YouTube anyone?_

To help with my own sanity _(and maybe yours?),_ I wrote an extension that hides many comment systems, since identifying them is fairly predictable. It's available for [Chrome](https://chrome.google.com/webstore/detail/hide-comments/bmhkdngdngchlneelllmdennfpmepbnc) and [Firefox](https://addons.mozilla.org/en-US/firefox/addon/hide-comments-everywhere/), and you can [read more](https://grantwinney.com/hide-comments-everywhere/) about it here.

## What sites does this work on?

A lot, including but not limited to:

* YouTube
* Twitter
* Reddit
* Disqus
* Livefyre
* WordPress
* Loads of other comment systems and individual sites.

If this is hiding anything unexpected, like some site that assigned the "comments" ID to the main content of their posts, then [let me know](https://github.com/grantwinney/hide-comments-everywhere/issues/new) so I can make adjustments. Better yet, [open a PR](https://github.com/grantwinney/hide-comments-in-chrome/pulls) with the change that's needed. Thanks!

### What doesn't it work with?

Some sites, like Facebook and Instagram, use random element identifiers and class names that change often. It's difficult to manage them and takes a lot of time, so I've thrown in the towel on them.

You might want to check out [Fluff Busting Purity](https://chrome.google.com/webstore/detail/fluff-busting-purity/nmkinhboiljjkhaknpaeaicmdjhagpep) for Facebook or [Antigram](https://chrome.google.com/webstore/detail/antigram-explore-blocker/igbheapdmolhhmmklmkfjjjncmhihfjh) for Instagram. I'm not sure if either blocks comments, but at least you can cut out a lot of time-sucking distractions.

## How does it work?

This addon checks whether it should allow or block comments for a website, based on a combination of [sites in a list](https://github.com/grantwinney/hide-comments-everywhere/blob/master/sites/sites.json), sites you've chosen to allow comments on, as well as a personal whitelist (always allow comments) and blacklist (always block comments) that you can define on the Options page.

Click on the icon in the toolbar and press the "toggle" button to toggle enabling/disabling 
(temporarily, if you choose) the comments on a single domain.

Your personal lists and other settings use synchronized storage, so they should be available on any machine you've installed the extension on and have logged into the same account with.


## Permissions

You'll be notified that it can "read and change all your data on the websites you visit" because that's how it works - it hides certain comment-related elements on the page so you don't see them.

It also uses storage to save its state, but it shouldn't prompt you for that.

## I need your help!

If you notice a website or commenting system that should be added to the list (so that it can be blocked), feel free to [open an issue](https://github.com/grantwinney/hide-comments-everywhere/issues/new) for it. Include the URL where you noticed it, and any other details you feel would be helpful.


Better yet, if you know which CSS elements (selectors) need to be blocked, [create a pull request](https://github.com/grantwinney/hide-comments-everywhere/pulls) with the necessary changes to the "[sites.json](https://github.com/grantwinney/hide-comments-everywhere/blob/master/sites/sites.json)" file, and I'll get the change merged in.

Thanks!

## Need help? Have a request?

[Open a new issue](https://github.com/grantwinney/hide-comments-everywhere/issues/new) with as many details as possible. The more you let me know upfront, the less I'll have to ask later!
