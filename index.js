require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// studyweb
// bZcv1LSsz2Bzk8N7

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
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    // create collections
    const assignmentCollection = client.db("studyo").collection("assignments");
    const submittedCollection = client
      .db("studyo")
      .collection("submitted-assignments");
    //  Assignments APIs
    app.post("/assignments", async (req, res) => {
      const assignment = req.body;
      const result = await assignmentCollection.insertOne(assignment);
      res.send(result);
    });
    app.get("/assignments", async (req, res) => {
      const result = await assignmentCollection.find().toArray();
      res.send(result);
    });
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
