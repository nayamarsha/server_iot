require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const mqtt = require("mqtt"); 
const app = express();
app.use(express.json());

const url = process.env.MONGODB_URL;

const waterLevelSchema = new mongoose.Schema({
  timestamp: { type: Date, default: () => new Date().toLocaleString("en-GB", { timeZone: "Asia/Jakarta" }) },
  level: Number
});

const waterLevelModel = mongoose.model("waterLevel", waterLevelSchema);

const connectWithRetry = () => {
  console.log("Trying to connect to MongoDB...");
  mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log("Connected to MongoDB");
      startMqttClient(); 
    })
    .catch(err => {
      console.error("MongoDB connection error:", err);
      console.log("Retrying connection in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
    });
};

const startMqttClient = () => {
  const brokerUrl = 'wss://k56e9d0e.ala.asia-southeast1.emqxsl.com:8084/mqtt';
  const username = 'dummy';
  const password = 'iot';
  const topicToSubscribe = 'bitcoin/price/status';
  const webClientId = 'webClient_BitcoinTracker_' + Math.random().toString(16).substr(2, 8);

  const options = {
    clientId: webClientId,
    username: username,
    password: password,
    clean: true,
    connectTimeout: 5000,
    reconnectPeriod: 2000,
  };

  const client = mqtt.connect(brokerUrl, options);

  client.on('connect', function () {
    console.log('Connected to MQTT broker!');
    client.subscribe(topicToSubscribe, function (err) {
      if (!err) {
        console.log(`Subscribed to topic: ${topicToSubscribe}`);
      } else {
        console.error('Subscription error:', err);
      }
    });
  });

  client.on('message', function (topic, message) {
    const messageString = message.toString();
    console.log(`Received message on topic ${topic}: ${messageString}`);
    try {
      const data = JSON.parse(messageString);
      if (data.level) {
        const waterLevelExample = new waterLevelModel({
          level: data.level
        });

        waterLevelExample.save()
          .then(() => {
            console.log("Water level data saved");
            //updateWaterLevelHistory(); 
          })
          .catch(err => console.error("Error saving data:", err));
      } else {
        console.log(`Received data does not conform to schema: ${messageString}`);
      }
    } catch (e) {
      console.error('Error parsing JSON payload:', e);
    }
  });

  // Other MQTT event handlers...
};

// const updateWaterLevelHistory = () => {
//   // Fetch the latest water level data and update the HTML table
//   waterLevelModel.find().sort({ timestamp: -1 }).limit(10).exec((err, data) => {
//     if (err) {
//       console.error("Error fetching water level history:", err);
//       return;
//     }
//     const tableBody = document.getElementById('historyTableBody');
//     tableBody.innerHTML = ''; // Clear existing rows
//     data.forEach(entry => {
//       const row = `<tr>
//                      <td>${entry.timestamp.toLocaleString()}</td>
//                      <td>${entry.level}</td>
//                      <td>${entry.level > 5 ? 'Danger' : 'Safe'}</td>
//                    </tr>`;
//       tableBody.innerHTML += row; // Append new row
//     });
//   });
// };

app.post('/data', (req, res) => {
  const { level } = req.body;
  if (level === " " || level < 0) {
    return res.status(400).send({ error: 'Invalid request body' });
  }
  const waterLevelExample = new waterLevelModel({
    level,
    timestamp: new Date().toLocaleString("en-GB", { timeZone: "Asia/Jakarta" })
  });

  waterLevelExample.save()
    .then(() => {
      console.log("Water level data saved");
      //updateWaterLevelHistory(); // Update the history table
      res.send({ message: 'Data saved successfully' });
    })
    .catch(err => {
      console.error("Error saving data:", err);
      res.status(500).send({ error: 'Error saving data' });
    });
});

connectWithRetry();

app.listen(3000, () => {
  console.log("Server is running on port 3000!!");
});
