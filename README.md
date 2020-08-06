![](https://grantwinney.com/content/images/2017/10/Hide-Comments-Everywhere.jpg)

# Hide Comments Everywhere

Fed up with the vitriol left in comments, many sites are dumping their comment systems completely. It's just too costly to monitor them, so they tend to devolve into a cess pool. Personally, I just want the content most of the time. _YouTube anyone?_

To help with my own sanity _(and maybe yours?),_ I wrote an extension that hides many comment systems - identifying them is somewhat predictable. It's available for [Chrome](https://chrome.google.com/webstore/detail/hide-comments/bmhkdngdngchlneelllmdennfpmepbnc) and [Firefox](https://addons.mozilla.org/en-US/firefox/addon/hide-comments-everywhere/), or [you can read more about it here](https://grantwinney.com/hide-comments-everywhere/) too.

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
* Any other comment system where someone happened to assign the ID or class "comments" or "respond". Hopefully this doesn't hide anything unexpected, like some site that assigned the "comments" ID to the main content of their posts... please [let me know](https://github.com/grantwinney/hide-comments-everywhere/issues/new) if it does.

## How does it work?

This extension checks whether comments should be disabled for the current URL, and is triggered when the page is first loaded or the URL changes (i.e. you click a link).

1. First, it checks the [sites.json](https://github.com/grantwinney/hide-comments-everywhere/blob/master/sites/sites.json) file for known DOM elements that contain comments on the current URL.
2. Then it sees if you've chosen to exclude the current URL (the whitelist on the Options page under Filters).
3. It injects a CSS stylesheet into the page that sets display style to "none" for comments (and anything related, like comment counters).

The allowed (whitelisted) sites are ones you define on the Options page. Specify a list of URLs as [regex patterns](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions), one per line, that should display comments all the time (the extension is effectively disabled for those URLs). Your list of allowed sites uses synchronized storage, so it should be available on any machine you've installed the extension on and are logged into.

- You can quickly add the URL of the current page by opening the extension popup (click the icon in the toolbar), and then selecting a URL (or entering a custom one) and pressing the "Allow" button. Note that, unlike the "options" page, these URLs are entered normally and not as regular expressions.
- **Note:** There's also a hard-coded whitelist, although I don't anticipate adding very many sites to it. One I added is GitHub, for which it's unlikely anyone would want to hide comments. There are issues with their DOM that cause legit sections of the site to be hidden.

Click on the icon in the toolbar and press the large "toggle" button to temporarily toggle enabling/disabling the extension for a single tab, in order to hide or display comments. Click it again to toggle it back. Reloading the page will cause it to follow the same rules as above, looking first at blocked sites and then your personal allowed sites.

## Permissions

You'll be notified that it can "read and change all your data on the websites you visit" because that's how it works - it hides certain comment-related elements on the page so you don't see them.

It also uses storage to save its state, but it shouldn't prompt you for that.

## I need your help!

If you notice a commenting system that should be added (blocked), [open an issue](https://github.com/grantwinney/hide-comments-everywhere/issues/new) for that. Include the website where you noticed it, or [create a pull request](https://github.com/grantwinney/hide-comments-everywhere/pulls) with the necessary changes to the "[sites.json](https://github.com/grantwinney/hide-comments-everywhere/blob/master/sites/sites.json)" file, and I'll follow-up as time permits.

Thanks!

## Need help? Have a request?

[Open a new issue](https://github.com/grantwinney/hide-comments-everywhere/issues/new) with as many details as possible. The more you let me know upfront, the less I'll have to ask later!
