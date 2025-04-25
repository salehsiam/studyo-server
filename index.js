require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://studyo-7b463.web.app",
      "https://studyo-7b463.firebaseapp.com/",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return req.status(401).send({ message: "unauthorized access" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return req.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bx9ca.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    // create collections
    const assignmentCollection = client.db("studyo").collection("assignments");
    const submittedCollection = client
      .db("studyo")
      .collection("submitted-assignments");
    const resourcesCollection = client.db("studyo").collection("resources");

    // authApi
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });
    // resources apis
    app.post("/resources", async (req, res) => {
      const resources = req.body;
      const result = await resourcesCollection.insertOne(resources);
      res.send(result);
    });

    app.get("/resources", async (req, res) => {
      const result = await resourcesCollection.find().toArray();
      res.send(result);
    });

    //  Assignments APIs
    app.post("/assignments", async (req, res) => {
      const assignment = req.body;
      const result = await assignmentCollection.insertOne(assignment);
      res.send(result);
    });
    app.get("/assignments", async (req, res) => {
      const email = req.query.email;
      let query = {};

      if (email) {
        query.creator_email = email;
      }
      const result = await assignmentCollection.find().toArray();
      res.send(result);
    });
    app.get("/features", async (req, res) => {
      const cursor = assignmentCollection.find().limit(8);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/new-assignments", async (req, res) => {
      const cursor = assignmentCollection.find().sort({ date: -1 }).limit(4);
      const result = await cursor.toArray();
      res.send(result);
    });
    // filter
    app.get("/assignments/easy", async (req, res) => {
      const query = { level: "easy" };
      const result = await assignmentCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/assignments/medium", async (req, res) => {
      const query = { level: "medium" };
      const result = await assignmentCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/assignments/hard", async (req, res) => {
      const query = { level: "hard" };
      const result = await assignmentCollection.find(query).toArray();
      res.send(result);
    });
    // search
    app.get("/assignments/search", async (req, res) => {
      const { query } = req.query;
      const result = await assignmentCollection
        .find({
          title: { $regex: query, $options: "i" },
        })
        .toArray();
      res.send(result);
    });

    app.get("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(query);
      res.send(result);
    });
    app.patch("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedAssignment = req.body;
      const assignment = {
        $set: {
          photo: updatedAssignment.photo,
          title: updatedAssignment.title,
          marks: updatedAssignment.marks,
          level: updatedAssignment.level,
          dueDate: updatedAssignment.dueDate,
          description: updatedAssignment.description,
        },
      };
      const result = await assignmentCollection.updateOne(
        filter,
        assignment,
        options
      );
      res.send(result);
    });

    app.delete("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = assignmentCollection.deleteOne(query);
      res.send(result);
    });

    // submitted assignment apis
    app.post("/submittedAssignments", async (req, res) => {
      const submitted = req.body;
      const result = await submittedCollection.insertOne(submitted);
      res.send(result);
    });
    app.get("/submittedAssignments", async (req, res) => {
      const query = { status: "pending" };
      const result = await submittedCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/submittedAssignments/:email", async (req, res) => {
      const email = req.params.email;
      const query = { creator_email: email, status: "pending" };
      const result = await submittedCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/submittedAssignments/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const submittedMarks = req.body;
      const updated = {
        $set: {
          marks: submittedMarks.marks,
          feedback: submittedMarks.feedback,
          status: submittedMarks.status,
        },
      };
      const result = await submittedCollection.updateOne(
        filter,
        updated,
        options
      );
      res.send(result);
    });
    app.get("/my-assignment/:email", async (req, res) => {
      const email = req.params.email;
      const query = { examinee_email: email };
      const result = await submittedCollection.find(query).toArray();
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Practice Makes You Perfects");
});

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
