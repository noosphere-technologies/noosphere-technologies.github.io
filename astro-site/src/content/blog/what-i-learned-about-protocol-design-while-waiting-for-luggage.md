---
title: 'What I Learned About Protocol Design While Waiting for Luggage in Vegas'
description: 'How the Model Context Protocol is falling into the same complexity trap as SOAP, and why SSH is the simple solution we already have'
pubDate: 'Apr 22 2025'
author: 'Jeff Hantin'
---

I flew into Las Vegas on Thursday and was greeted by the sight of a circus. No, not Circus Circus, that venerable house of playful attractions on the Strip: an advertising circus. The baggage claim at the airport had been saturated with a single message: "Zero Trust + AI". It was everywhere you could possibly look from a carousel, occupying every ad space, identical save for rearrangement to fit spaces with different aspect ratios.

It was such madness, in fact, that I couldn't even remember the name of the vendor an hour after leaving the airport! Only that it was, in fact, a single vendor, one that apparently had the marketing budget to buy out all the advertising space in the entire baggage claim area.

As part of my work with Noosphere Technologies  I've been following the development of the Model Context Protocol for building agentic AI applications lately, and realized something when I saw all that visual spam: there's getting to be so much complexity in and around MCP that developers are struggling under it and vendors are circling to offer tools to 'help' cope with it.

Don't get me wrong: every decision made up to this point in the evolution of MCP, taken in isolation, was entirely rational.

LLM APIs started simple: POST JSON, receive JSON. Then, for a better interactive experience, the option was added to receive a live server-sent event (SSE) stream as LLM output was generated. This cemented the mental model: AI connectivity was widely understood to mean JSON-RPC + SSE over HTTP.

Then, Anthropic rolled out MCP. It started as a straightforward local JSON-RPC over pipes. More complex use cases required callbacks, so either the agentic application or tools provider could initiate a message, which was trivial with pipes. To turn this into a networked protocol, Anthropic naturally turned to the same networking tools used to interface with LLMs: JSON-RPC + SSE over HTTP. For this to work, though, required leaving a SSE connection open essentially permanently to receive messages from a MCP server, and using another connection to POST messages to that MCP server.

But we're not done.

## The Streamable HTTP tangle - when protocols go wrong

Most recently, the MCP network transport was revised into Streamable HTTP, which is a fiendishly intricate hybrid protocol. It completely abandons REST principles - one endpoint handles GET, POST, and DELETE(!), and may return an empty 202 Accepted, emit a JSON response, or initiate a SSE stream, all depending on the server's whims. The server may choose a flow that can be as simple as JSON-RPC request-response or as complicated as establishing a two-way stateful message queuing dialogue using multiple connections and message correlation IDs, and now session IDs have been added too. Meanwhile, besides the multiple different variations which the server can choose from, a backward-compatible client has to try the new protocol, then try the old protocol if the new one fails, sniffing responses and trying to figure out exactly what version it's talking to! The client having to fumble through while the server does what it feels like is a poor substitute for proper negotiation... and clearly the protocol should know about negotiation, if you look at the spec for the payloads.

Now, in all fairness, Streamable HTTP does add one feature that isn't just another alternative way to accomplish the same thing: resumable event streams, which allow recovering messages that might have been lost due to a dropped connection. They were trying to solve a genuine problem that does occur in practice. That's an edge case, though. It doesn't address other ways a message can be dropped, like between the MCP server and an API endpoint it's accessing, and when a connection drop happens even the MCP client can't tell whether a request never made it to the server or the response fell on the floor. Streamable HTTP is an awful lot of architectural overhead to swallow just to plug one hole when there are plenty more.

So we get all this unnecessary web protocol intricacy, and I only expect it to get worse in the future unless we tackle a serious problem...

## The vendor feeding frenzy around MCP complexity

