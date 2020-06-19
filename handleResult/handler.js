const MongoClient = require("mongodb").MongoClient;
const Joi = require("@hapi/joi");

const submissionSchema = Joi.object({
  game_state: Joi.object({
    cellules: Joi.string(),
    active: Joi.boolean(),
    cellules_width: Joi.number(),
    cellules_height: Joi.number(),
  }),
  step_count: Joi.number(),
  active_count: Joi.number(),
  modifications: Joi.array().items(
    Joi.object({
      step_index: Joi.number(),
      grid_index: Joi.number(),
    })
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

  // insert result into db
  await collection.insertOne(submission);

  const valid = submissionSchema.validate(submission);
  if (valid) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Go Serverless v1.0!`,
      }),
    };
  } else {
    return {
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
