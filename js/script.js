const brokerUrl = 'wss://k56e9d0e.ala.asia-southeast1.emqxsl.com:8084/mqtt';
const username = 'dummy'; // Sesuaikan dengan EMQX kamu
const password = 'iot';
const topicToSubscribe = 'bitcoin/price/status';
const webClientId = 'webClient_BitcoinTracker_' + Math.random().toString(16).substr(2, 8);

const priceElement = document.getElementById('btcPrice');
const changeElement = document.getElementById('btcChange');
const updatedElement = document.getElementById('lastUpdated');
const serverStatusElement = document.getElementById('ServerStatus');

if (serverStatusElement) {
  serverStatusElement.style.color = 'red';
}

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

client.on('message', function (topic, message) {
  const messageString = message.toString();
  console.log(`Received message on topic ${topic}: ${messageString}`);
  try {
    const data = JSON.parse(messageString);
    if (priceElement && data.price && data.change24hr) { 
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