I've seen this movie before. It played out with SOAP and WS-* in the 2000s. Once the community - and tech vendors in particular - get involved, there are perverse economic incentives to ensure the protocol stays convoluted and only gets even harder to deal with: an entire cottage industry of new vendors and an army of existing ones find it in their best interest to not only leave the labyrinth there but keep building more walls, dead-end corridors, and confusing passages, so they can sell sanity-preserving services to developers and risk-management services to executives, leveraging the very chaos they've encouraged to get themselves a piece of the pie.

And so, behold the spectacle! Get your tickets from the authentication and authorization companies hawking OAuth, SAML, and OpenID integration! Watch the API gateway and management firms asking if you've thought of rate limiting, analytics, and monetization! Marvel at cloud providers offering managed hosting with automatic scaling! Gasp in fright at security specialists trying to scare CISOs into mandating the use of their zero-trust API proxies! If you miss anything, don't worry: the occasional observability company is there, injecting their bit so you can trace MCP workflows through the tangle the other players have created!

It's a feeding frenzy. And there's a name for that kind of behavior: process capture, lock-in, and rent-seeking. Worse yet, these kinds of companies are extracting enough money to do things like saturate airports with advertising to help them extract even more.

Outside of that, there's really no reason for that kind of intricacy in MCP in the first place. There's a really simple way to remote MCP.

## What Git teaches us about MCP's real problem

Agentic applications are certainly not the first software to need secure, strongly authenticated, bidirectional, interactive communication flows. Developers would have to be living under a rock at this point not to know about Git, which is probably the most prominent of such software packages. Git solved this problem years ago by simply not using Web protocols, and instead using something that fits the use case much better: SSH.

To developers who have been thoroughly steeped in the web API world, this may seem wrong. HTTP is the only thing that goes through corporate firewalls, right? SSH is for development and operations, right? Right?... Except it's already solved the problems MCP users are just discovering they need solved.

SSH gets you a connection that's more secure and flexible in many ways than HTTPS. Mutual cryptographic authentication is the default, not a rarely used option. Its basic mode of operation is to forward stdio pipes both ways, to and from a remote application, throughout the life of a connection; a single SSH connection can even host multiple concurrent two-way channels. The tools are mature. They're deployed on large sites with large numbers of users - look at GitHub.

MCP stdio + SSH is straightforward to use, too…

## Boulder City style: two lines of config vs. an enterprise vendor ecosystem

I originally got into the guts of configuring MCP servers at Noosphere Technologies, and I must say, MCP over stdio is actually pretty simple. Setting up MCP stdio + SSH isn't some configuration nightmare that needs enterprisey middleware, either. In fact, neither the MCP client nor server needs anything but the essential MCP stdio transport, and SSH handles all the remoting - no messy Streaming HTTP! It's as simple as opening up your agent's MCP configuration, say claude_desktop_config.json, and editing a couple lines.

Local filesystem access with MCP looks like this:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/agent/working-dir"]
    }
  }
}
```

Secure remote filesystem access with MCP looks like this:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "ssh",
      "args": ["remote-server", "npx", "-y", "@modelcontextprotocol/server-filesystem", "/home/agent/working-dir"]
    }
  }
}
```

Two simple changes and you're done. It just works. Claude Desktop can securely access files on a remote server, with a mutually authenticated interactive connection, and there's not a lick of unnecessary complication in sight.

The parade of companies putting on a Vegas Strip-style messaging blitz in the name of getting a piece of the value from what ultimately is just a pipe between two programs is exactly that: an elaborate act that's all about separating you from your money. Think about it: what value they add wouldn't have been needed if they hadn't manufactured the confusion in the first place!

Instead, let's do things the Boulder City way. 20 miles away from Las Vegas, instead of wasting everyone's time and energy putting on a show, is a place where useful work gets done - a place that builds actual infrastructure and tools, from renewable power plants to space-rated ballpoint pens. MCP over stdio with SSH for remoting is the Boulder City approach applied to building agentic applications: it isn't flashy, but it's solid and gets the job done so we can get on with building things that actually produce value.