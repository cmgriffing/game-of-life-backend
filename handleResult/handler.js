const MongoClient = require("mongodb").MongoClient;
const Joi = require("@hapi/joi");

const Filter = require("cellulelife-bad-words");
const filter = new Filter();

const submissionSchema = Joi.object({
  game_state: Joi.object({
    cellules: Joi.string().max(2000),
    active: Joi.boolean(),
    cellules_width: Joi.number(),
    cellules_height: Joi.number(),
  }),
  step_count: Joi.number().max(4001),
  active_count: Joi.number().max(2000),
  modifications: Joi.array()
    .items(
      Joi.object({
        step_index: Joi.number(),
        grid_index: Joi.number().max(2000),
      })
    )
    .max(100),
  user_name: Joi.string().max(4),
  seed_label: Joi.string().valid(
    "Bim",
    "C",
    "Coles",
    "Cube",
    "Diamond",
    "Glider",
    "hmm",
    "Forty Two",
    "Line",
    "Ligma",
    "Mr Sir",
    "Pentadecathlon",
    "Wall",
    "Windmills"
  ),
});

const client = new MongoClient(
  `mongodb+srv://mongo_user:${getEnvVariable(
    "MONGO_PASS"
  )}@cluster0-szvy0.mongodb.net/gameoflife?retryWrites=true&w=majority`
);

const connectionPromise = client.connect();

export const handleResult = async (event, context) => {
  await connectionPromise;
  const collection = client.db("gameoflife").collection("submissions");
  console.log({ event, context });

  // perform validation
  const submission = JSON.parse(event.body);

  const nameIsProfane = filter.containsProfanity(submission.user_name);

  console.log(`${submission.user_name} is profane: ${nameIsProfane}`);

  const valid = submissionSchema.validate(submission);
  console.log({ valid });

  if (!valid.error && !nameIsProfane) {
    // insert result into db
    await collection.insertOne(submission);

    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      statusCode: 200,
      body: JSON.stringify({
        message: `Go Serverless v1.0!`,
      }),
    };
  } else {
    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      statusCode: 400,
      body: JSON.stringify({
        message: "Saaaaad Panda!!!",
      }),
    };
  }
};

function getEnvVariable(variable) {
  return process.env[variable];
}
