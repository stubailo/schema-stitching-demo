# Schema stitching demo

Schema stitching is the idea of automatically combining two or more GraphQL schemas into one. It can be used to modularize a single GraphQL codebase, integrate with other APIs, or just combine two public APIs into one. This is going to be one of the main features of the 2.0 release of [graphql-tools](https://github.com/apollographql/graphql-tools/pull/382), a library for creating and manipulating GraphQL schemas in JavaScript.

Huge thanks to [Mikhail Novikov](https://github.com/freiksenet) for his awesome design and implementation on this feature, and please contribute to the PR if you find it exciting!

### Running the example

Just run it like any other npm project:

```
npm install
npm start
```

Then, open [localhost:3000/graphiql](http://localhost:3000/graphiql) in your web browser, and hit run on the query!

Oh and also grab a ticket for [GraphQL Summit 2017](https://summit.graphql.com/), a 2-day GraphQL conference in San Francisco on October 25-26.

### What does this do?

For all of the details, read the upcoming blog post (TODO).

In short, this combines two GraphQL APIs:

1. The [public GraphQL API](https://developers.universe.com/page/graphql-explorer) of Universe, the ticketing system we're using for GraphQL Summit
2. The [Dark Sky weather API wrapped in GraphQL on Launchpad](https://launchpad.graphql.com/5rrx10z19), built by [Matt Dionis](https://github.com/Matt-Dionis)

Against those two APIs, we can run the following queries:

```graphql
# Get information about GraphQL Summit from Universe
query {
  event(id: "5983706debf3140039d1e8b4") {
    title
    venueName
    address
    cityName
  }
}

# Get weather information about San Francisco from Dark Sky
query {
  location(place: "San Francisco") {
    city
    country
    weather {
      summary
      temperature
    }
  }
}
```

One thing that stands out is that the `cityName` field from Universe matches up nicely with the argument to the `location` field in the Dark Sky API. So what if we could just nicely pipe one into the other? Well, with schema stitching in graphql-tools 2.0, we now can!

```ts
const schema = mergeSchemas({
  schemas: [universeSchema, weatherSchema],
  links: [
    {
      name: 'location',
      from: 'Event',
      to: 'location',
      resolveArgs: parent => ({ place: parent.cityName }),
      fragment: `
        fragment WeatherLocationArgs on Event {
          cityName
        }
      `,
    },
  ],
});
```

This is saying that we want to add a `location` field on the `Event` type, and to call it we need the `cityName` field. Then, it just maps that field onto the `place` argument on the location field. Now, we can run the following query that gets information from both APIs!

```graphql
query {
  # From the Universe API
  event(id: "5983706debf3140039d1e8b4") {
    title
    description
    url

    # Stitched field that goes to the Dark Sky API
    location {
      city
      country
      weather {
        summary
        temperature
      }
    }
  }
}
```

This is a pretty basic example, and we're still working on the complete documentation. Follow along with the discussion on the [graphql-tools PR](https://github.com/apollographql/graphql-tools/pull/382)!
