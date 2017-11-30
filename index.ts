import * as express from 'express';
import * as bodyParser from 'body-parser';
import {graphqlExpress, graphiqlExpress} from 'apollo-server-express';
import {makeRemoteExecutableSchema, mergeSchemas, introspectSchema} from 'graphql-tools';
import {createApolloFetch,} from 'apollo-fetch';

async function run() {
	const createRemoteSchema = async (uri: string) => {
		const fetcher = createApolloFetch({uri});
		return makeRemoteExecutableSchema({
			schema: await introspectSchema(fetcher),
			fetcher
		});
	}
	const universeSchema = await createRemoteSchema('https://www.universe.com/graphql/beta')
	const weatherSchema = await createRemoteSchema('https://5rrx10z19.lp.gql.zone/graphql');
	const linkSchemaDefs = `
    extend type Event {
        location: Location
    }
  `
	const schema = mergeSchemas({
		schemas: [universeSchema, weatherSchema, linkSchemaDefs],
		resolvers: mergeInfo => ({
			Event: {
				location: {
					fragment: `fragment EventFragment on Event {cityName}`,
					resolve(parent: any, args: any, context: any, info: any) {
						const place: string = parent.cityName
						return mergeInfo.delegate(
							'query',
							'location',
							{place},
							context,
							info
						)
					}
				}
			}
		})
	})

	const app = express();

	app.use('/graphql', bodyParser.json(), graphqlExpress({schema}));

	app.use(
		'/graphiql',
		graphiqlExpress({
			endpointURL: '/graphql',
			query: `query {
  event(id: "5983706debf3140039d1e8b4") {
    title
    description
    url
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
      `,
		})
	);

	app.listen(3000);
	console.log('Server running. Open http://localhost:3000/graphiql to run queries.');
}

try {
	run();
} catch (e) {
	console.log(e, e.message, e.stack);
}
