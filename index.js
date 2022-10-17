const mongoose = require("mongoose");

const MONGODB_URI =
  "mongodb+srv://testUser:testUser123@cluster0.repty.mongodb.net/pokemonsample?retryWrites=true&w=majority";

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const pokeCollection = mongoose.connection.db.collection("samples_pokemon");
    /*

    1. FIRST QUESTION

    You should provide for all the pokemon that have 1 or more evolutions
    the name, number and spawn time of the evolutions. Estimated time: 15
    minutes.

    ------------------ SOLUTION ------------------
    I've take into consideration first or second evolution steps too,
    because they match with the requirements from the question. F.E:
      - Charmander -> Charmeleon -> Charizard ---- 2 Evolutions
      - Charmeleon -> Charizard ------------------ 1 Evolution
      - Charizard -> NONE ------------------------ 0 Evolution
    Charmander and Charmeleon are valid documents, with at least 1 evolution.

    I've grouped all elements with the following structure:

      |    {                                         |
      |      name: Pokemon,                          |
      |      next_evolutions: [                      |
      |        {                                     |
      |          name: Evolution name,               |
      |          spawn_time: Evolution spawn_time,   |
      |          num: Evolution num                  |
      |        },                                    |
      |        ...                                   |
      |      ]                                       |
      |    }                                         |

    */

    pokeCollection
      .aggregate([
        { $match: { next_evolution: { $exists: true } } },
        { $unwind: "$next_evolution" },
        {
          $lookup: {
            from: "samples_pokemon",
            localField: "next_evolution.name",
            foreignField: "name",
            as: "evolution",
          },
        },
        {
          $addFields: {
            "next_evolutions.spawn_time": {
              $arrayElemAt: ["$evolution.spawn_time", 0],
            },
            "next_evolutions.name": {
              $arrayElemAt: ["$evolution.name", 0],
            },
            "next_evolutions.num": {
              $arrayElemAt: ["$evolution.num", 0],
            },
          },
        },
        {
          $group: {
            _id: "$name",
            name: { $first: "$name" },
            next_evolutions: { $push: "$next_evolutions" },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            next_evolutions: 1,
          },
        },
      ])
      // Just for testing purposes
      .toArray((err, data) => {
        console.log(data);
      });

    /*

    2. SECOND QUESTION

    All first evolution pokemon that have an evolution with an avg spawn
    greater than 4 (the evolution should have the avg spawn greater than 4,
    not the initial pokemon), you need the name and number of each
    pokemon that meets the following requirements. Estimated time: 1h


    I've grouped all elements with the following structure:

      |    {                        |
      |      name: Pokemon name,    |
      |      num: Pokemon num       |
      |    }                        |

    */

    pokeCollection
      .aggregate([
        {
          $match: {
            $and: [
              {
                next_evolution: { $exists: true },
                prev_evolution: { $exists: false },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "samples_pokemon",
            localField: "next_evolution.name",
            foreignField: "name",
            as: "evolution",
          },
        },
        {
          $addFields: {
            "next_evolutions.spawn_time": {
              $arrayElemAt: ["$evolution.spawn_time", 0],
            },
          },
        },
        {
          $match: {
            "next_evolutions.spawn_time": { $regex: /^0(4)/g },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            num: 1,
          },
        },
      ])
      // Just for testing purposes
      .toArray((err, data) => {
        console.log(data);
      });

    // Just for test
  })
  .catch((err) => {
    console.error(`Error connecting to ${MONGODB_URI}`, err);
    process.exit(0);
  });

process.on("SIGINT", function () {
  mongoose.connection.close(function () {
    console.log("Mongoose disconnected on app termination");
    process.exit(0);
  });
});
