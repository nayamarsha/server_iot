const brokerUrl = 'wss://k56e9d0e.ala.asia-southeast1.emqxsl.com:8084/mqtt';
const username = 'dummy'; // Sesuaikan dengan EMQX kamu
const password = 'iot';
const topicToSubscribe = 'sensors/data/31272817';
const webClientId = 'webClient_BitcoinTracker_' + Math.random().toString(16).substr(2, 8);
const mongoose = require('mongoose')
const cors = require('cors');
const express = require('express')
const { Timestamp } = require('bson');

const priceElement = document.getElementById('btcPrice');
const changeElement = document.getElementById('btcChange');
const updatedElement = document.getElementById('lastUpdated');
const serverStatusElement = document.getElementById('ServerStatus');

if (serverStatusElement) {
  serverStatusElement.style.color = 'red';
}

const options = {
  clientId: webClientId,
  username: emqx ,
  password: password,
  clean: true,
  connectTimeout: 5000,
  reconnectPeriod: 2000,
};

console.log(`Attempting to connect to MQTT broker: ${brokerUrl}`);
const client = mqtt.connect(brokerUrl, options);
const mongodburl = 'mongodb+srv://aaaa:mongodbpw123@crud.atbxbz1.mongodb.net/?retryWrites=true&w=majority&appName=CRUD'

const waterLevelSchema = new mongoose.Schema({
  level: Number,
  timestamp: {type: Date, default:Date.now()}
})

const waterLevel = mongoose.model('waterlevel', waterLevelSchema);

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static('public'))


async function main(){
  await mongoose.connect(mongodburl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  console.log('terhubung ke mongodb atlas')


client.on('connect', function () {
  console.log('Connected to MQTT broker!');
  if (serverStatusElement) {
    serverStatusElement.textContent = 'Connected';
    serverStatusElement.style.color = 'green';
  }

  client.subscribe(topicToSubscribe, function (err) {
    if (!err) {
      console.log(`Subscribed to topic: ${topicToSubscribe}`);
    } else {
      console.error('Subscription error:', err);

      if (serverStatusElement) {
        serverStatusElement.textContent = 'Subscription Error'; // Example
        serverStatusElement.style.color = 'red';
      }
    }
  });
});



client.on('message', async (topic, message) {

  console.log(`Received message on topic ${topic}: ${messageString}`);
  try {
    const messageString = message.toString();
    const jsondata = JSON.parse(messageString);
    const level = jsondata.level;

    console.log(`data diterima - tppik: ${topic}, level: ${level}`)
    const data = new waterLevel({level})
    await data.save()
    if (priceElement && data.ketinggian_air && data.change24hr) { 
      priceElement.textContent = '$' + data.ketinggian_air;
      changeElement.textContent = data.change24hr;

      if (data.change24hr.startsWith('+')) {
        changeElement.className = 'change positive';
      } else if (data.change24hr.startsWith('-')) {
        changeElement.className = 'change negative';
      } else {
        changeElement.className = 'change';
      }
    }

    const now = new Date();
    if (updatedElement) {
        updatedElement.textContent = now.toLocaleString();
    }
  } catch (e) {
    console.error('Error parsing JSON payload:', e);
  }
});

client.on('error', function (err) {
  console.error('MQTT Connection Error:', err);
  
  if (serverStatusElement) {
    serverStatusElement.textContent = 'Connection Error';
    serverStatusElement.style.color = 'red';
  }
});

client.on('reconnect', function () {
  console.log('Reconnecting to MQTT broker...');
  if (serverStatusElement) {
    serverStatusElement.textContent = 'Reconnecting...';
    serverStatusElement.style.color = 'orange';
  }
});

client.on('close', function () {
  console.log('MQTT connection closed');
  if (serverStatusElement) {
    serverStatusElement.textContent = 'Disconnected';
    serverStatusElement.style.color = 'red';
  }
});

client.on('offline', function () {
  console.log('MQTT client is offline');
  if (serverStatusElement) {
    serverStatusElement.textContent = 'Offline';
    serverStatusElement.style.color = 'red';
  }
});
// 4. Endpoint untuk ambil data
app.get('/api/water-levels', async (req, res) => {
  const data = await WaterLevel.find().sort({ timestamp: -1 }).limit(100);
  res.json(data);
});

// 5. Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
}

// Jalankan aplikasi
main().catch((err) => console.error('Error utama:', err));
