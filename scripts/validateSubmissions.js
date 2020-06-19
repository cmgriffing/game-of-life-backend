require("dotenv").config();
const util = require("util");
const childProcess = require("child_process");
const { MongoClient, ObjectId } = require("mongodb");

const spawn = util.promisify(childProcess.spawn);

async function main() {
  const client = new MongoClient(
    `mongodb+srv://mongo_user:${getEnvVariable(
      "MONGO_PASS"
    )}@cluster0-szvy0.mongodb.net/gameoflife?retryWrites=true&w=majority`
  );

  await client.connect();

  const submissionCollection = client
    .db("gameoflife")
    .collection("submissions");

  const highScoreCollection = client.db("gameoflife").collection("highScores");

  const submissions = await submissionCollection.find({}).toArray();

  let submissionValidationResults = await Promise.all(
    submissions
      .map((submission) => {
        const _id = submission._id;
        delete submission._id;

        return {
          _id,
          submission,
        };
      })
      .map(async (submission) => {
        // validate results
        return new Promise((resolve, reject) => {
          const child = childProcess.spawn(`${__dirname}/game-of-life-core`, [
            JSON.stringify(submission),
          ]);
          child.stdout.on("data", (data) => {
            const stringifiedData = data.toString();
            resolve({
              ...JSON.parse(stringifiedData),
              submission,
            });
          });

          child.stderr.on("data", (data) => {
            console.log({ error: data });
            reject(data);
          });

          child.on("close", (code) => {
            // console.log(`child process exited with code ${code}`);
            // resolve(code);
          });
        });
      })
  );

  console.log({ submissionValidationResults });

  // remove invalid submissions
  submissionValidationResults = submissionValidationResults.filter(
    (submission) => {
      if (!submission.valid) {
        submissionCollection.deleteOne({
          _id: { $eq: ObjectId(submission.submission_id) },
        });
        return false;
      }
      return true;
    }
  );

  // remove id
  submissionValidationResults = submissionValidationResults.map(
    (submissionResult) => {
      const { submission } = submissionResult;
      delete submission._id;
      return {
        ...submissionResult,
        submission,
      };
    }
  );

  console.log(JSON.stringify(submissionValidationResults));

  // transfer valid submissions to high scores collection
  const insertResult = await highScoreCollection.insertMany(
    submissionValidationResults.map((result) => result.submission.submission)
  );

  if (insertResult) {
    console.log("insert many result", insertResult);
    const ids = submissionValidationResults.map((deleteResult) => {
      // console.log({ deleteResult });
      return ObjectId(deleteResult.submission_id);
    });
    console.log({ ids });
    const deleteResult = await submissionCollection.deleteMany({
      _id: {
        $in: ids,
      },
    });
    console.log({ deleteResult });
  } else {
    console.log("No insert Result;");
  }

  // process.exit();
}

function getEnvVariable(variable) {
  return process.env[variable];
}

process.on("unhandledRejection", function (error) {
  console.error("Unhandled Rejection: ", error.toString());
});

process.on("UncaughtException", function (error) {
  console.error("UncaughtException: ", error);
});

main();
