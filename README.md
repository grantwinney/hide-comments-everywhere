# Hide Comments

I thought about doing this awhile back, when I was reading major news outlets and was getting fed up with how full of vitriol some commenters are. I just wanted the content. YouTube can be even worse.

Ironically, now that I got around to making this, many sites are dumping their comment systems. It's just too costly to monitor the flood of comments on these huge sites, so they tend to devolve into a cess pool.

## What's this block/hide?

Well, here it is anyway - a Chrome extension to hide some of the popular commenting systems.

* Facebook comment plugin
* Disqus
* Automattic o2
* Livefyre
* WordPress

**What else?**

* YouTube comments (they're the worst)
* Any other comment system where someone happened to assign the ID "comments" or "respond". Hopefully this doesn't hide anything unexpected, like some site that assigned the "comments" ID to the main content of their posts... [let me know](https://github.com/grantwinney/chrome-extension-block-comments/issues/new) if it does.

## How's it work?

Either when the page is first loaded, or when the comments are inserted into the page (Disqus and YouTube delay loading comments), or when you click the extension icon in the toolbar, it runs a bit of JavaScript. All the script does is check whether it should enable/disable comments, and then sets the display style to "none" or "initial".

### Permissions

It will notify you that it needs access to all your tabs / pages. Since I have no idea if the site you're viewing has comments on it ahead of time, or will load them at some future time (like Disqus), I just apply a few CSS styles to every page in order to hide anything that might be there.

It also uses storage to save its state, but it shouldn't prompt you for that.

### Future

I intend to add one other feature where you can maintain a list of sites for which comments *should **not*** be hidden, even when the extension is enabled for all other sites.

## Need help? Have a request?

[Open a new issue](https://github.com/grantwinney/chrome-extension-block-comments/issues/new) with as many details as possible. The more you let me know upfront, the less I'll have to ask later!

If you notice a major commenting system that should be added, [open an issue](https://github.com/grantwinney/chrome-extension-block-comments/issues/new) for that too. Include the website where you noticed it, and I'll follow-up as time permits.
