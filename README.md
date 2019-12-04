![](https://grantwinney.com/content/images/2017/10/Hide-Comments-Everywhere.jpg)

# Hide Comments Everywhere

Fed up with the vitriol left in comments, many sites are dumping their comment systems completely. It's just too costly to monitor them, so they tend to devolve into a cess pool. Personally, I just want the content most of the time. _YouTube anyone?_

To help with my own sanity _(and maybe yours?),_ I wrote an extension that hides many comment systems - identifying them is somewhat predictable. It's available for [Chrome](https://chrome.google.com/webstore/detail/hide-comments/bmhkdngdngchlneelllmdennfpmepbnc) and [Firefox](https://addons.mozilla.org/en-US/firefox/addon/hide-comments-everywhere/). And if you're interested, I wrote about [what I learned](https://grantwinney.com/a-new-chrome-extension-for-hiding-comments/) too.

## What does this hide?

A lot, including but not limited to:

* Facebook comment plugin
* Disqus
* Livefyre
* WordPress
* Reddit
* YouTube
* Facebook
* Twitter
* Any other comment system where someone happened to assign the ID or class "comments" or "respond". Hopefully this doesn't hide anything unexpected, like some site that assigned the "comments" ID to the main content of their posts... please [let me know](https://github.com/grantwinney/chrome-extension-block-comments/issues/new) if it does.

## How does it work?

It's triggered when the page is first loaded, or the URL changes (you click a link), or the comments are injected into the page (Disqus and YouTube delay loading comments), or when you open the popup (via the extension icon in the toolbar) and choose to toggle a page or whitelist (allow) a new URL.

The extension checks whether it should enable/disable comments, and then adds a display style of "none" or removes the display style (resetting it to whatever the rest of the CSS on the page originally set it to). It determines this by hiding anything defined in the list of [included sites](https://github.com/grantwinney/hide-comments-in-chrome-sites/blob/master/sites.json), then showing anything listed in your list of *excluded* sites.

The allowed (white-listed) sites are ones you define on the "options" page. Specify a list of URLs as [regex patterns](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions), one per line, that should display comments all the time (the extension is effectively disabled for those URLs). Your list of allowed sites uses synchronized storage, so it should be available on any machine you've installed the extension on.

You can quickly add the URL of the current page by opening the extension popup (by clicking the icon in the toolbar), and then selecting a URL (or entering a custom one) and pressing the "Allow" button. Note that, unlike the "options" page, these URLs are entered normally and not as regular expressions.

_Note: There's also a hard-coded whitelist, although I don't anticipate adding very many sites to it. One I added, for example, is GitHub. It's unlikely anyone would want to hide comments on GitHub issues, and since they applied a `comment` class it gets scooped up by the "catch-all" pattern and basically breaks the site._

Click on the icon in the toolbar and press the large "toggle" button to temporarily toggle enabling/disabling the extension for a single tab, in order to hide or display comments. Click it again to toggle it back. Reloading the page will cause it to follow the same rules as above, looking first at blocked sites and then your personal allowed sites.

### Permissions

You'll be notified that it can "read and change all your data on the websites you visit" because that's how it works - it hides certain comment-related elements on the page so you don't see them.

It also uses storage to save its state, but it shouldn't prompt you for that.

## I need your help!

If you notice a commenting system that should be added (blocked), [open an issue](https://github.com/grantwinney/hide-comments-in-chrome-sites/issues/new) for that. Include the website where you noticed it, or [create a pull request](https://github.com/grantwinney/hide-comments-in-chrome-sites/pulls) with the necessary changes to the "[sites.json](https://github.com/grantwinney/hide-comments-in-chrome-sites/blob/master/sites.json)" file, and I'll follow-up as time permits.

Thanks!

## Need help? Have a request?

[Open a new issue](https://github.com/grantwinney/hide-comments-in-chrome/issues/new) with as many details as possible. The more you let me know upfront, the less I'll have to ask later!
