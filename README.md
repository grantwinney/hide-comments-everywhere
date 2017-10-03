# Hide Comments Everywhere

I thought about doing this awhile back, when I was reading major news outlets and was getting fed up with how full of vitriol some commenters are. Many sites are realizing this and dumping their comment systems completely. It's just too costly to monitor the flood of comments on these huge sites, so they tend to devolve into a cess pool. Personally, I just want the content most of the time. YouTube anyone?

If you're interested, I wrote about what I've learned (links below). If you'd just like to try it out, [it's available in the chrome web store](https://chrome.google.com/webstore/detail/hide-comments/bmhkdngdngchlneelllmdennfpmepbnc).

* [A new Chrome extension for hiding comments (and what I learned)](https://grantwinney.com/a-new-chrome-extension-for-hiding-comments/)

## What does this hide?

Here it is... the anti-social social plugin. A Chrome extension to hide commenting systems, including (but in no way limited to):

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

It's triggered when the page is first loaded, or the URL changes (you click a link), or the comments are injected into the page (Disqus and YouTube delay loading comments), or when you click the extension icon in the toolbar, running some JavaScript.

The script checks whether it should enable/disable comments, and then adds a display style of "none" or removes said display style (resetting it to whatever the rest of the CSS on the page originally set it to). It determines this by hiding anything defined in the list of [included sites](https://raw.githubusercontent.com/grantwinney/hide-comments-in-chrome-sites/master/sites.json), then showing anything listed in your list of *excluded* sites.

The excluded sites are ones you define on the "options" page. Specify a list of URLs as [regex patterns](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions), one per line, that should display comments all the time (the extension is effectively disabled for those URLs). Your list of excluded sites uses synchronized storage, so it should be available on any machine you've installed the extension on.

Click on the icon in the toolbar to temporarily toggle enabling/disabling the extension for a single tab, in order to hide or display contents. Click it again to toggle it back. Reloading the page will cause it to follow the same rules above, looking first at included sites and then excluded sites.

### Permissions

It uses storage to save its state, but it shouldn't prompt you for that.

## I need your help!

If you notice a commenting system that should be added, [open an issue](https://github.com/grantwinney/hide-comments-in-chrome-sites/issues/new) for that. Include the website where you noticed it, or [create a pull request](https://github.com/grantwinney/hide-comments-in-chrome-sites/pulls) with the necessary changes to the "[sites.json](https://github.com/grantwinney/hide-comments-in-chrome-sites/blob/master/sites.json)" file, and I'll follow-up as time permits.

Thanks!

## Need help? Have a request?

[Open a new issue](https://github.com/grantwinney/hide-comments-in-chrome/issues/new) with as many details as possible. The more you let me know upfront, the less I'll have to ask later!
