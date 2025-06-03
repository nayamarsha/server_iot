const brokerUrl = 'wss://k56e9d0e.ala.asia-southeast1.emqxsl.com:8084/mqtt';
const username = 'dummy'; // Sesuaikan dengan EMQX kamu
const password = 'iot';
const topicToSubscribe = 'banjir/level_air';
const webClientId = 'IOT_BANJIR_TRACKER_WEB'

const priceElement = document.getElementById('btcPrice');
const changeElement = document.getElementById('btcChange');
const updatedElement = document.getElementById('lastUpdated');
const mqttStatusElement = document.getElementById('mqttStatus');

const options = {
  clientId: webClientId,
  username: username,
  password: password,
  clean: true,
  connectTimeout: 5000,
  reconnectPeriod: 2000,
};

console.log(`Attempting to connect to MQTT broker: ${brokerUrl}`);
const client = mqtt.connect(brokerUrl, options);

function updateMqttStatus(status, colorClass) {
  mqttStatusElement.textContent = status;
  mqttStatusElement.className = 'mqtt-status ' + colorClass;
}

client.on('connect', function () {
  console.log('Connected to MQTT broker!');
  updateMqttStatus('Connected', 'connected');
  client.subscribe(topicToSubscribe, function (err) {
    if (!err) {
      console.log(`Subscribed to topic: ${topicToSubscribe}`);
    } else {
      console.error('Subscription error:', err);
      updateMqttStatus('Subscription Error', 'disconnected');
    }
  });
});

client.on('message', function (topic, message) {
  const messageString = message.toString();
  console.log(`Received message on topic ${topic}: ${messageString}`);
  try {
    const data = JSON.parse(messageString);
    if (data.price && data.change24hr) {
      priceElement.textContent = '$' + data.price;
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
    updatedElement.textContent = now.toLocaleString();
  } catch (e) {
    console.error('Error parsing JSON payload:', e);
  }
});

client.on('error', function (err) {
  console.error('MQTT Connection Error:', err);
  updateMqttStatus(`Error: ${err.message.substring(0, 30)}`, 'disconnected');
});

client.on('reconnect', function () {
  console.log('Reconnecting to MQTT broker...');
  updateMqttStatus('Reconnecting...', 'reconnecting');
});

client.on('close', function () {
  console.log('MQTT connection closed');
  updateMqttStatus('Disconnected', 'disconnected');
});

client.on('offline', function () {
  console.log('MQTT client is offline');
  updateMqttStatus('Offline', 'disconnected');
});
