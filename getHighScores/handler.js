const MongoClient = require("mongodb").MongoClient;

const client = new MongoClient(
  `mongodb+srv://mongo_user:${getEnvVariable(
    "MONGO_PASS"
  )}@cluster0-szvy0.mongodb.net/gameoflife?retryWrites=true&w=majority`
);

const connectionPromise = client.connect();

export const getHighScores = async (event, context) => {
  await connectionPromise;
  const collection = client.db("gameoflife").collection("highScores");
  console.log({ event, context });

  const scores = await collection
    .aggregate([
      {
        $sort: { score_count: -1, active_count: -1 },
      },
    ])
    .toArray();

  return {
    statusCode: 200,
    body: JSON.stringify({
      scores,
    }),
  };
};

function getEnvVariable(variable) {
  return process.env[variable];
}
