# Nuxt testing, which turned into an AI field trip

This started as a test for the 2026 EWU CSCD 379 class using the latest versions of Nuxt and Vuetify. 

Here are the initial steps
1. Created the project using the Nuxt command-line tools.
2. Added Vuetify manually to the project.
3. Removed the base page and created a little demo with buttons to increment a number.
Everything worked great.

## Then Claud Opus 4.5 Happened
So I started messing around to see if Opus 4.5 could build Wordle. It did a good, albeit simple, game to start, and even created new tabs and routes for it. However, after another four prompts, I had a game with a keyboard displaying the current results. 

Then I asked for Minesweeper, and my son wanted to do a camping-themed version. AI named it Bear Patrol. Not my name. He had good ideas, like clicking on a number should reveal the other cells if that number of flags are already placed. And clicking on a number when there are only that many unrevealed spaces adjacent should flag them. 

But it had built it all in the .vue file. So I asked for factoring into classes, which it did, once for Wordle and once for Minesweeper.

Then I wanted to build something that didn't exist. So I created a hot/cold game where there is a secret location and the rest of the board is a colored heat map. It struggled a bit more with the animations on this, and I tried Sonnet 4.5 on it, and it was generally worse, taking three prompts rather than one to get things fixed. Even at 3x the cost of tokens, Opus seemed worth it. However, I am happy with the results. It even built this one with classes, saying that it saw the pattern and used it. 

I went on to build a cavern game and a physics simulator (using a library). The cave one required a few more prompts, like seven, and the physics one basically worked on the first try. I reviewed the physics code and it actually looks really nice. 

## What does this mean?

It means I don't know what to teach in like 5 days. I have learned a few things:

1. Opus 4.5 is great at writing code. I haven't encountered anything like this and need to try more complex use cases.
2. Knowing what you want is the most important thing.
3. AI still needs us to break the problem down a bit. Just not as much as it did before.
4. Knowing how to structure software is very important. Probably the most important thing. 
5. This will and should change how we think about getting computers to do things we want. We are going to have to rethink how we approach development.

## What is the human impact?

People need software for different reasons. People write software for different reasons. These motivations will impact how they view AI - as a threat or an accelerator. Is it making my life easier, or is it stealing something I love?

### Developers

1. For people like me who code to build things that make people's lives better, AI is something that accelerates this process.
2. For people who love designing applications, some of the fun of the code is gone, but they are still at the architecture helm with an army of minions at the ready. (Yes, the yellow minions are a good analogy.)
3. For those who love writing code, loops, conditions, assignments, etc., this will look like AI taking away what they love. 

### Consumers

Over the last 20 years, we have seen a move from custom systems to configurable off-the-shelf applications. The main driver was cost. Custom software is expensive to build and costly to maintain. The return on investment has been well known for the last 10 years. As off-the-shelf apps become more capable and flexible, more organizations are adopting them. However, there is always tension: many users prefer their old custom system to the new configurable commercial software. The old system felt like it embodied the organization's ethos and what I like to call the 'secret sauce' of the business. However, the IT budgets were saving enough to tolerate some user dissatisfaction.

## Custom Software Renaissance

What does AI do? It changes the return-on-investment calculation for custom software solutions. AI is making custom solutions viable for a larger and larger segment of the market. Now, companies are not going to be forced to change their business around a piece of software and can instead create software around their business. Unlike the early 2000s, this software will look different in key ways. 

1. Software is not going to be built from the ground up, bare metal typically. It will be built with infrastructure, libraries, frameworks, and patterns.
2. The cloud has grown exponentially since, and the services available have matured from VMs and simple services to complex offerings providing core business features.
3. AI loves patterns and delivers excellent results when it has a model to follow and tools to utilize.

## Where are the growing edges?

It is still (as of 1/1/2026) the wild west of AI. Gunslingers abound. We are seeing the markers of civilization. The Old West analogy is a good one. We have a saloon and a post office in this here town, but not much more, yet. However, the settlers are arriving daily by wagonload. Some are hoping to get a sheriff, but it isn't looking promising.

1. Organizational competence takes time to build. Producing consistent results accessible to a broad group of people. It will be built faster than ever before. There is money to be made, or at least we think there is. We saw the adoption curves for the internet and social media, and this is moving faster. 
2. We are still working with human-based tooling. AI is building on human tooling. The fundamental languages and structures are optimized for human consumption. This will change. AI languages and tooling are coming. Not sure what they will look like, but they will reduce some of the friction AI faces when bending around human constructs.
3. People take time to adapt to tools. Early adopting is going to be a double-edged sword. On one hand, there is knowledge and experience. However, the barriers to entry are dropping, and spending time learning tooling that may be supplanted by something better and simpler may only lead to complexity bias (complex is better) that hurts our ability to adapt.  

## Setup

Make sure to install dependencies:

```bash
# npm
npm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build
```

Locally preview production build:

```bash
# npm
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
