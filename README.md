# Hide Comments

I thought about doing this awhile back, when I was reading major news outlets and was getting fed up with how full of vitriol some commenters are. I just wanted the content. YouTube can be even worse.

Ironically, now that I got around to making this, many sites are dumping their comment systems. Nothing on FoxNews or MSN. [NPR](http://www.npr.org/sections/ombudsman/2016/08/17/489516952/npr-website-to-get-rid-of-comments) got rid of theirs too. It's just too costly to monitor the flood of comments on these huge sites, so they tend to devolve into a cess pool.

## What's this block/hide?

Well, here it is anyway - a Chrome extension to hide a few popular commenting systems.

* Facebook comment plugin
* Disqus
* Automattic o2
* Livefyre
* WordPress

**What else?**

* Twitch chat window (because I find it annoying - ymmv)
* YouTube comments (they're the worst)
* Any other comment system where someone happened to assign the ID "comments" or "respond". Hopefully this doesn't hide anything unexpected, like some site that assigned the "comments" ID to the main content of their posts... [let me know](https://github.com/grantwinney/chrome-extension-block-comments/issues/new) if it does!

## How's it work?

It's all CSS right now. For those who know how CSS works, I've simply applied "display: none !important" to certain elements on the page.

I intend to add one other feature where you could maintain a list of sites for which comments *should **not*** be hidden.

## Need help? Have a request?

[Open a new issue](https://github.com/grantwinney/chrome-extension-block-comments/issues/new) with as many details as possible. The more you let me know upfront, the less I'll have to ask later!

If you notice a major commenting system that should be added, [open an issue](https://github.com/grantwinney/chrome-extension-block-comments/issues/new) for that too. Include the website where you noticed it, and I'll follow-up as time permits.
